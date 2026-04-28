/**
 * PMS Integration — Abstract Types
 * Any PMS adapter must implement IPMSAdapter
 */

export interface PMSReservation {
  pmsId: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail?: string;
  guestPhone?: string;
  roomNumber?: string;
  roomType?: string;
  checkinDate: string;     // YYYY-MM-DD
  checkoutDate: string;    // YYYY-MM-DD
  checkinTime?: string;    // HH:MM
  checkoutTime?: string;   // HH:MM
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';
  adults: number;
  children: number;
  totalAmount?: number;
  currency?: string;
  specialRequests?: string;
  source?: string;
  rawData?: Record<string, unknown>;
}

export interface PMSAvailability {
  date: string;            // YYYY-MM-DD
  roomsAvailable: number;
  earlyCheckinAvailable: boolean;
  lateCheckoutAvailable: boolean;
  earliestCheckinTime?: string;  // e.g. "11:00"
  latestCheckoutTime?: string;   // e.g. "14:00"
}

export interface PMSUpdatePayload {
  status?: PMSReservation['status'];
  checkinTime?: string;
  checkoutTime?: string;
  guestData?: Partial<Pick<PMSReservation, 'guestEmail' | 'guestPhone'>>;
}

export interface IPMSAdapter {
  provider: string;

  /** Fetch a single reservation by PMS ID */
  getReservation(pmsId: string): Promise<PMSReservation | null>;

  /** Fetch all upcoming reservations (next 7 days by default) */
  getUpcomingReservations(hotelId?: string): Promise<PMSReservation[]>;

  /** Check availability for a specific date */
  checkAvailability(date: string): Promise<PMSAvailability>;

  /** Update reservation data in the PMS */
  updateReservation(pmsId: string, updates: PMSUpdatePayload): Promise<boolean>;

  /** Mark check-in as completed in PMS */
  checkIn(pmsId: string): Promise<boolean>;

  /** Mark check-out as completed in PMS */
  checkOut(pmsId: string): Promise<boolean>;

  /** Test the connection */
  testConnection(): Promise<{ ok: boolean; message: string }>;
}

export interface PMSConfig {
  provider: 'cloudbeds' | 'mews' | 'opera' | 'sihotel' | 'mock';
  apiKey?: string;
  apiSecret?: string;
  propertyId?: string;
  webhookSecret?: string;
  config?: Record<string, unknown>;
}
