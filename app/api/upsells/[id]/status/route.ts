/**
 * PATCH /api/upsells/[id]/status
 * Confirma o cancela un cargo a habitación (usado por recepción)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { syncUpsellToReservation } from '@/lib/integrations/pms/cloudbeds';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!['confirmed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'status debe ser "confirmed" o "cancelled"' },
        { status: 400 }
      );
    }

    // Obtener el booking actual para el stub de Cloudbeds
    const { data: booking } = await supabase
      .from('upsell_bookings')
      .select('reservation_id, upsell_catalog(title, price)')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('upsell_bookings')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('[PATCH /api/upsells/[id]/status]', error);
      return NextResponse.json({ error: 'Error al actualizar estado' }, { status: 500 });
    }

    // Stub: sincronizar con Cloudbeds al confirmar
    if (status === 'confirmed' && booking?.reservation_id) {
      const catalog = booking.upsell_catalog as any;
      await syncUpsellToReservation(
        id,
        booking.reservation_id,
        catalog?.title ?? 'Servicio',
        catalog?.price ?? 0
      );
    }

    return NextResponse.json({ id, status });
  } catch (err) {
    console.error('[PATCH /api/upsells/[id]/status]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
