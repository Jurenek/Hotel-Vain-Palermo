# Arquitectura Técnica — Hotel Guest Experience Platform
## Basada en VAIN Boutique Hotel · Escalable a múltiples propiedades

---

## Visión general

Esta plataforma replica las capacidades de Duve/STAY pero integrada nativamente en la app del hotel, con control total sobre la experiencia y sin fees por reserva. Está diseñada como **multi-tenant**: un solo codebase puede servir a múltiples hoteles.

```
┌─────────────────────────────────────────────────────┐
│                   GUEST JOURNEY                      │
│  Reserva → Pre-arrival → Check-in → Estadía → Post  │
└─────────────────────────────────────────────────────┘
         ↕                              ↕
┌─────────────────┐           ┌──────────────────────┐
│   Guest App     │           │   Admin Panel        │
│  /checkin/[tok] │           │  /admin/             │
│  /stay/[tok]    │           │  /reception/         │
└─────────────────┘           └──────────────────────┘
         ↕                              ↕
┌──────────────────────────────────────────────────────┐
│              API Layer (Next.js Edge Functions)       │
│  /api/checkin  /api/upsells  /api/payments  /api/ai  │
└──────────────────────────────────────────────────────┘
         ↕                              ↕
┌────────────────────┐    ┌────────────────────────────┐
│   Supabase (DB)    │    │   Integration Layer        │
│  PostgreSQL + RLS  │    │  PMS · Payments · AI · Msg │
└────────────────────┘    └────────────────────────────┘
```

---

## Stack tecnológico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Frontend | Next.js 16 + TypeScript | App Router, Server Components donde aplique |
| Estilos | Tailwind CSS v4 | Custom design tokens por hotel |
| Animaciones | Framer Motion | Micro-interacciones en flujos de guest |
| Estado | Zustand | Store liviano para guest session |
| Base de datos | Supabase (PostgreSQL) | Multi-tenant con RLS por hotel |
| Deploy | Vercel | Edge Functions para API routes |
| PMS principal | Cloudbeds API v1.1 | Patrón adapter — soporta Mews, Opera, Sihotel |
| Pagos USD | Stripe | PaymentIntents para internacionales |
| Pagos ARS | Mercado Pago | Checkout Pro para locales |
| Email | Resend | Transaccional con templates |
| WhatsApp | WhatsApp Business API | Via Meta Business o Twilio |
| IA | Claude API (Anthropic) | Chatbot 24/7, escalación a humano |
| Storage | Cloudflare R2 / AWS S3 | Fotos de documentos, imágenes de menú |

---

## Multi-tenancy

Cada hotel es un **tenant** identificado por `hotel_id` (UUID) y `slug` (ej: `vain-palermo`).

### Cómo agregar un nuevo hotel
1. Insertar registro en tabla `hotels` con su configuración
2. Configurar su PMS en `pms_integrations`
3. Personalizar upsells en `upsell_catalog`
4. Configurar secuencias de mensajes en `message_sequences`
5. Apuntar dominio personalizado en Vercel (opcional)

### Aislamiento de datos
Todas las tablas tienen `hotel_id` como FK. Las políticas RLS de Supabase garantizan que los datos no se mezclen entre propiedades.

---

## Integración PMS — Patrón Adapter

```
lib/integrations/pms/
├── types.ts          ← Interfaz IPMSAdapter (contrato)
├── mock.ts           ← Datos de prueba para desarrollo
├── cloudbeds.ts      ← Cloudbeds REST API v1.1
└── index.ts          ← Factory function createPMSAdapter()
```

Para conectar **Cloudbeds** (cuando tengas las credenciales):

```bash
# .env.local
PMS_PROVIDER=cloudbeds
CLOUDBEDS_API_KEY=your_api_key_here
CLOUDBEDS_PROPERTY_ID=your_property_id_here
```

Para agregar un nuevo PMS (ej: Mews):
1. Crear `lib/integrations/pms/mews.ts` implementando `IPMSAdapter`
2. Agregar case en `createPMSAdapter()` en `index.ts`
3. Sin cambios en el resto de la app

---

## Flujo Check-in Pre-Arrival

```
PMS registra reserva
       ↓
POST /api/checkin  →  Crea checkin_token (UUID único)
       ↓
Mensaje automático (WhatsApp/email) con link
       ↓
/checkin/[token]  →  Huésped completa formulario (5 pasos)
  1. Bienvenida + datos reserva
  2. Datos personales
  3. Documento de identidad
  4. Firma digital + TyC
  5. Upsells (early in, late out, upgrades)
  6. Confirmación + QR
       ↓
POST /api/checkin/submit  →  Guarda en checkin_submissions
       ↓
Admin recibe notificación en tiempo real (Supabase Realtime)
```

### Generar links manualmente (desde admin panel)
Admin Panel → "Check-in" → Ingresar ID de reserva del PMS → Se genera y copia el link.

---

## Sistema de Upsells

