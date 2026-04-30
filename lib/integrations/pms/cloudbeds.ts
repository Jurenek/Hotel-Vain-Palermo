/**
 * Cloudbeds PMS Adapter
 *
 * Cloudbeds API v1.1 — https://hotels.cloudbeds.com/api/v1.1
 *
 * Setup:
 * 1. Log into Cloudbeds → Apps & Integrations → API
 * 2. Create an API key with scopes: reservations:read, reservations:write
 * 3. Add to .env.local:
 *    CLOUDBEDS_API_KEY=your_key
 *    CLOUDBEDS_PROPERTY_ID=your_property_id
 *
 * OAuth flow (for multi-property): use CLOUDBEDS_CLIENT_ID + CLOUDBEDS_CLIENT_SECRET
 */

import { IPMSAdapter, PMSReservation, PMSAvailability, PMSUpdatePayload } from './types';

const BASE_URL = 'https://api.cloudbeds.com/api/v1.1';

interface CloudbedsReservation {
  reservationID: string;
  guestName: string;
  guestFirstName?: string;
  guestLastName?: string;
  guestEmail?: string;
  guestPhone?: string;
  roomNumber?: string;
  roomTypeName?: string;
  startDate: string;
  endDate: string;
  status: string;
  adults: number;
  kids: number;
  grandTotal: number;
  currency?: string;
  sourceChannelLabel?: string;
  specialRequests?: string;
}

export class CloudbedsAdapter implements IPMSAdapter {
  provider = 'cloudbeds';
  private apiKey: string;
  private propertyId: string;

  constructor(apiKey: string, propertyId: string) {
    this.apiKey = apiKey;
    this.propertyId = propertyId;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' = 'GET',
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.set('propertyID', this.propertyId);

    const res = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      throw new Error(`Cloudbeds API error: ${res.status} ${await res.text()}`);
    }

    const json = await res.json();
    return json.data ?? json;
  }

  private mapReservation(r: CloudbedsReservation): PMSReservation {
    const nameParts = r.guestName?.split(' ') ?? [];
    return {
      pmsId: r.reservationID,
      guestFirstName: r.guestFirstName ?? nameParts[0] ?? '',
      guestLastName: r.guestLastName ?? nameParts.slice(1).join(' ') ?? '',
      guestEmail: r.guestEmail,
      guestPhone: r.guestPhone,
      roomNumber: r.roomNumber,
      roomType: r.roomTypeName,
      checkinDate: r.startDate,
      checkoutDate: r.endDate,
      checkinTime: '15:00',
      checkoutTime: '11:00',
      status: this.mapStatus(r.status),
      adults: r.adults ?? 1,
      children: r.kids ?? 0,
      totalAmount: r.grandTotal,
      currency: r.currency ?? 'USD',
      source: r.sourceChannelLabel,
      specialRequests: r.specialRequests,
      rawData: r as unknown as Record<string, unknown>,
    };
  }

  private mapStatus(s: string): PMSReservation['status'] {
    const map: Record<string, PMSReservation['status']> = {
      confirmed: 'confirmed',
      'checked in': 'checked_in',
      'checked out': 'checked_out',
      cancelled: 'cancelled',
      'no show': 'no_show',
    };
    return map[s.toLowerCase()] ?? 'confirmed';
  }

  async getReservation(pmsId: string): Promise<PMSReservation | null> {
    try {
      const data = await this.request<CloudbedsReservation>(`/getReservation?reservationID=${pmsId}`);
      return this.mapReservation(data);
    } catch (err) {
      console.error('[Cloudbeds] getReservation error:', err);
      return null;
    }
  }

  async getUpcomingReservations(): Promise<PMSReservation[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      const data = await this.request<{ reservations: CloudbedsReservation[] }>(
        `/getReservations?status=confirmed,checked_in&startDate=${today}&endDate=${nextWeek}`
      );
      return (data.reservations ?? []).map(r => this.mapReservation(r));
    } catch (err) {
      console.error('[Cloudbeds] getUpcomingReservations error:', err);
      return [];
    }
  }

  async checkAvailability(date: string): Promise<PMSAvailability> {
    try {
      const data = await this.request<{ roomsAvailable: number }>(
        `/getAvailabilityCalendar?startDate=${date}&endDate=${date}`
      );
      return {
        date,
        roomsAvailable: data.roomsAvailable ?? 0,
        earlyCheckinAvailable: (data.roomsAvailable ?? 0) > 0,
        lateCheckoutAvailable: (data.roomsAvailable ?? 0) > 0,
        earliestCheckinTime: '11:00',
        latestCheckoutTime: '14:00',
      };
    } catch (err) {
      console.error('[Cloudbeds] checkAvailability error:', err);
      return {
        date,
        roomsAvailable: 0,
        earlyCheckinAvailable: false,
        lateCheckoutAvailable: false,
      };
    }
  }

  async updateReservation(pmsId: string, updates: PMSUpdatePayload): Promise<boolean> {
    try {
      await this.request(`/putReservation`, 'PUT', {
        reservationID: pmsId,
        ...updates,
      });
      return true;
    } catch (err) {
      console.error('[Cloudbeds] updateReservation error:', err);
      return false;
    }
  }

  async checkIn(pmsId: string): Promise<boolean> {
    try {
      await this.request(`/postReservationCheckin`, 'POST', { reservationID: pmsId });
      return true;
    } catch (err) {
      console.error('[Cloudbeds] checkIn error:', err);
      return false;
    }
  }

  async checkOut(pmsId: string): Promise<boolean> {
    try {
      await this.request(`/postReservationCheckout`, 'POST', { reservationID: pmsId });
      return true;
    } catch (err) {
      console.error('[Cloudbeds] checkOut error:', err);
      return false;
    }
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      await this.request('/getHotelDetails');
      return { ok: true, message: 'Cloudbeds connected successfully' };
    } catch (err) {
      return { ok: false, message: `Connection failed: ${err}` };
    }
  }
}

/**
 * Sincroniza un cargo de upsell al folio de la reserva en Cloudbeds.
 * Stub listo para activar cuando estén disponibles las credenciales de API.
 *
 * Para activar: implementar POST /api/v1.1/postFolioCharge con:
 *   reservationID, description, quantity, amount
 */
export async function syncUpsellToReservation(
  bookingId: string,
  reservationId: string,
  upsellTitle: string,
  amount: number
): Promise<void> {
  const apiKey = process.env.CLOUDBEDS_API_KEY;
  const propertyId = process.env.CLOUDBEDS_PROPERTY_ID;

  if (!apiKey || !propertyId) {
    console.log(
      `[Cloudbeds stub] Cargo "${upsellTitle}" (booking: ${bookingId}) → reserva ${reservationId} — $${amount}. Pendiente de credenciales de API.`
    );
    return;
  }

  // TODO: activar cuando estén disponibles las credenciales
  // const adapter = new CloudbedsAdapter(apiKey, propertyId);
  // await adapter.request('/postFolioCharge', 'POST', {
  //   reservationID: reservationId,
  //   description: upsellTitle,
  //   quantity: 1,
  //   amount,
  // });
  console.log(
    `[Cloudbeds] Sync activado para "${upsellTitle}" → reserva ${reservationId}`
  );
}
