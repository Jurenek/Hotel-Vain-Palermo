'use client';

import { useRouter } from 'next/navigation';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';

export default function InfoPage() {
    const router = useRouter();

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
                    <p className="text-stone-600">Thames 2226, Palermo Soho</p>
                    <p className="text-stone-600">Buenos Aires, Argentina</p>
                    <a
                        href="https://maps.google.com/?q=Thames+2226+Palermo+Buenos+Aires"
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
                            href="tel:+541147746780"
                            className="w-full flex items-center space-x-3 p-3 bg-stone-50 rounded hover:bg-stone-100 transition-all"
                        >
                            <Phone className="w-5 h-5 text-stone-600" />
                            <span className="text-stone-900">+54 11 4774-6780</span>
                        </a>

                        <a
                            href="mailto:info@vainhotel.com"
                            className="w-full flex items-center space-x-3 p-3 bg-stone-50 rounded hover:bg-stone-100 transition-all"
                        >
                            <Mail className="w-5 h-5 text-stone-600" />
                            <span className="text-stone-900">info@vainhotel.com</span>
                        </a>

                        <a
                            href="https://wa.me/5491165559467"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center space-x-3 p-3 bg-green-50 rounded hover:bg-green-100 transition-all"
                        >
                            <MessageCircle className="w-5 h-5 text-green-600" />
                            <span className="text-stone-900">WhatsApp: +54 9 11 6555-9467</span>
                        </a>
                    </div>
                </div>

                {/* Amenities */}
                <div className="bg-white border border-stone-200 rounded-sm p-6 space-y-4">
                    <h3 className="font-medium text-lg">Amenities</h3>

                    <div className="grid grid-cols-2 gap-3">
                        {[
                            'WiFi Gratis',
                            'Rooftop Pool',
                            'Desayuno Incluido',
                            'Aire Acondicionado',
                            'Calefacción',
                            'Concierge 24/7',
                        ].map((amenity) => (
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

