'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, CheckSquare, TrendingUp, Calendar, Clock,
  Copy, Check, RefreshCw, ChevronRight, Star,
  AlertCircle, LogIn, Loader2, ArrowUpRight,
  MessageSquare, BarChart3, Settings, Wifi
} from 'lucide-react';

interface DashboardStats {
  totalCheckins: number;
  pendingCheckins: number;
  todayArrivals: number;
  activeUpsells: number;
}

interface CheckinRow {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
  submitted_at: string;
  reservations: { room_number: string; checkin_date: string; checkout_date: string };
}

interface UpsellRow {
  id: string;
  price: number;
  currency: string;
  status: string;
  created_at: string;
  upsell_catalog: { title: string; type: string };
}

// ── Generate link modal ─────────────────────────────────
function GenerateLinkModal({
  onClose,
  onGenerated,
}: {
  onClose: () => void;
  onGenerated: (url: string, name: string) => void;
}) {
  const [pmsId, setPmsId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!pmsId.trim()) { setError('Ingresá el ID de reserva'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/generate-checkin-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pmsReservationId: pmsId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onGenerated(data.checkinUrl, data.reservation.guestName);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-5"
      >
        <div>
          <h3 className="text-lg font-bold text-stone-800">Generar link de check-in</h3>
          <p className="text-stone-500 text-sm mt-1">Ingresá el ID de la reserva del PMS</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">ID de reserva (PMS)</label>
          <input
            type="text"
            placeholder="Ej: RES-001 o 12345"
            value={pmsId}
            onChange={e => setPmsId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
          {error && (
            <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {error}
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-stone-600 bg-stone-100 rounded-xl font-medium text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex-1 py-3 bg-stone-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generar link'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Generated link modal ────────────────────────────────
function LinkGeneratedModal({
  url,
  guestName,
  onClose,
}: {
  url: string;
  guestName: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-5"
      >
        <div className="text-center">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Check className="w-7 h-7 text-green-500" />
          </div>
          <h3 className="text-lg font-bold text-stone-800">¡Link generado!</h3>
          <p className="text-stone-500 text-sm mt-1">Para {guestName}</p>
        </div>

        <div className="bg-stone-50 rounded-xl p-4">
          <p className="text-xs text-stone-500 mb-2">Link de check-in</p>
          <p className="text-sm text-stone-700 break-all font-mono">{url}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={copy}
            className="py-3 flex items-center justify-center gap-2 bg-stone-800 text-white rounded-xl font-medium text-sm"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
          <a
            href={`https://wa.me/?text=Hola ${guestName.split(' ')[0]}! Tu check-in online en VAIN está listo: ${url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 flex items-center justify-center gap-2 bg-green-500 text-white rounded-xl font-medium text-sm"
          >
            Enviar por WA
          </a>
        </div>

        <button onClick={onClose} className="w-full py-2 text-stone-400 text-sm underline">
          Cerrar
        </button>
      </motion.div>
    </div>
  );
}

// ── Stat card ───────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  color,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      {loading ? (
        <div className="h-8 w-12 bg-stone-100 rounded animate-pulse" />
      ) : (
        <p className="text-2xl font-bold text-stone-800">{value}</p>
      )}
      <p className="text-xs text-stone-500 mt-1">{label}</p>
    </div>
  );
}

// ── Status badge ─────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; class: string }> = {
    submitted: { label: 'Enviado', class: 'bg-blue-50 text-blue-600' },
    verified: { label: 'Verificado', class: 'bg-green-50 text-green-600' },
    rejected: { label: 'Rechazado', class: 'bg-red-50 text-red-600' },
    pending: { label: 'Pendiente', class: 'bg-amber-50 text-amber-600' },
    confirmed: { label: 'Confirmado', class: 'bg-green-50 text-green-600' },
    paid: { label: 'Pagado', class: 'bg-green-50 text-green-600' },
  };
  const s = map[status] ?? { label: status, class: 'bg-stone-100 text-stone-600' };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${s.class}`}>{s.label}</span>
  );
}

// ── Main page ───────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [upsells, setUpsells] = useState<UpsellRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<{ url: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'checkins' | 'upsells'>('overview');

  const loadData = async () => {
    setLoadingData(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      const data = await res.json();
      setStats(data.stats);
      setCheckins(data.recentCheckins);
      setUpsells(data.recentUpsells);
    } catch {
      // silent
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'checkins', label: 'Check-ins', icon: LogIn },
    { id: 'upsells', label: 'Upsells', icon: TrendingUp },
  ] as const;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-stone-800 text-white px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-xl font-bold tracking-wide">VAIN Admin</h1>
            <p className="text-stone-400 text-xs">Panel de gestión · Palermo Soho</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2 text-stone-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-4 py-2 bg-white text-stone-800 rounded-xl text-sm font-semibold flex items-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              Check-in
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-stone-800 px-4 gap-1 pb-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-xl transition-colors ${
              activeTab === tab.id
                ? 'bg-stone-50 text-stone-800'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
        {/* ── Overview tab ───────────────────────── */}
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={Calendar}
                label="Llegadas hoy"
                value={stats?.todayArrivals ?? 0}
                color="bg-blue-50 text-blue-600"
                loading={loadingData}
              />
              <StatCard
                icon={CheckSquare}
                label="Check-ins online"
                value={stats?.totalCheckins ?? 0}
                color="bg-green-50 text-green-600"
                loading={loadingData}
              />
              <StatCard
                icon={Clock}
                label="Pendientes de verificar"
                value={stats?.pendingCheckins ?? 0}
                color="bg-amber-50 text-amber-600"
                loading={loadingData}
              />
              <StatCard
                icon={TrendingUp}
                label="Upsells activos"
                value={stats?.activeUpsells ?? 0}
                color="bg-purple-50 text-purple-600"
                loading={loadingData}
              />
            </div>

            {/* Quick actions */}
            <div>
              <p className="text-sm font-semibold text-stone-600 mb-3">Acciones rápidas</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: LogIn, label: 'Generar link check-in', action: () => setShowGenerateModal(true), color: 'text-stone-700' },
                  { icon: MessageSquare, label: 'Ver mensajes', action: () => {}, color: 'text-stone-700' },
                  { icon: Users, label: 'Huéspedes', action: () => {}, color: 'text-stone-700' },
                  { icon: Settings, label: 'Configuración', action: () => window.location.href = '/reception', color: 'text-stone-700' },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm flex items-center gap-3 text-left active:scale-95 transition-transform"
                  >
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="text-sm font-medium text-stone-700">{item.label}</span>
                    <ChevronRight className="w-4 h-4 text-stone-300 ml-auto" />
                  </button>
                ))}
              </div>
            </div>

            {/* Recent checkins preview */}
            {checkins.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-stone-600">Últimos check-ins</p>
                  <button onClick={() => setActiveTab('checkins')} className="text-xs text-stone-400 flex items-center gap-1">
                    Ver todos <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-2">
                  {checkins.slice(0, 3).map(c => (
                    <div key={c.id} className="bg-white rounded-xl px-4 py-3 border border-stone-100 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-stone-800 text-sm">{c.first_name} {c.last_name}</p>
                        <p className="text-xs text-stone-400">
                          {c.reservations?.room_number ? `Hab. ${c.reservations.room_number}` : 'Sin habitación'} · {' '}
                          {new Date(c.submitted_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Check-ins tab ───────────────────────── */}
        {activeTab === 'checkins' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-stone-800">Check-ins recibidos</p>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="px-4 py-2 bg-stone-800 text-white rounded-xl text-sm font-medium flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" /> Nuevo link
              </button>
            </div>

            {loadingData ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-stone-100 animate-pulse">
                    <div className="h-4 bg-stone-100 rounded w-40 mb-2" />
                    <div className="h-3 bg-stone-100 rounded w-24" />
                  </div>
                ))}
              </div>
            ) : checkins.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No hay check-ins todavía</p>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="mt-3 text-sm text-stone-600 underline"
                >
                  Generar el primero
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {checkins.map(c => (
                  <div key={c.id} className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-stone-800">{c.first_name} {c.last_name}</p>
                        <p className="text-xs text-stone-500 mt-0.5">
                          {c.reservations?.room_number ? `Hab. ${c.reservations.room_number}` : 'Sin habitación asignada'}
                          {c.reservations?.checkin_date && ` · Llegada: ${new Date(c.reservations.checkin_date).toLocaleDateString('es-AR')}`}
                        </p>
                        <p className="text-xs text-stone-400 mt-1">
                          Enviado: {new Date(c.submitted_at).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Upsells tab ─────────────────────────── */}
        {activeTab === 'upsells' && (
          <div className="space-y-4">
            <p className="font-semibold text-stone-800">Upsells solicitados</p>

            {loadingData ? (
              <div className="h-20 bg-stone-100 rounded-2xl animate-pulse" />
            ) : upsells.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Aún no hay upsells solicitados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upsells.map(u => (
                  <div key={u.id} className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-stone-800 text-sm">{u.upsell_catalog?.title}</p>
                      <p className="text-xs text-stone-500 mt-0.5">
                        ${u.price} {u.currency} · {new Date(u.created_at).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <StatusBadge status={u.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showGenerateModal && (
        <GenerateLinkModal
          onClose={() => setShowGenerateModal(false)}
          onGenerated={(url, name) => {
            setShowGenerateModal(false);
            setGeneratedLink({ url, name });
          }}
        />
      )}

      {generatedLink && (
        <LinkGeneratedModal
          url={generatedLink.url}
          guestName={generatedLink.name}
          onClose={() => setGeneratedLink(null)}
        />
      )}
    </div>
  );
}
