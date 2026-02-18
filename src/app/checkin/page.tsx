'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, QrCode, X } from 'lucide-react';
import { useGuestStore } from '@/lib/store';
import QRCodeLib from 'qrcode';
import { useEffect } from 'react';

export default function CheckInPage() {
    const router = useRouter();
    const { guest, updateGuest, completeCheckIn } = useGuestStore();
    const [email, setEmail] = useState(guest.email || '');
    const [arrivalTime, setArrivalTime] = useState('15:00');
    const [qrCode, setQrCode] = useState('');

    useEffect(() => {
        if (guest.checkInCompleted) {
            // Generate QR code
            const qrData = JSON.stringify({
                hotel: 'VAIN',
                guest: guest.name,
                room: guest.roomNumber,
                checkIn: guest.checkIn,
            });
            QRCodeLib.toDataURL(qrData, { width: 256 }).then(setQrCode);
        }
    }, [guest.checkInCompleted, guest.name, guest.roomNumber, guest.checkIn]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        completeCheckIn(email, arrivalTime);
    };

    if (guest.checkInCompleted) {
        return (
            <div className="min-h-screen bg-white">
                <div className="bg-neutral-900 text-white p-6">
                    <button
                        onClick={() => router.push('/home')}
                        className="mb-4 text-neutral-400 hover:text-white transition"
                    >
                        ← Volver
                    </button>
                    <h2 className="text-2xl font-light tracking-wide">Check-in Digital</h2>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 text-center space-y-6 py-12"
                >
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-2xl font-light">Check-in Confirmado</h3>
                        <p className="text-neutral-600">
                            Tu habitación {guest.roomNumber} estará lista a las 15:00
                        </p>
                    </div>

                    {qrCode && (
                        <div className="bg-neutral-50 p-6 rounded-sm space-y-4">
                            <img src={qrCode} alt="QR Code" className="mx-auto" />
                            <p className="text-sm text-neutral-600">
                                Presenta este código QR en recepción
                            </p>
                        </div>
                    )}

                    <button
                        onClick={() => router.push('/home')}
                        className="w-full bg-neutral-900 text-white py-4 rounded-sm font-light tracking-wide hover:bg-neutral-800 transition"
                    >
                        IR AL INICIO
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            <div className="bg-neutral-900 text-white p-6">
                <button
                    onClick={() => router.push('/')}
                    className="mb-4 text-neutral-400 hover:text-white transition"
                >
                    ← Volver
                </button>
                <h2 className="text-2xl font-light tracking-wide">Check-in Digital</h2>
            </div>

            <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="p-6 space-y-6"
            >
                <div className="border border-neutral-200 p-4 rounded-sm">
                    <label className="text-xs text-neutral-500 block mb-2">
                        NOMBRE COMPLETO
                    </label>
                    <input
                        type="text"
                        value={guest.name}
                        onChange={(e) => updateGuest({ name: e.target.value })}
                        className="w-full text-lg font-light outline-none"
                        required
                    />
                </div>

                <div className="border border-neutral-200 p-4 rounded-sm">
                    <label className="text-xs text-neutral-500 block mb-2">EMAIL</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full text-lg font-light outline-none"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="border border-neutral-200 p-4 rounded-sm">
                        <label className="text-xs text-neutral-500 block mb-2">
                            CHECK-IN
                        </label>
                        <p className="text-lg font-light">{guest.checkIn}</p>
                    </div>
                    <div className="border border-neutral-200 p-4 rounded-sm">
                        <label className="text-xs text-neutral-500 block mb-2">
                            CHECK-OUT
                        </label>
                        <p className="text-lg font-light">{guest.checkOut}</p>
                    </div>
                </div>

                <div className="border border-neutral-200 p-4 rounded-sm">
                    <label className="text-xs text-neutral-500 block mb-2">
                        HORA DE LLEGADA ESTIMADA
                    </label>
                    <input
                        type="time"
                        value={arrivalTime}
                        onChange={(e) => setArrivalTime(e.target.value)}
                        className="w-full text-lg font-light outline-none"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-neutral-900 text-white py-4 rounded-sm font-light tracking-wide hover:bg-neutral-800 transition"
                >
                    CONFIRMAR CHECK-IN
                </button>
            </motion.form>
        </div>
    );
}
