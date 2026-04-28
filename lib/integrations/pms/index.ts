/**
 * PMS Factory
 * Returns the correct adapter based on the hotel's PMS configuration.
 * Falls back to MockPMSAdapter if no credentials are configured.
 */

import { IPMSAdapter, PMSConfig } from './types';
import { MockPMSAdapter } from './mock';
import { CloudbedsAdapter } from './cloudbeds';

export function createPMSAdapter(config: PMSConfig): IPMSAdapter {
  switch (config.provider) {
    case 'cloudbeds':
      if (!config.apiKey || !config.propertyId) {
        console.warn('[PMS] Cloudbeds credentials missing — falling back to Mock PMS');
        return new MockPMSAdapter();
      }
      return new CloudbedsAdapter(config.apiKey, config.propertyId);

    case 'mock':
    default:
      return new MockPMSAdapter();
  }
}

/** Get PMS adapter for a hotel from Supabase config */
export async function getPMSForHotel(hotelSlug: string): Promise<IPMSAdapter> {
  // In production: query pms_integrations table for this hotel
  // For now, check environment variables as a quick override
  const provider = process.env.PMS_PROVIDER as PMSConfig['provider'] ?? 'mock';

  if (provider === 'cloudbeds') {
    return createPMSAdapter({
      provider: 'cloudbeds',
      apiKey: process.env.CLOUDBEDS_API_KEY,
      propertyId: process.env.CLOUDBEDS_PROPERTY_ID,
    });
  }

  return createPMSAdapter({ provider: 'mock' });
}

export type { IPMSAdapter, PMSReservation, PMSAvailability, PMSConfig } from './types';
