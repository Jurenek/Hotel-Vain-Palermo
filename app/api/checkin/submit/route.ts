/**
 * POST /api/checkin/submit
 * Submits the guest's check-in form data
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      token,
      firstName,
      lastName,
      email,
      phone,
      nationality,
      documentType,
      documentNumber,
      documentPhotoUrl,
      signatureData,
      tncAccepted,
      preferences,
      estimatedArrival,
      selectedUpsells = [],
      requestedTimes = {},
    } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    if (!tncAccepted) {
      return NextResponse.json({ error: 'Terms and conditions must be accepted' }, { status: 400 });
    }

    // Resolve token
    const { data: tokenRow, error: tokenErr } = await supabase
      .from('checkin_tokens')
      .select('id, reservation_id, hotel_id, expires_at, used_at')
      .eq('token', token)
      .single();

    if (tokenErr || !tokenRow) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Check-in link expired' }, { status: 410 });
    }

    // Generate QR code content (will be rendered on frontend)
    const qrContent = `VAIN-CHECKIN:${tokenRow.reservation_id}:${Date.now()}`;

    // Save submission
    const { data: submission, error: subErr } = await supabase
      .from('checkin_submissions')
      .insert({
        hotel_id: tokenRow.hotel_id,
        reservation_id: tokenRow.reservation_id,
        token_id: tokenRow.id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        nationality,
        document_type: documentType,
        document_number: documentNumber,
        document_photo_url: documentPhotoUrl,
        signature_data: signatureData,
        tnc_accepted: tncAccepted,
        tnc_accepted_at: new Date().toISOString(),
        preferences: preferences ?? {},
        estimated_arrival: estimatedArrival,
        qr_code: qrContent,
        status: 'submitted',
      })
      .select()
      .single();

    if (subErr || !submission) {
      console.error('[checkin/submit]', subErr);
      return NextResponse.json({ error: 'Failed to save check-in' }, { status: 500 });
    }

    // Mark token as used
    await supabase
      .from('checkin_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenRow.id);

    // Update guest profile if email provided
    if (email) {
      const { data: resData } = await supabase
        .from('reservations')
        .select('hotel_id')
        .eq('id', tokenRow.reservation_id)
        .single();

      if (resData) {
        await supabase
          .from('hotel_guests')
          .upsert({
            hotel_id: resData.hotel_id,
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            nationality,
            document_type: documentType,
            document_number: documentNumber,
          }, { onConflict: 'hotel_id,email', ignoreDuplicates: false })
          .select();
      }
    }

    // Process selected upsells (Charge to room)
    if (selectedUpsells && selectedUpsells.length > 0) {
      for (const upsellId of selectedUpsells) {
        // Fetch upsell details to get price
        const { data: upsellData } = await supabase
          .from('upsell_catalog')
          .select('price, currency')
          .eq('id', upsellId)
          .single();
          
        if (upsellData) {
          await supabase
            .from('upsell_bookings')
            .insert({
              hotel_id: tokenRow.hotel_id,
              reservation_id: tokenRow.reservation_id,
              upsell_id: upsellId,
              price: upsellData.price,
              currency: upsellData.currency,
              payment_method: 'room_charge',
              payment_status: 'pending', // Will be paid at checkout
              status: 'confirmed',
              requested_time: requestedTimes[upsellId] || null,
            });
        }
      }
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      qrCode: qrContent,
      message: '¡Check-in completado! Te esperamos.',
    });
  } catch (err) {
    console.error('[POST /api/checkin/submit]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
