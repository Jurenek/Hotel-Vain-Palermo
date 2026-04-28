export interface CreatePaymentIntentParams {
  amount: number;           // in cents for Stripe / full ARS for MP
  currency: 'USD' | 'ARS';
  description: string;
  metadata?: Record<string, string>;
  successUrl?: string;
  cancelUrl?: string;
}

export interface PaymentIntentResult {
  id: string;
  provider: 'stripe' | 'mercadopago';
  clientSecret?: string;   // Stripe
  preferenceId?: string;   // MercadoPago
  checkoutUrl?: string;    // MercadoPago redirect URL
  amount: number;
  currency: string;
  status: 'pending' | 'requires_payment_method' | 'succeeded' | 'failed';
}

export interface IPaymentAdapter {
  provider: 'stripe' | 'mercadopago';
  createIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
  getIntent(id: string): Promise<PaymentIntentResult | null>;
  refund(intentId: string, amount?: number): Promise<boolean>;
}
