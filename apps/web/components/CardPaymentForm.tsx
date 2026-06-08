'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface CardPaymentFormProps {
  userId: string;
  onPaymentSuccess?: (paymentIntentId: string, clientSecret: string) => void;
  onPaymentError?: (error: string) => void;
  apiGatewayUrl: string;
}

interface PaymentIntentInitiationResponse {
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

interface TokenizationResponse {
  payment_method_id: string;
  card_brand: string;
  card_last4: string;
  exp_month: number;
  exp_year: number;
  saved: boolean;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD'];
const CARD_BRANDS = ['visa', 'mastercard', 'amex', 'discover'];

export function CardPaymentForm({
  userId,
  onPaymentSuccess,
  onPaymentError,
  apiGatewayUrl,
}: CardPaymentFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [saveCard, setSaveCard] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  const parseExpiry = (expiryStr: string): { month: string; year: string } | null => {
    const parts = expiryStr.split('/');
    if (parts.length === 2 && parts[0].length === 2 && parts[1].length === 2) {
      const month = parts[0];
      const year = `20${parts[1]}`;
      return { month, year };
    }
    return null;
  };

  const validateForm = (): boolean => {
    setError(null);

    if (!cardNumber.replace(/\s/g, '')) {
      setError('Please enter a card number');
      return false;
    }

    if (cardNumber.replace(/\s/g, '').length < 13) {
      setError('Card number must be at least 13 digits');
      return false;
    }

    if (!expiry || !parseExpiry(expiry)) {
      setError('Please enter a valid expiry date (MM/YY)');
      return false;
    }

    if (!cvc || cvc.length < 3) {
      setError('Please enter a valid CVC');
      return false;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return false;
    }

    return true;
  };

  const handlePayment = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const expiryParts = parseExpiry(expiry);
      if (!expiryParts) {
        throw new Error('Invalid expiry date');
      }

      const amountInCents = Math.round(parseFloat(amount) * 100);

      const tokenizeResponse = await fetch(
        `${apiGatewayUrl}/payment/method/tokenize`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            card_number: cardNumber.replace(/\s/g, ''),
            exp_month: expiryParts.month,
            exp_year: expiryParts.year,
            cvc,
            save_for_future: saveCard,
          }),
        }
      );

      if (!tokenizeResponse.ok) {
        const errorData = await tokenizeResponse.json();
        throw new Error(errorData.error || 'Card tokenization failed');
      }

      const tokenized: TokenizationResponse = await tokenizeResponse.json();

      const paymentIntentResponse = await fetch(
        `${apiGatewayUrl}/payment/intent/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            amount_cents: amountInCents,
            currency,
            description: `Card payment - ${tokenized.card_brand} ending in ${tokenized.card_last4}`,
            payment_method_id: tokenized.payment_method_id,
            metadata: {
              card_brand: tokenized.card_brand,
              card_last4: tokenized.card_last4,
              platform: 'web',
            },
          }),
        }
      );

      if (!paymentIntentResponse.ok) {
        const errorData = await paymentIntentResponse.json();
        throw new Error(errorData.error || 'Payment intent creation failed');
      }

      const paymentIntent: PaymentIntentInitiationResponse =
        await paymentIntentResponse.json();

      if (paymentIntent.requires_action) {
        if (
          paymentIntent.next_action?.type === 'redirect_to_url' &&
          paymentIntent.next_action?.redirect_url
        ) {
          setError('3D Secure authentication required. Redirecting...');
          setTimeout(() => {
            window.location.href = paymentIntent.next_action!.redirect_url!;
          }, 2000);
        }
      } else if (paymentIntent.status === 'succeeded') {
        setSuccess(`Payment of ${currency} ${amount} completed successfully!`);
        toast.success('Payment completed successfully');
        onPaymentSuccess?.(paymentIntent.payment_intent_id, paymentIntent.client_secret || '');

        setTimeout(() => {
          setCardNumber('');
          setExpiry('');
          setCvc('');
          setAmount('');
        }, 1500);
      } else {
        setSuccess('Payment is being processed. You will receive confirmation shortly.');
        toast.info('Payment processing');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      toast.error(errorMessage);
      onPaymentError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [cardNumber, expiry, cvc, amount, currency, userId, saveCard, apiGatewayUrl, onPaymentSuccess, onPaymentError]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Card Payment</CardTitle>
        <CardDescription>Enter your card details to complete the payment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="card-number">Card Number</Label>
          <Input
            id="card-number"
            placeholder="4111 1111 1111 1111"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            disabled={loading}
            maxLength={19}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiry">Expiry (MM/YY)</Label>
            <Input
              id="expiry"
              placeholder="MM/YY"
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              disabled={loading}
              maxLength={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cvc">CVC</Label>
            <Input
              id="cvc"
              placeholder="123"
              type="password"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
              disabled={loading}
              maxLength={4}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Amount</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading}
              step="0.01"
              min="0"
              className="flex-1"
            />
            <Select value={currency} onValueChange={setCurrency} disabled={loading}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((curr) => (
                  <SelectItem key={curr} value={curr}>
                    {curr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="save-card"
            checked={saveCard}
            onCheckedChange={(checked) => setSaveCard(checked as boolean)}
            disabled={loading}
          />
          <Label htmlFor="save-card" className="font-normal cursor-pointer">
            Save this card for future payments
          </Label>
        </div>

        <Button
          onClick={handlePayment}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ${currency} ${amount || '0.00'}`
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          By proceeding, you agree to our Terms of Service and Privacy Policy
        </p>
      </CardContent>
    </Card>
  );
}
