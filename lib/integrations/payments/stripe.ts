/**
 * Stripe Payment Adapter
 * For USD transactions (international guests)
 *
 * Setup:
 * STRIPE_SECRET_KEY=sk_...
 * STRIPE_WEBHOOK_SECRET=whsec_...
 * NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
 */

import { IPaymentAdapter, CreatePaymentIntentParams, PaymentIntentResult } from './types';

export class StripeAdapter implements IPaymentAdapter {
  provider = 'stripe' as const;
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  private async stripeRequest<T>(endpoint: string, body?: URLSearchParams): Promise<T> {
    const res = await fetch(`https://api.stripe.com/v1${endpoint}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Stripe error: ${err.error?.message ?? res.statusText}`);
    }
    return res.json();
  }

  async createIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    const body = new URLSearchParams({
      amount: String(Math.round(params.amount * 100)),  // dollars → cents
      currency: params.currency.toLowerCase(),
      description: params.description,
      automatic_payment_methods: JSON.stringify({ enabled: 'true' }),
    });

    if (params.metadata) {
      Object.entries(params.metadata).forEach(([k, v]) => {
        body.append(`metadata[${k}]`, v);
      });
    }

    const intent = await this.stripeRequest<{
      id: string; client_secret: string; status: string; amount: number; currency: string;
    }>('/payment_intents', body);

    return {
      id: intent.id,
      provider: 'stripe',
      clientSecret: intent.client_secret,
      amount: intent.amount / 100,
      currency: intent.currency.toUpperCase(),
      status: intent.status === 'succeeded' ? 'succeeded' : 'pending',
    };
  }

  async getIntent(id: string): Promise<PaymentIntentResult | null> {
    try {
      const intent = await this.stripeRequest<{
        id: string; client_secret: string; status: string; amount: number; currency: string;
      }>(`/payment_intents/${id}`);
      return {
        id: intent.id,
        provider: 'stripe',
        clientSecret: intent.client_secret,
        amount: intent.amount / 100,
        currency: intent.currency.toUpperCase(),
        status: intent.status as PaymentIntentResult['status'],
      };
    } catch {
      return null;
    }
  }

  async refund(intentId: string, amount?: number): Promise<boolean> {
    try {
      const body = new URLSearchParams({ payment_intent: intentId });
      if (amount) body.append('amount', String(Math.round(amount * 100)));
      await this.stripeRequest('/refunds', body);
      return true;
    } catch {
      return false;
    }
  }
}
