import { useState, useCallback } from 'react';

export interface PaymentIntentResponse {
  payment_intent_id: string;
  client_secret: string | null;
  status: string;
  amount: number;
  currency: string;
  requires_action: boolean;
  next_action: {
    type: string;
    use_stripe_sdk?: boolean;
    redirect_url?: string;
  } | null;
}

export interface TokenizationResponse {
  payment_method_id: string;
  card_brand: string;
  card_last4: string;
  exp_month: number;
  exp_year: number;
  saved: boolean;
}

export interface PaymentError {
  code: string;
  message: string;
}

export interface PaymentState {
  loading: boolean;
  error: PaymentError | null;
  paymentIntentId: string | null;
  clientSecret: string | null;
  status: 'idle' | 'tokenizing' | 'creating-intent' | 'confirming' | 'processing' | 'succeeded' | 'failed';
}

interface UseCardPaymentOptions {
  userId: string;
  apiGatewayUrl: string;
  onSuccess?: (paymentIntentId: string, clientSecret: string) => void;
  onError?: (error: PaymentError) => void;
}

export function useCardPayment({
  userId,
  apiGatewayUrl,
  onSuccess,
  onError,
}: UseCardPaymentOptions) {
  const [state, setState] = useState<PaymentState>({
    loading: false,
    error: null,
    paymentIntentId: null,
    clientSecret: null,
    status: 'idle',
  });

  const resetError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const tokenizeCard = useCallback(
    async (
      cardNumber: string,
      expMonth: string,
      expYear: string,
      cvc: string,
      saveCard: boolean = false
    ): Promise<TokenizationResponse | null> => {
      setState((prev) => ({ ...prev, loading: true, status: 'tokenizing', error: null }));

      try {
        const response = await fetch(`${apiGatewayUrl}/payment/method/tokenize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            card_number: cardNumber.replace(/\s/g, ''),
            exp_month: expMonth,
            exp_year: expYear,
            cvc,
            save_for_future: saveCard,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Card tokenization failed');
        }

        const tokenized: TokenizationResponse = await response.json();
        return tokenized;
      } catch (error) {
        const paymentError: PaymentError = {
          code: 'TOKENIZATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to tokenize card',
        };
        setState((prev) => ({ ...prev, loading: false, error: paymentError, status: 'failed' }));
        onError?.(paymentError);
        return null;
      }
    },
    [userId, apiGatewayUrl, onError]
  );

  const createPaymentIntent = useCallback(
    async (
      amountInCents: number,
      currency: string,
      description: string,
      paymentMethodId?: string,
      metadata?: Record<string, string>
    ): Promise<PaymentIntentResponse | null> => {
      setState((prev) => ({ ...prev, loading: true, status: 'creating-intent', error: null }));

      try {
        const response = await fetch(`${apiGatewayUrl}/payment/intent/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            amount_cents: amountInCents,
            currency,
            description,
            payment_method_id: paymentMethodId,
            metadata,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Payment intent creation failed');
        }

        const intent: PaymentIntentResponse = await response.json();
        setState((prev) => ({
          ...prev,
          paymentIntentId: intent.payment_intent_id,
          clientSecret: intent.client_secret,
          status: intent.requires_action ? 'confirming' : intent.status === 'succeeded' ? 'succeeded' : 'processing',
          loading: false,
        }));
        return intent;
      } catch (error) {
        const paymentError: PaymentError = {
          code: 'INTENT_CREATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create payment intent',
        };
        setState((prev) => ({ ...prev, loading: false, error: paymentError, status: 'failed' }));
        onError?.(paymentError);
        return null;
      }
    },
    [userId, apiGatewayUrl, onError]
  );

  const confirmPaymentIntent = useCallback(
    async (
      paymentIntentId: string,
      paymentMethodId?: string
    ): Promise<PaymentIntentResponse | null> => {
      setState((prev) => ({ ...prev, loading: true, status: 'confirming', error: null }));

      try {
        const response = await fetch(`${apiGatewayUrl}/payment/intent/confirm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            payment_intent_id: paymentIntentId,
            payment_method_id: paymentMethodId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Payment confirmation failed');
        }

        const intent: PaymentIntentResponse = await response.json();
        const finalStatus = intent.status === 'succeeded' ? 'succeeded' : intent.status === 'failed' ? 'failed' : 'processing';

        setState((prev) => ({
          ...prev,
          loading: false,
          status: finalStatus as PaymentState['status'],
          clientSecret: intent.client_secret,
        }));

        if (finalStatus === 'succeeded') {
          onSuccess?.(paymentIntentId, intent.client_secret || '');
        }

        return intent;
      } catch (error) {
        const paymentError: PaymentError = {
          code: 'CONFIRMATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to confirm payment',
        };
        setState((prev) => ({ ...prev, loading: false, error: paymentError, status: 'failed' }));
        onError?.(paymentError);
        return null;
      }
    },
    [apiGatewayUrl, onSuccess, onError]
  );

  const processPayment = useCallback(
    async (
      cardNumber: string,
      expMonth: string,
      expYear: string,
      cvc: string,
      amountInCents: number,
      currency: string,
      saveCard: boolean = false
    ): Promise<boolean> => {
      const tokenized = await tokenizeCard(cardNumber, expMonth, expYear, cvc, saveCard);
      if (!tokenized) return false;

      const intent = await createPaymentIntent(
        amountInCents,
        currency,
        `Card payment - ${tokenized.card_brand} ending in ${tokenized.card_last4}`,
        tokenized.payment_method_id,
        {
          card_brand: tokenized.card_brand,
          card_last4: tokenized.card_last4,
          mobile: 'true',
        }
      );

      if (!intent) return false;

      if (intent.requires_action) {
        return await confirmPaymentIntent(
          intent.payment_intent_id,
          tokenized.payment_method_id
        ).then((result) => result !== null && result.status === 'succeeded');
      }

      return intent.status === 'succeeded';
    },
    [tokenizeCard, createPaymentIntent, confirmPaymentIntent]
  );

  const getFxConversion = useCallback(
    async (
      fromCurrency: string,
      toCurrency: string,
      amount: string
    ): Promise<{
      rate: number;
      amount_in: string;
      amount_out: string;
      fee: string;
    } | null> => {
      try {
        const response = await fetch(`${apiGatewayUrl}/fx/convert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from_currency: fromCurrency,
            to_currency: toCurrency,
            amount,
          }),
        });

        if (!response.ok) {
          throw new Error('FX conversion failed');
        }

        return await response.json();
      } catch (error) {
        console.error('FX conversion error:', error);
        return null;
      }
    },
    [apiGatewayUrl]
  );

  return {
    state,
    tokenizeCard,
    createPaymentIntent,
    confirmPaymentIntent,
    processPayment,
    getFxConversion,
    resetError,
  };
}
