'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Wifi,
    UtensilsCrossed,
    Waves,
    MessageCircle,
    Car,
    Music,
    MapPin,
    Home as HomeIcon,
    Calendar,
    Info,
} from 'lucide-react';
import { useGuestStore } from '@/lib/store';
import { getGreeting } from '@/lib/utils';

export default function HomePage() {
    const router = useRouter();
    const { guest } = useGuestStore();
    const [mounted, setMounted] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    const greeting = getGreeting();

    const hotelInfo = {
        breakfast: { start: '7:00', end: '11:00', location: 'Lobby Bar' },
        pool: { start: '9:00', end: '20:00', location: 'Rooftop Terrace' },
    };

    return (
        <div className="min-h-screen bg-neutral-50 pb-20">
            {/* Header */}
            <div className="bg-neutral-900 text-white p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-light tracking-[0.2em]">VAIN</h1>
                        <p className="text-xs tracking-widest text-neutral-400 mt-1">
                            PALERMO SOHO
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-neutral-400">{greeting}</p>
                        <p className="text-lg font-light">{guest.name}</p>
                    </div>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                    <div className="bg-neutral-800 p-4 rounded-sm">
                        <p className="text-xs text-neutral-400 mb-1">HABITACIÓN</p>
                        <p className="text-2xl font-light">{guest.roomNumber}</p>
                    </div>
                    <div className="bg-neutral-800 p-4 rounded-sm">
                        <p className="text-xs text-neutral-400 mb-1">CHECK-OUT</p>
                        <p className="text-lg font-light">{guest.checkOut}</p>
                    </div>
                </div>
            </div>

            {/* WiFi Card */}
            <div className="mx-6 -mt-6 bg-white rounded-sm shadow-lg p-6 border border-neutral-100">
                <div className="flex items-start space-x-4">
                    <div className="bg-neutral-100 p-3 rounded-full">
                        <Wifi className="w-6 h-6 text-neutral-700" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-medium mb-1">WiFi del Hotel</h3>
                        <p className="text-sm text-neutral-500 mb-3">Red: VAIN_GUEST</p>
                        <div className="flex items-center justify-between bg-neutral-50 p-3 rounded">
                            <code className="text-sm font-mono">{guest.wifiPassword}</code>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(guest.wifiPassword);
                                    alert('Contraseña copiada!');
                                }}
                                className="text-xs text-neutral-600 hover:text-neutral-900 underline"
                            >
                                Copiar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Schedule */}
            <div className="p-6 space-y-4">
                <h2 className="text-lg font-light tracking-wide">Horarios de Hoy</h2>

                <div className="space-y-3">
                    <motion.div
                        whileHover={{ x: 4 }}
                        className="bg-white p-4 rounded-sm border border-neutral-100 flex items-center justify-between"
                    >
                        <div className="flex items-center space-x-3">
                            <UtensilsCrossed className="w-5 h-5 text-neutral-600" />
                            <div>
                                <p className="font-medium">Desayuno</p>
                                <p className="text-sm text-neutral-500">
                                    {hotelInfo.breakfast.location}
                                </p>
                            </div>
                        </div>
                        <span className="text-sm text-neutral-600">
                            {hotelInfo.breakfast.start} - {hotelInfo.breakfast.end}
                        </span>
                    </motion.div>

                    <motion.div
                        whileHover={{ x: 4 }}
                        className="bg-white p-4 rounded-sm border border-neutral-100 flex items-center justify-between"
                    >
                        <div className="flex items-center space-x-3">
                            <Waves className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="font-medium">Rooftop Pool</p>
                                <p className="text-sm text-neutral-500">
                                    {hotelInfo.pool.location}
                                </p>
                            </div>
                        </div>
                        <span className="text-sm text-neutral-600">
                            {hotelInfo.pool.start} - {hotelInfo.pool.end}
                        </span>
                    </motion.div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="px-6 pb-6 space-y-4">
                <h2 className="text-lg font-light tracking-wide">Acciones Rápidas</h2>

                <div className="grid grid-cols-2 gap-3">
                    <QuickActionButton
                        icon={MessageCircle}
                        label="Chat con Recepción"
                        onClick={() => setChatOpen(true)}
                    />
                    <QuickActionButton
                        icon={Car}
                        label="Pedir Auto"
                        onClick={() => router.push('/concierge')}
                    />
                    <QuickActionButton
                        icon={Music}
                        label="Experiencias"
                        onClick={() => router.push('/experiences')}
                    />
                    <QuickActionButton
                        icon={MapPin}
                        label="Info del Hotel"
                        onClick={() => router.push('/info')}
                    />
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNav
                active="home"
                onNavigate={(screen) => {
                    if (screen === 'chat') setChatOpen(true);
                    else router.push(`/${screen}`);
                }}
            />

            {/* Chat Overlay */}
            {chatOpen && (
                <ChatOverlay onClose={() => setChatOpen(false)} guestName={guest.name} />
            )}
        </div>
    );
}

function QuickActionButton({
    icon: Icon,
    label,
    onClick,
}: {
    icon: any;
    label: string;
    onClick: () => void;
}) {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="bg-white border border-neutral-200 p-4 rounded-sm hover:bg-neutral-50 transition-all"
        >
            <Icon className="w-6 h-6 text-neutral-700 mb-2" />
            <p className="text-sm font-medium">{label}</p>
        </motion.button>
    );
}

function BottomNav({
    active,
    onNavigate,
}: {
    active: string;
    onNavigate: (screen: string) => void;
}) {
    const navItems = [
        { id: 'home', icon: HomeIcon, label: 'Inicio' },
        { id: 'experiences', icon: Music, label: 'Experiencias' },
        { id: 'chat', icon: MessageCircle, label: 'Chat' },
        { id: 'info', icon: Info, label: 'Info' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200">
            <div className="max-w-md mx-auto px-6 py-4">
                <div className="flex items-center justify-around">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`flex flex-col items-center space-y-1 ${active === item.id ? 'text-neutral-900' : 'text-neutral-400'
                                }`}
                        >
                            <item.icon className="w-6 h-6" />
                            <span className="text-xs">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ChatOverlay({ onClose, guestName }: { onClose: () => void; guestName: string }) {
    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed inset-0 bg-white z-50 flex flex-col"
        >
            <div className="bg-neutral-900 text-white p-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-light">Recepción Vain</h3>
                    <p className="text-xs text-neutral-400">Disponible 24/7</p>
                </div>
                <button onClick={onClose} className="text-white hover:text-neutral-300">
                    ✕
                </button>
            </div>

            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                <div className="flex justify-start">
                    <div className="bg-neutral-100 rounded-2xl rounded-tl-none p-4 max-w-[80%]">
                        <p className="text-sm text-neutral-800">
                            ¡Hola {guestName}! ¿En qué podemos ayudarte hoy?
                        </p>
                        <span className="text-xs text-neutral-500 mt-1 block">Ahora</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {['Pedir toallas extra', 'Solicitar taxi', 'Housekeeping', 'Info turística'].map(
                        (action) => (
                            <button
                                key={action}
                                className="bg-neutral-50 border border-neutral-200 p-3 rounded-lg text-sm hover:bg-neutral-100 transition"
                            >
                                {action}
                            </button>
                        )
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-neutral-200">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        placeholder="Escribí tu mensaje..."
                        className="flex-1 border border-neutral-300 rounded-full px-4 py-3 outline-none focus:border-neutral-500"
                    />
                    <button className="bg-neutral-900 text-white p-3 rounded-full hover:bg-neutral-800 transition">
                        →
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
