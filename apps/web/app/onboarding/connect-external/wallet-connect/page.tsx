'use client';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { useOnboardingStore } from '@/lib/onboardingStore';
import { AlertCircle, Check, Copy, QrCode } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import QRCode from 'qrcode.react';

type Step = 'bridge-select' | 'qr-display' | 'connecting' | 'approval';

const POPULAR_WALLETS = [
  { name: 'Phantom', icon: '👻', description: 'Solana & Ethereum' },
  { name: 'MetaMask', icon: '🦊', description: 'Ethereum & EVM chains' },
  { name: 'OKX Wallet', icon: '🐂', description: 'Multi-chain support' },
  { name: 'Ledger Live', icon: '💾', description: 'Hardware wallet' },
  { name: 'WalletConnect', icon: '🔗', description: 'Any WalletConnect wallet' },
  { name: 'Privy', icon: '🔐', description: 'Social recovery' },
];

export default function WalletConnectBridgeScreen() {
  const router = useRouter();
  const { setFlow, setAuthMethod, setWalletAddress, setStep } = useOnboardingStore();

  const [currentStep, setCurrentStep] = useState<Step>('bridge-select');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<{
    name: string;
    address: string;
  } | null>(null);

  // Mock WalletConnect URI for QR display
  const mockURI = 'wc:a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6@2?relay-protocol=irn&symKey=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

  const simulateWalletConnection = async () => {
    return new Promise((resolve) => setTimeout(resolve, 3000));
  };

  const handleWalletSelection = async (walletName: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      setCurrentStep('connecting');

      try {
        const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
        if (!projectId) {
          throw new Error('WalletConnect project ID not configured');
        }

        await simulateWalletConnection();
      } catch (error) {
        console.error('[WalletConnect] Connection error:', error);
        throw error;
      }

      // Mock wallet connection
      setConnectedWallet({
        name: walletName,
        address: '0x' + Math.random().toString(16).substr(2, 40),
      });

      setCurrentStep('approval');
    } catch (err) {
      console.error('[WalletConnectBridge] Error:', err);
      setError('Failed to connect to wallet. Please try again.');
      setCurrentStep('bridge-select');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveConnection = async () => {
    if (!connectedWallet) return;

    try {
      setIsProcessing(true);

      setWalletAddress(connectedWallet.address);
      setAuthMethod('connect');
      setFlow('connect-external');
      setStep(3);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      router.push('/onboarding/connect-external/confirm');
    } catch (err) {
      console.error('[WalletConnectBridge] Approval error:', err);
      setError('Failed to approve connection. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectConnection = () => {
    setConnectedWallet(null);
    setCurrentStep('bridge-select');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleBack = () => {
    if (currentStep === 'bridge-select') {
      setStep(2);
      router.push('/onboarding/auth-method');
    } else if (currentStep === 'qr-display') {
      setCurrentStep('bridge-select');
    } else if (currentStep === 'connecting') {
      return;
    } else if (currentStep === 'approval') {
      handleRejectConnection();
    }
  };

  return (
    <OnboardingContainer
      showBackButton={currentStep !== 'connecting'}
      onBack={handleBack}
    >
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12">
            <ProgressBar currentStep={3} totalSteps={9} style="linear" />
          </div>

          {currentStep === 'bridge-select' && (
            <>
              <div className="mb-12 text-center">
                <h1 className="text-3xl md:text-4xl font-bold text-deep-charcoal dark:text-bone-white mb-3">
                  Connect via WalletConnect
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Select your wallet to connect securely
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {POPULAR_WALLETS.map((wallet) => (
                  <button
                    key={wallet.name}
                    onClick={() => handleWalletSelection(wallet.name)}
                    disabled={isProcessing}
                    className="w-full p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-pale-gold dark:hover:border-neon-gold transition-all duration-200 hover:shadow-lg text-left group disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-4"
                  >
                    <span className="text-4xl flex-shrink-0">{wallet.icon}</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-deep-charcoal dark:text-bone-white mb-1 group-hover:text-pale-gold dark:group-hover:text-neon-gold transition-colors">
                        {wallet.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {wallet.description}
                      </p>
                    </div>
                    <div className="text-pale-gold dark:text-neon-gold opacity-0 group-hover:opacity-100 transition-opacity">
                      →
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentStep('qr-display')}
                className="w-full p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-pale-gold dark:hover:border-neon-gold transition-all duration-200 hover:shadow-lg text-left group"
              >
                <div className="flex items-center gap-4">
                  <QrCode className="w-8 h-8 text-pale-gold dark:text-neon-gold flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-deep-charcoal dark:text-bone-white mb-1 group-hover:text-pale-gold dark:group-hover:text-neon-gold transition-colors">
                      Scan QR Code
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Use your mobile wallet to scan the QR code
                    </p>
                  </div>
                  <div className="text-pale-gold dark:text-neon-gold opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </div>
                </div>
              </button>

              <div className="mt-8 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <span className="font-semibold">🔒 Secure Connection:</span> All connections are encrypted and verified by WalletConnect.
                </p>
              </div>
            </>
          )}

          {currentStep === 'qr-display' && (
            <>
              <div className="mb-8 text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-deep-charcoal dark:text-bone-white mb-2">
                  Scan QR Code
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Use your mobile wallet to scan this QR code
                </p>
              </div>

              <div className="mb-8 p-8 rounded-2xl bg-white dark:bg-gray-800 border-2 border-pale-gold dark:border-neon-gold flex justify-center">
                <QRCode
                  value={mockURI}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="mb-8 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-200 mb-3">
                  <span className="font-semibold">📱 Instructions:</span>
                </p>
                <ol className="text-sm text-blue-900 dark:text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Open your wallet app on mobile</li>
                  <li>Tap the WalletConnect button</li>
                  <li>Scan this QR code</li>
                  <li>Approve the connection</li>
                </ol>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => setCurrentStep('bridge-select')}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-deep-charcoal dark:text-bone-white hover:border-pale-gold dark:hover:border-neon-gold transition-colors"
                >
                  Back
                </button>
              </div>
            </>
          )}

          {currentStep === 'connecting' && (
            <>
              <div className="flex flex-col items-center justify-center py-20">
                <div className="mb-8">
                  <div className="w-16 h-16 rounded-full border-4 border-pale-gold dark:border-neon-gold border-t-transparent dark:border-t-transparent animate-spin mx-auto"></div>
                </div>
                <h2 className="text-2xl font-bold text-deep-charcoal dark:text-bone-white mb-2 text-center">
                  Connecting to Wallet...
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  Please approve the connection in your wallet application
                </p>
              </div>
            </>
          )}

          {currentStep === 'approval' && connectedWallet && (
            <>
              <div className="mb-12 text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-deep-charcoal dark:text-bone-white mb-4">
                  Approve Connection
                </h2>
              </div>

              <div className="mb-8 p-6 rounded-2xl border-2 border-pale-gold dark:border-neon-gold bg-gradient-to-r from-pale-gold/10 to-pale-gold/5 dark:from-neon-gold/10 dark:to-neon-gold/5">
                <div className="text-center">
                  <div className="mb-4 text-5xl">{connectedWallet.name === 'Phantom' ? '👻' : '🔐'}</div>
                  <h3 className="text-lg font-bold text-deep-charcoal dark:text-bone-white mb-2">
                    {connectedWallet.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-mono break-all">
                    {connectedWallet.address}
                  </p>
                  <button
                    onClick={() => copyToClipboard(connectedWallet.address)}
                    className="inline-flex items-center gap-2 text-sm text-pale-gold dark:text-neon-gold hover:underline"
                  >
                    {copiedToClipboard ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Address
                      </>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-8 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              )}

              <div className="mb-8 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <span className="font-semibold">✓ Connected:</span> Your wallet has been successfully connected to ORŸA.
                </p>
              </div>

              <div className="space-y-4">
                <OnboardingButton
                  label={isProcessing ? 'Continuing...' : 'Continue'}
                  onClick={handleApproveConnection}
                  variant="primary"
                  size="lg"
                  disabled={isProcessing}
                />
                <button
                  onClick={handleRejectConnection}
                  disabled={isProcessing}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-deep-charcoal dark:text-bone-white hover:border-pale-gold dark:hover:border-neon-gold transition-colors disabled:opacity-50"
                >
                  Use Different Wallet
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </OnboardingContainer>
  );
}
