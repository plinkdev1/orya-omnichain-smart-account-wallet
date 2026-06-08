'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Copy, RotateCcw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeReceiveProps {
  walletAddress: string;
  chainName: string;
  amount?: string;
  label?: string;
  expiresAt?: Date;
}

export function QRCodeReceive({
  walletAddress,
  chainName,
  amount,
  label,
  expiresAt,
}: QRCodeReceiveProps) {
  const [paymentUri, setPaymentUri] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const qrRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    let uri = `${chainName}:${walletAddress}`;

    const params = new URLSearchParams();
    if (amount) params.append('amount', amount);
    if (label) params.append('label', label);

    const queryString = params.toString();
    if (queryString) {
      uri += `?${queryString}`;
    }

    setPaymentUri(uri);
  }, [walletAddress, chainName, amount, label]);

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining('Expired');
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${minutes}m ${seconds}s`);
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    toast.success('Address copied to clipboard');
  };

  const handleCopyURI = () => {
    navigator.clipboard.writeText(paymentUri);
    toast.success('Payment URI copied to clipboard');
  };

  const handleDownloadQR = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `qr-payment-${Date.now()}.png`;
        link.click();
        toast.success('QR code downloaded');
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Receive Payment</CardTitle>
        <CardDescription>Share this QR code or address to receive payment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isExpired && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>This QR code has expired. Please generate a new one.</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center justify-center gap-4">
          <div
            ref={qrRef}
            className={`p-4 bg-white border rounded-lg ${isExpired ? 'opacity-50' : ''}`}
          >
            <QRCode
              value={paymentUri}
              size={256}
              level="H"
              includeMargin={true}
              disabled={isExpired}
            />
          </div>

          {expiresAt && (
            <div className="text-sm text-slate-600">
              {isExpired ? (
                <span className="text-red-600 font-semibold">Expired</span>
              ) : (
                <span>Expires in: <span className="font-semibold">{timeRemaining}</span></span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="wallet-address" className="text-sm">
              Wallet Address
            </Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="wallet-address"
                value={walletAddress}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAddress}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {amount && (
            <div>
              <Label className="text-sm">
                Amount: {amount}
              </Label>
            </div>
          )}

          {label && (
            <div>
              <Label className="text-sm">
                Label: {label}
              </Label>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCopyURI}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy URI
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDownloadQR}
          >
            <Download className="h-4 w-4 mr-2" />
            Download QR
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
