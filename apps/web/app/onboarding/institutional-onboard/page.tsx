'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useOnboardingStore } from '@/lib/onboarding-store';
import { Building2, CheckCircle, ChevronLeft, ChevronRight, Loader2, Plus, X } from 'lucide-react';

type InstitutionalStep = 'welcome' | 'wallet' | 'kyb' | 'team' | 'complete';

interface TeamMember {
  id: string;
  email: string;
  role: 'admin' | 'approver' | 'viewer';
}

export default function InstitutionalOnboarding() {
  const router = useRouter();
  const { setWalletCreated, setStep, setAuthenticated } = useOnboardingStore();
  const [currentStep, setCurrentStep] = useState<InstitutionalStep>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [kybStatus, setKybStatus] = useState<'pending' | 'submitted' | 'verified'>('pending');
  const [multiSigThreshold, setMultiSigThreshold] = useState(2);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: '1', email: 'founder@company.com', role: 'admin' },
  ]);
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const addTeamMember = () => {
    if (newMemberEmail && !teamMembers.some(m => m.email === newMemberEmail)) {
      setTeamMembers([
        ...teamMembers,
        {
          id: Math.random().toString(),
          email: newMemberEmail,
          role: 'approver',
        },
      ]);
      setNewMemberEmail('');
    }
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
  };

  const handleNext = async () => {
    if (currentStep === 'welcome') {
      setCurrentStep('wallet');
    } else if (currentStep === 'wallet') {
      setCurrentStep('kyb');
    } else if (currentStep === 'kyb') {
      setIsLoading(true);
      await new Promise(r => setTimeout(r, 2000));
      setKybStatus('submitted');
      setIsLoading(false);
      setCurrentStep('team');
    } else if (currentStep === 'team') {
      setIsLoading(true);
      await new Promise(r => setTimeout(r, 1500));
      setWalletCreated(true);
      setAuthenticated(true, 'dynamic');
      setStep(5);
      setCurrentStep('complete');
      setTimeout(() => router.push('/dashboard'), 2000);
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    const steps: InstitutionalStep[] = ['welcome', 'wallet', 'kyb', 'team', 'complete'];
    const currentIdx = steps.indexOf(currentStep);
    if (currentIdx > 0) {
      setCurrentStep(steps[currentIdx - 1]);
    }
  };

  const stepConfig = {
    welcome: { number: 1, title: 'Welcome', subtitle: 'Enterprise Setup' },
    wallet: { number: 2, title: 'Wallet', subtitle: 'Configure Multi-Sig' },
    kyb: { number: 3, title: 'Verification', subtitle: 'KYB Process' },
    team: { number: 4, title: 'Team', subtitle: 'Add Team Members' },
    complete: { number: 5, title: 'Complete', subtitle: 'All Set!' },
  };

  const config = stepConfig[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Progress */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5].map((num, idx) => (
              <motion.div key={num} className="flex items-center flex-1">
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    num < config.number
                      ? 'bg-green-500 text-white'
                      : num === config.number
                      ? 'bg-purple-500 text-white ring-2 ring-purple-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {num < config.number ? <CheckCircle className="w-5 h-5" /> : num}
                </motion.div>
                {idx < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-colors ${
                      num < config.number ? 'bg-green-500' : 'bg-slate-700'
                    }`}
                  />
                )}
              </motion.div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">{config.title}</h2>
            <p className="text-purple-300 text-sm">{config.subtitle}</p>
          </div>
        </motion.div>

        {/* Welcome */}
        {currentStep === 'welcome' && (
          <motion.div
            className="bg-slate-900/50 backdrop-blur rounded-2xl border border-purple-500/20 p-12 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Building2 className="w-16 h-16 text-purple-400 mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-white mb-4">
              Enterprise Wallet Setup
            </h3>
            <p className="text-lg text-purple-300 mb-8 max-w-md mx-auto">
              Set up a secure, compliant wallet for your organization with multi-signature security and team management.
            </p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: '🔐', label: 'Multi-Sig' },
                { icon: '✓', label: 'KYB' },
                { icon: '👥', label: 'Team' },
              ].map((item, i) => (
                <div key={i} className="p-4 bg-purple-500/10 rounded-lg">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <div className="text-sm text-purple-300">{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Wallet Config */}
        {currentStep === 'wallet' && (
          <motion.div
            className="bg-slate-900/50 backdrop-blur rounded-2xl border border-purple-500/20 p-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-2xl font-bold text-white mb-6">
              Multi-Signature Configuration
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Number of Signers
                </label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={teamMembers.length}
                  disabled
                  className="w-full px-4 py-2 bg-slate-800 border border-purple-500/30 rounded-lg text-white disabled:opacity-60"
                />
                <p className="text-sm text-purple-300/60 mt-2">
                  You currently have {teamMembers.length} signer(s). Add more team members to increase this number.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Required Signatures (M-of-N)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="1"
                    max={teamMembers.length}
                    value={multiSigThreshold}
                    onChange={e => setMultiSigThreshold(Math.max(1, Math.min(teamMembers.length, parseInt(e.target.value))))}
                    className="flex-1 px-4 py-2 bg-slate-800 border border-purple-500/30 rounded-lg text-white"
                  />
                  <span className="text-purple-300">
                    of {teamMembers.length}
                  </span>
                </div>
                <p className="text-sm text-purple-300/60 mt-2">
                  Require {multiSigThreshold} out of {teamMembers.length} signatures to approve transactions
                </p>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-300">
                  <strong>Recommended:</strong> Set a threshold of 2/3 or higher for enhanced security
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* KYB */}
        {currentStep === 'kyb' && (
          <motion.div
            className="bg-slate-900/50 backdrop-blur rounded-2xl border border-purple-500/20 p-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-2xl font-bold text-white mb-6">
              Know Your Business (KYB)
            </h3>

            {kybStatus === 'pending' && (
              <div className="space-y-4">
                {[
                  { label: 'Company Name', value: '' },
                  { label: 'Registration Number', value: '' },
                  { label: 'Industry', value: '' },
                  { label: 'Country', value: '' },
                ].map((field, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <label className="block text-sm font-semibold text-white mb-2">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 bg-slate-800 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  </motion.div>
                ))}
              </div>
            )}

            {kybStatus === 'submitted' && (
              <motion.div
                className="text-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-white mb-2">
                  KYB Submitted
                </h4>
                <p className="text-purple-300">
                  Our team will review your information within 24 hours
                </p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Team */}
        {currentStep === 'team' && (
          <motion.div
            className="bg-slate-900/50 backdrop-blur rounded-2xl border border-purple-500/20 p-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="text-2xl font-bold text-white mb-6">
              Team Management
            </h3>

            <div className="space-y-6">
              {/* Add Member */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Add Team Members
                </label>
                <div className="flex gap-2 mb-4">
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={e => setNewMemberEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 px-4 py-2 bg-slate-800 border border-purple-500/30 rounded-lg text-white placeholder-purple-300/50"
                  />
                  <button
                    onClick={addTeamMember}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add
                  </button>
                </div>
              </div>

              {/* Team List */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">
                  Team Members ({teamMembers.length})
                </label>
                <div className="space-y-2">
                  {teamMembers.map((member, idx) => (
                    <motion.div
                      key={member.id}
                      className="p-4 bg-slate-800/50 border border-purple-500/20 rounded-lg flex items-center justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-white">{member.email}</div>
                        <div className="text-xs text-purple-300/60 capitalize">
                          {member.role}
                        </div>
                      </div>
                      <select
                        value={member.role}
                        onChange={e => {
                          const updated = [...teamMembers];
                          updated[idx].role = e.target.value as 'admin' | 'approver' | 'viewer';
                          setTeamMembers(updated);
                        }}
                        className="px-3 py-1 bg-slate-700 border border-purple-500/20 rounded text-sm text-white"
                      >
                        <option value="admin">Admin</option>
                        <option value="approver">Approver</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      {teamMembers.length > 1 && (
                        <button
                          onClick={() => removeTeamMember(member.id)}
                          className="ml-2 p-1 hover:bg-red-500/20 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Complete */}
        {currentStep === 'complete' && (
          <motion.div
            className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur rounded-2xl border border-purple-500/30 p-12 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <CheckCircle className="w-8 h-8 text-green-400" />
            </motion.div>
            <h3 className="text-3xl font-bold text-white mb-3">Enterprise Wallet Ready!</h3>
            <p className="text-purple-300 mb-4">
              Your secure multi-sig wallet is configured and ready for use
            </p>
            <p className="text-sm text-purple-300/60">Redirecting to dashboard...</p>
          </motion.div>
        )}

        {/* Navigation */}
        {currentStep !== 'complete' && (
          <motion.div
            className="flex items-center justify-between mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={handleBack}
              disabled={currentStep === 'welcome'}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-purple-300 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Next
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
