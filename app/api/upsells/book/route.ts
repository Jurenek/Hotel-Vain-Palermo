/**
 * POST /api/upsells/book
 * Books an upsell and creates a payment intent
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getPaymentAdapter } from '@/lib/integrations/payments';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, upsellId, currency, requestedTime } = body;

    if (!token || !upsellId) {
      return NextResponse.json({ error: 'token and upsellId required' }, { status: 400 });
    }

    // Resolve token
    const { data: tokenRow } = await supabase
      .from('checkin_tokens')
      .select('reservation_id, hotel_id, reservations(pms_reservation_id), hotels(slug, name)')
      .eq('token', token)
      .single();

    if (!tokenRow) return NextResponse.json({ error: 'Invalid token' }, { status: 404 });

    // Get upsell
    const { data: upsell } = await supabase
      .from('upsell_catalog')
      .select('*')
      .eq('id', upsellId)
      .eq('active', true)
      .single();

    if (!upsell) return NextResponse.json({ error: 'Upsell not found' }, { status: 404 });

    const selectedCurrency = (currency ?? upsell.currency ?? 'USD') as 'USD' | 'ARS';
    const hotel = tokenRow.hotels as any;

    // Create payment intent
    const payments = getPaymentAdapter(selectedCurrency);
    const intent = await payments.createIntent({
      amount: upsell.price,
      currency: selectedCurrency,
      description: `${upsell.title} — ${hotel.name}`,
      metadata: {
        upsellId,
        reservationId: tokenRow.reservation_id,
        hotelSlug: hotel.slug,
        requestedTime: requestedTime ?? '',
      },
      successUrl: `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vain-hotel-app.vercel.app'}/checkin/${token}/confirm?upsell=success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vain-hotel-app.vercel.app'}/checkin/${token}/upsells`,
    });

    // Record upsell booking
    await supabase.from('upsell_bookings').insert({
      hotel_id: tokenRow.hotel_id,
      reservation_id: tokenRow.reservation_id,
      upsell_id: upsellId,
      price: upsell.price,
      currency: selectedCurrency,
      payment_method: payments.provider,
      payment_id: intent.id,
      payment_status: 'pending',
      status: 'pending',
      requested_time: requestedTime,
    });

    // Record payment intent
    await supabase.from('payment_intents').insert({
      hotel_id: tokenRow.hotel_id,
      provider: payments.provider,
      external_id: intent.id,
      amount: upsell.price,
      currency: selectedCurrency,
      metadata: {
        upsellId,
        reservationId: tokenRow.reservation_id,
      },
    });

    return NextResponse.json({
      intentId: intent.id,
      provider: intent.provider,
      // Stripe: needs client-side SDK
      clientSecret: intent.clientSecret,
      // MercadoPago: redirect to checkout URL
      checkoutUrl: intent.checkoutUrl,
      amount: upsell.price,
      currency: selectedCurrency,
    });
  } catch (err) {
    console.error('[POST /api/upsells/book]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
