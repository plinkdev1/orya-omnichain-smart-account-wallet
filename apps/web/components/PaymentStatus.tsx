'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type TransactionStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

interface PaymentStatusProps {
  status: TransactionStatus;
  transactionId: string;
  amount: string;
  currency: string;
  from?: string;
  to: string;
  timestamp?: Date;
  fee?: string;
  exchangeRate?: string;
  errorMessage?: string;
  walletAddress?: string;
  chain?: string;
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    badgeVariant: 'outline' as const,
  },
  processing: {
    icon: TrendingUp,
    label: 'Processing',
    color: 'bg-blue-100 text-blue-800',
    badgeVariant: 'outline' as const,
  },
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
    badgeVariant: 'default' as const,
  },
  failed: {
    icon: XCircle,
    label: 'Failed',
    color: 'bg-red-100 text-red-800',
    badgeVariant: 'destructive' as const,
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-800',
    badgeVariant: 'secondary' as const,
  },
  refunded: {
    icon: ArrowRight,
    label: 'Refunded',
    color: 'bg-purple-100 text-purple-800',
    badgeVariant: 'secondary' as const,
  },
};

export function PaymentStatus({
  status,
  transactionId,
  amount,
  currency,
  from,
  to,
  timestamp,
  fee,
  exchangeRate,
  errorMessage,
  walletAddress,
  chain,
}: PaymentStatusProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Transaction Status</CardTitle>
          <Badge variant={config.badgeVariant}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
        <CardDescription>
          {timestamp && new Date(timestamp).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {errorMessage && status === 'failed' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-start py-3 border-b">
            <span className="text-sm text-slate-600">Transaction ID</span>
            <span className="font-mono text-sm">{transactionId}</span>
          </div>

          <div className="flex justify-between items-start py-3 border-b">
            <span className="text-sm text-slate-600">Amount</span>
            <div className="text-right">
              <span className="font-semibold text-lg">
                {amount} {currency}
              </span>
            </div>
          </div>

          {from && (
            <div className="flex justify-between items-start py-3 border-b">
              <span className="text-sm text-slate-600">From</span>
              <span className="font-mono text-xs text-right">{from}</span>
            </div>
          )}

          <div className="flex justify-between items-start py-3 border-b">
            <span className="text-sm text-slate-600">To</span>
            <span className="font-mono text-xs text-right">{to}</span>
          </div>

          {walletAddress && (
            <div className="flex justify-between items-start py-3 border-b">
              <span className="text-sm text-slate-600">Wallet Address</span>
              <span className="font-mono text-xs text-right">{walletAddress}</span>
            </div>
          )}

          {chain && (
            <div className="flex justify-between items-start py-3 border-b">
              <span className="text-sm text-slate-600">Blockchain</span>
              <span className="font-semibold text-sm">{chain}</span>
            </div>
          )}

          {fee && (
            <div className="flex justify-between items-start py-3 border-b">
              <span className="text-sm text-slate-600">Fee</span>
              <span className="text-sm">{fee}</span>
            </div>
          )}

          {exchangeRate && (
            <div className="flex justify-between items-start py-3">
              <span className="text-sm text-slate-600">Exchange Rate</span>
              <span className="text-sm">{exchangeRate}</span>
            </div>
          )}
        </div>

        {status === 'pending' && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Your transaction is being processed. This may take a few minutes.
            </AlertDescription>
          </Alert>
        )}

        {status === 'processing' && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              Your transaction is being confirmed on the blockchain.
            </AlertDescription>
          </Alert>
        )}

        {status === 'completed' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your transaction has been completed successfully.
            </AlertDescription>
          </Alert>
        )}

        {status === 'failed' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Your transaction failed. Please try again or contact support.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
