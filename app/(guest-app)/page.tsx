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
        <div className="min-h-screen bg-gradient-to-br from-stone-100 via-neutral-50 to-amber-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-stone-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center space-y-8 max-w-md z-10"
            >
                {/* Logo */}
                <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-center space-y-3"
                >
                    {/* Logo VAIN como imagen */}
                    <div className="flex justify-center">
                        <img
                            src="/Logo-Vain.webp"
                            alt="VAIN Hotel"
                            className="h-20 w-auto object-contain"
                        />
                    </div>
                    <p className="text-xs tracking-[0.4em] text-stone-600 uppercase font-body">Boutique Hotel</p>
                    <p className="text-sm text-stone-700 font-body font-light">Palermo Soho · Buenos Aires</p>
                </motion.div>

                {/* Foto del hotel VAIN - Pileta */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="w-full max-w-xs mx-auto rounded-xl shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-300 mt-8"
                >
                    <img
                        src="/assets/pileta-vain.jpg"
                        alt="VAIN Hotel - Pileta"
                        className="w-full h-48 object-cover"
                    />
                </motion.div>



                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="text-stone-700 text-sm leading-relaxed max-w-xs mx-auto font-body"
                >
                    Tu estadía comienza aquí. Explorá Palermo con el estilo que te caracteriza.
                </motion.p>

                {/* Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    className="space-y-3"
                >
                    <button
                        onClick={() => router.push('/checkin')}
                        className="w-full bg-gradient-to-r from-stone-800 to-stone-700 text-white py-4 px-8 rounded-xl font-light tracking-wide hover:from-stone-700 hover:to-stone-600 transition-all transform hover:scale-[1.02] shadow-xl hover:shadow-2xl"
                    >
                        COMENZAR CHECK-IN
                    </button>

                    <button
                        onClick={() => router.push('/home')}
                        className="text-stone-600 text-sm hover:text-stone-900 transition-colors font-medium"
                    >
                        Ya hice check-in →
                    </button>
                </motion.div>
            </motion.div>

            {/* CSS animations */}
            <style jsx>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
}
