'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, QrCode, Zap } from 'lucide-react';

export type PaymentMethod = 'stripe' | 'kulipa' | 'qr';

interface PaymentMethodSelectorProps {
  onMethodSelected: (method: PaymentMethod) => void;
  selectedMethod?: PaymentMethod;
  disabled?: boolean;
}

const PAYMENT_METHODS = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Pay with credit/debit card',
    icon: CreditCard,
  },
  {
    id: 'kulipa',
    name: 'Kulipa',
    description: 'Mobile money & bank transfers',
    icon: Zap,
  },
  {
    id: 'qr',
    name: 'QR Code Payment',
    description: 'Scan to pay with crypto',
    icon: QrCode,
  },
];

export function PaymentMethodSelector({
  onMethodSelected,
  selectedMethod = 'stripe',
  disabled = false,
}: PaymentMethodSelectorProps) {
  const [selected, setSelected] = useState<PaymentMethod>(selectedMethod);

  const handleSelect = (method: PaymentMethod) => {
    setSelected(method);
    onMethodSelected(method);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Payment Method</CardTitle>
        <CardDescription>Choose how you want to pay</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selected} onValueChange={(val) => handleSelect(val as PaymentMethod)}>
          <div className="space-y-4">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <div key={method.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                  <RadioGroupItem value={method.id} id={method.id} disabled={disabled} />
                  <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-slate-600" />
                      <div>
                        <p className="font-semibold">{method.name}</p>
                        <p className="text-sm text-slate-500">{method.description}</p>
                      </div>
                    </div>
                  </Label>
                </div>
              );
            })}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
