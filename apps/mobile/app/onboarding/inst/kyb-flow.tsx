import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ActivityIndicator,
  Picker,
} from 'react-native';
import { useColorScheme } from 'nativewind';
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { useOnboardingStore } from '../../../lib/onboardingStore';

interface KYBData {
  companyName: string;
  registrationNumber: string;
  country: string;
  beneficiaries: Array<{
    name: string;
    ownership: string;
  }>;
  businessPurpose: string;
  transactionVolume: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function KYBFlowScreen() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
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

  const countries = ['United States', 'United Kingdom', 'Canada', 'Singapore', 'Switzerland', 'Other'];
  const transactionVolumes = ['< $1M', '$1M - $10M', '$10M - $100M', '> $100M'];
  const businessPurposes = ['Treasury Management', 'Trading', 'Yield Farming', 'Multi-sig Vault', 'Other'];

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

      router.push('/onboarding/inst/suite-confirm');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'KYB verification failed';
      setError(errorMessage);
      console.error('[KYB] Error:', err);
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  const bgColor = isDark ? 'bg-orya-ocean' : 'bg-orya-cream';
  const textColor = isDark ? 'text-white' : 'text-orya-charcoal';
  const inputBg = isDark ? 'bg-gray-800' : 'bg-white';
  const inputBorder = isDark ? 'border-gray-700' : 'border-gray-200';
  const errorColor = isDark ? 'text-red-400' : 'text-red-600';

  const progressPercentage = (currentStep / 3) * 100;

