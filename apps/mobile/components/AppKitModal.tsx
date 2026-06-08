import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import { useReOwnApprovals } from '@orya/wallet-core/connectivity';
import { AlertCircle, Check, X, Clock } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

interface AppKitModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AppKitModal: React.FC<AppKitModalProps> = ({
  isOpen: controlledOpen,
  onOpenChange,
}) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const {
    pendingSessions,
    pendingRequests,
    isLoading,
    approveSession,
    rejectSession,
    approveRequest,
    rejectRequest,
  } = useReOwnApprovals();

  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sessions' | 'requests'>('sessions');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    if (pendingSessions.length > 0 || pendingRequests.length > 0) {
      setOpen(true);
    }
  }, [pendingSessions.length, pendingRequests.length, setOpen]);

  const currentItem = activeTab === 'sessions'
    ? pendingSessions[selectedIndex]
    : pendingRequests[selectedIndex];

  const totalItems = activeTab === 'sessions' ? pendingSessions.length : pendingRequests.length;

  const handleApprove = () => {
    if (!currentItem) return;

    if (activeTab === 'sessions' && 'topic' in currentItem) {
      approveSession(currentItem.id);
    } else if (activeTab === 'requests' && 'method' in currentItem) {
      approveRequest(currentItem.id, 'approved');
    }

    if (selectedIndex < totalItems - 1) {
      setSelectedIndex(selectedIndex + 1);
    } else {
      setOpen(false);
      setSelectedIndex(0);
    }
  };

  const handleReject = () => {
    if (!currentItem) return;

    if (activeTab === 'sessions' && 'topic' in currentItem) {
      rejectSession(currentItem.id);
    } else if (activeTab === 'requests' && 'method' in currentItem) {
      rejectRequest(currentItem.id, 'User rejected');
    }

    if (selectedIndex < totalItems - 1) {
      setSelectedIndex(selectedIndex + 1);
    } else {
      setOpen(false);
      setSelectedIndex(0);
    }
  };

  const getSessionDisplay = () => {
    if (!currentItem || !('topic' in currentItem)) return null;
    const session = currentItem;
    return (
      <View className="space-y-4">
        <View className={`rounded-2xl p-4 ${isDark ? 'bg-orya-ocean/50' : 'bg-orya-aqua/10'}`}>
          <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-orya-charcoal'}`}>
            Connection Request
          </Text>
          <Text className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {session.peerName || 'Unknown'} wants to connect to your wallet
          </Text>
        </View>

        <View className="space-y-3">
          <View className="flex-row justify-between items-center">
            <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Chain:
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {session.chainId}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Accounts:
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {session.accounts.length} account(s)
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const getRequestDisplay = () => {
    if (!currentItem || !('method' in currentItem)) return null;
    const request = currentItem;
    return (
      <View className="space-y-4">
        <View className={`rounded-2xl p-4 ${isDark ? 'bg-orya-ocean/50' : 'bg-orya-aqua/10'}`}>
          <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-orya-charcoal'}`}>
            Signing Request
          </Text>
          <Text className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {request.peerName || 'Unknown'} is requesting a signature
          </Text>
        </View>

        <View className="space-y-3">
          <View className="flex-row justify-between items-center">
            <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Method:
            </Text>
            <Text className={`text-sm font-mono ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {request.method}
            </Text>
          </View>
          <View className="flex-row justify-between items-center">
            <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Chain:
            </Text>
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {request.chainId}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setOpen(false)}
    >
      <View className={`flex-1 justify-center items-center ${isDark ? 'bg-black/50' : 'bg-black/40'}`}>
        <View
          className={`w-11/12 rounded-3xl p-6 max-h-3/4 ${isDark ? 'bg-orya-ocean' : 'bg-white'}`}
          style={{ maxWidth: 500 }}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row items-center gap-2 mb-4">
              <Clock size={20} color={isDark ? '#FFD700' : '#4DA2FF'} />
              <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-orya-charcoal'}`}>
                Wallet Action Required
              </Text>
            </View>

            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              You have {totalItems} pending {activeTab === 'sessions' ? 'session' : 'signing'} request(s)
            </Text>

            {totalItems > 1 && (
              <View className={`flex-row gap-2 mb-6 pb-4 border-b ${isDark ? 'border-orya-sea-blue/30' : 'border-gray-200'}`}>
                <TouchableOpacity
                  onPress={() => {
                    setActiveTab('sessions');
                    setSelectedIndex(0);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg ${
                    activeTab === 'sessions'
                      ? isDark ? 'bg-orya-sea-blue/30' : 'bg-orya-aqua/20'
                      : isDark ? 'bg-orya-ocean/30' : 'bg-gray-100'
                  }`}
                >
                  <Text className={`text-sm font-semibold text-center ${
                    activeTab === 'sessions'
                      ? isDark ? 'text-yellow-400' : 'text-blue-600'
                      : isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Sessions ({pendingSessions.length})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setActiveTab('requests');
                    setSelectedIndex(0);
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg ${
                    activeTab === 'requests'
                      ? isDark ? 'bg-orya-sea-blue/30' : 'bg-orya-aqua/20'
                      : isDark ? 'bg-orya-ocean/30' : 'bg-gray-100'
                  }`}
                >
                  <Text className={`text-sm font-semibold text-center ${
                    activeTab === 'requests'
                      ? isDark ? 'text-yellow-400' : 'text-blue-600'
                      : isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Requests ({pendingRequests.length})
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View className="min-h-48 mb-6">
              {currentItem && (
                <>
                  {activeTab === 'sessions' ? getSessionDisplay() : getRequestDisplay()}
                </>
              )}
            </View>

            {totalItems > 1 && (
              <View className={`flex-row items-center justify-between mb-6 pb-4 ${isDark ? 'border-orya-sea-blue/30' : 'border-gray-200'} border-b`}>
                <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedIndex + 1} of {totalItems}
                </Text>
                <View className={`flex-1 h-1.5 rounded-full mx-3 ${isDark ? 'bg-orya-sea-blue/30' : 'bg-gray-200'}`}>
                  <View
                    className="h-full rounded-full bg-blue-500"
                    style={{
                      width: `${((selectedIndex + 1) / totalItems) * 100}%`,
                    }}
                  />
                </View>
              </View>
            )}

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleReject}
                disabled={isLoading}
                className={`flex-1 py-3 rounded-xl border ${
                  isLoading
                    ? isDark ? 'opacity-50 border-orya-sea-blue/30' : 'opacity-50 border-gray-300'
                    : isDark ? 'border-orya-sea-blue/50' : 'border-gray-300'
                }`}
              >
                <Text className={`text-center font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Reject
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleApprove}
                disabled={isLoading}
                className={`flex-1 py-3 rounded-xl ${isLoading ? 'opacity-50' : ''} bg-blue-600`}
              >
                <Text className="text-center font-semibold text-white">
                  {isLoading ? 'Processing...' : 'Approve'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default AppKitModal;
