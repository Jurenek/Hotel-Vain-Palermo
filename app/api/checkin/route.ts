/**
 * POST /api/checkin
 * Creates a check-in token for a reservation (called by PMS webhook or manually)
 *
 * GET /api/checkin?token=xxx
 * Returns reservation data for the check-in flow
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getPMSForHotel } from '@/lib/integrations/pms';

// GET — Resolve token → reservation data
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  // Look up the token
  const { data: tokenRow, error: tokenErr } = await supabase
    .from('checkin_tokens')
    .select('*, reservations(*), hotels(*)')
    .eq('token', token)
    .single();

  if (tokenErr || !tokenRow) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
  }

  if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Check-in link expired' }, { status: 410 });
  }

  const reservation = tokenRow.reservations;
  const hotel = tokenRow.hotels;

  // Check if already submitted
  const { data: existing } = await supabase
    .from('checkin_submissions')
    .select('id, status, submitted_at')
    .eq('reservation_id', reservation.id)
    .single();

  return NextResponse.json({
    hotel: {
      id: hotel.id,
      slug: hotel.slug,
      name: hotel.name,
      primaryColor: hotel.primary_color,
      accentColor: hotel.accent_color,
      logoUrl: hotel.logo_url,
      address: hotel.address,
      whatsapp: hotel.whatsapp,
    },
    reservation: {
      id: reservation.id,
      guestFirstName: reservation.raw_pms_data?.guestFirstName ?? 'Huésped',
      guestLastName: reservation.raw_pms_data?.guestLastName ?? '',
      roomNumber: reservation.room_number,
      roomType: reservation.room_type,
      checkinDate: reservation.checkin_date,
      checkoutDate: reservation.checkout_date,
      checkinTime: reservation.checkin_time ?? '15:00',
      checkoutTime: reservation.checkout_time ?? '11:00',
      adults: reservation.adults,
      nights: Math.ceil((new Date(reservation.checkout_date).getTime() - new Date(reservation.checkin_date).getTime()) / 86400000),
    },
    alreadySubmitted: !!existing,
    submissionStatus: existing?.status ?? null,
  });
}

// POST — Create check-in token for a reservation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reservationId, pmsReservationId, hotelSlug } = body;

    if (!reservationId && !pmsReservationId) {
      return NextResponse.json({ error: 'reservationId or pmsReservationId required' }, { status: 400 });
    }

    let dbReservationId = reservationId;

    // If we only have PMS ID, sync the reservation first
    if (!reservationId && pmsReservationId) {
      const pms = await getPMSForHotel(hotelSlug ?? 'vain-palermo');
      const pmsRes = await pms.getReservation(pmsReservationId);
      if (!pmsRes) {
        return NextResponse.json({ error: 'Reservation not found in PMS' }, { status: 404 });
      }

      // Get hotel
      const { data: hotel } = await supabase
        .from('hotels')
        .select('id')
        .eq('slug', hotelSlug ?? 'vain-palermo')
        .single();

      if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

      // Upsert reservation
      const { data: res } = await supabase
        .from('reservations')
        .upsert({
          hotel_id: hotel.id,
          pms_reservation_id: pmsReservationId,
          room_number: pmsRes.roomNumber,
          room_type: pmsRes.roomType,
          checkin_date: pmsRes.checkinDate,
          checkout_date: pmsRes.checkoutDate,
          checkin_time: pmsRes.checkinTime ?? '15:00',
          checkout_time: pmsRes.checkoutTime ?? '11:00',
          status: pmsRes.status,
          adults: pmsRes.adults,
          children: pmsRes.children,
          total_amount: pmsRes.totalAmount,
          currency: pmsRes.currency ?? 'USD',
          source: pmsRes.source,
          raw_pms_data: pmsRes,
        }, { onConflict: 'hotel_id,pms_reservation_id' })
        .select()
        .single();

      dbReservationId = res?.id;
    }

    if (!dbReservationId) {
      return NextResponse.json({ error: 'Could not resolve reservation' }, { status: 500 });
    }

    // Get hotel_id from reservation
    const { data: reservation } = await supabase
      .from('reservations')
      .select('hotel_id')
      .eq('id', dbReservationId)
      .single();

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    // Create (or reuse) check-in token
    const { data: existing } = await supabase
      .from('checkin_tokens')
      .select('token')
      .eq('reservation_id', dbReservationId)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (existing) {
      return NextResponse.json({ token: existing.token });
    }

    const { data: newToken, error } = await supabase
      .from('checkin_tokens')
      .insert({
        hotel_id: reservation.hotel_id,
        reservation_id: dbReservationId,
      })
      .select('token')
      .single();

    if (error || !newToken) {
      return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
    }

    return NextResponse.json({ token: newToken.token });
  } catch (err) {
    console.error('[POST /api/checkin]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
