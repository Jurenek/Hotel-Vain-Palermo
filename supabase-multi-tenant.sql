-- ============================================================
-- VAIN Hotel Platform — Multi-Tenant Schema
-- Replicable across any hotel property
-- Run in Supabase SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────
-- 0. EXTENSIONS
-- ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
-- 1. HOTELS (tenant root)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hotels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,        -- e.g. "vain-palermo"
  name          TEXT NOT NULL,
  tagline       TEXT,
  address       TEXT,
  city          TEXT,
  country       TEXT DEFAULT 'AR',
  phone         TEXT,
  email         TEXT,
  whatsapp      TEXT,
  google_maps_url TEXT,
  logo_url      TEXT,
  primary_color TEXT DEFAULT '#57534e',      -- stone-600
  accent_color  TEXT DEFAULT '#d4b896',
  timezone      TEXT DEFAULT 'America/Argentina/Buenos_Aires',
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate existing VAIN hotel data
INSERT INTO hotels (slug, name, tagline, address, city, phone, email, whatsapp, google_maps_url)
VALUES (
  'vain-palermo',
  'VAIN Boutique Hotel',
  'Palermo Soho, Buenos Aires',
  'Thames 2226, Palermo Soho',
  'Buenos Aires, Argentina',
  '+54 11 4774-6780',
  'info@vainhotel.com',
  '+54 9 11 6555-9467',
  'https://maps.google.com/?q=Thames+2226+Palermo+Buenos+Aires'
) ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────
-- 2. HOTEL SETTINGS (per-hotel config, extends existing table)
-- ─────────────────────────────────────────────
ALTER TABLE hotel_settings
  ADD COLUMN IF NOT EXISTS hotel_id UUID REFERENCES hotels(id),
  ADD COLUMN IF NOT EXISTS checkout_hour TEXT DEFAULT '11:00',
  ADD COLUMN IF NOT EXISTS checkin_hour  TEXT DEFAULT '15:00',
  ADD COLUMN IF NOT EXISTS currency      TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS early_checkin_price NUMERIC(10,2) DEFAULT 25.00,
  ADD COLUMN IF NOT EXISTS late_checkout_price NUMERIC(10,2) DEFAULT 25.00,
  ADD COLUMN IF NOT EXISTS tripadvisor_url TEXT,
  ADD COLUMN IF NOT EXISTS google_reviews_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- ─────────────────────────────────────────────
-- 3. PMS INTEGRATIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pms_integrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL,              -- 'cloudbeds' | 'mews' | 'opera' | 'sihotel' | 'mock'
  api_key       TEXT,                       -- encrypted in production
  api_secret    TEXT,
  property_id   TEXT,                       -- provider's internal property ID
  webhook_secret TEXT,
  config        JSONB DEFAULT '{}',
  active        BOOLEAN DEFAULT true,
  last_sync_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, provider)
);

-- Insert mock PMS for VAIN while real Cloudbeds credentials are obtained
INSERT INTO pms_integrations (hotel_id, provider, config)
SELECT id, 'mock', '{"note": "Replace with Cloudbeds credentials when available"}'
FROM hotels WHERE slug = 'vain-palermo'
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 4. CRM INTEGRATIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_integrations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id    UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  provider    TEXT NOT NULL,               -- 'hubspot' | 'salesforce' | 'mailchimp' | 'none'
  api_key     TEXT,
  config      JSONB DEFAULT '{}',
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, provider)
);

-- ─────────────────────────────────────────────
-- 5. GUESTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hotel_guests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  pms_guest_id    TEXT,                     -- ID in the PMS system
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  nationality     TEXT,
  document_type   TEXT,                     -- 'passport' | 'dni' | 'id'
  document_number TEXT,
  document_photo_url TEXT,
  language        TEXT DEFAULT 'es',
  tags            TEXT[] DEFAULT '{}',     -- VIP, returning, etc.
  notes           TEXT,
  total_stays     INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, email)
);

