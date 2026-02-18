'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useGuestStore } from '@/lib/store';

export default function WelcomePage() {
    const router = useRouter();
    const { guest } = useGuestStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Si ya completó check-in, redirigir al home
        if (guest.checkInCompleted) {
            setTimeout(() => router.push('/home'), 1500);
        }
    }, [guest.checkInCompleted, router]);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-stone-800 text-white flex flex-col items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center space-y-8 max-w-md"
            >
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="space-y-2"
                >
                    <h1 className="text-6xl font-light tracking-[0.3em]">VAIN</h1>
                    <p className="text-sm tracking-widest text-neutral-400">
                        BOUTIQUE HOTEL
                    </p>
                    <div className="w-24 h-px bg-neutral-600 mx-auto mt-4"></div>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-neutral-300 text-sm leading-relaxed"
                >
                    Bienvenido a tu estadía en el corazón de Palermo
                </motion.p>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="space-y-4"
                >
                    <button
                        onClick={() => router.push('/checkin')}
                        className="w-full bg-white text-neutral-900 py-4 rounded-sm font-light tracking-wide hover:bg-neutral-100 transition-all shadow-lg hover:shadow-xl"
                    >
                        COMENZAR CHECK-IN
                    </button>

                    <button
                        onClick={() => router.push('/home')}
                        className="text-neutral-400 text-sm hover:text-white transition-colors"
                    >
                        Ir al inicio
                    </button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="pt-8 text-xs text-neutral-500 space-y-1"
                >
                    <p>Thames 2226, Palermo Soho</p>
                    <p>Buenos Aires, Argentina</p>
                </motion.div>
            </motion.div>
        </div>
    );
}
