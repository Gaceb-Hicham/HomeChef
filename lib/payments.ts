import { Platform } from 'react-native';

// =============================================================
// Payment Service — Web-safe version
// Stripe React Native is native-only. On web, all card payments
// are simulated. On native, the .native.ts override loads Stripe.
// =============================================================

interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
}

/** Initialize payments (no-op on web) */
export async function initializePayments() {
  // Stripe React Native only works on iOS/Android
  if (Platform.OS === 'web') {
    console.log('[Payments] Web mode — card payments simulated');
  }
}

/** Create payment intent via Supabase Edge Function */
export async function createPaymentIntent(
  amount: number, customerId: string, chefId: string, orderId: string,
) {
  try {
    const { supabase } = require('@/lib/supabase');
    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { amount: amount * 100, currency: 'dzd', customer_id: customerId, chef_id: chefId, order_id: orderId },
    });
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (e: any) {
    return { data: null, error: e.message || 'Failed to create payment intent' };
  }
}

/** Process card payment — on web, returns simulated success */
export async function processCardPayment(clientSecret: string): Promise<PaymentResult> {
  // On web & dev, simulate success. Native builds use payments.native.ts
  return { success: true, paymentIntentId: 'pi_simulated_web' };
}

/** Process cash on delivery */
export function processCashPayment(orderId: string): PaymentResult {
  return { success: true, paymentIntentId: `cash_${orderId}` };
}

/** Full checkout flow */
export async function processCheckout(params: {
  method: 'card' | 'cash'; amount: number; customerId: string; chefId: string; orderId: string;
}): Promise<PaymentResult> {
  if (params.method === 'cash') return processCashPayment(params.orderId);

  const { data: intent, error } = await createPaymentIntent(
    params.amount, params.customerId, params.chefId, params.orderId,
  );
  if (error || !intent) return { success: false, error: error || 'Failed to initialize payment' };

  return processCardPayment(intent.clientSecret);
}

/** Refund a payment */
export async function refundPayment(paymentIntentId: string, amount?: number) {
  try {
    const { supabase } = require('@/lib/supabase');
    const { error } = await supabase.functions.invoke('refund-payment', {
      body: { payment_intent_id: paymentIntentId, amount: amount ? amount * 100 : undefined },
    });
    return { success: !error, error: error?.message };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/** Get chef payout balance */
export async function getChefPayoutBalance(chefId: string) {
  try {
    const { supabase } = require('@/lib/supabase');
    const { data, error } = await supabase.functions.invoke('get-payout-balance', { body: { chef_id: chefId } });
    if (error) return { available: 0, pending: 0, error: error.message };
    return { available: data?.available || 0, pending: data?.pending || 0 };
  } catch (e: any) {
    return { available: 0, pending: 0, error: e.message };
  }
}

/** Request payout */
export async function requestPayout(chefId: string, amount: number) {
  try {
    const { supabase } = require('@/lib/supabase');
    const { error } = await supabase.functions.invoke('request-payout', { body: { chef_id: chefId, amount: amount * 100 } });
    return { success: !error, error: error?.message };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
