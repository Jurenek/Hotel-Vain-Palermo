'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, FileText, PenLine, CheckCircle2, ChevronRight,
  ChevronLeft, Loader2, AlertCircle, Star, Clock, Wifi,
  Coffee, MapPin, Phone
} from 'lucide-react';
import { formatDisplay, nightsBetween } from '@/lib/date-utils';
import QRCode from 'qrcode';

// ─── Types ────────────────────────────────────────────
interface HotelData {
  name: string; slug: string; primaryColor: string;
  accentColor: string; logoUrl?: string; address: string; whatsapp?: string;
}
interface ReservationData {
  id: string; guestFirstName: string; guestLastName: string;
  roomNumber?: string; roomType?: string; checkinDate: string;
  checkoutDate: string; checkinTime: string; checkoutTime: string;
  adults: number; nights: number;
}
interface UpsellOffer {
  id: string; type: string; title: string; description: string;
  price: number; currency: string; maxHours?: number;
  availableFrom?: string; availableUntil?: string;
}

// ─── Step indicator ────────────────────────────────────
const STEPS = ['Bienvenida', 'Tus datos', 'Documentos', 'Firma', 'Extras', 'Confirmación'];

function StepBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-500 ${
            i <= current ? 'bg-stone-700' : 'bg-stone-200'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────
export default function CheckinPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hotel, setHotel] = useState<HotelData | null>(null);
  const [reservation, setReservation] = useState<ReservationData | null>(null);
  const [upsells, setUpsells] = useState<UpsellOffer[]>([]);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Form state
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    nationality: '', documentType: 'passport', documentNumber: '',
    estimatedArrival: '',
    tncAccepted: false,
    signatureData: '',
    selectedUpsells: [] as string[],
    requestedTimes: {} as Record<string, string>,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  // Load data
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [checkinRes, upsellRes] = await Promise.all([
          fetch(`/api/checkin?token=${token}`),
          fetch(`/api/upsells?token=${token}`),
        ]);

        if (!checkinRes.ok) {
          const err = await checkinRes.json();
          setError(err.error ?? 'Link inválido o expirado');
          setLoading(false);
          return;
        }

        const checkinData = await checkinRes.json();
        setHotel(checkinData.hotel);
        setReservation(checkinData.reservation);

        if (checkinData.alreadySubmitted) {
          setStep(5); // Jump to confirmation
        }

        if (upsellRes.ok) {
          const upsellData = await upsellRes.json();
          setUpsells(upsellData.upsells ?? []);
        }

        // Pre-fill name from reservation
        setForm(f => ({
          ...f,
          firstName: checkinData.reservation.guestFirstName,
          lastName: checkinData.reservation.guestLastName,
        }));
      } catch {
        setError('Error cargando tu check-in. Por favor intentá de nuevo.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // Canvas signature
  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1c1917';
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      setForm(f => ({ ...f, signatureData: canvas.toDataURL() }));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      setForm(f => ({ ...f, signatureData: '' }));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/checkin/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          nationality: form.nationality,
          documentType: form.documentType,
          documentNumber: form.documentNumber,
          signatureData: form.signatureData,
          tncAccepted: form.tncAccepted,
          estimatedArrival: form.estimatedArrival,
          preferences: {},
          selectedUpsells: form.selectedUpsells,
          requestedTimes: form.requestedTimes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Generate QR
      const qrUrl = await QRCode.toDataURL(data.qrCode, {
        width: 240,
        margin: 2,
        color: { dark: '#1c1917', light: '#fafaf9' },
      });
      setQrDataUrl(qrUrl);
      setStep(5);
    } catch (err: any) {
      setError(err.message ?? 'Error al enviar el check-in');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / Error ─────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-stone-500 animate-spin" />
      </div>
    );
  }

  if (error && step !== 5) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-semibold text-stone-800">{error}</h2>
          <p className="text-stone-500 text-sm">Si creés que es un error, contactá recepción.</p>
          {hotel?.whatsapp && (
            <a
              href={`https://wa.me/${hotel.whatsapp.replace(/\D/g, '')}`}
              className="inline-block mt-4 px-6 py-3 bg-green-500 text-white rounded-xl text-sm font-medium"
            >
              Escribinos por WhatsApp
            </a>
          )}
        </div>
      </div>
    );
  }

  if (!hotel || !reservation) return null;

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="bg-stone-800 text-white px-6 pt-safe pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          {hotel.logoUrl ? (
            <img src={hotel.logoUrl} alt={hotel.name} className="h-8 object-contain" />
          ) : (
            <span className="text-lg font-bold tracking-widest uppercase">{hotel.name}</span>
          )}
        </div>
        {step < 5 && <StepBar current={step} total={5} />}
        {step < 5 && (
          <p className="text-stone-400 text-xs mt-1">{STEPS[step]}</p>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25 }}
          >
            {/* ── Step 0: Welcome ─────────────────── */}
            {step === 0 && (
              <div className="px-6 py-8 space-y-6">
                <div>
                  <h1 className="text-2xl font-bold text-stone-800">
                    ¡Hola, {reservation.guestFirstName}! 👋
                  </h1>
                  <p className="text-stone-500 mt-1 text-sm">
                    Completá tu check-in en 2 minutos y llegá directo a tu habitación.
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-stone-600" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wider">Habitación</p>
                      <p className="font-semibold text-stone-800">
                        {reservation.roomNumber ? `#${reservation.roomNumber}` : 'Por asignar'}
                        {reservation.roomType ? ` · ${reservation.roomType}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-stone-100" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Check-in</p>
                      <p className="font-semibold text-stone-800 text-sm">{formatDisplay(reservation.checkinDate)}</p>
                      <p className="text-stone-500 text-xs flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> Desde {reservation.checkinTime}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wider mb-1">Check-out</p>
                      <p className="font-semibold text-stone-800 text-sm">{formatDisplay(reservation.checkoutDate)}</p>
                      <p className="text-stone-500 text-xs flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> Hasta {reservation.checkoutTime}
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-stone-100" />

                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    {reservation.nights} {reservation.nights === 1 ? 'noche' : 'noches'} · {reservation.adults} {reservation.adults === 1 ? 'adulto' : 'adultos'}
                  </div>
                </div>

                <button
                  onClick={() => setStep(1)}
                  className="w-full py-4 bg-stone-800 text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  Empezar check-in <ChevronRight className="w-5 h-5" />
                </button>

                <p className="text-center text-xs text-stone-400">
                  Tus datos están protegidos y solo son usados para tu estadía
                </p>
              </div>
            )}

            {/* ── Step 1: Personal data ────────────── */}
            {step === 1 && (
              <div className="px-6 py-8 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                    <User className="w-5 h-5" /> Tus datos personales
                  </h2>
                  <p className="text-stone-500 text-sm mt-1">Confirmá o completá la información</p>
                </div>

                <div className="space-y-4">
                  {[
                    { label: 'Nombre', key: 'firstName', type: 'text', placeholder: 'Tu nombre' },
                    { label: 'Apellido', key: 'lastName', type: 'text', placeholder: 'Tu apellido' },
                    { label: 'Email', key: 'email', type: 'email', placeholder: 'tu@email.com' },
                    { label: 'Teléfono / WhatsApp', key: 'phone', type: 'tel', placeholder: '+54 9 11...' },
                    { label: 'Nacionalidad', key: 'nationality', type: 'text', placeholder: 'Argentina' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-stone-700 mb-1.5">{field.label}</label>
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={form[field.key as keyof typeof form] as string}
                        onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 placeholder:text-stone-300"
                      />
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Hora estimada de llegada</label>
                    <input
                      type="time"
                      value={form.estimatedArrival}
                      onChange={e => setForm(f => ({ ...f, estimatedArrival: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Document ──────────────────── */}
            {step === 2 && (
              <div className="px-6 py-8 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                    <FileText className="w-5 h-5" /> Documento de identidad
                  </h2>
                  <p className="text-stone-500 text-sm mt-1">Requerido por regulación hotelera</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Tipo de documento</label>
                    <select
                      value={form.documentType}
                      onChange={e => setForm(f => ({ ...f, documentType: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                    >
                      <option value="passport">Pasaporte</option>
                      <option value="dni">DNI (Argentina)</option>
                      <option value="id">Cédula / ID Nacional</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Número de documento</label>
                    <input
                      type="text"
                      placeholder="Ej: AA123456"
                      value={form.documentNumber}
                      onChange={e => setForm(f => ({ ...f, documentNumber: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 placeholder:text-stone-300"
                    />
                  </div>

                  <div className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl p-6 text-center space-y-3">
                    <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mx-auto">
                      <FileText className="w-6 h-6 text-stone-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-700">Foto del documento</p>
                      <p className="text-xs text-stone-400 mt-0.5">Opcional — podés presentarlo en recepción</p>
                    </div>
                    <label className="inline-block cursor-pointer">
                      <span className="px-4 py-2 bg-stone-800 text-white rounded-xl text-sm font-medium">
                        Subir foto
                      </span>
                      <input type="file" accept="image/*" capture="environment" className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) setForm(f => ({ ...f, documentPhotoFile: file } as any));
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 3: Signature ──────────────────── */}
            {step === 3 && (
              <div className="px-6 py-8 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                    <PenLine className="w-5 h-5" /> Firma digital
                  </h2>
                  <p className="text-stone-500 text-sm mt-1">Aceptación de términos y condiciones</p>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm space-y-3 max-h-40 overflow-y-auto">
                  <h3 className="font-semibold text-stone-800 text-sm">Términos y condiciones</h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Al firmar, el huésped acepta las políticas del hotel incluyendo: horarios de check-in/out,
                    política de cancelación, responsabilidad por daños, prohibición de fumar en habitaciones,
                    política de mascotas, y uso de instalaciones. El hotel no se responsabiliza por objetos de valor
                    no depositados en caja fuerte. Los datos personales son tratados conforme a la normativa de
                    protección de datos vigente (Ley 25.326).
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-stone-700 mb-2">Firmá aquí:</p>
                  <div className="border-2 border-stone-200 rounded-2xl overflow-hidden bg-white">
                    <canvas
                      ref={canvasRef}
                      width={360}
                      height={140}
                      className="w-full touch-none cursor-crosshair"
                      onMouseDown={startDraw}
                      onMouseMove={draw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={startDraw}
                      onTouchMove={draw}
                      onTouchEnd={endDraw}
                    />
                  </div>
                  {form.signatureData && (
                    <button
                      onClick={clearSignature}
                      className="mt-2 text-xs text-stone-400 underline"
                    >
                      Borrar firma
                    </button>
                  )}
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.tncAccepted}
                    onChange={e => setForm(f => ({ ...f, tncAccepted: e.target.checked }))}
                    className="mt-0.5 w-5 h-5 rounded accent-stone-800"
                  />
                  <span className="text-sm text-stone-600">
                    Leí y acepto los términos y condiciones del hotel
                  </span>
                </label>
              </div>
            )}

            {/* ── Step 4: Upsells ───────────────────── */}
            {step === 4 && (
              <div className="px-6 py-8 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-stone-800">Mejorá tu estadía ✨</h2>
                  <p className="text-stone-500 text-sm mt-1">Servicios adicionales disponibles para tu reserva</p>
                </div>

                {upsells.length === 0 ? (
                  <div className="text-center py-8 text-stone-400">
                    <Star className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No hay servicios adicionales disponibles por ahora</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upsells.map(upsell => {
                      const selected = form.selectedUpsells.includes(upsell.id);
                      return (
                        <div
                          key={upsell.id}
                          onClick={() => setForm(f => ({
                            ...f,
                            selectedUpsells: selected
                              ? f.selectedUpsells.filter(id => id !== upsell.id)
                              : [...f.selectedUpsells, upsell.id],
                          }))}
                          className={`bg-white rounded-2xl p-5 border-2 cursor-pointer transition-all shadow-sm ${
                            selected ? 'border-stone-800' : 'border-stone-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="font-semibold text-stone-800">{upsell.title}</p>
                              <p className="text-sm text-stone-500 mt-0.5">{upsell.description}</p>
                              {upsell.availableFrom && (
                                <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Disponible desde las {upsell.availableFrom}
                                </p>
                              )}
                              {upsell.availableUntil && (
                                <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Disponible hasta las {upsell.availableUntil}
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-stone-800">${upsell.price}</p>
                              <p className="text-xs text-stone-400">{upsell.currency}</p>
                            </div>
                          </div>

                          {selected && upsell.type === 'early_checkin' && (
                            <div className="mt-3 pt-3 border-t border-stone-100">
                              <label className="block text-sm font-medium text-stone-700 mb-1.5">¿A qué hora llegás?</label>
                              <input
                                type="time"
                                min="10:00"
                                max="14:59"
                                value={form.requestedTimes[upsell.id] ?? ''}
                                onChange={e => setForm(f => ({
                                  ...f,
                                  requestedTimes: { ...f.requestedTimes, [upsell.id]: e.target.value },
                                }))}
                                className="px-4 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
                                onClick={e => e.stopPropagation()}
                              />
                            </div>
                          )}

                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-3 ml-auto transition-colors ${
                            selected ? 'bg-stone-800 border-stone-800' : 'border-stone-300'
                          }`}>
                            {selected && <CheckCircle2 className="w-4 h-4 text-white fill-white" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-4 bg-stone-800 text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
                >
                  {submitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Guardando...</>
                  ) : (
                    <>Finalizar check-in <CheckCircle2 className="w-5 h-5" /></>
                  )}
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full py-2 text-stone-400 text-sm underline"
                >
                  Saltar extras y finalizar
                </button>
              </div>
            )}

            {/* ── Step 5: Confirmation ─────────────── */}
            {step === 5 && (
              <div className="px-6 py-8 space-y-6 text-center">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </motion.div>

                <div>
                  <h2 className="text-2xl font-bold text-stone-800">¡Check-in listo!</h2>
                  <p className="text-stone-500 mt-1 text-sm">
                    Gracias {reservation.guestFirstName}. Te esperamos en {hotel.name}.
                  </p>
                </div>

                {qrDataUrl && (
                  <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm space-y-3">
                    <p className="text-sm font-semibold text-stone-700">Tu código de check-in</p>
                    <img src={qrDataUrl} alt="QR Check-in" className="mx-auto w-48 h-48" />
                    <p className="text-xs text-stone-400">Mostrá este QR en recepción al llegar</p>
                  </div>
                )}

                <div className="bg-stone-50 rounded-2xl p-5 text-left space-y-4">
                  <p className="font-semibold text-stone-800 text-sm">Info para tu llegada</p>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-xs text-stone-400 mb-1">Check-in</p>
                      <p className="font-medium text-stone-800">{reservation.checkinTime}hs</p>
                      <p className="text-xs text-stone-500">{formatDisplay(reservation.checkinDate)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3">
                      <p className="text-xs text-stone-400 mb-1">Check-out</p>
                      <p className="font-medium text-stone-800">{reservation.checkoutTime}hs</p>
                      <p className="text-xs text-stone-500">{formatDisplay(reservation.checkoutDate)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <MapPin className="w-4 h-4 text-stone-400" />
                    {hotel.address}
                  </div>
                </div>

                {hotel.whatsapp && (
                  <a
                    href={`https://wa.me/${hotel.whatsapp.replace(/\D/g, '')}?text=Hola! Completé mi check-in online para la reserva de ${reservation.guestFirstName} ${reservation.guestLastName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white rounded-2xl font-medium text-sm"
                  >
                    <Phone className="w-4 h-4" />
                    Contactar recepción
                  </a>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      {step > 0 && step < 5 && (
        <div className="px-6 pb-safe pb-6 pt-4 border-t border-stone-100 bg-white flex gap-3">
          <button
            onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-1 px-5 py-3 text-stone-600 bg-stone-100 rounded-xl font-medium text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Atrás
          </button>

          <button
            onClick={() => {
              if (step === 3 && !form.tncAccepted) {
                setError('Debés aceptar los términos y condiciones');
                return;
              }
              setError(null);
              if (step === 4) return; // Submit handled inside step 4
              setStep(s => s + 1);
            }}
            disabled={step === 3 && !form.tncAccepted}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-stone-800 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
          >
            {step === 4 ? 'Finalizar' : 'Continuar'}
            {step < 4 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      )}

      {error && step !== 5 && (
        <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
