/**
 * GET /api/admin/dashboard
 * Returns aggregated stats for the admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const hotelSlug = req.nextUrl.searchParams.get('hotel') ?? 'vain-palermo';

  // Get hotel
  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('slug', hotelSlug)
    .single();

  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

  const hotelId = hotel.id;
  const today = new Date().toISOString().split('T')[0];

  // Parallel queries
  const [
    { count: totalCheckins },
    { count: pendingCheckins },
    { count: todayArrivals },
    { count: activeUpsells },
    { data: recentCheckins },
    { data: recentUpsells },
  ] = await Promise.all([
    supabase.from('checkin_submissions').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId),
    supabase.from('checkin_submissions').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('status', 'submitted'),
    supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('checkin_date', today),
    supabase.from('upsell_bookings').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('status', 'confirmed'),
    supabase.from('checkin_submissions')
      .select('id, first_name, last_name, status, submitted_at, reservations(room_number, checkin_date, checkout_date)')
      .eq('hotel_id', hotelId)
      .order('submitted_at', { ascending: false })
      .limit(10),
    supabase.from('upsell_bookings')
      .select('id, price, currency, status, created_at, upsell_catalog(title, type)')
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return NextResponse.json({
    stats: {
      totalCheckins: totalCheckins ?? 0,
      pendingCheckins: pendingCheckins ?? 0,
      todayArrivals: todayArrivals ?? 0,
      activeUpsells: activeUpsells ?? 0,
    },
    recentCheckins: recentCheckins ?? [],
    recentUpsells: recentUpsells ?? [],
  });
}
