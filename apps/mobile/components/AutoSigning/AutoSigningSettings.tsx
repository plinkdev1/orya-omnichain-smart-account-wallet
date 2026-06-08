import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { SigningMethod, AutoSigningPolicy } from '@orya/wallet-core';
import { useAutoSigning } from '@orya/wallet-core';

export default function AutoSigningSettings() {
  const {
    policies,
    defaultSigningMethod,
    allowAutoSign,
    loading,
    error,
    addPolicy,
    updatePolicy,
    removePolicy,
    enablePolicy,
    disablePolicy,
    setDefaultSigningMethod,
    setAllowAutoSign,
  } = useAutoSigning();

  const [showPolicyForm, setShowPolicyForm] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [policyName, setPolicyName] = useState('');

  const signingMethods: { method: SigningMethod; icon: string; label: string }[] = [
    { method: 'biometric', icon: '🔐', label: 'Biometric' },
    { method: 'passkey', icon: '🔑', label: 'Passkey' },
    { method: 'password', icon: '🔒', label: 'Password' },
    { method: 'hardware', icon: '💳', label: 'Hardware' },
  ];

  const handleAddPolicy = async () => {
    if (!policyName.trim()) {
      Alert.alert('Error', 'Policy name is required');
      return;
    }

    const newPolicy: AutoSigningPolicy = {
      id: editingPolicyId || `policy-${Date.now()}`,
      name: policyName,
      description: '',
      enabled: true,
      rules: [],
      createdAt: editingPolicyId
        ? policies.find((p) => p.id === editingPolicyId)?.createdAt || Date.now()
        : Date.now(),
      updatedAt: Date.now(),
    };

    try {
      if (editingPolicyId) {
        await updatePolicy(newPolicy);
      } else {
        await addPolicy(newPolicy);
      }
      setPolicyName('');
      setShowPolicyForm(false);
      setEditingPolicyId(null);
    } catch (err) {
      Alert.alert('Error', 'Failed to save policy');
    }
  };

  const handleDeletePolicy = (id: string) => {
    Alert.alert('Delete Policy', 'Are you sure you want to delete this policy?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removePolicy(id);
          } catch (err) {
            Alert.alert('Error', 'Failed to delete policy');
          }
        },
      },
    ]);
  };

  const handleTogglePolicy = async (id: string, enabled: boolean) => {
    try {
      if (enabled) {
        await enablePolicy(id);
      } else {
        await disablePolicy(id);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to toggle policy');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Main Toggle */}
      <LinearGradient
        colors={['#2D3748', '#1F2937']}
        style={styles.mainToggle}
      >
        <View>
          <Text style={styles.toggleTitle}>Auto-Signing</Text>
          <Text style={styles.toggleDescription}>
            Automatically sign transactions according to your policies
          </Text>
        </View>
        <Switch
          value={allowAutoSign}
          onValueChange={(val) => setAllowAutoSign(val)}
          disabled={loading}
          trackColor={{ false: '#4B5563', true: '#8B5CF6' }}
          thumbColor={allowAutoSign ? '#fff' : '#9CA3AF'}
        />
      </LinearGradient>

      {/* Signing Method Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default Signing Method</Text>
        <View style={styles.methodGrid}>
          {signingMethods.map(({ method, icon, label }) => (
            <TouchableOpacity
              key={method}
              onPress={() => setDefaultSigningMethod(method)}
              disabled={loading}
              style={[
                styles.methodButton,
                defaultSigningMethod === method && styles.methodButtonActive,
              ]}
            >
              <Text style={styles.methodIcon}>{icon}</Text>
              <Text
                style={[
                  styles.methodLabel,
                  defaultSigningMethod === method && styles.methodLabelActive,
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Policies Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Auto-Signing Policies</Text>
          <TouchableOpacity
            onPress={() => setShowPolicyForm(true)}
            disabled={loading || !allowAutoSign}
            style={[
              styles.addButton,
              (!allowAutoSign || loading) && styles.addButtonDisabled,
            ]}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {policies.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No policies yet. Create one to get started.
            </Text>
          </View>
        ) : (
          policies.map((policy) => (
            <View key={policy.id} style={styles.policyCard}>
              <View style={styles.policyHeader}>
                <View style={styles.policyInfo}>
                  <Text style={styles.policyName}>{policy.name}</Text>
                  <View
                    style={[
                      styles.policyBadge,
                      policy.enabled
                        ? styles.policyBadgeActive
                        : styles.policyBadgeInactive,
                    ]}
                  >
                    <Text style={styles.policyBadgeText}>
                      {policy.enabled ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={policy.enabled}
                  onValueChange={(val) => handleTogglePolicy(policy.id, val)}
                  disabled={loading}
                  trackColor={{ false: '#4B5563', true: '#8B5CF6' }}
                  thumbColor={policy.enabled ? '#fff' : '#9CA3AF'}
                />
              </View>

              <View style={styles.policyActions}>
                <TouchableOpacity
                  onPress={() => handleDeletePolicy(policy.id)}
                  disabled={loading}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Policy Form Modal (simplified) */}
      {showPolicyForm && (
        <View style={styles.formOverlay}>
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>New Auto-Signing Policy</Text>

            <TextInputField
              label="Policy Name"
              value={policyName}
              onChangeText={setPolicyName}
              placeholder="e.g., Low-Value Swaps"
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                onPress={handleAddPolicy}
                disabled={loading}
                style={[styles.formButton, styles.saveButton]}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowPolicyForm(false);
                  setEditingPolicyId(null);
                  setPolicyName('');
                }}
                style={[styles.formButton, styles.cancelButton]}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </ScrollView>
  );
}

interface TextInputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}

function TextInputField({ label, value, onChangeText, placeholder }: TextInputFieldProps) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Text style={styles.inputPlaceholder}>
          {value || placeholder}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 16,
  },
  mainToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  toggleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#4B5563',
    opacity: 0.5,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  methodGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  methodButton: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  methodButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  methodIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  methodLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  methodLabelActive: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
  policyCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  policyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  policyInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  policyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  policyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  policyBadgeActive: {
    backgroundColor: '#065F46',
  },
  policyBadgeInactive: {
    backgroundColor: '#374151',
  },
  policyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  policyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#7F1D1D',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '600',
  },
  formOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000AA',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  formContainer: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D1D5DB',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputPlaceholder: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  formActions: {
    flexDirection: 'row',
    gap: 8,
  },
  formButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#8B5CF6',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#374151',
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#7F1D1D',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
  },
});
