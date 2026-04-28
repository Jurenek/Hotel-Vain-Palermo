'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { VainLogo } from '@/components/VainLogo';
import {
    Car,
    UtensilsCrossed,
    MapPin,
    AlertCircle,
    MessageCircle,
    Phone,
    Mail,
    Send,
    Loader2,
    Music
} from 'lucide-react';
import { useGuestStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

interface Request {
    id: string;
    type: string;
    status: 'pending' | 'in_progress' | 'completed';
    messages: { sender: string; text: string; timestamp: string }[];
    createdAt: string;
}

export default function ConciergePage() {
    const router = useRouter();
    const { guest } = useGuestStore();
    const [formData, setFormData] = useState({
        queryType: '',
        message: '',
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [requests, setRequests] = useState<Request[]>([]);

    const queryTypes = [
        { id: 'tango_show', label: 'Reserva Show de Tango', icon: Music },
        { id: 'city_tour', label: 'Reserva City Tour', icon: MapPin },
        { id: 'recommendations', label: 'Recomendaciones en la zona', icon: UtensilsCrossed },
        { id: 'taxi', label: 'Solicitar Taxi / Transfer', icon: Car },
        { id: 'housekeeping', label: 'Housekeeping / Mantenimiento', icon: AlertCircle },
        { id: 'other', label: 'Otra consulta', icon: MessageCircle },
    ];

    const fetchRequests = async () => {
        try {
            // Use timestamp to bypass any browser or proxy cache
            const timestamp = Date.now();
            const res = await fetch(`/api/requests?t=${timestamp}`, {
                cache: 'no-store',
                headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
            });

            if (res.ok) {
                const allRequests = await res.json();

                // Robust filtering to avoid mismatches due to spaces or casing
                const activeGuestName = (guest.name || '').trim().toLowerCase();
                const activeRoomNum = (guest.roomNumber || '').trim().toLowerCase();

                const myRequests = allRequests.filter((r: any) => {
                    const reqName = (r.guestName || '').trim().toLowerCase();
                    const reqRoom = (r.roomNumber || '').trim().toLowerCase();
                    const match = reqName === activeGuestName && reqRoom === activeRoomNum;
                    return match;
                });

                console.log(`[Polling] System time: ${new Date().toLocaleTimeString()} | Total: ${allRequests.length} | Mine: ${myRequests.length}`);
                setRequests(myRequests);
            }
        } catch (error) {
            console.error('[Polling] Error fetching requests:', error);
        }
    };

    useEffect(() => {
        fetchRequests();
        
        // Subscribe to changes on the requests table
        const channel = supabase
            .channel('guest-requests')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'requests' },
                (payload) => {
                    console.log('[Realtime] Request changed:', payload);
                    fetchRequests();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guestId: guest.email || guest.name,
                    guestName: guest.name,
                    roomNumber: guest.roomNumber,
                    type: formData.queryType,
                    message: formData.message,
                }),
            });

            if (res.ok) {
                setSubmitted(true);
                setFormData({ queryType: '', message: '' });
                await fetchRequests(); // Refresh list immediately
                setTimeout(() => setSubmitted(false), 3000);
            } else {
                const err = await res.json();
                console.error('[Concierge] Submission failed:', err);
            }
        } catch (error) {
            console.error('[Concierge] Error submitting request:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-500 text-white shadow-sm';
            case 'in_progress': return 'bg-blue-600 text-white shadow-sm';
            case 'completed': return 'bg-emerald-600 text-white shadow-sm';
            default: return 'bg-stone-200 text-stone-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'in_progress': return 'En Proceso';
            case 'completed': return 'Completado';
            default: return status;
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 pb-20">
            {/* Header */}
            <div className="bg-stone-900 text-white p-6 flex justify-between items-end">
                <div>
                    <button
                        onClick={() => router.push('/home')}
                        className="mb-4 text-stone-400 hover:text-white transition text-xs flex items-center"
                    >
                        <span className="mr-1">←</span> Volver
                    </button>
                    <h2 className="text-2xl font-light tracking-wide">Concierge</h2>
                    <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest">
                        Mayordomía 24/7
                    </p>
                </div>
                <VainLogo className="w-16" light showSubtitle={false} />
            </div>

            <div className="p-6 space-y-6">
                {/* Active Requests with Chat */}
                {requests.length > 0 && (
                    <div>
                        <h3 className="font-medium text-lg mb-4">Tus Solicitudes</h3>
                        <div className="space-y-4">
                            {requests.map((request) => (
                                <RequestChat
                                    key={request.id}
                                    request={request}
                                    queryTypes={queryTypes}
                                    getStatusColor={getStatusColor}
                                    getStatusLabel={getStatusLabel}
                                    onMessageSent={fetchRequests}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div>
                    <h3 className="text-lg font-light tracking-wide mb-4">
                        Servicios Frecuentes
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {queryTypes.map((type) => (
                            <motion.button
                                key={type.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setFormData({ ...formData, queryType: type.id })}
                                className={`p-4 rounded-sm border transition-all text-left ${formData.queryType === type.id
                                    ? 'bg-stone-900 text-white border-stone-900'
                                    : 'bg-white border-stone-200 hover:bg-stone-50'
                                    }`}
                            >
                                <type.icon
                                    className={`w-5 h-5 mb-2 ${formData.queryType === type.id ? 'text-white' : 'text-stone-600'
                                        }`}
                                />
                                <p className="text-sm font-medium">{type.label}</p>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Formulario */}
                <div className="bg-white border border-stone-200 rounded-sm p-6">
                    <h3 className="font-medium text-lg mb-4">Nueva Consulta</h3>

                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Info auto-rellenada */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border border-stone-200 p-3 rounded-sm bg-stone-50">
                                    <label className="text-xs text-stone-500 block mb-1">
                                        HUÉSPED
                                    </label>
                                    <p className="text-sm font-medium">{guest.name}</p>
                                </div>
                                <div className="border border-stone-200 p-3 rounded-sm bg-stone-50">
                                    <label className="text-xs text-stone-500 block mb-1">
                                        HABITACIÓN
                                    </label>
                                    <p className="text-sm font-medium">{guest.roomNumber}</p>
                                </div>
                            </div>

                            {/* Tipo de consulta */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest block mb-2 text-stone-500">
                                    Tipo de consulta *
                                </label>
                                <select
                                    value={formData.queryType}
                                    onChange={(e) =>
                                        setFormData({ ...formData, queryType: e.target.value })
                                    }
                                    required
                                    className="w-full border-b-2 border-stone-200 bg-transparent py-3 outline-none focus:border-stone-900 transition-colors text-stone-900 appearance-none rounded-none"
                                >
                                    <option value="" className="text-stone-400">Seleccionar servicio...</option>
                                    {queryTypes.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.label.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Mensaje */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest block mb-2 text-stone-500">
                                    ¿En qué podemos ayudarte? *
                                </label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) =>
                                        setFormData({ ...formData, message: e.target.value })
                                    }
                                    required
                                    rows={3}
                                    placeholder="Escribe tu mensaje aquí..."
                                    className="w-full border-b-2 border-stone-200 bg-transparent py-3 outline-none focus:border-stone-900 transition-colors resize-none text-stone-900 rounded-none placeholder:text-stone-300"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-stone-900 text-white py-4 rounded-sm font-light tracking-wide hover:bg-stone-800 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        <span>ENVIAR A RECEPCIÓN</span>
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8 space-y-3"
                        >
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                                <Send className="w-8 h-8 text-green-600" />
                            </div>
                            <h4 className="text-lg font-medium">¡Consulta enviada!</h4>
                            <p className="text-sm text-stone-600">
                                Te responderemos a la brevedad
                            </p>
                        </motion.div>
                    )}
                </div>

                {/* Contacto Directo */}
                <div className="bg-white border border-stone-200 rounded-sm p-6 space-y-4">
                    <h3 className="font-medium text-lg">Contacto Directo</h3>
                    <div className="space-y-3">
                        <a
                            href="https://wa.me/5491165559467"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center space-x-3 p-3 bg-green-50 rounded hover:bg-green-100 transition-all"
                        >
                            <MessageCircle className="w-5 h-5 text-green-600" />
                            <span className="text-stone-900">WhatsApp: +54 9 11 6555-9467</span>
                        </a>

                        <a
                            href="tel:+541147746780"
                            className="w-full flex items-center space-x-3 p-3 bg-stone-50 rounded hover:bg-stone-100 transition-all"
                        >
                            <Phone className="w-5 h-5 text-stone-600" />
                            <span className="text-stone-900">+54 11 4774-6780</span>
                        </a>

                        <a
                            href="mailto:info@vainhotel.com"
                            className="w-full flex items-center space-x-3 p-3 bg-stone-50 rounded hover:bg-stone-100 transition-all"
                        >
                            <Mail className="w-5 h-5 text-stone-600" />
                            <span className="text-stone-900">info@vainhotel.com</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Individual Request with expandable chat
function RequestChat({ request, queryTypes, getStatusColor, getStatusLabel, onMessageSent }: {
    request: Request;
    queryTypes: { id: string; label: string; icon: any }[];
    getStatusColor: (status: string) => string;
    getStatusLabel: (status: string) => string;
    onMessageSent: () => void;
}) {
    const [expanded, setExpanded] = useState(request.status !== 'completed');
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (expanded) scrollToBottom();
    }, [expanded, request.messages.length]);

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        setSending(true);
        try {
            await fetch(`/api/requests/${request.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: replyText, sender: 'guest' }),
            });
            setReplyText('');
            onMessageSent();
        } catch (error) {
            console.error('Error sending reply', error);
        } finally {
            setSending(false);
        }
    };

    const TypeIcon = queryTypes.find(t => t.id === request.type)?.icon;
    const canReply = request.status !== 'completed';

    return (
        <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
            {/* Request Header - always visible */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-stone-50 transition"
            >
                <div className="flex items-center space-x-3">
                    {TypeIcon && <TypeIcon className="w-5 h-5 text-stone-600" />}
                    <div>
                        <span className="font-medium text-sm text-stone-900">
                            {queryTypes.find(t => t.id === request.type)?.label || request.type}
                        </span>
                        <p className="text-xs text-stone-400">
                            {new Date(request.createdAt).toLocaleDateString()} · {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>
                        {getStatusLabel(request.status)}
                    </span>
                    <motion.span
                        animate={{ rotate: expanded ? 180 : 0 }}
                        className="text-stone-400 text-sm"
                    >
                        ▼
                    </motion.span>
                </div>
            </button>

            {/* Chat Thread - expandable */}
            {expanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="border-t border-stone-100"
                >
                    {/* Messages */}
                    <div className="max-h-64 overflow-y-auto p-4 space-y-3 bg-stone-50">
                        {request.messages.length === 0 ? (
                            <p className="text-center text-stone-400 text-sm italic py-4">
                                Esperando respuesta de recepción...
                            </p>
                        ) : (
                            request.messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.sender === 'guest' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm border ${msg.sender === 'guest'
                                        ? 'bg-amber-50 border-amber-200 text-stone-950 rounded-br-none'
                                        : 'bg-stone-900 border-stone-900 text-white rounded-bl-none'
                                        }`}>
                                        <div className="flex items-center justify-between mb-1.5 opacity-80">
                                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${msg.sender === 'guest' ? 'text-amber-800' : 'text-stone-300'
                                                }`}>
                                                {msg.sender === 'guest' ? 'Huésped' : '🛎️ Recepción'}
                                            </p>
                                            <p className={`text-[9px] font-medium ${msg.sender === 'guest' ? 'text-amber-600' : 'text-stone-500'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <p className="text-[15px] leading-relaxed font-medium">{msg.text}</p>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Reply Input */}
                    {canReply && (
                        <form onSubmit={handleReply} className="p-3 border-t border-stone-100 flex space-x-2 bg-white">
                            <input
                                type="text"
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                placeholder="Escribir respuesta..."
                                className="flex-1 border border-stone-300 rounded-full px-4 py-2 text-sm outline-none focus:border-stone-900 transition"
                            />
                            <button
                                type="submit"
                                disabled={sending || !replyText.trim()}
                                className="bg-stone-900 text-white p-2 rounded-full hover:bg-stone-800 disabled:opacity-40 transition"
                            >
                                {sending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                            </button>
                        </form>
                    )}

                    {/* Completed callout */}
                    {!canReply && (
                        <div className="p-3 bg-green-50 text-center text-xs text-green-700 border-t border-green-100">
                            ✓ Esta solicitud fue completada
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
