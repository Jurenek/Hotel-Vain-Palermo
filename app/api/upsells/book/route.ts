/**
 * POST /api/upsells/book
 * Registra un cargo a la habitación del huésped (sin pasarela de pago)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { syncUpsellToReservation } from '@/lib/integrations/pms/cloudbeds';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomNumber, guestName, upsellId, requestedTime } = body;

    if (!roomNumber || !guestName || !upsellId) {
      return NextResponse.json(
        { error: 'roomNumber, guestName y upsellId son requeridos' },
        { status: 400 }
      );
    }

    // Obtener el upsell del catálogo
    const { data: upsell } = await supabase
      .from('upsell_catalog')
      .select('*')
      .eq('id', upsellId)
      .eq('active', true)
      .single();

    if (!upsell) {
      return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });
    }

    // Buscar al huésped por número de habitación para obtener reservation_id
    const { data: guestRecord } = await supabase
      .from('hotel_guests')
      .select('id, reservation_id, hotel_id')
      .eq('room_number', roomNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const hotelId = guestRecord?.hotel_id ?? upsell.hotel_id;
    const reservationId = guestRecord?.reservation_id ?? null;
    const guestId = guestRecord?.id ?? null;

    // Evitar duplicados: verificar si ya tiene este servicio solicitado o confirmado
    if (reservationId) {
      const { data: existing } = await supabase
        .from('upsell_bookings')
        .select('id')
        .eq('reservation_id', reservationId)
        .eq('upsell_id', upsellId)
        .in('status', ['pending', 'confirmed'])
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: 'Ya solicitaste este servicio' },
          { status: 409 }
        );
      }
    }

    // Crear el cargo a la habitación
    const { data: booking, error } = await supabase
      .from('upsell_bookings')
      .insert({
        hotel_id: hotelId,
        reservation_id: reservationId,
        upsell_id: upsellId,
        guest_id: guestId,
        price: upsell.price,
        currency: upsell.currency ?? 'USD',
        payment_method: 'room_charge',
        payment_status: 'room_charge',
        status: 'pending',
        requested_time: requestedTime ?? null,
        notes: JSON.stringify({ roomNumber, guestName }),
      })
      .select('id')
      .single();

    if (error) {
      console.error('[POST /api/upsells/book]', error);
      return NextResponse.json({ error: 'Error al registrar el cargo' }, { status: 500 });
    }

    // Stub: sincronizar con Cloudbeds cuando estén disponibles las credenciales
    if (reservationId) {
      await syncUpsellToReservation(booking.id, reservationId, upsell.title, upsell.price);
    }

    return NextResponse.json({
      bookingId: booking.id,
      upsellTitle: upsell.title,
      roomNumber,
      status: 'pending',
    });
  } catch (err) {
    console.error('[POST /api/upsells/book]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