```
GET /api/upsells?token=xxx
  → Consulta PMS disponibilidad real
  → Retorna ofertas filtradas por disponibilidad
  → Precio dinámico (configurable por hotel)

POST /api/upsells/book
  → Detecta moneda del huésped (USD → Stripe, ARS → MercadoPago)
  → Crea PaymentIntent en el proveedor
  → Guarda booking como "pending" hasta confirmar pago

Webhooks de pago → POST /api/payments/webhook
  → Confirma upsell_booking
  → Notifica recepción (Supabase Realtime)
  → Actualiza PMS via adapter
```

---

## Variables de entorno requeridas

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_BASE_URL=https://vain-hotel-app.vercel.app

# PMS — Cloudbeds (cuando estén disponibles)
PMS_PROVIDER=mock  # cambiar a "cloudbeds" cuando tengas las keys
CLOUDBEDS_API_KEY=
CLOUDBEDS_PROPERTY_ID=

# Pagos
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
MP_ACCESS_TOKEN=APP_USR-...
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-...

# Email
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@vainhotel.com

# WhatsApp (Phase 2)
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
WHATSAPP_WEBHOOK_SECRET=

# IA (Phase 3)
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Roadmap de implementación

### ✅ Fase 1 — Construido
- [x] Arquitectura multi-tenant (DB schema)
- [x] PMS adapter (Cloudbeds + Mock)
- [x] Capa de pagos dual (Stripe + Mercado Pago)
- [x] Flujo Check-in Pre-Arrival completo
- [x] Sistema de Upsells (early/late check-out)
- [x] Admin panel con generación de links y stats
- [x] QR de confirmación

### 🔄 Fase 2 — Próximos pasos
- [ ] Conectar Cloudbeds API (cuando lleguen las keys)
- [ ] Webhooks de Stripe y MercadoPago
- [ ] Secuencias automáticas (cron job / pg_cron)
- [ ] WhatsApp Business API integration
- [ ] Email templates con Resend
- [ ] Communication hub (bandeja unificada)
- [ ] Sistema de feedback post-estadía

### 📋 Fase 3 — Diferenciación
- [ ] Asistente IA con Claude API
- [ ] Menú digital + Room Service
- [ ] Llaves digitales (requiere hardware)
- [ ] Analytics avanzados
- [ ] App nativa (React Native / Expo)

---

## Cómo conectar Cloudbeds

1. Ir a Cloudbeds → **Apps & Integrations → API**
2. Crear API key con permisos: `reservations:read`, `reservations:write`, `availability:read`
3. Copiar `API Key` y `Property ID`
4. En `.env.local`:
   ```
   PMS_PROVIDER=cloudbeds
   CLOUDBEDS_API_KEY=tu_key
   CLOUDBEDS_PROPERTY_ID=tu_property_id
   ```
5. Reiniciar servidor — la app ya usa Cloudbeds real

### Webhook de Cloudbeds (para sync automático)
1. En Cloudbeds → Apps → Webhooks → New Webhook
2. URL: `https://vain-hotel-app.vercel.app/api/webhooks/pms`
3. Eventos: `reservation.created`, `reservation.updated`, `reservation.checked_in`, `reservation.checked_out`

---

## Escalabilidad — Agregar un segundo hotel

```typescript
// 1. Insertar en tabla hotels
INSERT INTO hotels (slug, name, address, city, ...)
VALUES ('otro-hotel-slug', 'Otro Hotel', ...)

// 2. Configurar PMS
INSERT INTO pms_integrations (hotel_id, provider, api_key, property_id)
VALUES (otro_hotel_id, 'mews', 'api_key', 'prop_id')

// 3. Los flujos existentes funcionan sin cambios de código
// El factory detecta automáticamente qué PMS usar por hotel
```

El dominio puede ser el mismo (`/checkin/[token]`) o uno personalizado por hotel (configurando en Vercel).

---

## Estructura de archivos agregados

```
app/
├── checkin/[token]/
│   └── page.tsx              ← Flujo completo check-in (6 pasos)
├── admin/
│   └── page.tsx              ← Admin dashboard con stats y generación de links
├── api/
│   ├── checkin/
│   │   ├── route.ts          ← GET (resolve token) + POST (crear token)
│   │   └── submit/route.ts   ← POST (guardar formulario)
│   ├── upsells/
│   │   ├── route.ts          ← GET (obtener upsells disponibles)
│   │   └── book/route.ts     ← POST (reservar upsell + crear pago)
│   └── admin/
│       ├── dashboard/route.ts         ← Estadísticas del dashboard
│       └── generate-checkin-link/     ← Generar link manualmente

lib/
├── date-utils.ts             ← Utilidades de fechas sin dependencias
└── integrations/
    ├── pms/
    │   ├── types.ts          ← Interfaz IPMSAdapter
    │   ├── mock.ts           ← Datos de prueba
    │   ├── cloudbeds.ts      ← Adapter Cloudbeds
    │   └── index.ts          ← Factory
    └── payments/
        ├── types.ts
        ├── stripe.ts
        ├── mercadopago.ts
        └── index.ts          ← Factory (detecta USD→Stripe, ARS→MP)

supabase-multi-tenant.sql     ← Migration completa (ejecutar en Supabase)
```
