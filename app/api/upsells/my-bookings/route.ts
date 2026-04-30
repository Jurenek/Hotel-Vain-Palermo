/**
 * GET /api/upsells/my-bookings?roomNumber=X
 * Devuelve los cargos a habitación del huésped
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const roomNumber = req.nextUrl.searchParams.get('roomNumber');
  if (!roomNumber) {
    return NextResponse.json({ error: 'roomNumber requerido' }, { status: 400 });
  }

  try {
    // Buscar reservation_id del huésped activo en esa habitación
    const { data: guestRecord } = await supabase
      .from('hotel_guests')
      .select('reservation_id')
      .eq('room_number', roomNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let query = supabase
      .from('upsell_bookings')
      .select('id, status, requested_time, created_at, notes, upsell_catalog(title, type, price, currency)')
      .eq('payment_method', 'room_charge')
      .order('created_at', { ascending: false });

    if (guestRecord?.reservation_id) {
      query = query.eq('reservation_id', guestRecord.reservation_id);
    } else {
      // Fallback: buscar por roomNumber en el campo notes
      query = query.ilike('notes', `%"roomNumber":"${roomNumber}"%`);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('[GET /api/upsells/my-bookings]', error);
      return NextResponse.json({ error: 'Error al obtener reservas' }, { status: 500 });
    }

    const result = (bookings ?? []).map((b) => {
      const catalog = b.upsell_catalog as any;
      return {
        id: b.id,
        title: catalog?.title ?? 'Servicio',
        type: catalog?.type ?? 'other',
        price: catalog?.price,
        currency: catalog?.currency ?? 'USD',
        status: b.status,
        requestedTime: b.requested_time,
        createdAt: b.created_at,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[GET /api/upsells/my-bookings]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
