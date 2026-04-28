/**
 * Payment Factory
 * Automatically selects Stripe (USD) or MercadoPago (ARS) based on currency
 */

import { IPaymentAdapter } from './types';
import { StripeAdapter } from './stripe';
import { MercadoPagoAdapter } from './mercadopago';

export function getPaymentAdapter(currency: 'USD' | 'ARS'): IPaymentAdapter {
  if (currency === 'ARS') {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) throw new Error('MP_ACCESS_TOKEN not configured');
    return new MercadoPagoAdapter(token);
  }

  // Default to Stripe for USD
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new StripeAdapter(key);
}

export type { IPaymentAdapter, PaymentIntentResult, CreatePaymentIntentParams } from './types';
