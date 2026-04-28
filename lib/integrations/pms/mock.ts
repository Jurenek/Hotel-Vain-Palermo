/**
 * Mock PMS Adapter
 * Used when no real PMS credentials are configured.
 * Generates realistic reservation data for development/testing.
 * Replace with CloudbedsAdapter once API keys are available.
 */

import { IPMSAdapter, PMSReservation, PMSAvailability, PMSUpdatePayload } from './types';
import { addDays, format } from '../../date-utils';

const MOCK_RESERVATIONS: PMSReservation[] = [
  {
    pmsId: 'RES-001',
    guestFirstName: 'Lucas',
    guestLastName: 'Hernández',
    guestEmail: 'lucas.hernandez@email.com',
    guestPhone: '+54 9 11 5555-1234',
    roomNumber: '204',
    roomType: 'Superior Double',
    checkinDate: format(addDays(new Date(), 1), 'YYYY-MM-DD'),
    checkoutDate: format(addDays(new Date(), 4), 'YYYY-MM-DD'),
    checkinTime: '15:00',
    checkoutTime: '11:00',
    status: 'confirmed',
    adults: 2,
    children: 0,
    totalAmount: 450,
    currency: 'USD',
    source: 'Booking.com',
  },
  {
    pmsId: 'RES-002',
    guestFirstName: 'María',
    guestLastName: 'González',
    guestEmail: 'maria.gonzalez@email.com',
    guestPhone: '+1 555 234-5678',
    roomNumber: '301',
    roomType: 'Deluxe Suite',
    checkinDate: format(addDays(new Date(), 2), 'YYYY-MM-DD'),
    checkoutDate: format(addDays(new Date(), 5), 'YYYY-MM-DD'),
    checkinTime: '15:00',
    checkoutTime: '11:00',
    status: 'confirmed',
    adults: 1,
    children: 0,
    totalAmount: 780,
    currency: 'USD',
    source: 'Direct',
  },
  {
    pmsId: 'RES-003',
    guestFirstName: 'James',
    guestLastName: 'Wilson',
    guestEmail: 'jwilson@company.com',
    roomNumber: '102',
    roomType: 'Standard Room',
    checkinDate: format(new Date(), 'YYYY-MM-DD'),
    checkoutDate: format(addDays(new Date(), 2), 'YYYY-MM-DD'),
    checkinTime: '15:00',
    checkoutTime: '11:00',
    status: 'checked_in',
    adults: 1,
    children: 0,
    totalAmount: 220,
    currency: 'USD',
    source: 'Airbnb',
  },
];

export class MockPMSAdapter implements IPMSAdapter {
  provider = 'mock';
  private reservations = [...MOCK_RESERVATIONS];

  async getReservation(pmsId: string): Promise<PMSReservation | null> {
    return this.reservations.find(r => r.pmsId === pmsId) ?? null;
  }

  async getUpcomingReservations(): Promise<PMSReservation[]> {
    return this.reservations.filter(r => r.status !== 'cancelled');
  }

  async checkAvailability(date: string): Promise<PMSAvailability> {
    // Simulate 70% chance of early/late availability
    const seed = date.charCodeAt(8) || 0;
    return {
      date,
      roomsAvailable: 3 + (seed % 5),
      earlyCheckinAvailable: seed % 3 !== 0,
      lateCheckoutAvailable: seed % 4 !== 0,
      earliestCheckinTime: '11:00',
      latestCheckoutTime: '14:00',
    };
  }

  async updateReservation(pmsId: string, updates: PMSUpdatePayload): Promise<boolean> {
    const idx = this.reservations.findIndex(r => r.pmsId === pmsId);
    if (idx === -1) return false;
    if (updates.status) this.reservations[idx].status = updates.status;
    if (updates.checkinTime) this.reservations[idx].checkinTime = updates.checkinTime;
    if (updates.checkoutTime) this.reservations[idx].checkoutTime = updates.checkoutTime;
    console.log(`[MockPMS] Updated reservation ${pmsId}:`, updates);
    return true;
  }

  async checkIn(pmsId: string): Promise<boolean> {
    return this.updateReservation(pmsId, { status: 'checked_in' });
  }

  async checkOut(pmsId: string): Promise<boolean> {
    return this.updateReservation(pmsId, { status: 'checked_out' });
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    return { ok: true, message: 'Mock PMS connected (no real PMS configured yet)' };
  }
}
