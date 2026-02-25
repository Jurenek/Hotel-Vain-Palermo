import { supabase } from './supabase';

export interface HotelSettings {
    id: string;
    wifi_network: string;
    wifi_password: string;
    breakfast_start: string;
    breakfast_end: string;
    breakfast_location: string;
    pool_start: string;
    pool_end: string;
    pool_location: string;
    reception_hours: string;
    quiet_hours_start: string;
    quiet_hours_end: string;
    phone: string;
    email: string;
    whatsapp: string;
    address: string;
    city: string;
    google_maps_url: string;
    amenities: string[];
    updated_at: string;
}

// Default settings as fallback
const defaultSettings: HotelSettings = {
    id: 'main',
    wifi_network: 'VAIN_GUEST',
    wifi_password: 'love2bevain',
    breakfast_start: '7:00',
    breakfast_end: '11:00',
    breakfast_location: 'Lobby Bar',
    pool_start: '9:00',
    pool_end: '20:00',
    pool_location: 'Rooftop Terrace',
    reception_hours: '24/7',
    quiet_hours_start: '22:00',
    quiet_hours_end: '8:00',
    phone: '+54 11 4774-6780',
    email: 'info@vainhotel.com',
    whatsapp: '+54 9 11 6555-9467',
    address: 'Thames 2226, Palermo Soho',
    city: 'Buenos Aires, Argentina',
    google_maps_url: 'https://maps.google.com/?q=Thames+2226+Palermo+Buenos+Aires',
    amenities: ['WiFi Gratis', 'Rooftop Pool', 'Desayuno Incluido', 'Aire Acondicionado', 'Calefacción', 'Concierge 24/7'],
    updated_at: new Date().toISOString(),
};

export const getHotelSettings = async (): Promise<HotelSettings> => {
    const { data, error } = await supabase
        .from('hotel_settings')
        .select('*')
        .eq('id', 'main')
        .single();

    if (error || !data) {
        console.error('Error fetching hotel settings:', error);
        return defaultSettings;
    }

    return data as HotelSettings;
};

export const updateHotelSettings = async (updates: Partial<HotelSettings>): Promise<HotelSettings> => {
    const { id, ...rest } = updates;
    const updateData = {
        ...rest,
        updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
        .from('hotel_settings')
        .update(updateData)
        .eq('id', 'main')
        .select()
        .single();

    if (error || !data) {
        console.error('Error updating hotel settings:', error);
        return defaultSettings;
    }

    return data as HotelSettings;
};
