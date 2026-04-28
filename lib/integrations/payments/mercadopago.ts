/**
 * Mercado Pago Adapter
 * For ARS transactions (local Argentine guests)
 *
 * Setup:
 * MP_ACCESS_TOKEN=APP_USR-...
 * MP_PUBLIC_KEY=APP_USR-...
 * NEXT_PUBLIC_BASE_URL=https://vain-hotel-app.vercel.app
 */

import { IPaymentAdapter, CreatePaymentIntentParams, PaymentIntentResult } from './types';

const BASE_URL = 'https://api.mercadopago.com/v1';

export class MercadoPagoAdapter implements IPaymentAdapter {
  provider = 'mercadopago' as const;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async mpRequest<T>(endpoint: string, body?: unknown): Promise<T> {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(`MercadoPago error: ${JSON.stringify(err)}`);
    }
    return res.json();
  }

  async createIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://vain-hotel-app.vercel.app';

    // MercadoPago uses "preferences" for checkout flows
    const preference = await this.mpRequest<{
      id: string;
      init_point: string;
      sandbox_init_point: string;
    }>('/checkout/preferences', {
      items: [
        {
          title: params.description,
          quantity: 1,
          unit_price: params.amount,
          currency_id: params.currency === 'ARS' ? 'ARS' : 'USD',
        },
      ],
      back_urls: {
        success: params.successUrl ?? `${baseUrl}/checkin/payment/success`,
        failure: params.cancelUrl ?? `${baseUrl}/checkin/payment/failure`,
        pending: `${baseUrl}/checkin/payment/pending`,
      },
      auto_return: 'approved',
      metadata: params.metadata ?? {},
      statement_descriptor: 'VAIN HOTEL',
    });

    const isDev = process.env.NODE_ENV !== 'production';

    return {
      id: preference.id,
      provider: 'mercadopago',
      preferenceId: preference.id,
      checkoutUrl: isDev ? preference.sandbox_init_point : preference.init_point,
      amount: params.amount,
      currency: params.currency,
      status: 'pending',
    };
  }

  async getIntent(id: string): Promise<PaymentIntentResult | null> {
    try {
      const pref = await this.mpRequest<{
        id: string; status?: string; total_amount?: number; currency_id?: string;
      }>(`/checkout/preferences/${id}`);
      return {
        id: pref.id,
        provider: 'mercadopago',
        preferenceId: pref.id,
        amount: pref.total_amount ?? 0,
        currency: pref.currency_id ?? 'ARS',
        status: 'pending',
      };
    } catch {
      return null;
    }
  }

  async refund(paymentId: string, amount?: number): Promise<boolean> {
    try {
      await this.mpRequest(`/payments/${paymentId}/refunds`, amount ? { amount } : undefined);
      return true;
    } catch {
      return false;
    }
  }
}
