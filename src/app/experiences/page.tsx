'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music, Wine, UtensilsCrossed, Palette, Clock, MapPin, ChevronRight } from 'lucide-react';

export default function ExperiencesPage() {
    const router = useRouter();

    const experiences = [
        {
            id: 1,
            title: 'Cena Show de Tango',
            venue: 'El Querandi',
            description: 'Experiencia auténtica de tango con cena de 3 pasos',
            time: '20:30',
            price: 'USD 95',
            icon: Music,
        },
        {
            id: 2,
            title: 'Don Julio Parrilla',
            venue: 'Palermo Soho',
            description: 'Mejor parrilla de Buenos Aires (reserva recomendada)',
            time: 'Varios horarios',
            price: 'USD 60-80',
            icon: UtensilsCrossed,
        },
        {
            id: 3,
            title: 'Wine Tasting Tour',
            venue: 'Palermo Viejo',
            description: 'Degustación de vinos argentinos con sommelier',
            time: '18:00',
            price: 'USD 75',
            icon: Wine,
        },
        {
            id: 4,
            title: 'Galería Tour',
            venue: 'Circuito Palermo Soho',
            description: 'Recorrido por galerías de arte contemporáneo',
            time: '15:00',
            price: 'USD 40',
            icon: Palette,
        },
    ];

    return (
        <div className="min-h-screen bg-neutral-50 pb-20">
            <div className="bg-neutral-900 text-white p-6">
                <button
                    onClick={() => router.push('/home')}
                    className="mb-4 text-neutral-400 hover:text-white transition"
                >
                    ← Volver
                </button>
                <h2 className="text-2xl font-light tracking-wide">Experiencias en Palermo</h2>
                <p className="text-sm text-neutral-400 mt-2">
                    Descubrí lo mejor de Buenos Aires
                </p>
            </div>

            <div className="p-6 space-y-4">
                {experiences.map((exp, idx) => (
                    <motion.div
                        key={exp.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white border border-neutral-200 p-5 rounded-sm hover:shadow-md transition-all"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="bg-neutral-100 p-3 rounded-full">
                                <exp.icon className="w-5 h-5 text-neutral-700" />
                            </div>
                            <span className="text-sm text-neutral-600">{exp.price}</span>
                        </div>

                        <h3 className="font-medium text-lg mb-1">{exp.title}</h3>
                        <p className="text-sm text-neutral-500 mb-2">{exp.venue}</p>
                        <p className="text-sm text-neutral-600 mb-3">{exp.description}</p>

                        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                            <span className="text-sm text-neutral-500 flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {exp.time}
                            </span>
                            <button className="text-sm font-medium text-neutral-900 hover:underline flex items-center">
                                Reservar
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
