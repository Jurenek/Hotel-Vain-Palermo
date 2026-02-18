'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    CheckCircle2,
    AlertCircle,
    User,
    MapPin,
    MessageSquare,
    Send
} from 'lucide-react';

interface Request {
    id: string;
    guestName: string;
    roomNumber: string;
    type: string;
    status: 'pending' | 'in_progress' | 'completed';
    messages: { sender: string; text: string; timestamp: string }[];
    createdAt: string;
    updatedAt: string;
}

export default function ReceptionPage() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
    const [responseText, setResponseText] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/requests', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setRequests(data);

                // Update selected request if it exists
                if (selectedRequest) {
                    const updated = data.find((r: Request) => r.id === selectedRequest.id);
                    if (updated) setSelectedRequest(updated);
                }
            }
        } catch (error) {
            console.error('Failed to fetch requests', error);
        }
    };

    useEffect(() => {
        fetchRequests();
        const interval = setInterval(fetchRequests, 3000); // Fast polling for reception
        return () => clearInterval(interval);
    }, [selectedRequest?.id]); // Re-subscribe if selection changes

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await fetch(`/api/requests/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            fetchRequests();
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    const handleSendResponse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRequest || !responseText.trim()) return;

        try {
            await fetch(`/api/requests/${selectedRequest.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: responseText, status: 'in_progress' }),
            });
            setResponseText('');
            fetchRequests();
        } catch (error) {
            console.error('Failed to send response', error);
        }
    };

    const filteredRequests = requests.filter(r => {
        if (filter === 'all') return true;
        return r.status === filter;
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
            case 'in_progress': return <Clock className="w-4 h-4 text-blue-600" />;
            case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
            default: return null;
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar / List */}
            <div className="w-1/3 bg-white border-r border-stone-200 flex flex-col">
                <div className="p-4 border-b border-stone-200 bg-stone-900 text-white">
                    <h1 className="text-xl font-light tracking-wide">Recepción</h1>
                    <p className="text-xs text-stone-400 mt-1">Panel de control</p>
                </div>

                {/* Filters */}
                <div className="p-2 border-b border-stone-100 flex space-x-2 overflow-x-auto">
                    {['all', 'pending', 'in_progress', 'completed'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider ${filter === f
                                ? 'bg-stone-900 text-white'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                }`}
                        >
                            {f.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {/* Request List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredRequests.length === 0 ? (
                        <div className="p-8 text-center text-stone-400 text-sm">
                            No hay solicitudes
                        </div>
                    ) : (
                        filteredRequests.map((req) => (
                            <div
                                key={req.id}
                                onClick={() => setSelectedRequest(req)}
                                className={`p-4 border-b border-stone-100 cursor-pointer transition-colors ${selectedRequest?.id === req.id ? 'bg-stone-50 border-l-4 border-l-stone-900' : 'hover:bg-stone-50 border-l-4 border-l-transparent'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold text-stone-900">
                                        Hab {req.roomNumber}
                                    </span>
                                    <span className="text-xs text-stone-400">
                                        {new Date(req.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm text-stone-600 mb-2">
                                    <span className="capitalize px-1.5 py-0.5 bg-stone-100 rounded text-xs border border-stone-200">
                                        {req.type}
                                    </span>
                                    {getStatusIcon(req.status)}
                                </div>
                                <p className="text-sm text-stone-500 line-clamp-2">
                                    {req.messages[0]?.text || "Sin mensaje"}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content / Detail */}
            <div className="flex-1 bg-stone-50 flex flex-col h-full">
                {selectedRequest ? (
                    <>
                        {/* Header */}
                        <div className="p-6 bg-white border-b border-stone-200 flex justify-between items-start">
                            <div className="flex items-start space-x-4">
                                <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-stone-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-medium text-stone-900">
                                        {selectedRequest.guestName}
                                    </h2>
                                    <div className="flex items-center space-x-3 text-sm text-stone-500 mt-1">
                                        <div className="flex items-center space-x-1">
                                            <MapPin className="w-4 h-4" />
                                            <span>Hab {selectedRequest.roomNumber}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <span className="px-2 py-0.5 bg-stone-100 rounded text-xs uppercase border border-stone-200">
                                                {selectedRequest.type}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-2">
                                {['pending', 'in_progress', 'completed'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusUpdate(selectedRequest.id, status)}
                                        className={`px-3 py-1.5 rounded text-xs font-medium uppercase tracking-wide border transition-all ${selectedRequest.status === status
                                            ? 'bg-stone-900 text-white border-stone-900'
                                            : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                                            }`}
                                    >
                                        {status.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chat / Timeline */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {selectedRequest.messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.sender === 'reception' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-lg p-4 ${msg.sender === 'reception'
                                            ? 'bg-stone-900 text-white rounded-br-none'
                                            : 'bg-white border border-stone-200 rounded-bl-none shadow-sm'
                                            }`}
                                    >
                                        <p className="text-sm">{msg.text}</p>
                                        <p className={`text-xs mt-2 ${msg.sender === 'reception' ? 'text-stone-400' : 'text-stone-400'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {selectedRequest.messages.length === 0 && (
                                <div className="text-center text-stone-400 italic mt-10">
                                    No hay mensajes en esta solicitud.
                                </div>
                            )}
                        </div>

                        {/* Reply Input */}
                        <div className="p-4 bg-white border-t border-stone-200">
                            <form onSubmit={handleSendResponse} className="flex space-x-3">
                                <input
                                    type="text"
                                    value={responseText}
                                    onChange={(e) => setResponseText(e.target.value)}
                                    placeholder="Escribe una respuesta..."
                                    className="flex-1 border border-stone-300 rounded-sm px-4 py-2 outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!responseText.trim()}
                                    className="bg-stone-900 text-white px-6 py-2 rounded-sm hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
                                >
                                    <Send className="w-4 h-4" />
                                    <span>Enviar</span>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-stone-400 bg-stone-50">
                        <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg font-light">Selecciona una solicitud para ver detalles</p>
                    </div>
                )}
            </div>
        </div>
    );
}
