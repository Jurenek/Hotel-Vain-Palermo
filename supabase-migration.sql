-- ============================================
-- VAIN Hotel App - Migration: hotel_settings & experiences
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- 1. Hotel Settings Table (key-value JSON store)
CREATE TABLE IF NOT EXISTS hotel_settings (
    id TEXT PRIMARY KEY DEFAULT 'main',
    wifi_network TEXT DEFAULT 'VAIN_GUEST',
    wifi_password TEXT DEFAULT 'love2bevain',
    breakfast_start TEXT DEFAULT '7:00',
    breakfast_end TEXT DEFAULT '11:00',
    breakfast_location TEXT DEFAULT 'Lobby Bar',
    pool_start TEXT DEFAULT '9:00',
    pool_end TEXT DEFAULT '20:00',
    pool_location TEXT DEFAULT 'Rooftop Terrace',
    reception_hours TEXT DEFAULT '24/7',
    quiet_hours_start TEXT DEFAULT '22:00',
    quiet_hours_end TEXT DEFAULT '8:00',
    phone TEXT DEFAULT '+54 11 4774-6780',
    email TEXT DEFAULT 'info@vainhotel.com',
    whatsapp TEXT DEFAULT '+54 9 11 6555-9467',
    address TEXT DEFAULT 'Thames 2226, Palermo Soho',
    city TEXT DEFAULT 'Buenos Aires, Argentina',
    google_maps_url TEXT DEFAULT 'https://maps.google.com/?q=Thames+2226+Palermo+Buenos+Aires',
    amenities JSONB DEFAULT '["WiFi Gratis", "Rooftop Pool", "Desayuno Incluido", "Aire Acondicionado", "Calefacción", "Concierge 24/7"]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default row
INSERT INTO hotel_settings (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;

-- 2. Experiences Table
CREATE TABLE IF NOT EXISTS experiences (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    venue TEXT NOT NULL,
    description TEXT NOT NULL,
    time TEXT NOT NULL,
    price TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'Music',
    category TEXT NOT NULL DEFAULT 'food',
    bookable BOOLEAN NOT NULL DEFAULT false,
    rating NUMERIC(2,1),
    distance TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed experiences from current hardcoded data
INSERT INTO experiences (title, venue, description, time, price, icon, category, bookable, rating) VALUES
    ('Cena Show de Tango', 'El Querandi', 'Experiencia auténtica de tango con cena de 3 pasos', '20:30', 'USD 95', 'Music', 'tango', true, 4.8),
    ('Milonga La Catedral', 'Almagro', 'Milonga auténtica para bailar tango - Fácil de reservar', '23:00', 'USD 15', 'Music', 'tango', true, 4.9),
    ('Wine Tasting Tour', 'Palermo Viejo', 'Degustación de vinos argentinos con sommelier', '18:00', 'USD 75', 'Wine', 'food', true, 4.7),
    ('Galería Tour', 'Circuito Palermo Soho', 'Recorrido por galerías de arte contemporáneo', '15:00', 'USD 40', 'Palette', 'art', true, 4.6),
    ('Don Julio Parrilla', 'Palermo Soho', 'Mejor parrilla de Buenos Aires - Recomendación top', 'Varios horarios', 'USD 80-100', 'UtensilsCrossed', 'food', false, 4.9);

-- Enable RLS (Row Level Security) - allow public read, authenticated write
ALTER TABLE hotel_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read hotel_settings" ON hotel_settings FOR SELECT USING (true);
CREATE POLICY "Allow public read experiences" ON experiences FOR SELECT USING (true);

-- Allow public write access (for the reception dashboard, no auth yet)
CREATE POLICY "Allow public write hotel_settings" ON hotel_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public write experiences" ON experiences FOR ALL USING (true) WITH CHECK (true);

-- 3. Requests Table
CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    room_number TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Allow public read/write (for demo purposes)
CREATE POLICY "Allow public read requests" ON requests FOR SELECT USING (true);
CREATE POLICY "Allow public write requests" ON requests FOR ALL USING (true) WITH CHECK (true);
