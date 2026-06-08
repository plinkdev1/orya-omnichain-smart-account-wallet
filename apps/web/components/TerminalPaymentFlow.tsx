'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  CreditCard,
} from 'lucide-react';
import { toast } from 'sonner';

export type TerminalProvider = 'square' | 'stripe';
export type PaymentFlowStep = 'provider-select' | 'device-select' | 'amount' | 'processing' | 'complete';

interface TerminalPaymentFlowProps {
  userId: string;
  onPaymentComplete?: (transactionId: string, amount: string) => void;
  onPaymentError?: (error: string) => void;
}

interface Device {
  id: string;
  name: string;
  status: string;
}

export function TerminalPaymentFlow({
  userId,
  onPaymentComplete,
  onPaymentError,
}: TerminalPaymentFlowProps) {
  const [step, setStep] = useState<PaymentFlowStep>('provider-select');
  const [selectedProvider, setSelectedProvider] = useState<TerminalProvider | ''>('');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProvider && step === 'device-select') {
      fetchDevices(selectedProvider as TerminalProvider);
    }
  }, [selectedProvider, step]);

  const fetchDevices = async (provider: TerminalProvider) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/terminal/devices/${provider}`, {
        headers: {
          'X-User-ID': userId,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch devices');
      }

      const data = await response.json();
      setDevices(data.devices || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch devices');
      toast.error('Failed to load terminal devices');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSelect = (provider: TerminalProvider) => {
    setSelectedProvider(provider);
    setError(null);
    setStep('device-select');
  };

  const handleDeviceSelect = () => {
    if (!selectedDevice) {
      setError('Please select a device');
      return;
    }
    setError(null);
    setStep('amount');
  };

  const handleAmountSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!selectedDevice || !selectedProvider) {
      setError('Device or provider not selected');
      return;
    }

    setError(null);
    setLoading(true);
    setStep('processing');

    try {
      const response = await fetch('/api/terminal/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
        },
        body: JSON.stringify({
          provider: selectedProvider,
          reader_id: selectedDevice,
          amount: Math.round(parseFloat(amount) * 100),
          currency,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout');
      }

      const data = await response.json();
      setTransactionId(data.checkout_id);
      setStep('complete');

      if (onPaymentComplete) {
        onPaymentComplete(data.checkout_id, amount);
      }

      toast.success('Payment completed successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Payment failed';
      setError(errorMsg);
      setStep('amount');

      if (onPaymentError) {
        onPaymentError(errorMsg);
      }

      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('provider-select');
    setSelectedProvider('');
    setSelectedDevice('');
    setAmount('');
    setCurrency('USD');
    setError(null);
    setTransactionId(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>In-Store Terminal Payment</CardTitle>
        <CardDescription>Process payment using a terminal device</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'provider-select' && (
          <div className="space-y-4">
            <Label>Select Payment Provider</Label>
            <div className="grid grid-cols-2 gap-3">
              {['square', 'stripe'].map((provider) => (
                <Button
                  key={provider}
                  variant={selectedProvider === provider ? 'default' : 'outline'}
                  onClick={() => handleProviderSelect(provider as TerminalProvider)}
                  className="h-24"
                >
                  <div className="flex flex-col items-center gap-2">
                    <CreditCard className="h-6 w-6" />
                    <span className="capitalize font-semibold">{provider}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {step === 'device-select' && (
          <div className="space-y-4">
            <Label htmlFor="device">Select Terminal Device</Label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
              </div>
            ) : (
              <>
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger id="device">
                    <SelectValue placeholder="Choose a device..." />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.length > 0 ? (
                      devices.map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.name} ({device.status})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-devices" disabled>
                        No devices available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleDeviceSelect}
                  disabled={!selectedDevice || loading}
                  className="w-full"
                >
                  Continue
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setStep('provider-select')}
                  className="w-full"
                >
                  Back
                </Button>
              </>
            )}
          </div>
        )}

        {step === 'amount' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency} disabled={loading}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['USD', 'EUR', 'GBP', 'AUD', 'CAD'].map((curr) => (
                    <SelectItem key={curr} value={curr}>
                      {curr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleAmountSubmit}
              disabled={!amount || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Process Payment
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => setStep('device-select')}
              disabled={loading}
              className="w-full"
            >
              Back
            </Button>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            <p className="text-center text-slate-600">Processing your payment...</p>
          </div>
        )}

        {step === 'complete' && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <CheckCircle2 className="h-16 w-16 text-green-600" />
            <h3 className="text-lg font-semibold">Payment Successful</h3>
            <p className="text-slate-600 text-center">
              Transaction ID: <span className="font-mono text-sm">{transactionId}</span>
            </p>
            <p className="text-slate-600 text-center">
              Amount: <span className="font-semibold">{amount} {currency}</span>
            </p>
            <Button onClick={handleReset} className="w-full">
              New Payment
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
