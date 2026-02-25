'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music, Wine, UtensilsCrossed, Palette, Clock, MapPin, ChevronRight, Star, Loader2 } from 'lucide-react';

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

export default function ExperiencesPage() {
    const router = useRouter();
    const [experiences, setExperiences] = useState<Experience[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/experiences', { cache: 'no-store' })
            .then(r => r.json())
            .then(data => {
                setExperiences(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const getIcon = (iconName: string) => {
        const icons: Record<string, any> = {
            Music,
            Wine,
            UtensilsCrossed,
            Palette,
        };
        return icons[iconName] || Music;
    };

    return (
        <div className="min-h-screen bg-stone-50 pb-20">
            <div className="bg-stone-900 text-white p-6">
                <button
                    onClick={() => router.push('/home')}
                    className="mb-4 text-stone-400 hover:text-white transition"
                >
                    ← Volver
                </button>
                <h2 className="text-2xl font-light tracking-wide">Experiencias en Palermo</h2>
                <p className="text-sm text-stone-400 mt-2">
                    Descubrí lo mejor de Buenos Aires
                </p>
            </div>

            <div className="p-6 space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
                    </div>
                ) : experiences.length === 0 ? (
                    <div className="text-center py-12 text-stone-400">
                        <p>No hay experiencias disponibles</p>
                    </div>
                ) : (
                    experiences.map((exp) => {
                        const Icon = getIcon(exp.icon);
                        return (
                            <motion.div
                                key={exp.id}
                                whileHover={{ scale: 1.02 }}
                                className="bg-white border border-stone-200 rounded-xl p-5 hover:shadow-lg transition-all"
                            >
                                <div className="flex items-start space-x-4">
                                    <div className="bg-stone-100 p-3 rounded-lg">
                                        <Icon className="w-6 h-6 text-stone-700" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-lg text-stone-900">{exp.title}</h3>
                                                <p className="text-sm text-stone-600">{exp.venue}</p>
                                            </div>
                                            {exp.rating && (
                                                <div className="flex items-center space-x-1 ml-2">
                                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                    <span className="text-sm font-medium text-stone-700">{exp.rating}</span>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-sm text-stone-600 mb-3">{exp.description}</p>

                                        <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                                            <div className="space-y-1">
                                                <div className="flex items-center text-sm text-stone-500">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    {exp.time}
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {exp.bookable ? (
                                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                                            ✓ Reserva disponible
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
                                                            ⭐ Recomendación
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-stone-500 mb-1">Desde</p>
                                                <p className="text-xl font-light text-stone-900">{exp.price}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => router.push('/concierge')}
                                            className="w-full mt-4 bg-stone-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-stone-800 transition-all"
                                        >
                                            {exp.bookable ? 'SOLICITAR RESERVA' : 'MÁS INFORMACIÓN'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
