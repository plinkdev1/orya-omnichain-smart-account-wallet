'use client';

/**
 * Onboarding Screen 5: Recovery Phrase Verification (Standard Flow)
 * Users verify 3 random words from their recovery phrase
 * 
 * Features:
 * - Step-by-step quiz with question progress
 * - Back button navigates to previous question
 * - Visual progress bar and percentage
 * - Multiple-choice options for each word
 * - Answer validation with error recovery
 */

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { useRecoveryPhraseGenerator } from '@/hooks/useRecoveryPhraseGenerator';
import { useOnboardingStore } from '@/lib/onboardingStore';
import { AlertCircle, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface QuizQuestion {
  position: number;
  word: string;
  options: string[];
}

export default function RecoveryPhraseVerifyScreen() {
  const router = useRouter();
  const { setStep, recoveryPhrase } = useOnboardingStore();
  const { getVerificationQuizWords } = useRecoveryPhraseGenerator();
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [verified, setVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recoveryPhrase) {
      const questions = getVerificationQuizWords(recoveryPhrase, 3);
      setQuizQuestions(questions);
    }
  }, [recoveryPhrase, getVerificationQuizWords]);

  const handleAnswerSelect = (answer: string) => {
    const newAnswers = { ...answers, [currentQuestionIndex]: answer };
    setAnswers(newAnswers);
    setError(null);
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setError(null);
    } else {
      // Go back to previous screen if on first question
      setStep(4);
      router.push('/onboarding/recovery-phrase-display');
    }
  };

  const handleContinue = () => {
    const currentAnswer = answers[currentQuestionIndex];
    const currentQuestion = quizQuestions[currentQuestionIndex];

    if (!currentAnswer) {
      setError('Please select an answer before continuing');
      return;
    }

    if (currentAnswer !== currentQuestion.word) {
      setError(`That's not the right word. Please try again.`);
      // Reset this question's answer to allow retry
      const newAnswers = { ...answers };
      delete newAnswers[currentQuestionIndex];
      setAnswers(newAnswers);
      return;
    }

    // Move to next question or complete verification
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setError(null);
    } else {
      handleVerifyComplete();
    }
  };

  const handleVerifyComplete = async () => {
    setIsVerifying(true);
    try {
      // Verify all answers are correct
      let allCorrect = true;
      quizQuestions.forEach((question, index) => {
        if (answers[index] !== question.word) {
          allCorrect = false;
        }
      });

      if (!allCorrect) {
        setError('Some answers were incorrect. Please review and try again.');
        setIsVerifying(false);
        return;
      }

      setVerified(true);
      // Auto-proceed after a short delay
      setTimeout(() => {
        setStep(7);
        router.push('/onboarding/success');
      }, 1000);
    } catch (err) {
      console.error('[VerifyRecovery] Verification error:', err);
      setError('Failed to verify recovery phrase');
      setIsVerifying(false);
    }
  };

  if (quizQuestions.length === 0) {
    return (
      <OnboardingContainer>
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-4 border-pale-gold border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-deep-charcoal dark:text-bone-white">Loading verification...</p>
          </div>
        </div>
      </OnboardingContainer>
    );
  }

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / quizQuestions.length) * 100;
  const buttonLabel =
    currentQuestionIndex === quizQuestions.length - 1
      ? isVerifying
        ? 'Verifying...'
        : 'Complete Verification'
      : 'Next Word';

  return (
    <OnboardingContainer showBackButton={false}>
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar - Main Onboarding Progress */}
          <div className="mb-12">
            <ProgressBar currentStep={5} totalSteps={9} style="linear" />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-deep-charcoal dark:text-bone-white mb-3">
              Verify Your Recovery Phrase
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Select the correct words to confirm you've backed them up
            </p>
          </div>

          {/* Question Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                Question {currentQuestionIndex + 1} of {quizQuestions.length}
              </span>
              <span className="text-sm font-semibold text-pale-gold dark:text-neon-gold">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pale-gold to-deep-charcoal dark:from-neon-gold dark:to-bone-white transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Verification Success */}
          {verified && (
            <div className="mb-8 p-6 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex gap-4">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-200 mb-1">
                  Verification Complete!
                </h3>
                <p className="text-sm text-green-800 dark:text-green-300">
                  All words verified correctly. Proceeding...
                </p>
              </div>
            </div>
          )}

          {/* Current Question */}
          {!verified && currentQuestion && (
            <>
              {/* Error Message */}
              {error && (
                <div className="mb-8 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Question */}
              <div className="mb-8 p-6 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
                  What's the word at position...
                </p>
                <p className="text-4xl font-bold text-deep-charcoal dark:text-bone-white text-center">
                  #{currentQuestion.position}?
                </p>
              </div>

              {/* Answer Options */}
              <div className="mb-8 space-y-3">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={isVerifying}
                    className={`
                      w-full p-4 rounded-xl border-2 transition-all duration-200
                      font-semibold text-left
                      ${
                        answers[currentQuestionIndex] === option
                          ? 'border-pale-gold dark:border-neon-gold bg-pale-gold/10 dark:bg-neon-gold/10 text-deep-charcoal dark:text-bone-white'
                          : 'border-gray-200 dark:border-gray-700 text-deep-charcoal dark:text-bone-white hover:border-pale-gold/40 dark:hover:border-neon-gold/40'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    {option}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  disabled={isVerifying}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-deep-charcoal dark:text-bone-white font-semibold hover:border-pale-gold/40 dark:hover:border-neon-gold/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <OnboardingButton
                  label={buttonLabel}
                  onClick={handleContinue}
                  variant="primary"
                  size="lg"
                  disabled={!answers[currentQuestionIndex] || isVerifying}
                  isLoading={isVerifying}
                  className="flex-1"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </OnboardingContainer>
  );
}