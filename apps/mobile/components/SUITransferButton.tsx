import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { useSUITransaction } from '../hooks/useSUITransaction';
import { useSUIWallet } from '../providers/SUIWalletProvider';

interface SUITransferButtonProps {
  recipientAddress: string;
  objectId: string;
  onSuccess?: (digest: string) => void;
  disabled?: boolean;
}

export function SUITransferButton({
  recipientAddress,
  objectId,
  onSuccess,
  disabled = false,
}: SUITransferButtonProps) {
  const { selectedAccount } = useSUIWallet();
  const { mutateAsync, isLoading } = useSUITransaction();

  const handleTransfer = async () => {
    if (!selectedAccount) {
      alert('No account selected');
      return;
    }

    try {
      const tx = new Uint8Array([
        0x00,
      ]);

      const digest = await mutateAsync(tx);
      onSuccess?.(digest);
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  };

  return (
    <View className="gap-2">
      <TouchableOpacity
        onPress={handleTransfer}
        disabled={isLoading || disabled || !selectedAccount}
        className={`p-4 rounded-lg items-center justify-center ${
          isLoading || disabled || !selectedAccount
            ? 'bg-gray-300'
            : 'bg-sui-blue'
        }`}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Transfer</Text>
        )}
      </TouchableOpacity>
      {!selectedAccount && (
        <Text className="text-red-500 text-xs text-center">
          Please connect a wallet first
        </Text>
      )}
    </View>
  );
}