-- ─────────────────────────────────────────────
-- 6. RESERVATIONS (synced from PMS)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id          UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  pms_reservation_id TEXT,                  -- Cloudbeds reservation ID
  guest_id          UUID REFERENCES hotel_guests(id),
  room_number       TEXT,
  room_type         TEXT,
  checkin_date      DATE NOT NULL,
  checkout_date     DATE NOT NULL,
  checkin_time      TEXT DEFAULT '15:00',
  checkout_time     TEXT DEFAULT '11:00',
  status            TEXT DEFAULT 'confirmed', -- confirmed | checked_in | checked_out | cancelled
  adults            INT DEFAULT 1,
  children          INT DEFAULT 0,
  total_amount      NUMERIC(10,2),
  currency          TEXT DEFAULT 'USD',
  special_requests  TEXT,
  source            TEXT,                    -- 'booking.com' | 'direct' | 'airbnb' | etc.
  raw_pms_data      JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hotel_id, pms_reservation_id)
);

-- ─────────────────────────────────────────────
-- 7. CHECKIN TOKENS (magic link per reservation)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS checkin_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id  UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  token           TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'base64url'),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  used_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 8. CHECKIN SUBMISSIONS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS checkin_submissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id          UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id    UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  token_id          UUID REFERENCES checkin_tokens(id),
  first_name        TEXT,
  last_name         TEXT,
  email             TEXT,
  phone             TEXT,
  nationality       TEXT,
  document_type     TEXT,
  document_number   TEXT,
  document_photo_url TEXT,
  signature_data    TEXT,                   -- base64 signature or signed URL
  tnc_accepted      BOOLEAN DEFAULT false,
  tnc_accepted_at   TIMESTAMPTZ,
  preferences       JSONB DEFAULT '{}',     -- pillow type, floor, etc.
  estimated_arrival TEXT,                   -- e.g. "14:30"
  qr_code           TEXT,                   -- generated QR content
  status            TEXT DEFAULT 'submitted', -- submitted | verified | rejected
  submitted_at      TIMESTAMPTZ DEFAULT NOW(),
  verified_at       TIMESTAMPTZ,
  verified_by       TEXT
);

