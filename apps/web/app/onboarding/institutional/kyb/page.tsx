'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useOnboardingStore } from '@/lib/onboardingStore';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { AlertCircle, ChevronRight, Trash2 } from 'lucide-react';

interface BeneficiaryOwner {
  name: string;
  ownership: string;
}

interface KYBData {
  companyName: string;
  registrationNumber: string;
  country: string;
  beneficiaries: BeneficiaryOwner[];
  businessPurpose: string;
  transactionVolume: string;
}

interface FormErrors {
  [key: string]: string;
}

const countries = ['United States', 'United Kingdom', 'Canada', 'Singapore', 'Switzerland', 'Other'];
const transactionVolumes = ['< $1M', '$1M - $10M', '$10M - $100M', '> $100M'];
const businessPurposes = ['Treasury Management', 'Trading', 'Yield Farming', 'Multi-sig Vault', 'Other'];

export default function InstitutionalKYBPage() {
  const router = useRouter();
  const { setLoading, setError, error: storeError } = useOnboardingStore();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [kybData, setKybData] = useState<KYBData>({
    companyName: '',
    registrationNumber: '',
    country: '',
    beneficiaries: [{ name: '', ownership: '' }],
    businessPurpose: '',
    transactionVolume: '',
  });

  const validateStep = (step: number): boolean => {
    const errors: FormErrors = {};

    if (step === 1) {
      if (!kybData.companyName.trim()) errors.companyName = 'Company name is required';
      if (!kybData.registrationNumber.trim()) errors.registrationNumber = 'Registration number is required';
      if (!kybData.country) errors.country = 'Country is required';
    } else if (step === 2) {
      if (kybData.beneficiaries.length === 0) {
        errors.beneficiaries = 'At least one beneficial owner is required';
      } else {
        kybData.beneficiaries.forEach((beneficiary, idx) => {
          if (!beneficiary.name.trim()) errors[`beneficiary_name_${idx}`] = 'Name is required';
          if (!beneficiary.ownership.trim()) errors[`beneficiary_ownership_${idx}`] = 'Ownership % is required';
          else if (isNaN(Number(beneficiary.ownership))) errors[`beneficiary_ownership_${idx}`] = 'Must be a number';
        });
      }

      const totalOwnership = kybData.beneficiaries.reduce((sum, b) => sum + (parseFloat(b.ownership) || 0), 0);
      if (totalOwnership !== 100) {
        errors.totalOwnership = `Total ownership must equal 100% (currently ${totalOwnership}%)`;
      }
    } else if (step === 3) {
      if (!kybData.businessPurpose) errors.businessPurpose = 'Business purpose is required';
      if (!kybData.transactionVolume) errors.transactionVolume = 'Transaction volume is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) return;

    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as 1 | 2 | 3);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as 1 | 2 | 3);
    }
  };

  const handleAddBeneficiary = () => {
    setKybData({
      ...kybData,
      beneficiaries: [...kybData.beneficiaries, { name: '', ownership: '' }],
    });
  };

  const handleRemoveBeneficiary = (index: number) => {
    if (kybData.beneficiaries.length > 1) {
      setKybData({
        ...kybData,
        beneficiaries: kybData.beneficiaries.filter((_, i) => i !== index),
      });
    }
  };

  const handleBeneficiaryChange = (index: number, field: 'name' | 'ownership', value: string) => {
    const updated = [...kybData.beneficiaries];
    updated[index] = { ...updated[index], [field]: value };
    setKybData({ ...kybData, beneficiaries: updated });
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      setIsProcessing(true);
      setLoading(true);
      setError(null);

      console.log('[KYB] Submitting KYB data:', {
        companyName: kybData.companyName,
        registrationNumber: kybData.registrationNumber,
        country: kybData.country,
        beneficiaryCount: kybData.beneficiaries.length,
        businessPurpose: kybData.businessPurpose,
        transactionVolume: kybData.transactionVolume,
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const kybSuccess = Math.random() > 0.2;

      if (!kybSuccess) {
        throw new Error('KYB verification failed. Please review your company information.');
      }

      router.push('/onboarding/institutional/confirm');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'KYB verification failed';
      setError(errorMessage);
      console.error('[KYB] Error:', err);
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  const progressPercentage = (currentStep / 3) * 100;

  return (
    <OnboardingContainer showBackButton onBack={() => router.back()}>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-12">
            <ProgressBar currentStep={currentStep} totalSteps={3} style="linear" />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-deep-charcoal dark:text-bone-white mb-3">
              KYB Verification
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Step {currentStep} of 3 - Complete your Know Your Business verification
            </p>
          </div>

          {storeError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 dark:text-red-400 text-sm">{storeError}</p>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-semibold text-deep-charcoal dark:text-bone-white mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-950/50 text-deep-charcoal dark:text-bone-white focus:outline-none focus:border-pale-gold dark:focus:border-neon-gold transition"
                  placeholder="Enter legal company name"
                  value={kybData.companyName}
                  onChange={(e) => setKybData({ ...kybData, companyName: e.target.value })}
                />
                {formErrors.companyName && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{formErrors.companyName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-deep-charcoal dark:text-bone-white mb-2">
                  Registration Number
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-950/50 text-deep-charcoal dark:text-bone-white focus:outline-none focus:border-pale-gold dark:focus:border-neon-gold transition"
                  placeholder="e.g., 12345678"
                  value={kybData.registrationNumber}
                  onChange={(e) => setKybData({ ...kybData, registrationNumber: e.target.value })}
                />
                {formErrors.registrationNumber && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{formErrors.registrationNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-deep-charcoal dark:text-bone-white mb-2">
                  Country of Registration
                </label>
                <select
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-950/50 text-deep-charcoal dark:text-bone-white focus:outline-none focus:border-pale-gold dark:focus:border-neon-gold transition"
                  value={kybData.country}
                  onChange={(e) => setKybData({ ...kybData, country: e.target.value })}
                >
                  <option value="">Select a country...</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                {formErrors.country && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{formErrors.country}</p>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-deep-charcoal dark:text-bone-white">
                  Beneficial Owners
                </h3>
                <button
                  onClick={handleAddBeneficiary}
                  className="text-sm px-3 py-1 bg-pale-gold/10 dark:bg-neon-gold/10 text-pale-gold dark:text-neon-gold font-semibold rounded-lg hover:bg-pale-gold/20 dark:hover:bg-neon-gold/20 transition"
                >
                  + Add Owner
                </button>
              </div>

              <div className="space-y-4">
                {kybData.beneficiaries.map((beneficiary, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900/50 space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-semibold text-deep-charcoal dark:text-bone-white">
                        Owner {index + 1}
                      </h4>
                      {kybData.beneficiaries.length > 1 && (
                        <button
                          onClick={() => handleRemoveBeneficiary(index)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 rounded border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-950/50 text-deep-charcoal dark:text-bone-white text-sm focus:outline-none focus:border-pale-gold dark:focus:border-neon-gold transition"
                          placeholder="Full name"
                          value={beneficiary.name}
                          onChange={(e) => handleBeneficiaryChange(index, 'name', e.target.value)}
                        />
                        {formErrors[`beneficiary_name_${index}`] && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {formErrors[`beneficiary_name_${index}`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                          Ownership %
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 rounded border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-slate-950/50 text-deep-charcoal dark:text-bone-white text-sm focus:outline-none focus:border-pale-gold dark:focus:border-neon-gold transition"
                          placeholder="0-100"
                          min="0"
                          max="100"
                          step="0.01"
                          value={beneficiary.ownership}
                          onChange={(e) => handleBeneficiaryChange(index, 'ownership', e.target.value)}
                        />
                        {formErrors[`beneficiary_ownership_${index}`] && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {formErrors[`beneficiary_ownership_${index}`]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {formErrors.beneficiaries && (
                  <p className="text-xs text-red-600 dark:text-red-400">{formErrors.beneficiaries}</p>
                )}
                {formErrors.totalOwnership && (
                  <p className="text-xs text-red-600 dark:text-red-400">{formErrors.totalOwnership}</p>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-semibold text-deep-charcoal dark:text-bone-white mb-2">
                  Business Purpose
                </label>
                <select
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-950/50 text-deep-charcoal dark:text-bone-white focus:outline-none focus:border-pale-gold dark:focus:border-neon-gold transition"
                  value={kybData.businessPurpose}
                  onChange={(e) => setKybData({ ...kybData, businessPurpose: e.target.value })}
                >
                  <option value="">Select purpose...</option>
                  {businessPurposes.map((purpose) => (
                    <option key={purpose} value={purpose}>
                      {purpose}
                    </option>
                  ))}
                </select>
                {formErrors.businessPurpose && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{formErrors.businessPurpose}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-deep-charcoal dark:text-bone-white mb-2">
                  Annual Transaction Volume
                </label>
                <select
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-950/50 text-deep-charcoal dark:text-bone-white focus:outline-none focus:border-pale-gold dark:focus:border-neon-gold transition"
                  value={kybData.transactionVolume}
                  onChange={(e) => setKybData({ ...kybData, transactionVolume: e.target.value })}
                >
                  <option value="">Select volume...</option>
                  {transactionVolumes.map((volume) => (
                    <option key={volume} value={volume}>
                      {volume}
                    </option>
                  ))}
                </select>
                {formErrors.transactionVolume && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{formErrors.transactionVolume}</p>
                )}
              </div>

              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  ℹ️ KYB Verification
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Your information will be verified against regulatory databases. This process typically takes 2-3 business days.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3 flex flex-col">
            {currentStep > 1 && (
              <OnboardingButton
                label="Back"
                onClick={handlePreviousStep}
                variant="secondary"
                size="lg"
                disabled={isProcessing}
              />
            )}

            <OnboardingButton
              label={currentStep === 3 ? 'Submit KYB' : 'Next Step'}
              onClick={currentStep === 3 ? handleSubmit : handleNextStep}
              variant="primary"
              size="lg"
              disabled={isProcessing}
              loading={isProcessing}
              icon={currentStep < 3 ? ChevronRight : undefined}
            />
          </div>
        </div>
      </div>
    </OnboardingContainer>
  );
}
