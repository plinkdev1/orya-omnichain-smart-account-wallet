'use client';

import { Trash2, Plus, Edit2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { AutoSigningPolicy, SigningMethod } from '@orya/wallet-core';
import { useAutoSigning } from '@orya/wallet-core';

export default function AutoSigningSettings() {
  const {
    preferences,
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
  const [policyForm, setPolicyForm] = useState<Partial<AutoSigningPolicy>>({
    name: '',
    description: '',
    enabled: true,
    rules: [],
  });

  const signingMethods: SigningMethod[] = ['biometric', 'passkey', 'password', 'hardware'];

  const handleAddPolicy = async () => {
    if (!policyForm.name?.trim()) {
      alert('Policy name is required');
      return;
    }

    const newPolicy: AutoSigningPolicy = {
      id: editingPolicyId || `policy-${Date.now()}`,
      name: policyForm.name,
      description: policyForm.description,
      enabled: policyForm.enabled ?? true,
      rules: policyForm.rules ?? [],
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
      setPolicyForm({ name: '', description: '', enabled: true, rules: [] });
      setShowPolicyForm(false);
      setEditingPolicyId(null);
    } catch (err) {
      console.error('Failed to save policy:', err);
    }
  };

  const handleEditPolicy = (policy: AutoSigningPolicy) => {
    setPolicyForm(policy);
    setEditingPolicyId(policy.id);
    setShowPolicyForm(true);
  };

  const handleDeletePolicy = async (id: string) => {
    if (confirm('Are you sure you want to delete this policy?')) {
      try {
        await removePolicy(id);
      } catch (err) {
        console.error('Failed to delete policy:', err);
      }
    }
  };

  const handleTogglePolicy = async (id: string, enabled: boolean) => {
    try {
      if (enabled) {
        await enablePolicy(id);
      } else {
        await disablePolicy(id);
      }
    } catch (err) {
      console.error('Failed to toggle policy:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Auto-Signing Toggle */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">Auto-Signing</h3>
            <p className="text-sm text-slate-400">
              Automatically sign and submit transactions according to your policies
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={allowAutoSign}
              onChange={(e) => setAllowAutoSign(e.target.checked)}
              disabled={loading}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500" />
          </label>
        </div>
      </div>

      {/* Signing Method Selection */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 space-y-4">
        <h3 className="text-lg font-semibold text-white">Default Signing Method</h3>
        <div className="grid grid-cols-2 gap-3">
          {signingMethods.map((method) => (
            <button
              key={method}
              onClick={() => setDefaultSigningMethod(method)}
              disabled={loading}
              className={`p-3 rounded-lg transition-colors text-sm font-medium capitalize ${
                defaultSigningMethod === method
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {method === 'biometric' && '🔐'}{' '}
              {method === 'passkey' && '🔑'}{' '}
              {method === 'password' && '🔒'}{' '}
              {method === 'hardware' && '💳'} {method}
            </button>
          ))}
        </div>
      </div>

      {/* Policies Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Auto-Signing Policies</h3>
          <button
            onClick={() => setShowPolicyForm(true)}
            disabled={loading || !allowAutoSign}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Policy
          </button>
        </div>

        {/* Policy Form */}
        {showPolicyForm && (
          <AutoSigningPolicyForm
            policy={
              editingPolicyId
                ? policies.find((p) => p.id === editingPolicyId)
                : undefined
            }
            onSave={handleAddPolicy}
            onCancel={() => {
              setShowPolicyForm(false);
              setEditingPolicyId(null);
              setPolicyForm({ name: '', description: '', enabled: true, rules: [] });
            }}
            onChange={setPolicyForm}
            formData={policyForm}
            loading={loading}
          />
        )}

        {/* Policy List */}
        <div className="space-y-3">
          {policies.length === 0 ? (
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 text-center">
              <p className="text-slate-400 text-sm">No policies yet. Create one to get started.</p>
            </div>
          ) : (
            policies.map((policy) => (
              <div
                key={policy.id}
                className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white">{policy.name}</h4>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        policy.enabled
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {policy.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {policy.description && (
                    <p className="text-sm text-slate-400 mt-1">{policy.description}</p>
                  )}
                  {policy.rules.length > 0 && (
                    <div className="mt-2 text-xs text-slate-400">
                      {policy.rules.length} rule{policy.rules.length !== 1 ? 's' : ''} applied
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policy.enabled}
                      onChange={(e) => handleTogglePolicy(policy.id, e.target.checked)}
                      disabled={loading}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500" />
                  </label>
                  <button
                    onClick={() => handleEditPolicy(policy)}
                    disabled={loading}
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePolicy(policy.id)}
                    disabled={loading}
                    className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}

interface AutoSigningPolicyFormProps {
  policy?: AutoSigningPolicy;
  formData: Partial<AutoSigningPolicy>;
  onChange: (data: Partial<AutoSigningPolicy>) => void;
  onSave: () => void;
  onCancel: () => void;
  loading: boolean;
}

function AutoSigningPolicyForm({
  policy,
  formData,
  onChange,
  onSave,
  onCancel,
  loading,
}: AutoSigningPolicyFormProps) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Policy Name</label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          disabled={loading}
          placeholder="e.g., Low-Value Swaps"
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => onChange({ ...formData, description: e.target.value })}
          disabled={loading}
          placeholder="Describe when this policy applies..."
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 resize-none"
          rows={2}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSave}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white rounded-lg transition-colors font-medium"
        >
          {loading ? 'Saving...' : 'Save Policy'}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
