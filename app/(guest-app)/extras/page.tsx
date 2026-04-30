'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sun,
    Moon,
    Crown,
    Clock,
    CheckCircle2,
    Loader2,
    X,
    Home as HomeIcon,
    Music,
    Info,
    MessageCircle,
    Sparkles,
} from 'lucide-react';
import { useGuestStore } from '@/lib/store';

interface Upsell {
    id: string;
    type: string;
    title: string;
    description: string;
    price: number;
    currency: string;
    maxHours?: number;
}

interface MyBooking {
    id: string;
    title: string;
    type: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    requestedTime?: string;
}

const UPSELL_ICONS: Record<string, any> = {
    early_checkin: Sun,
    late_checkout: Moon,
    room_upgrade: Crown,
};

const UPSELL_COLORS: Record<string, string> = {
    early_checkin: 'from-amber-400 to-orange-500',
    late_checkout: 'from-indigo-400 to-purple-500',
    room_upgrade: 'from-yellow-400 to-amber-500',
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendiente de confirmación', color: 'bg-amber-100 text-amber-800' },
    confirmed: { label: 'Confirmado ✓', color: 'bg-emerald-100 text-emerald-800' },
    cancelled: { label: 'Cancelado', color: 'bg-stone-100 text-stone-500' },
};

export default function ExtrasPage() {
    const router = useRouter();
    const { guest } = useGuestStore();
    const [upsells, setUpsells] = useState<Upsell[]>([]);
    const [myBookings, setMyBookings] = useState<MyBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Upsell | null>(null);
    const [requestedTime, setRequestedTime] = useState('');
    const [booking, setBooking] = useState(false);
    const [successId, setSuccessId] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState('');

    const fetchData = async () => {
        try {
            const [catalogRes, bookingsRes] = await Promise.all([
                fetch('/api/upsells', { cache: 'no-store' }),
                fetch(`/api/upsells/my-bookings?roomNumber=${guest.roomNumber}`, { cache: 'no-store' }),
            ]);

            if (catalogRes.ok) {
                const data = await catalogRes.json();
                setUpsells(data.upsells ?? []);
            }
            if (bookingsRes.ok) {
                const data = await bookingsRes.json();
                setMyBookings(data);
            }
        } catch (err) {
            console.error('[ExtrasPage] fetch error', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [guest.roomNumber]);

    const getBookingForUpsell = (upsellId: string) =>
        myBookings.find((b) => b.id === upsellId || b.type === getTypeForId(upsellId));

    const getTypeForId = (upsellId: string) =>
        upsells.find((u) => u.id === upsellId)?.type ?? '';

    const needsTime = (type: string) =>
        type === 'early_checkin' || type === 'late_checkout';

    const handleConfirm = async () => {
        if (!selected) return;
        setBooking(true);
        setErrorMsg('');
        try {
            const res = await fetch('/api/upsells/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomNumber: guest.roomNumber,
                    guestName: guest.name,
                    upsellId: selected.id,
                    requestedTime: requestedTime || undefined,
                }),
            });

            if (res.status === 409) {
                setErrorMsg('Ya solicitaste este servicio.');
                return;
            }
            if (!res.ok) {
                const err = await res.json();
                setErrorMsg(err.error ?? 'Error al solicitar el servicio.');
                return;
            }

            const data = await res.json();
            setSuccessId(data.bookingId);
            setSelected(null);
            setRequestedTime('');
            await fetchData();
        } catch {
            setErrorMsg('Error de conexión. Intentá de nuevo.');
        } finally {
            setBooking(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 pb-24">
            {/* Header */}
            <div className="bg-gradient-to-br from-stone-700 to-stone-900 text-white p-6 pb-10">
                <div className="flex items-center justify-between mb-2">
                    <img
                        src="/Logo-Vain.webp"
                        alt="VAIN"
                        className="h-7 w-auto object-contain brightness-0 invert"
                    />
                    <div className="text-right">
                        <p className="text-xs text-stone-400">Hab. {guest.roomNumber}</p>
                        <p className="text-sm font-light text-stone-200">{guest.name}</p>
                    </div>
                </div>
                <h1 className="text-2xl font-light tracking-wide mt-4">Servicios del hotel</h1>
                <p className="text-sm text-stone-400 mt-1">Se registran como cargo a tu habitación</p>
            </div>

            {/* Content */}
            <div className="px-5 -mt-4 space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
                    </div>
                ) : upsells.length === 0 ? (
                    <div className="bg-white rounded-xl border border-stone-100 p-10 text-center mt-6">
                        <Sparkles className="w-10 h-10 mx-auto mb-3 text-stone-300" />
                        <p className="text-stone-400 text-sm">No hay servicios disponibles</p>
                    </div>
                ) : (
                    upsells.map((upsell) => {
                        const Icon = UPSELL_ICONS[upsell.type] ?? Sparkles;
                        const gradient = UPSELL_COLORS[upsell.type] ?? 'from-stone-500 to-stone-700';
                        const existingBooking = myBookings.find(
                            (b) => b.type === upsell.type && b.status !== 'cancelled'
                        );
                        const statusInfo = existingBooking
                            ? STATUS_LABEL[existingBooking.status]
                            : null;

                        return (
                            <motion.div
                                key={upsell.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl shadow-md border border-stone-100 overflow-hidden"
                            >
                                <div className="flex items-start p-5 space-x-4">
                                    <div className={`bg-gradient-to-br ${gradient} p-3.5 rounded-xl shadow-lg flex-shrink-0`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-stone-900 text-lg leading-tight">
                                            {upsell.title}
                                        </h3>
                                        <p className="text-sm text-stone-500 mt-1 leading-relaxed">
                                            {upsell.description}
                                        </p>
                                        {existingBooking?.requestedTime && (
                                            <div className="flex items-center space-x-1 mt-2 text-xs text-stone-500">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>Hora solicitada: {existingBooking.requestedTime}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="px-5 pb-5 flex items-center justify-between">
                                    {statusInfo ? (
                                        <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${statusInfo.color}`}>
                                            {statusInfo.label}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-stone-400">Cargo a habitación</span>
                                    )}

                                    {!existingBooking ? (
                                        <button
                                            onClick={() => {
                                                setSelected(upsell);
                                                setErrorMsg('');
                                                setRequestedTime('');
                                            }}
                                            className="bg-stone-900 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-stone-700 transition-all active:scale-95"
                                        >
                                            Solicitar
                                        </button>
                                    ) : existingBooking.status === 'confirmed' ? (
                                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                    ) : null}
                                </div>
                            </motion.div>
                        );
                    })
                )}

                {/* Toast de éxito */}
                <AnimatePresence>
                    {successId && (
                        <motion.div
                            initial={{ y: 60, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 60, opacity: 0 }}
                            onAnimationComplete={() => setTimeout(() => setSuccessId(null), 3000)}
                            className="fixed bottom-24 left-4 right-4 bg-stone-900 text-white text-sm text-center px-4 py-3 rounded-xl shadow-2xl z-50"
                        >
                            ✓ Solicitud registrada. Recepción la confirmará en breve.
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom sheet de confirmación */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-40 flex items-end"
                        onClick={() => setSelected(null)}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-white rounded-t-3xl p-6 space-y-5 shadow-2xl"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-stone-900">{selected.title}</h3>
                                <button
                                    onClick={() => setSelected(null)}
                                    className="text-stone-400 hover:text-stone-700 transition"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="bg-stone-50 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-600">Habitación</span>
                                    <span className="font-medium text-stone-900">{guest.roomNumber}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-600">Huésped</span>
                                    <span className="font-medium text-stone-900">{guest.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-600">Método de pago</span>
                                    <span className="font-medium text-stone-900">Cargo a habitación</span>
                                </div>
                            </div>

                            {needsTime(selected.type) && (
                                <div>
                                    <label className="text-xs font-medium text-stone-600 block mb-2 uppercase tracking-wide">
                                        Hora deseada
                                    </label>
                                    <input
                                        type="time"
                                        value={requestedTime}
                                        onChange={(e) => setRequestedTime(e.target.value)}
                                        className="w-full border border-stone-300 rounded-xl px-4 py-3 text-stone-900 outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 text-base"
                                    />
                                </div>
                            )}

                            {errorMsg && (
                                <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                                    {errorMsg}
                                </p>
                            )}

                            <button
                                onClick={handleConfirm}
                                disabled={booking}
                                className="w-full bg-stone-900 text-white py-4 rounded-xl font-medium text-base hover:bg-stone-800 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center space-x-2"
                            >
                                {booking ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <span>Confirmar cargo a hab. {guest.roomNumber}</span>
                                )}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Nav */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-stone-200 px-4 py-3 shadow-2xl z-30">
                <div className="flex items-center justify-around max-w-md mx-auto">
                    <NavButton icon={HomeIcon} label="Inicio" active={false} onClick={() => router.push('/home')} />
                    <NavButton icon={Music} label="Salidas" active={false} onClick={() => router.push('/experiences')} />
                    <NavButton icon={Sparkles} label="Extras" active={true} onClick={() => {}} />
                    <NavButton icon={MessageCircle} label="Concierge" active={false} onClick={() => router.push('/concierge')} />
                    <NavButton icon={Info} label="Info" active={false} onClick={() => router.push('/info')} />
                </div>
            </div>
        </div>
    );
}

function NavButton({
    icon: Icon,
    label,
    active,
    onClick,
}: {
    icon: any;
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center space-y-1 transition-all p-2 rounded-lg ${
                active ? 'text-stone-900 scale-110 bg-stone-50' : 'text-stone-500'
            }`}
        >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{label}</span>
        </button>
    );
}
