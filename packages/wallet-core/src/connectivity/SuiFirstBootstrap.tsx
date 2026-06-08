import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { connectWalletSuccess } from '../store/slices/walletSlice';

export interface SuiFirstBootstrapProps {
  isVisible: boolean;
  suiAddress: string;
  onComplete: () => void;
  onSkip?: () => void;
  showSkipButton?: boolean;
}

interface BootstrapStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  action?: () => void;
}

export const SuiFirstBootstrap: React.FC<SuiFirstBootstrapProps> = ({
  isVisible,
  suiAddress,
  onComplete,
  onSkip,
  showSkipButton = true,
}) => {
  const dispatch = useAppDispatch();
  const walletState = useAppSelector((state: any) => state.wallet);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const steps: BootstrapStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Sui 🚀',
      description:
        'Your fastest blockchain is ready. Sui powers instant, low-cost transactions across the world.',
      icon: '⚡',
    },
    {
      id: 'primary',
      title: 'Your Default Chain',
      description:
        'Sui is now your primary chain. All transactions start here unless you choose another.',
      icon: '⭐',
    },
    {
      id: 'yield',
      title: 'Explore Yield',
      description:
        'Visit Grove to discover bundled yield strategies, automated vaults, and LST opportunities.',
      icon: '📈',
    },
    {
      id: 'multichain',
      title: 'Go Multichain',
      description:
        'Ready to expand? Add other blockchains like Solana, Ethereum, or Cosmos anytime.',
      icon: '🌐',
    },
  ];

  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [isVisible]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(false);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsAnimating(true);
      }, 300);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      handleComplete();
    }
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="sui-first-bootstrap-overlay">
      <div className="sui-first-bootstrap-container">
        <div className="sui-first-bootstrap-header">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          {showSkipButton && (
            <button className="skip-button" onClick={handleSkip}>
              Skip
            </button>
          )}
        </div>

        <div className="sui-first-bootstrap-content">
          <div
            className={`bootstrap-step ${isAnimating ? 'animate-in' : 'animate-out'}`}
            key={step.id}
          >
            <div className="step-icon">{step.icon}</div>
            <h2 className="step-title">{step.title}</h2>
            <p className="step-description">{step.description}</p>

            {step.id === 'welcome' && (
              <div className="address-badge">
                <span className="address-label">Your Sui Address</span>
                <code className="address-code">{suiAddress.slice(0, 6)}...{suiAddress.slice(-4)}</code>
              </div>
            )}

            {step.id === 'yield' && (
              <div className="yield-preview">
                <div className="yield-item">
                  <span>vSUI 6% APY</span>
                  <span className="badge">Staking</span>
                </div>
                <div className="yield-item">
                  <span>LBTC Loop 12%</span>
                  <span className="badge">DeFi</span>
                </div>
              </div>
            )}

            {step.id === 'multichain' && (
              <div className="chain-selector">
                <div className="chain-item">
                  <span>Solana</span>
                  <span className="chain-icon">◎</span>
                </div>
                <div className="chain-item">
                  <span>Ethereum</span>
                  <span className="chain-icon">Ξ</span>
                </div>
                <div className="chain-item">
                  <span>Cosmos</span>
                  <span className="chain-icon">⚛</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sui-first-bootstrap-footer">
          <button className="button button-secondary" onClick={handleSkip} style={{ display: showSkipButton ? 'block' : 'none' }}>
            Skip Tour
          </button>
          <button className="button button-primary" onClick={handleNext}>
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>

        <style>{`
          .sui-first-bootstrap-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(4px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          .sui-first-bootstrap-container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
            width: 90%;
            max-width: 600px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            max-height: 90vh;
            animation: slideUp 0.3s ease;
          }

          @keyframes slideUp {
            from {
              transform: translateY(20px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .sui-first-bootstrap-header {
            padding: 16px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #f0f0f0;
            position: relative;
          }

          .progress-bar {
            position: absolute;
            bottom: -1px;
            left: 0;
            right: 0;
            height: 3px;
            background: #f0f0f0;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #2e8555 0%, #4db56d 100%);
          }

          .skip-button {
            background: none;
            border: none;
            color: #666;
            cursor: pointer;
            font-size: 14px;
            padding: 8px 12px;
            border-radius: 4px;
            transition: all 0.2s;
          }

          .skip-button:hover {
            background: #f5f5f5;
            color: #333;
          }

          .sui-first-bootstrap-content {
            padding: 48px 24px;
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 300px;
          }

          .bootstrap-step {
            text-align: center;
            width: 100%;
            animation: fadeIn 0.4s ease;
          }

          .bootstrap-step.animate-out {
            animation: fadeOut 0.3s ease;
          }

          @keyframes fadeOut {
            from {
              opacity: 1;
              transform: scale(1);
            }
            to {
              opacity: 0;
              transform: scale(0.95);
            }
          }

          .step-icon {
            font-size: 64px;
            margin-bottom: 16px;
            display: inline-block;
          }

          .step-title {
            font-size: 28px;
            font-weight: 600;
            margin: 16px 0;
            color: #1a1a1a;
          }

          .step-description {
            font-size: 14px;
            color: #666;
            line-height: 1.6;
            margin-bottom: 24px;
          }

          .address-badge {
            background: #f9f9f9;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 16px;
            margin-top: 16px;
          }

          .address-label {
            display: block;
            font-size: 12px;
            color: #999;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }

          .address-code {
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            color: #2e8555;
            background: white;
            padding: 8px 12px;
            border-radius: 4px;
            word-break: break-all;
          }

          .yield-preview {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 16px;
          }

          .yield-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f9f9f9;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
          }

          .badge {
            background: #e8f5e9;
            color: #2e8555;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
          }

          .chain-selector {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 16px;
          }

          .chain-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f9f9f9;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .chain-item:hover {
            background: #efefef;
          }

          .chain-icon {
            font-size: 18px;
          }

          .sui-first-bootstrap-footer {
            padding: 16px 24px;
            display: flex;
            gap: 12px;
            border-top: 1px solid #f0f0f0;
          }

          .button {
            flex: 1;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }

          .button-primary {
            background: linear-gradient(90deg, #2e8555 0%, #4db56d 100%);
            color: white;
          }

          .button-primary:hover {
            background: linear-gradient(90deg, #27723d 0%, #3fa55a 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(46, 133, 85, 0.3);
          }

          .button-primary:active {
            transform: translateY(0);
          }

          .button-secondary {
            background: #f5f5f5;
            color: #333;
          }

          .button-secondary:hover {
            background: #efefef;
          }

          @media (max-width: 640px) {
            .sui-first-bootstrap-container {
              width: 95%;
              max-height: calc(100vh - 32px);
            }

            .sui-first-bootstrap-content {
              padding: 32px 16px;
              min-height: 250px;
            }

            .step-title {
              font-size: 24px;
            }

            .sui-first-bootstrap-footer {
              flex-direction: column-reverse;
            }

            .button {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  );
};
