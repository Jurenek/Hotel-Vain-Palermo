'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VainLogo } from '@/components/VainLogo';
import {
    Clock,
    CheckCircle2,
    AlertCircle,
    User,
    MapPin,
    MessageSquare,
    Send,
    Star,
    Plus,
    Trash2,
    Save,
    Wifi,
    Coffee,
    Waves,
    Phone,
    Mail,
    Edit3,
    X,
    Loader2,
    Settings,
    Sparkles,
    LayoutDashboard,
    RefreshCw,
    Music,
    Wine,
    UtensilsCrossed,
    Palette,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ==================== TYPES ====================
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

interface Experience {
    id: number;
    title: string;
    venue: string;
    description: string;
    time: string;
    price: string;
    icon: string;
    category: string;
    bookable: boolean;
    rating: number | null;
    distance: string | null;
}

interface HotelSettings {
    wifi_network: string;
    wifi_password: string;
    breakfast_start: string;
    breakfast_end: string;
    breakfast_location: string;
    pool_start: string;
    pool_end: string;
    pool_location: string;
    reception_hours: string;
    quiet_hours_start: string;
    quiet_hours_end: string;
    phone: string;
    email: string;
    whatsapp: string;
    address: string;
    city: string;
    google_maps_url: string;
    amenities: string[];
}

type TabId = 'requests' | 'experiences' | 'services' | 'wifi';

// ==================== MAIN COMPONENT ====================
export default function ReceptionPage() {
    const [activeTab, setActiveTab] = useState<TabId>('requests');

    const tabs: { id: TabId; label: string; icon: any }[] = [
        { id: 'requests', label: 'Solicitudes', icon: MessageSquare },
        { id: 'experiences', label: 'Experiencias', icon: Sparkles },
        { id: 'services', label: 'Servicios', icon: Coffee },
        { id: 'wifi', label: 'WiFi & Info', icon: Wifi },
    ];

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Top Header */}
            <div className="bg-stone-900 text-white px-6 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <VainLogo className="w-20" light showSubtitle={false} />
                    <div className="h-6 w-px bg-stone-700 mx-2" />
                    <div>
                        <h1 className="text-sm font-medium tracking-widest uppercase">Recepción</h1>
                        <p className="text-[10px] text-stone-500 uppercase tracking-tighter">Panel de gestión</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => window.open('/', '_blank')}
                        className="text-xs text-stone-400 hover:text-amber-500 transition-colors flex items-center space-x-1"
                    >
                        <span>Ver Web de Huéspedes</span>
                    </button>
                    <div className="h-4 w-px bg-stone-700" />
                    <div className="flex items-center space-x-2 text-stone-400">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] uppercase tracking-widest">En Línea</span>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border-b border-stone-200 px-4 flex space-x-1 overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'border-stone-900 text-stone-900'
                            : 'border-transparent text-stone-500 hover:text-stone-700 hover:border-stone-300'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'requests' && <RequestsTab />}
                {activeTab === 'experiences' && <ExperiencesTab />}
                {activeTab === 'services' && <ServicesTab />}
                {activeTab === 'wifi' && <WifiInfoTab />}
            </div>
        </div>
    );
}

