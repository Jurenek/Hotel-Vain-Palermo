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
        <div className="min-h-screen bg-stone-50 pb-20">
            {/* Header más claro */}
            <div className="bg-gradient-to-br from-stone-600 to-stone-700 text-white p-6 pb-12">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <img
                            src="/Logo-Vain.webp"
                            alt="VAIN"
                            className="h-8 w-auto object-contain brightness-0 invert"
                        />
                        <p className="text-xs tracking-widest text-stone-200 mt-1 font-body">Palermo Soho</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-stone-200 font-body">{greeting}</p>
                        <p className="text-lg font-light font-body">{guest.name}</p>
                    </div>
                </div>

                {/* Cards más claras y legibles */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                    <div className="bg-white text-stone-900 p-4 rounded-xl shadow-md">
                        <p className="text-xs text-stone-600 mb-1 font-medium">HABITACIÓN</p>
                        <p className="text-3xl font-light text-stone-900">{guest.roomNumber}</p>
                    </div>
                    <div className="bg-white text-stone-900 p-4 rounded-xl shadow-md">
                        <p className="text-xs text-stone-600 mb-1 font-medium">CHECK-OUT</p>
                        <p className="text-lg font-light text-stone-900">{guest.checkOut}</p>
                    </div>
                </div>
            </div>

            {/* WiFi Card with gradient */}
            <div className="mx-6 -mt-10 relative z-10">
                <div className="bg-white rounded-xl shadow-2xl p-6 border border-stone-100">
                    <div className="flex items-start space-x-4">
                        <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-3 rounded-xl shadow-lg">
                            <Wifi className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-medium text-stone-900 mb-1">WiFi del Hotel</h3>
                            <p className="text-sm text-stone-600 mb-3">Red: <span className="font-mono font-medium">VAIN_GUEST</span></p>
                            <div className="flex items-center justify-between bg-stone-50 p-3 rounded-lg border border-stone-200">
                                <code className="text-sm font-mono text-stone-800">{guest.wifiPassword}</code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(guest.wifiPassword);
                                        alert('¡Contraseña copiada!');
                                    }}
                                    className="text-xs bg-stone-800 text-white px-3 py-1 rounded-full hover:bg-stone-700 transition-all"
                                >
                                    Copiar
                                </button>
                            </div>
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
                        className="bg-white p-4 rounded-sm border border-stone-100 flex items-center justify-between"
                    >
                        <div className="flex items-center space-x-3">
                            <UtensilsCrossed className="w-5 h-5 text-stone-600" />
                            <div>
                                <p className="font-medium">Desayuno</p>
                                <p className="text-sm text-stone-500">
                                    {hotelInfo.breakfast.location}
                                </p>
                            </div>
                        </div>
                        <span className="text-sm text-stone-600">
                            {hotelInfo.breakfast.start} - {hotelInfo.breakfast.end}
                        </span>
                    </motion.div>

                    <motion.div
                        whileHover={{ x: 4 }}
                        className="bg-white p-4 rounded-sm border border-stone-100 flex items-center justify-between"
                    >
                        <div className="flex items-center space-x-3">
                            <Waves className="w-5 h-5 text-blue-600" />
                            <div>
                                <p className="font-medium">Rooftop Pool</p>
                                <p className="text-sm text-stone-500">
                                    {hotelInfo.pool.location}
                                </p>
                            </div>
                        </div>
                        <span className="text-sm text-stone-600">
                            {hotelInfo.pool.start} - {hotelInfo.pool.end}
                        </span>
                    </motion.div>
                </div>
            </div>

            {/* Quick Actions más claras */}
            <div className="px-6 pb-6 space-y-4">
                <h2 className="text-lg font-medium tracking-wide text-stone-900 font-heading">Acciones Rápidas</h2>

                <div className="grid grid-cols-2 gap-3">
                    <QuickActionButton
                        icon={MessageCircle}
                        label="Concierge"
                        onClick={() => router.push('/concierge')}
                        className="bg-stone-800 text-white hover:bg-stone-700"
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
                        label="Info Hotel"
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

// Quick Action Button Component
const QuickActionButton = ({ icon: Icon, label, onClick, className = '' }: {
    icon: any;
    label: string;
    onClick: () => void;
    className?: string;
}) => (
    <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`p-5 rounded-xl transition-all shadow-md ${className || 'bg-white border border-stone-200 hover:shadow-xl'}`}
    >
        <Icon className={`w-6 h-6 mb-2 ${className?.includes('text-white') ? 'text-white' : 'text-stone-700'}`} />
        <p className={`text-sm font-medium ${className?.includes('text-white') ? 'text-white' : 'text-stone-900'}`}>{label}</p>
    </motion.button>
);

// Bottom Navigation
const BottomNav = ({ active, onNavigate }: { active: string; onNavigate: (screen: string) => void }) => (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-stone-200 px-6 py-3 shadow-2xl z-40">
        <div className="flex items-center justify-around">
            <NavButton icon={HomeIcon} label="Inicio" active={active === 'home'} onClick={() => onNavigate('home')} />
            <NavButton icon={Music} label="Experiencias" active={active === 'experiences'} onClick={() => onNavigate('experiences')} />
            <NavButton icon={Info} label="Info" active={active === 'info'} onClick={() => onNavigate('info')} />
            <NavButton icon={Calendar} label="Check-in" active={active === 'checkin'} onClick={() => onNavigate('checkin')} />
        </div>
    </div>
);

const NavButton = ({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) => (
    <button onClick={onClick} className={`flex flex-col items-center space-y-1 transition-all p-2 rounded-lg ${active ? 'text-stone-900 scale-110 bg-stone-50' : 'text-stone-500'}`}>
        <Icon className="w-5 h-5" />
        <span className="text-xs font-medium">{label}</span>
    </button>
);

function ChatOverlay({ onClose, guestName }: { onClose: () => void; guestName: string }) {
    return (
        <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed inset-0 bg-white z-50 flex flex-col"
        >
            <div className="bg-stone-900 text-white p-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-light">Recepción Vain</h3>
                    <p className="text-xs text-stone-400">Disponible 24/7</p>
                </div>
                <button onClick={onClose} className="text-white hover:text-stone-300">
                    ✕
                </button>
            </div>

            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                <div className="flex justify-start">
                    <div className="bg-stone-100 rounded-2xl rounded-tl-none p-4 max-w-[80%]">
                        <p className="text-sm text-stone-800">
                            ¡Hola {guestName}! ¿En qué podemos ayudarte hoy?
                        </p>
                        <span className="text-xs text-stone-500 mt-1 block">Ahora</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {['Pedir toallas extra', 'Solicitar taxi', 'Housekeeping', 'Info turística'].map(
                        (action) => (
                            <button
                                key={action}
                                className="bg-stone-50 border border-stone-200 p-3 rounded-lg text-sm hover:bg-stone-100 transition"
                            >
                                {action}
                            </button>
                        )
                    )}
                </div>
            </div>

            <div className="p-4 border-t border-stone-200">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        placeholder="Escribí tu mensaje..."
                        className="flex-1 border border-stone-300 rounded-full px-4 py-3 outline-none focus:border-stone-500"
                    />
                    <button className="bg-stone-900 text-white p-3 rounded-full hover:bg-stone-800 transition">
                        →
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

