'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionTypes } from '@walletconnect/types';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { ConnectExternalWallet } from '@/components/onboarding/ConnectExternalWallet';
import { useOnboardingStore } from '@/lib/onboardingStore';
import { Card } from '@/components/ui/card';
import { useWalletConnect } from '@orya/wallet-core/hooks';

export default function ConnectExternalWalletScreen() {
  const router = useRouter();
  const { setFlow, setAuthMethod, setWalletAddress, setStep } = useOnboardingStore();
  const { sessions } = useWalletConnect();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeSessions = useMemo(
    () => Object.values(sessions || {}) as SessionTypes.Struct[],
    [sessions],
  );

  const handleBack = () => {
    setStep(2);
    router.push('/onboarding/auth-method');
  };

  const handleConnectSuccess = (session: SessionTypes.Struct) => {
    const accounts = session?.namespaces?.eip155?.accounts ?? [];
    const firstAccount = accounts[0]?.split(':').pop();

    if (firstAccount) {
      setWalletAddress(firstAccount);
    }

    setAuthMethod('connect');
    setFlow('connect-external');
    setStep(3);
    router.push('/onboarding/connect-external/confirm');
  };

  return (
    <OnboardingContainer showBackButton onBack={handleBack}>
      <div className="min-h-screen py-8 px-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          <ProgressBar currentStep={3} totalSteps={9} style="linear" />

          <div className="space-y-3 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-deep-charcoal dark:text-bone-white">
              Connect External Wallet
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Pair your existing wallet with ORŸA using WalletConnect.
            </p>
          </div>

          {errorMessage && (
            <div className="rounded border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          <ConnectExternalWallet onConnect={handleConnectSuccess} onError={setErrorMessage} />

          <Card className="p-4">
            <h2 className="text-sm font-semibold text-muted-foreground">
              How WalletConnect works
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <li>1. Generate a pairing QR code or paste an existing WalletConnect URI.</li>
              <li>2. Approve the connection inside your wallet application.</li>
              <li>3. Return here to continue onboarding once the pairing succeeds.</li>
            </ul>
          </Card>

          {activeSessions.length > 0 && (
            <Card className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground">
                  Active WalletConnect Sessions
                </h2>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {activeSessions.length} connected wallet{activeSessions.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-2">
                {activeSessions.map((session) => (
                  <div key={session.topic} className="rounded border border-muted px-3 py-2 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        {session.peer?.metadata?.name || 'Wallet'}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground break-all">
                        {session.topic}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </OnboardingContainer>
  );
}
