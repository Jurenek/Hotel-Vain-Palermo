'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Car,
    UtensilsCrossed,
    MapPin,
    AlertCircle,
    MessageCircle,
    Phone,
    Mail,
    Send,
    Loader2
} from 'lucide-react';
import { useGuestStore } from '@/lib/store';

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
        { id: 'taxi', label: 'Solicitar taxi/transfer', icon: Car },
        { id: 'restaurant', label: 'Reservas restaurantes', icon: UtensilsCrossed },
        { id: 'tourism', label: 'Información turística', icon: MapPin },
        { id: 'problem', label: 'Problema en habitación', icon: AlertCircle },
        { id: 'other', label: 'Otra consulta', icon: MessageCircle },
    ];

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/requests', { cache: 'no-store' });
            if (res.ok) {
                const allRequests = await res.json();
                // Filter requests for the current guest (store guest name/room)
                // In a real app we'd filter on the server or use a unique ID
                const myRequests = allRequests.filter((r: Request & { guestName: string, roomNumber: string }) =>
                    r.guestName === guest.name && r.roomNumber === guest.roomNumber
                );
                setRequests(myRequests);
            }
        } catch (error) {
            console.error('Failed to fetch requests', error);
        }
    };

    useEffect(() => {
        fetchRequests();
        const interval = setInterval(fetchRequests, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [guest.name, guest.roomNumber]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guestId: guest.email || guest.name, // Use name as fallback ID
                    guestName: guest.name,
                    roomNumber: guest.roomNumber,
                    type: formData.queryType,
                    message: formData.message,
                }),
            });

            if (res.ok) {
                setSubmitted(true);
                setFormData({ queryType: '', message: '' });
                fetchRequests(); // Refresh list immediately
                setTimeout(() => setSubmitted(false), 3000);
            }
        } catch (error) {
            console.error('Error submitting request', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'completed': return 'bg-green-100 text-green-800';
            default: return 'bg-stone-100 text-stone-800';
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
            <div className="bg-stone-900 text-white p-6">
                <button
                    onClick={() => router.push('/home')}
                    className="mb-4 text-stone-400 hover:text-white transition"
                >
                    ← Volver
                </button>
                <h2 className="text-2xl font-light tracking-wide">Concierge</h2>
                <p className="text-sm text-stone-400 mt-2">
                    ¿En qué podemos ayudarte hoy?
                </p>
            </div>

            <div className="p-6 space-y-6">
                {/* Active Requests */}
                {requests.length > 0 && (
                    <div className="bg-white border border-stone-200 rounded-sm p-6">
                        <h3 className="font-medium text-lg mb-4">Tus Solicitudes</h3>
                        <div className="space-y-4">
                            {requests.map((request) => (
                                <div key={request.id} className="border border-stone-100 rounded-sm p-4 bg-stone-50">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center space-x-2">
                                            {queryTypes.find(t => t.id === request.type)?.icon && (() => {
                                                const Icon = queryTypes.find(t => t.id === request.type)!.icon;
                                                return <Icon className="w-4 h-4 text-stone-600" />
                                            })()}
                                            <span className="font-medium text-sm">
                                                {queryTypes.find(t => t.id === request.type)?.label || request.type}
                                            </span>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(request.status)}`}>
                                            {getStatusLabel(request.status)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-stone-600 mb-3 ml-6">
                                        {/* Show latest message from reception if any */}
                                        {request.messages.filter(m => m.sender === 'reception').length > 0 ? (
                                            <div className="bg-white p-2 rounded border border-stone-100 mt-2">
                                                <p className="text-xs font-semibold text-stone-900 mb-1">Recepción:</p>
                                                <p>{request.messages.filter(m => m.sender === 'reception').pop()?.text}</p>
                                            </div>
                                        ) : (
                                            <p className="italic text-stone-400">Esperando respuesta...</p>
                                        )}
                                    </div>
                                    <div className="text-xs text-stone-400 text-right">
                                        {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
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
                                <label className="text-sm font-medium block mb-2">
                                    Tipo de consulta *
                                </label>
                                <select
                                    value={formData.queryType}
                                    onChange={(e) =>
                                        setFormData({ ...formData, queryType: e.target.value })
                                    }
                                    required
                                    className="w-full border border-stone-300 rounded-sm p-3 outline-none focus:border-stone-500"
                                >
                                    <option value="">Seleccionar...</option>
                                    {queryTypes.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Mensaje */}
                            <div>
                                <label className="text-sm font-medium block mb-2">
                                    Mensaje *
                                </label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) =>
                                        setFormData({ ...formData, message: e.target.value })
                                    }
                                    required
                                    rows={4}
                                    placeholder="Describe tu solicitud o consulta..."
                                    className="w-full border border-stone-300 rounded-sm p-3 outline-none focus:border-stone-500 resize-none"
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