// ==================== REQUESTS TAB (existing code, cleaned up) ====================
function RequestsTab() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
    const [responseText, setResponseText] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');

    const fetchRequests = async () => {
        try {
            const timestamp = Date.now();
            const res = await fetch(`/api/requests?t=${timestamp}`, {
                cache: 'no-store',
                headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
            });
            if (res.ok) {
                const data = await res.json();
                console.log(`[Reception Polling] Received ${data.length} requests`);
                setRequests(data);

                // Use a functional update to get the latest selectedRequest
                setSelectedRequest(prev => {
                    if (!prev) return null;
                    const updated = data.find((r: Request) => r.id === prev.id);
                    return updated || prev;
                });
            }
        } catch (error) {
            console.error('[Reception Polling] Failed to fetch requests:', error);
        }
    };

    useEffect(() => {
        fetchRequests();
        
        // Subscribe to changes on the requests table
        const channel = supabase
            .channel('reception-requests')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'requests' },
                (payload) => {
                    console.log('[Realtime] Request changed:', payload);
                    fetchRequests(); // Re-fetch all to keep it simple and consistent
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

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

    const filteredRequests = requests.filter(r => filter === 'all' || r.status === filter);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <AlertCircle className="w-4 h-4 text-amber-500" />;
            case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
            case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            default: return null;
        }
    };

    return (
        <div className="flex h-full overflow-hidden">
            {/* Sidebar / List */}
            <div className="w-1/3 bg-white border-r border-stone-200 flex flex-col">
                {/* Filters */}
                <div className="p-2 border-b border-stone-100 flex space-x-2 overflow-x-auto">
                    {['all', 'pending', 'in_progress', 'completed'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider whitespace-nowrap ${filter === f
                                ? f === 'pending'
                                    ? 'bg-amber-500 text-white'
                                    : f === 'in_progress'
                                        ? 'bg-blue-500 text-white'
                                        : f === 'completed'
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-stone-900 text-white'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                }`}
                        >
                            {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : f === 'in_progress' ? 'En proceso' : 'Completados'}
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
                                    {req.status === 'pending' && <span className="text-[10px] px-2 py-0.5 bg-amber-500 text-white rounded-full font-bold uppercase tracking-wider">Pendiente</span>}
                                    {req.status === 'in_progress' && <span className="text-[10px] px-2 py-0.5 bg-blue-600 text-white rounded-full font-bold uppercase tracking-wider">En Proceso</span>}
                                    {req.status === 'completed' && <span className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded-full font-bold uppercase tracking-wider">Listo</span>}
                                </div>
                                <p className="text-sm text-stone-500 line-clamp-2">
                                    {req.messages && req.messages.length > 0
                                        ? req.messages[req.messages.length - 1].text
                                        : "Sin mensaje"}
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
                                        <span className="px-2 py-0.5 bg-stone-100 rounded text-xs uppercase border border-stone-200">
                                            {selectedRequest.type}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex space-x-2">
                                {['pending', 'in_progress', 'completed'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusUpdate(selectedRequest.id, status)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wide border transition-all ${selectedRequest.status === status
                                            ? status === 'pending'
                                                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                                : status === 'in_progress'
                                                    ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                                                    : 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                                            : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                                            }`}
                                    >
                                        {status === 'pending' ? 'Pendiente' : status === 'in_progress' ? 'En proceso' : 'Completado'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Chat / Timeline */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-white">
                            {selectedRequest.messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender === 'reception' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-5 py-4 shadow-sm border ${msg.sender === 'reception'
                                        ? 'bg-stone-900 border-stone-900 text-white rounded-br-none'
                                        : 'bg-amber-50 border-amber-200 text-stone-900 rounded-bl-none'
                                        }`}>
                                        <div className="flex items-center justify-between mb-2 border-b border-opacity-20 border-current pb-1">
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${msg.sender === 'reception' ? 'text-stone-400' : 'text-amber-800'}`}>
                                                {msg.sender === 'reception' ? '🛎️ Recepción' : '👤 Huésped'}
                                            </p>
                                            <p className={`text-[9px] font-medium ${msg.sender === 'reception' ? 'text-stone-500' : 'text-amber-600'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <p className="text-[15px] leading-relaxed font-medium">{msg.text}</p>
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

// ==================== EXPERIENCES TAB ====================
function ExperiencesTab() {
    const [experiences, setExperiences] = useState<Experience[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<Experience | null>(null);
    const [creating, setCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');

    const emptyExperience: Experience = {
        id: 0,
        title: '',
        venue: '',
        description: '',
        time: '',
        price: '',
        icon: 'Music',
        category: 'food',
        bookable: false,
        rating: null,
        distance: null,
    };

    const fetchExperiences = async () => {
        try {
            const res = await fetch('/api/experiences', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setExperiences(data);
            }
        } catch (error) {
            console.error('Error fetching experiences', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchExperiences(); }, []);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleSave = async (exp: Experience) => {
        setSaving(true);
        try {
            if (creating) {
                const res = await fetch('/api/experiences', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(exp),
                });
                if (res.ok) {
                    showToast('✅ Experiencia creada');
                    setCreating(false);
                    setEditing(null);
                    fetchExperiences();
                }
            } else {
                const res = await fetch(`/api/experiences/${exp.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(exp),
                });
                if (res.ok) {
                    showToast('✅ Experiencia actualizada');
                    setEditing(null);
                    fetchExperiences();
                }
            }
        } catch (error) {
            console.error('Error saving experience', error);
            showToast('❌ Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta experiencia?')) return;
        try {
            await fetch(`/api/experiences/${id}`, { method: 'DELETE' });
            showToast('🗑️ Experiencia eliminada');
            fetchExperiences();
        } catch (error) {
            console.error('Error deleting experience', error);
        }
    };

    const iconOptions = ['Music', 'Wine', 'UtensilsCrossed', 'Palette', 'MapPin', 'Star'];
    const categoryOptions = ['tango', 'food', 'art', 'nightlife', 'tour'];

    return (
        <div className="h-full overflow-y-auto">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ y: -40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -40, opacity: 0 }}
                        className="fixed top-20 right-6 z-50 bg-stone-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm"
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="p-6 max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-medium text-stone-900">Experiencias</h2>
                        <p className="text-sm text-stone-500">Gestionar experiencias que ven los huéspedes</p>
                    </div>
                    <button
                        onClick={() => { setCreating(true); setEditing(emptyExperience); }}
                        className="flex items-center space-x-2 bg-stone-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-800 transition"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nueva Experiencia</span>
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {experiences.map((exp) => {
                            const Icon = (exp.icon === 'Music' ? Music :
                                exp.icon === 'Wine' ? Wine :
                                    exp.icon === 'UtensilsCrossed' ? UtensilsCrossed : Palette);
                            return (
                                <div key={exp.id} className="bg-white border border-stone-200 rounded-lg p-4 flex items-center justify-between hover:shadow-sm transition group">
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div className="bg-stone-50 p-3 rounded-lg border border-stone-100 group-hover:bg-amber-50 group-hover:border-amber-100 transition-colors">
                                            <Icon className="w-5 h-5 text-stone-400 group-hover:text-amber-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-1">
                                                <h3 className="font-medium text-stone-900">{exp.title}</h3>
                                                <span className="text-[10px] px-2 py-0.5 bg-stone-100 rounded-full text-stone-500 uppercase tracking-tighter font-bold">{exp.category}</span>
                                                {exp.bookable && (
                                                    <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full uppercase tracking-tighter font-bold">✓ Reservable</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-stone-500">{exp.venue} · {exp.time} · {exp.price}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-4">
                                        <button
                                            onClick={() => { setEditing(exp); setCreating(false); }}
                                            className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded transition"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(exp.id)}
                                            className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {experiences.length === 0 && (
                            <div className="text-center py-12 text-stone-400">
                                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No hay experiencias cargadas</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit/Create Modal */}
            <AnimatePresence>
                {editing && (
                    <ExperienceModal
                        experience={editing}
                        isNew={creating}
                        saving={saving}
                        iconOptions={iconOptions}
                        categoryOptions={categoryOptions}
                        onSave={handleSave}
                        onClose={() => { setEditing(null); setCreating(false); }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Experience edit/create modal
function ExperienceModal({ experience, isNew, saving, iconOptions, categoryOptions, onSave, onClose }: {
    experience: Experience;
    isNew: boolean;
    saving: boolean;
    iconOptions: string[];
    categoryOptions: string[];
    onSave: (exp: Experience) => void;
    onClose: () => void;
}) {
    const [form, setForm] = useState(experience);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between p-5 border-b border-stone-200">
                    <h3 className="text-lg font-medium">
                        {isNew ? 'Nueva Experiencia' : 'Editar Experiencia'}
                    </h3>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-900">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-stone-600 block mb-1">TÍTULO *</label>
                        <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">LUGAR *</label>
                            <input type="text" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" required />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">HORARIO</label>
                            <input type="text" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-stone-600 block mb-1">DESCRIPCIÓN *</label>
                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                            rows={3} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900 resize-none" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">PRECIO</label>
                            <input type="text" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">RATING</label>
                            <input type="number" step="0.1" min="0" max="5" value={form.rating || ''} onChange={e => setForm({ ...form, rating: e.target.value ? parseFloat(e.target.value) : null })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">CATEGORÍA</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900 bg-white">
                                {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">ICONO</label>
                            <select value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900 bg-white">
                                {iconOptions.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">DISTANCIA</label>
                            <input type="text" value={form.distance || ''} onChange={e => setForm({ ...form, distance: e.target.value || null })}
                                placeholder="ej: 5 min walk" className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" />
                        </div>
                        <div className="flex items-end pb-1">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input type="checkbox" checked={form.bookable} onChange={e => setForm({ ...form, bookable: e.target.checked })}
                                    className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900" />
                                <span className="text-sm text-stone-700">Reservable por VAIN</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-5 border-t border-stone-200 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 transition">
                        Cancelar
                    </button>
                    <button
                        onClick={() => onSave(form)}
                        disabled={saving || !form.title || !form.venue || !form.description}
                        className="flex items-center space-x-2 bg-stone-900 text-white px-5 py-2 rounded-lg text-sm hover:bg-stone-800 disabled:opacity-50 transition"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>{isNew ? 'Crear' : 'Guardar'}</span>
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ==================== SERVICES TAB ====================
function ServicesTab() {
    const [settings, setSettings] = useState<HotelSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');

    const fetchSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/hotel-settings', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            } else {
                setError(`API Error: ${res.status}`);
                console.error('[ServicesTab] API Error:', res.status);
            }
        } catch (err) {
            setError('Connection Error');
            console.error('[ServicesTab] Connection Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSettings(); }, []);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            const res = await fetch('/api/hotel-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                showToast('✅ Horarios actualizados');
            }
        } catch (error) {
            console.error('Error saving settings', error);
            showToast('❌ Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            </div>
        );
    }

    if (error || !settings) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <p className="text-stone-600 font-medium">{error || 'No se pudieron cargar los datos'}</p>
                <button
                    onClick={fetchSettings}
                    className="bg-stone-900 text-white px-6 py-2 rounded-lg text-sm hover:bg-stone-800 transition"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ y: -40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -40, opacity: 0 }}
                        className="fixed top-20 right-6 z-50 bg-stone-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm"
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="p-6 max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-medium text-stone-900">Servicios & Horarios</h2>
                        <p className="text-sm text-stone-500">Editar la información que ven los huéspedes</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center space-x-2 bg-stone-900 text-white px-5 py-2 rounded-lg text-sm hover:bg-stone-800 disabled:opacity-50 transition"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Guardar Cambios</span>
                    </button>
                </div>

                {/* Breakfast */}
                <div className="bg-white border border-stone-200 rounded-lg p-5">
                    <div className="flex items-center space-x-2 mb-4">
                        <Coffee className="w-5 h-5 text-amber-600" />
                        <h3 className="font-medium text-stone-900">Desayuno</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">INICIO</label>
                            <input type="text" value={settings.breakfast_start}
                                onChange={e => setSettings({ ...settings, breakfast_start: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">FIN</label>
                            <input type="text" value={settings.breakfast_end}
                                onChange={e => setSettings({ ...settings, breakfast_end: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">UBICACIÓN</label>
                            <input type="text" value={settings.breakfast_location}
                                onChange={e => setSettings({ ...settings, breakfast_location: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" />
                        </div>
                    </div>
                </div>

                {/* Pool */}
                <div className="bg-white border border-stone-200 rounded-lg p-5">
                    <div className="flex items-center space-x-2 mb-4">
                        <Waves className="w-5 h-5 text-blue-600" />
                        <h3 className="font-medium text-stone-900">Piscina / Rooftop</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">INICIO</label>
                            <input type="text" value={settings.pool_start}
                                onChange={e => setSettings({ ...settings, pool_start: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">FIN</label>
                            <input type="text" value={settings.pool_end}
                                onChange={e => setSettings({ ...settings, pool_end: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">UBICACIÓN</label>
                            <input type="text" value={settings.pool_location}
                                onChange={e => setSettings({ ...settings, pool_location: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" />
                        </div>
                    </div>
                </div>

                {/* Reception & Quiet Hours */}
                <div className="bg-white border border-stone-200 rounded-lg p-5">
                    <div className="flex items-center space-x-2 mb-4">
                        <Settings className="w-5 h-5 text-stone-600" />
                        <h3 className="font-medium text-stone-900">Recepción & Horario Silencioso</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">RECEPCIÓN</label>
                            <input type="text" value={settings.reception_hours}
                                onChange={e => setSettings({ ...settings, reception_hours: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">SILENCIO DESDE</label>
                            <input type="text" value={settings.quiet_hours_start}
                                onChange={e => setSettings({ ...settings, quiet_hours_start: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">SILENCIO HASTA</label>
                            <input type="text" value={settings.quiet_hours_end}
                                onChange={e => setSettings({ ...settings, quiet_hours_end: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==================== WIFI & INFO TAB ====================
function WifiInfoTab() {
    const [settings, setSettings] = useState<HotelSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const [newAmenity, setNewAmenity] = useState('');

    const fetchSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/hotel-settings', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            } else {
                setError(`API Error: ${res.status}`);
                console.error('[WifiInfoTab] API Error:', res.status);
            }
        } catch (err) {
            setError('Connection Error');
            console.error('[WifiInfoTab] Connection Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSettings(); }, []);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            const res = await fetch('/api/hotel-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                showToast('✅ Información actualizada');
            }
        } catch (error) {
            console.error('Error saving settings', error);
            showToast('❌ Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const addAmenity = () => {
        if (!newAmenity.trim() || !settings) return;
        setSettings({ ...settings, amenities: [...settings.amenities, newAmenity.trim()] });
        setNewAmenity('');
    };

    const removeAmenity = (idx: number) => {
        if (!settings) return;
        setSettings({ ...settings, amenities: settings.amenities.filter((_, i) => i !== idx) });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            </div>
        );
    }

    if (error || !settings) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <p className="text-stone-600 font-medium">{error || 'No se pudieron cargar los datos'}</p>
                <button
                    onClick={fetchSettings}
                    className="bg-stone-900 text-white px-6 py-2 rounded-lg text-sm hover:bg-stone-800 transition"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ y: -40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -40, opacity: 0 }}
                        className="fixed top-20 right-6 z-50 bg-stone-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm"
                    >
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="p-6 max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-medium text-stone-900">WiFi & Información</h2>
                        <p className="text-sm text-stone-500">Contraseña de WiFi, contacto y amenities</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center space-x-2 bg-stone-900 text-white px-5 py-2 rounded-lg text-sm hover:bg-stone-800 disabled:opacity-50 transition"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Guardar Cambios</span>
                    </button>
                </div>

                {/* WiFi */}
                <div className="bg-white border border-stone-200 rounded-lg p-5">
                    <div className="flex items-center space-x-2 mb-4">
                        <Wifi className="w-5 h-5 text-amber-600" />
                        <h3 className="font-medium text-stone-900">WiFi del Hotel</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">NOMBRE DE RED</label>
                            <input type="text" value={settings.wifi_network}
                                onChange={e => setSettings({ ...settings, wifi_network: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">CONTRASEÑA</label>
                            <input type="text" value={settings.wifi_password}
                                onChange={e => setSettings({ ...settings, wifi_password: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900 font-mono" />
                        </div>
                    </div>
                </div>

                {/* Contact */}
                <div className="bg-white border border-stone-200 rounded-lg p-5">
                    <div className="flex items-center space-x-2 mb-4">
                        <Phone className="w-5 h-5 text-stone-600" />
                        <h3 className="font-medium text-stone-900">Contacto</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">TELÉFONO</label>
                            <input type="text" value={settings.phone}
                                onChange={e => setSettings({ ...settings, phone: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">EMAIL</label>
                            <input type="text" value={settings.email}
                                onChange={e => setSettings({ ...settings, email: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">WHATSAPP</label>
                            <input type="text" value={settings.whatsapp}
                                onChange={e => setSettings({ ...settings, whatsapp: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" />
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="bg-white border border-stone-200 rounded-lg p-5">
                    <div className="flex items-center space-x-2 mb-4">
                        <MapPin className="w-5 h-5 text-stone-600" />
                        <h3 className="font-medium text-stone-900">Ubicación</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">DIRECCIÓN</label>
                            <input type="text" value={settings.address}
                                onChange={e => setSettings({ ...settings, address: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-stone-600 block mb-1">CIUDAD</label>
                            <input type="text" value={settings.city}
                                onChange={e => setSettings({ ...settings, city: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-medium text-stone-600 block mb-1">GOOGLE MAPS URL</label>
                            <input type="text" value={settings.google_maps_url}
                                onChange={e => setSettings({ ...settings, google_maps_url: e.target.value })}
                                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900" />
                        </div>
                    </div>
                </div>

                {/* Amenities */}
                <div className="bg-white border border-stone-200 rounded-lg p-5">
                    <div className="flex items-center space-x-2 mb-4">
                        <Star className="w-5 h-5 text-amber-600" />
                        <h3 className="font-medium text-stone-900">Amenities</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {(settings.amenities || []).map((amenity, idx) => (
                            <span key={idx} className="flex items-center space-x-1 bg-stone-100 text-stone-700 px-3 py-1.5 rounded-full text-sm">
                                <span>{amenity}</span>
                                <button onClick={() => removeAmenity(idx)} className="text-stone-400 hover:text-red-500 ml-1">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={newAmenity}
                            onChange={e => setNewAmenity(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                            placeholder="Agregar amenity..."
                            className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-stone-900"
                        />
                        <button
                            onClick={addAmenity}
                            disabled={!newAmenity.trim()}
                            className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-stone-800 disabled:opacity-50 transition"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
