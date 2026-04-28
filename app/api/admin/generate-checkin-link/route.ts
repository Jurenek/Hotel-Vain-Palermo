/**
 * POST /api/admin/generate-checkin-link
 * Manually generate a check-in link for a reservation (from admin panel)
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getPMSForHotel } from '@/lib/integrations/pms';

export async function POST(req: NextRequest) {
  try {
    const { pmsReservationId, hotelSlug } = await req.json();
    console.log('[generate-checkin-link] Request:', { pmsReservationId, hotelSlug });

    if (!pmsReservationId) {
      return NextResponse.json({ error: 'pmsReservationId required' }, { status: 400 });
    }

    const slug = hotelSlug ?? 'vain-palermo';

    // Get hotel
    console.log('[generate-checkin-link] Looking up hotel:', slug);
    const { data: hotel, error: hotelErr } = await supabase
      .from('hotels')
      .select('id')
      .eq('slug', slug)
      .single();

    if (hotelErr) {
      console.error('[generate-checkin-link] Hotel query error:', hotelErr);
      return NextResponse.json({ error: `Hotel lookup failed: ${hotelErr.message}` }, { status: 500 });
    }

    if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    console.log('[generate-checkin-link] Found hotel:', hotel.id);

    // Sync from PMS
    console.log('[generate-checkin-link] Getting PMS adapter for:', slug);
    const pms = await getPMSForHotel(slug);
    console.log('[generate-checkin-link] PMS provider:', pms.provider);

    const pmsRes = await pms.getReservation(pmsReservationId);

    if (!pmsRes) {
      return NextResponse.json({ error: 'Reservation not found in PMS' }, { status: 404 });
    }
    console.log('[generate-checkin-link] Found PMS reservation:', pmsRes.pmsId);

    // Upsert reservation
    console.log('[generate-checkin-link] Upserting reservation...');
    const { data: reservation, error: resErr } = await supabase
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

    if (resErr) {
      console.error('[generate-checkin-link] Reservation upsert error:', resErr);
      return NextResponse.json({ error: `Reservation sync failed: ${resErr.message}` }, { status: 500 });
    }

    if (!reservation) {
      return NextResponse.json({ error: 'Failed to sync reservation' }, { status: 500 });
    }
    console.log('[generate-checkin-link] Reservation created:', reservation.id);

    // Create or get token
    console.log('[generate-checkin-link] Looking for existing token...');
    const { data: existing } = await supabase
      .from('checkin_tokens')
      .select('token')
      .eq('reservation_id', reservation.id)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();

    let token = existing?.token;

    if (!token) {
      console.log('[generate-checkin-link] Creating new token...');
      const { data: newToken, error: tokenErr } = await supabase
        .from('checkin_tokens')
        .insert({ hotel_id: hotel.id, reservation_id: reservation.id })
        .select('token')
        .single();

      if (tokenErr) {
        console.error('[generate-checkin-link] Token creation error:', tokenErr);
        return NextResponse.json({ error: `Token creation failed: ${tokenErr.message}` }, { status: 500 });
      }
      token = newToken?.token;
    }

    if (!token) {
      return NextResponse.json({ error: 'Failed to create token' }, { status: 500 });
    }
    console.log('[generate-checkin-link] Token generated:', token);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vain-hotel-app.vercel.app';
    const checkinUrl = `${baseUrl}/checkin/${token}`;

    return NextResponse.json({
      token,
      checkinUrl,
      reservation: {
        guestName: `${pmsRes.guestFirstName} ${pmsRes.guestLastName}`,
        checkinDate: pmsRes.checkinDate,
        checkoutDate: pmsRes.checkoutDate,
        roomNumber: pmsRes.roomNumber,
      },
    });
  } catch (err) {
    console.error('[generate-checkin-link] Caught exception:', err);
    return NextResponse.json({ error: `Error: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }
}