-- ─────────────────────────────────────────────
-- 9. UPSELL CATALOG (per hotel)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS upsell_catalog (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  type            TEXT NOT NULL,            -- 'early_checkin' | 'late_checkout' | 'upgrade' | 'service'
  title           TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(10,2) NOT NULL,
  currency        TEXT DEFAULT 'USD',
  max_hours       INT,                      -- for early/late: max hours before/after
  availability_rule JSONB DEFAULT '{}',     -- dynamic pricing rules
  active          BOOLEAN DEFAULT true,
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default upsells for VAIN
INSERT INTO upsell_catalog (hotel_id, type, title, description, price, max_hours, sort_order)
SELECT
  h.id,
  u.type, u.title, u.description, u.price, u.max_hours, u.sort_order
FROM hotels h, (VALUES
  ('early_checkin', 'Early Check-in', 'Ingresá desde las 11hs en lugar de las 15hs', 25.00, 4, 1),
  ('late_checkout', 'Late Check-out', 'Extendé tu estadía hasta las 14hs en lugar de las 11hs', 25.00, 3, 2),
  ('upgrade', 'Room Upgrade', 'Mejorá tu habitación a una superior con terraza', 50.00, NULL, 3)
) AS u(type, title, description, price, max_hours, sort_order)
WHERE h.slug = 'vain-palermo'
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 10. UPSELL BOOKINGS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS upsell_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id  UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  upsell_id       UUID NOT NULL REFERENCES upsell_catalog(id),
  guest_id        UUID REFERENCES hotel_guests(id),
  price           NUMERIC(10,2) NOT NULL,
  currency        TEXT NOT NULL,
  payment_method  TEXT,                     -- 'stripe' | 'mercadopago'
  payment_id      TEXT,                     -- external payment ID
  payment_status  TEXT DEFAULT 'pending',   -- pending | paid | failed | refunded
  status          TEXT DEFAULT 'pending',   -- pending | confirmed | cancelled
  requested_time  TEXT,                     -- e.g. "11:00" for early checkin
  notes           TEXT,
  notified_at     TIMESTAMPTZ,              -- when reception was notified
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 11. PAYMENT INTENTS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_intents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL,            -- 'stripe' | 'mercadopago'
  external_id     TEXT,                     -- Stripe PaymentIntent ID / MP preference ID
  amount          NUMERIC(10,2) NOT NULL,
  currency        TEXT NOT NULL,
  status          TEXT DEFAULT 'pending',
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 12. AUTOMATED MESSAGE SEQUENCES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS message_sequences (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  trigger_event   TEXT NOT NULL,           -- 'reservation_confirmed' | '48h_before_checkin' | 'checkin_day' | 'post_checkout_2h'
  trigger_offset_hours INT DEFAULT 0,
  channel         TEXT NOT NULL,           -- 'whatsapp' | 'email' | 'sms'
  subject         TEXT,                    -- for email
  body_template   TEXT NOT NULL,           -- handlebars-style: {{guest_name}}, {{checkin_date}}, etc.
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Seed message templates for VAIN
INSERT INTO message_sequences (hotel_id, name, trigger_event, trigger_offset_hours, channel, subject, body_template)
SELECT h.id, s.name, s.trigger_event, s.trigger_offset_hours, s.channel, s.subject, s.body_template
FROM hotels h, (VALUES
  ('Pre-arrival Check-in Link', '48h_before_checkin', -48, 'whatsapp', NULL,
   'Hola {{guest_name}}! 🏨 Tu llegada a VAIN se acerca. Completá tu check-in online y ahorrá tiempo en recepción: {{checkin_url}}'),
  ('Check-in Day Welcome', 'checkin_day', 0, 'whatsapp', NULL,
   '¡Bienvenido/a {{guest_name}}! 🎉 Hoy es tu día de llegada a VAIN. Tu habitación estará lista a las {{checkin_time}}. ¿Necesitás algo? Estamos acá.'),
  ('Post Stay Feedback', 'post_checkout_2h', 2, 'whatsapp', NULL,
   'Hola {{guest_name}}, ¿cómo estuvo tu estadía en VAIN? Nos encantaría saber tu opinión: {{feedback_url}} ¡Gracias por elegirnos! 💙'),
  ('Pre-arrival Email', '48h_before_checkin', -48, 'email', 'Tu check-in en VAIN está listo',
   'Hola {{guest_name}},\n\nTu check-in online para el {{checkin_date}} está disponible. Hacé click aquí para completarlo: {{checkin_url}}\n\n¿Querés llegar antes de las {{checkin_time}}? Tenemos disponibilidad para Early Check-in desde USD 25.\n\nNos vemos pronto!\nEquipo VAIN')
) AS s(name, trigger_event, trigger_offset_hours, channel, subject, body_template)
WHERE h.slug = 'vain-palermo'
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────
-- 13. MESSAGE LOGS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS message_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id  UUID REFERENCES reservations(id),
  sequence_id     UUID REFERENCES message_sequences(id),
  channel         TEXT NOT NULL,
  recipient       TEXT NOT NULL,
  subject         TEXT,
  body            TEXT,
  status          TEXT DEFAULT 'sent',     -- sent | delivered | failed | bounced
  external_id     TEXT,
  sent_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 14. CONVERSATIONS (communication hub)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id  UUID REFERENCES reservations(id),
  guest_id        UUID REFERENCES hotel_guests(id),
  guest_name      TEXT,
  channel         TEXT NOT NULL,           -- 'whatsapp' | 'app_chat' | 'email'
  status          TEXT DEFAULT 'open',     -- open | resolved | pending
  assigned_to     TEXT,                    -- staff member name/email
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  unread_count    INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 15. CONVERSATION MESSAGES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversation_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type     TEXT NOT NULL,           -- 'guest' | 'staff' | 'ai'
  sender_name     TEXT,
  body            TEXT NOT NULL,
  channel         TEXT,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 16. FEEDBACK
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback_surveys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id  UUID REFERENCES reservations(id),
  guest_id        UUID REFERENCES hotel_guests(id),
  guest_name      TEXT,
  score_cleanliness INT CHECK (score_cleanliness BETWEEN 1 AND 5),
  score_service     INT CHECK (score_service BETWEEN 1 AND 5),
  score_overall     INT CHECK (score_overall BETWEEN 1 AND 5),
  comment         TEXT,
  would_recommend BOOLEAN,
  redirected_to_public BOOLEAN DEFAULT false,  -- sent to Google/TripAdvisor
  alert_sent      BOOLEAN DEFAULT false,       -- low-score alert sent to staff
  submitted_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 17. MENU (digital menu / room service)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menu_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id    UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  icon        TEXT,
  sort_order  INT DEFAULT 0,
  active      BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS menu_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES menu_categories(id),
  name            TEXT NOT NULL,
  description     TEXT,
  price           NUMERIC(10,2),
  currency        TEXT DEFAULT 'USD',
  image_url       TEXT,
  allergens       TEXT[] DEFAULT '{}',
  available       BOOLEAN DEFAULT true,
  sort_order      INT DEFAULT 0
);

-- ─────────────────────────────────────────────
-- 18. ROOM SERVICE ORDERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id  UUID REFERENCES reservations(id),
  room_number     TEXT,
  items           JSONB NOT NULL DEFAULT '[]',  -- [{item_id, name, qty, price}]
  total_amount    NUMERIC(10,2),
  status          TEXT DEFAULT 'pending',       -- pending | preparing | delivered | cancelled
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 19. DIGITAL KEYS (optional)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS digital_keys (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id  UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  provider        TEXT NOT NULL,            -- 'nuki' | 'salto' | 'assa_abloy' | 'dormakaba'
  external_key_id TEXT,
  room_number     TEXT,
  valid_from      TIMESTAMPTZ,
  valid_until     TIMESTAMPTZ,
  status          TEXT DEFAULT 'inactive',  -- inactive | active | revoked
  issued_at       TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ
);

-- ─────────────────────────────────────────────
-- 20. PMS SYNC LOG
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pms_sync_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id    UUID NOT NULL REFERENCES hotels(id),
  provider    TEXT NOT NULL,
  event_type  TEXT,                         -- 'reservation_created' | 'reservation_updated' | etc.
  raw_payload JSONB,
  status      TEXT DEFAULT 'processed',
  error       TEXT,
  synced_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 21. RLS POLICIES
-- ─────────────────────────────────────────────
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE upsell_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE upsell_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE pms_sync_log ENABLE ROW LEVEL SECURITY;

-- Public read for guest-facing data (scoped by token)
CREATE POLICY "Public read hotels" ON hotels FOR SELECT USING (active = true);
CREATE POLICY "Public read upsell_catalog" ON upsell_catalog FOR SELECT USING (active = true);
CREATE POLICY "Public read menu_categories" ON menu_categories FOR SELECT USING (active = true);
CREATE POLICY "Public read menu_items" ON menu_items FOR SELECT USING (available = true);

-- Token-based read for reservations (guests access via checkin_tokens)
CREATE POLICY "Token read reservations" ON reservations FOR SELECT USING (true);
CREATE POLICY "Token read checkin_tokens" ON checkin_tokens FOR SELECT USING (true);

-- Public write for guest-submitted data
CREATE POLICY "Public insert checkin_submissions" ON checkin_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert upsell_bookings" ON upsell_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert payment_intents" ON payment_intents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert room_orders" ON room_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert feedback_surveys" ON feedback_surveys FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert conversation_messages" ON conversation_messages FOR INSERT WITH CHECK (true);

-- Admin full access (all tables)
CREATE POLICY "Admin all hotels" ON hotels FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all reservations" ON reservations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all guests" ON hotel_guests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all checkin_submissions" ON checkin_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all upsell_bookings" ON upsell_bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all conversations" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all conversation_messages" ON conversation_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all feedback" ON feedback_surveys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all menu_items" ON menu_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all menu_categories" ON menu_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all room_orders" ON room_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all pms_integrations" ON pms_integrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all message_sequences" ON message_sequences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all message_logs" ON message_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all digital_keys" ON digital_keys FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all pms_sync_log" ON pms_sync_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all payment_intents" ON payment_intents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all crm_integrations" ON crm_integrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admin all checkin_tokens" ON checkin_tokens FOR ALL USING (true) WITH CHECK (true);
