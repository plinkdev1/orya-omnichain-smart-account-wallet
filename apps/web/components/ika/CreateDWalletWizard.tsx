'use client';

import { useState } from 'react';
import { useCreateDWallet } from '@orya/wallet-core/hooks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface CreateDWalletWizardProps {
  userKeys: any;
  ikaCoinId: string;
  onComplete: (result: any) => void;
}

const STEP_DESCRIPTIONS = [
  { num: 1, title: 'Register Encryption Key', desc: 'One-time setup for your account' },
  { num: 2, title: 'DKG First Round', desc: 'Initialize distributed key generation' },
  { num: 3, title: 'DKG Second Round', desc: 'Complete key generation process' },
  { num: 4, title: 'Accept User Share', desc: 'Finalize your encrypted key share' },
];

export function CreateDWalletWizard({
  userKeys,
  ikaCoinId,
  onComplete,
}: CreateDWalletWizardProps) {
  const { createDWallet, progress, isCreating, error, result } = useCreateDWallet();

  const handleCreate = async () => {
    await createDWallet({
      userId: userKeys.getSuiAddress(),
      userKeys,
      ikaCoinId,
    });

    if (result) {
      onComplete(result);
    }
  };

  const getProgressPercentage = () => {
    if (!progress) return 0;
    return (progress.step / 4) * 100;
  };

  const getStepStatus = (step: number) => {
    if (!progress) return 'pending';
    if (progress.step > step) return 'completed';
    if (progress.step === step) return progress.status;
    return 'pending';
  };

  const getStepIcon = (status: string) => {
    if (status === 'completed') return '✓';
    if (status === 'failed') return '✕';
    return null;
  };

  const getStepBgColor = (status: string) => {
    if (status === 'completed') return 'bg-green-500 text-white';
    if (status === 'in_progress') return 'bg-sui-blue text-white';
    if (status === 'failed') return 'bg-red-500 text-white';
    return 'bg-gray-300 text-gray-600';
  };

  const getStepContainerBgColor = (status: string) => {
    if (status === 'completed') return 'bg-green-50 border-green-200';
    if (status === 'in_progress') return 'bg-blue-50 border-blue-200';
    if (status === 'failed') return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-deep-charcoal dark:text-bone-white">
        Create Zero-Trust dWallet
      </h2>

      <div className="space-y-4 mb-6">
        {STEP_DESCRIPTIONS.map((step) => {
          const status = getStepStatus(step.num);
          return (
            <div
              key={step.num}
              className={`flex items-start gap-4 p-4 rounded-lg border ${getStepContainerBgColor(status)}`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${getStepBgColor(status)}`}
              >
                {getStepIcon(status) || step.num}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-deep-charcoal dark:text-bone-white">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{step.desc}</p>
                {progress?.step === step.num && progress?.status === 'in_progress' && (
                  <p className="text-sm text-sui-blue mt-1">{progress.message}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isCreating && (
        <div className="mb-6">
          <Progress value={getProgressPercentage()} className="h-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
            {progress?.message || 'Initializing...'}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">
            Creation Failed
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <Button
        onClick={handleCreate}
        disabled={isCreating}
        className="w-full bg-sui-blue hover:bg-sui-blue/90"
        size="lg"
      >
        {isCreating ? 'Creating dWallet...' : 'Create Zero-Trust dWallet'}
      </Button>

      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
          🛡️ Zero-Trust Security
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li>✓ Your private key never exists in full</li>
          <li>✓ Distributed across multiple parties</li>
          <li>✓ Encrypted with your personal encryption key</li>
          <li>✓ Maximum security for high-value assets</li>
        </ul>
      </div>
    </Card>
  );
}