  return (
    <SafeAreaView className={`flex-1 ${bgColor}`}>
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="px-6 py-8">
          <View className="mb-8">
            <Text className={`text-3xl font-bold ${textColor} mb-2`}>
              KYB Verification
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Step {currentStep} of 3
            </Text>
            <View className="mt-3 h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
              <View
                className="h-full bg-gradient-to-r from-orya-sea-blue to-orya-neon-gold"
                style={{ width: `${progressPercentage}%` }}
              />
            </View>
          </View>

          {storeError && (
            <View className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex-row gap-3">
              <AlertCircle size={20} color={isDark ? '#fca5a5' : '#dc2626'} />
              <Text className={`flex-1 ${errorColor} text-sm`}>{storeError}</Text>
            </View>
          )}

          {currentStep === 1 && (
            <View>
              <View className="mb-6">
                <Text className={`font-semibold ${textColor} mb-2`}>Company Name</Text>
                <TextInput
                  className={`border rounded-lg px-4 py-3 ${inputBg} ${inputBorder} border ${textColor}`}
                  placeholder="Enter legal company name"
                  placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                  value={kybData.companyName}
                  onChangeText={(text) => setKybData({ ...kybData, companyName: text })}
                />
                {formErrors.companyName && (
                  <Text className={`text-xs mt-1 ${errorColor}`}>{formErrors.companyName}</Text>
                )}
              </View>

              <View className="mb-6">
                <Text className={`font-semibold ${textColor} mb-2`}>Registration Number</Text>
                <TextInput
                  className={`border rounded-lg px-4 py-3 ${inputBg} ${inputBorder} border ${textColor}`}
                  placeholder="e.g., 12345678"
                  placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                  value={kybData.registrationNumber}
                  onChangeText={(text) => setKybData({ ...kybData, registrationNumber: text })}
                />
                {formErrors.registrationNumber && (
                  <Text className={`text-xs mt-1 ${errorColor}`}>{formErrors.registrationNumber}</Text>
                )}
              </View>

              <View className="mb-6">
                <Text className={`font-semibold ${textColor} mb-2`}>Country of Registration</Text>
                <View className={`border rounded-lg ${inputBg} ${inputBorder} border`}>
                  <Picker
                    selectedValue={kybData.country}
                    onValueChange={(value) => setKybData({ ...kybData, country: value })}
                    style={{
                      color: isDark ? 'white' : '#000',
                    }}
                  >
                    <Picker.Item label="Select a country..." value="" />
                    {countries.map((country) => (
                      <Picker.Item key={country} label={country} value={country} />
                    ))}
                  </Picker>
                </View>
                {formErrors.country && (
                  <Text className={`text-xs mt-1 ${errorColor}`}>{formErrors.country}</Text>
                )}
              </View>
            </View>
          )}

          {currentStep === 2 && (
            <View>
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className={`font-semibold ${textColor}`}>Beneficial Owners</Text>
                  <TouchableOpacity
                    onPress={handleAddBeneficiary}
                    className="px-3 py-1 bg-orya-sea-blue/20 rounded-lg"
                  >
                    <Text className="text-orya-sea-blue text-xs font-semibold">+ Add</Text>
                  </TouchableOpacity>
                </View>

                {kybData.beneficiaries.map((beneficiary, index) => (
                  <View key={index} className="mb-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className={`text-sm font-semibold ${textColor}`}>Owner {index + 1}</Text>
                      {kybData.beneficiaries.length > 1 && (
                        <TouchableOpacity onPress={() => handleRemoveBeneficiary(index)}>
                          <Text className="text-red-600 text-xs font-semibold">Remove</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View className="mb-3">
                      <Text className={`text-xs ${textColor} mb-1`}>Name</Text>
                      <TextInput
                        className={`border rounded px-3 py-2 ${inputBg} ${inputBorder} border ${textColor}`}
                        placeholder="Full name"
                        placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                        value={beneficiary.name}
                        onChangeText={(text) => handleBeneficiaryChange(index, 'name', text)}
                      />
                      {formErrors[`beneficiary_name_${index}`] && (
                        <Text className={`text-xs mt-1 ${errorColor}`}>
                          {formErrors[`beneficiary_name_${index}`]}
                        </Text>
                      )}
                    </View>

                    <View>
                      <Text className={`text-xs ${textColor} mb-1`}>Ownership %</Text>
                      <TextInput
                        className={`border rounded px-3 py-2 ${inputBg} ${inputBorder} border ${textColor}`}
                        placeholder="0-100"
                        placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
                        keyboardType="decimal-pad"
                        value={beneficiary.ownership}
                        onChangeText={(text) => handleBeneficiaryChange(index, 'ownership', text)}
                      />
                      {formErrors[`beneficiary_ownership_${index}`] && (
                        <Text className={`text-xs mt-1 ${errorColor}`}>
                          {formErrors[`beneficiary_ownership_${index}`]}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}

                {formErrors.beneficiaries && (
                  <Text className={`text-xs ${errorColor} mb-3`}>{formErrors.beneficiaries}</Text>
                )}
                {formErrors.totalOwnership && (
                  <Text className={`text-xs ${errorColor} mb-3`}>{formErrors.totalOwnership}</Text>
                )}
              </View>
            </View>
          )}

          {currentStep === 3 && (
            <View>
              <View className="mb-6">
                <Text className={`font-semibold ${textColor} mb-2`}>Business Purpose</Text>
                <View className={`border rounded-lg ${inputBg} ${inputBorder} border`}>
                  <Picker
                    selectedValue={kybData.businessPurpose}
                    onValueChange={(value) => setKybData({ ...kybData, businessPurpose: value })}
                    style={{
                      color: isDark ? 'white' : '#000',
                    }}
                  >
                    <Picker.Item label="Select purpose..." value="" />
                    {businessPurposes.map((purpose) => (
                      <Picker.Item key={purpose} label={purpose} value={purpose} />
                    ))}
                  </Picker>
                </View>
                {formErrors.businessPurpose && (
                  <Text className={`text-xs mt-1 ${errorColor}`}>{formErrors.businessPurpose}</Text>
                )}
              </View>

              <View className="mb-6">
                <Text className={`font-semibold ${textColor} mb-2`}>Annual Transaction Volume</Text>
                <View className={`border rounded-lg ${inputBg} ${inputBorder} border`}>
                  <Picker
                    selectedValue={kybData.transactionVolume}
                    onValueChange={(value) => setKybData({ ...kybData, transactionVolume: value })}
                    style={{
                      color: isDark ? 'white' : '#000',
                    }}
                  >
                    <Picker.Item label="Select volume..." value="" />
                    {transactionVolumes.map((volume) => (
                      <Picker.Item key={volume} label={volume} value={volume} />
                    ))}
                  </Picker>
                </View>
                {formErrors.transactionVolume && (
                  <Text className={`text-xs mt-1 ${errorColor}`}>{formErrors.transactionVolume}</Text>
                )}
              </View>

              <View className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Text className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-900'} font-semibold`}>
                  ℹ️ KYB Verification
                </Text>
                <Text className={`text-xs mt-2 ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                  Your information will be verified against regulatory databases. This process typically takes 2-3 business days.
                </Text>
              </View>
            </View>
          )}

          <View className="mt-8 gap-3">
            {currentStep > 1 && (
              <TouchableOpacity
                onPress={handlePreviousStep}
                disabled={isProcessing}
                className="py-3 rounded-2xl border-2 border-orya-sea-blue/30"
              >
                <Text className="text-orya-sea-blue font-semibold text-center">Back</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={currentStep === 3 ? handleSubmit : handleNextStep}
              disabled={isProcessing}
              className={`py-4 rounded-2xl ${
                isProcessing
                  ? 'bg-gray-400'
                  : 'bg-gradient-to-r from-orya-sea-blue to-orya-sea-blue/80'
              }`}
            >
              {isProcessing ? (
                <ActivityIndicator color="white" />
              ) : (
                <View className="flex-row items-center justify-center gap-2">
                  <Text className="text-white font-bold">
                    {currentStep === 3 ? 'Submit KYB' : 'Next Step'}
                  </Text>
                  {currentStep < 3 && <ArrowRight size={18} color="white" />}
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
