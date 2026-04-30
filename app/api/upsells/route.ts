/**
 * GET /api/upsells?token=xxx
 * Returns available upsells for a reservation, checking PMS availability
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getPMSForHotel } from '@/lib/integrations/pms';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  // Sin token: devolver catálogo completo de upsells activos (para la app del huésped post check-in)
  if (!token) {
    const { data: catalog } = await supabase
      .from('upsell_catalog')
      .select('id, type, title, description, price, currency, max_hours')
      .eq('active', true)
      .order('sort_order');

    return NextResponse.json({ upsells: catalog ?? [] });
  }

  // Resolve token → reservation
  const { data: tokenRow } = await supabase
    .from('checkin_tokens')
    .select('reservation_id, hotel_id, reservations(checkin_date, checkout_date, pms_reservation_id), hotels(slug)')
    .eq('token', token)
    .single();

  if (!tokenRow) return NextResponse.json({ error: 'Invalid token' }, { status: 404 });

  const reservation = tokenRow.reservations as any;
  const hotel = tokenRow.hotels as any;

  // Check PMS availability
  const pms = await getPMSForHotel(hotel.slug);
  const availability = await pms.checkAvailability(reservation.checkin_date);

  // Get upsell catalog for this hotel
  const { data: catalog } = await supabase
    .from('upsell_catalog')
    .select('*')
    .eq('hotel_id', tokenRow.hotel_id)
    .eq('active', true)
    .order('sort_order');

  if (!catalog) return NextResponse.json({ upsells: [] });

  // Filter by availability
  const upsells = catalog
    .filter(u => {
      if (u.type === 'early_checkin') return availability.earlyCheckinAvailable;
      if (u.type === 'late_checkout') return availability.lateCheckoutAvailable;
      return true;
    })
    .map(u => ({
      id: u.id,
      type: u.type,
      title: u.title,
      description: u.description,
      price: u.price,
      currency: u.currency,
      maxHours: u.max_hours,
      // For early checkin: show available from time
      availableFrom: u.type === 'early_checkin' ? availability.earliestCheckinTime : undefined,
      availableUntil: u.type === 'late_checkout' ? availability.latestCheckoutTime : undefined,
    }));

  return NextResponse.json({
    upsells,
    checkinDate: reservation.checkin_date,
    checkoutDate: reservation.checkout_date,
    availability: {
      earlyCheckin: availability.earlyCheckinAvailable,
      lateCheckout: availability.lateCheckoutAvailable,
      earliestCheckinTime: availability.earliestCheckinTime,
      latestCheckoutTime: availability.latestCheckoutTime,
    },
  });
}
