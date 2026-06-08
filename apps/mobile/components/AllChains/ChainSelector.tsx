import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native'
import { useChainbaseSupportedChains } from '@orya/wallet-core'
import { tw } from 'nativewind'
import { Search, X } from 'lucide-react-native'

interface ChainSelectorProps {
  visible: boolean
  onClose: () => void
  onSelect: (chainId: string) => void
  currentChainId: string
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({
  visible,
  onClose,
  onSelect,
  currentChainId,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: chains, isLoading } = useChainbaseSupportedChains()

  const filteredChains = chains?.filter((chain) =>
    chain.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chain.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderChain = ({ item }: { item: typeof chains[0] }) => {
    const isSelected = item.id === currentChainId

    return (
      <TouchableOpacity
        style={tw`p-4 border-b border-gray-100 flex-row items-center justify-between ${
          isSelected ? 'bg-blue-50' : 'bg-white'
        }`}
        onPress={() => {
          onSelect(item.id)
          onClose()
        }}
      >
        <View style={tw`flex-1`}>
          <Text style={tw`font-semibold text-gray-900`}>{item.name}</Text>
          <Text style={tw`text-sm text-gray-500 mt-1`}>
            {item.symbol}
            {item.isTestnet ? ' • Testnet' : ''}
          </Text>
        </View>
        {isSelected && <View style={tw`w-2 h-2 rounded-full bg-blue-600`} />}
      </TouchableOpacity>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 bg-white`}>
        {/* Header */}
        <View style={tw`flex-row items-center justify-between p-4 border-b border-gray-200`}>
          <Text style={tw`text-xl font-bold`}>Select Chain</Text>
          <TouchableOpacity onPress={onClose} testID="close-button" accessibilityLabel="Close chain selector">
            <X size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={tw`p-4 border-b border-gray-200`}>
          <View style={tw`flex-row items-center bg-gray-100 rounded-lg px-3 py-2`}>
            <Search size={20} color="#666" />
            <TextInput
              style={tw`flex-1 ml-2 text-base`}
              placeholder="Search chains..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Chain List */}
        {isLoading ? (
          <View style={tw`flex-1 justify-center items-center`} testID="loading-spinner">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <FlatList
            data={filteredChains}
            renderItem={renderChain}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={tw`p-8 items-center`}>
                <Text style={tw`text-gray-500`}>No chains found</Text>
              </View>
            }
          />
        )}

        {/* Chain Count */}
        {!isLoading && filteredChains && (
          <View style={tw`p-4 border-t border-gray-200`}>
            <Text style={tw`text-sm text-gray-500 text-center`}>
              {filteredChains.length} chains available
            </Text>
          </View>
        )}
      </View>
    </Modal>
  )
}
