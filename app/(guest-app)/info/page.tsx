'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Mail, MapPin, MessageCircle, Loader2 } from 'lucide-react';

interface HotelSettings {
    phone: string;
    email: string;
    whatsapp: string;
    address: string;
    city: string;
    google_maps_url: string;
    amenities: string[];
}

export default function InfoPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<HotelSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/hotel-settings', { cache: 'no-store' })
            .then(r => r.json())
            .then(data => {
                setSettings(data);
                setLoading(false);
            })
            .catch(() => {
                // Fallback
                setSettings({
                    phone: '+54 11 4774-6780',
                    email: 'info@vainhotel.com',
                    whatsapp: '+54 9 11 6555-9467',
                    address: 'Thames 2226, Palermo Soho',
                    city: 'Buenos Aires, Argentina',
                    google_maps_url: 'https://maps.google.com/?q=Thames+2226+Palermo+Buenos+Aires',
                    amenities: ['WiFi Gratis', 'Rooftop Pool', 'Desayuno Incluido', 'Aire Acondicionado', 'Calefacción', 'Concierge 24/7'],
                });
                setLoading(false);
            });
    }, []);

    if (loading || !settings) {
        return (
            <div className="min-h-screen bg-stone-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
            </div>
        );
    }

    // Extract WhatsApp number for the wa.me link (remove spaces and special chars)
    const waNumber = settings.whatsapp.replace(/[^0-9]/g, '');

    return (
        <div className="min-h-screen bg-stone-50 pb-20">
            <div className="bg-stone-900 text-white p-6">
                <button
                    onClick={() => router.push('/home')}
                    className="mb-4 text-stone-400 hover:text-white transition"
                >
                    ← Volver
                </button>
                <h2 className="text-2xl font-light tracking-wide">Información del Hotel</h2>
            </div>

            <div className="p-6 space-y-6">
                {/* Location */}
                <div className="bg-white border border-stone-200 rounded-sm p-6 space-y-4">
                    <h3 className="font-medium text-lg">Ubicación</h3>
                    <p className="text-stone-600">{settings.address}</p>
                    <p className="text-stone-600">{settings.city}</p>
                    <a
                        href={settings.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-stone-900 underline inline-block"
                    >
                        Ver en Google Maps
                    </a>
                </div>

                {/* Contact */}
                <div className="bg-white border border-stone-200 rounded-sm p-6 space-y-4">
                    <h3 className="font-medium text-lg">Contacto</h3>

                    <div className="space-y-3">
                        <a
                            href={`tel:${settings.phone.replace(/[^0-9+]/g, '')}`}
                            className="w-full flex items-center space-x-3 p-3 bg-stone-50 rounded hover:bg-stone-100 transition-all"
                        >
                            <Phone className="w-5 h-5 text-stone-600" />
                            <span className="text-stone-900">{settings.phone}</span>
                        </a>

                        <a
                            href={`mailto:${settings.email}`}
                            className="w-full flex items-center space-x-3 p-3 bg-stone-50 rounded hover:bg-stone-100 transition-all"
                        >
                            <Mail className="w-5 h-5 text-stone-600" />
                            <span className="text-stone-900">{settings.email}</span>
                        </a>

                        <a
                            href={`https://wa.me/${waNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center space-x-3 p-3 bg-green-50 rounded hover:bg-green-100 transition-all"
                        >
                            <MessageCircle className="w-5 h-5 text-green-600" />
                            <span className="text-stone-900">WhatsApp: {settings.whatsapp}</span>
                        </a>
                    </div>
                </div>

                {/* Amenities */}
                <div className="bg-white border border-stone-200 rounded-sm p-6 space-y-4">
                    <h3 className="font-medium text-lg">Amenities</h3>

                    <div className="grid grid-cols-2 gap-3">
                        {settings.amenities.map((amenity) => (
                            <div key={amenity} className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-stone-900 rounded-full"></div>
                                <span className="text-sm text-stone-700">{amenity}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
