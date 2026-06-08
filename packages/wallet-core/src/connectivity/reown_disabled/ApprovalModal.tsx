import React, { FC, useState, useCallback } from 'react';
import { WalletSession, SigningRequest } from './sessionStore';
import { SessionManager } from './SessionManager';
import { SigningQueue } from './SigningQueue';

export interface ApprovalModalProps {
  isOpen: boolean;
  type: 'session' | 'signing';
  data: WalletSession | SigningRequest;
  onApprove: () => void;
  onReject: () => void;
  isLoading?: boolean;
  className?: string;
}

export const ApprovalModal: FC<ApprovalModalProps> = ({
  isOpen,
  type,
  data,
  onApprove,
  onReject,
  isLoading = false,
  className = '',
}) => {
  const [confirmApprove, setConfirmApprove] = useState(false);

  const isSessionApproval = (data: any): data is WalletSession => {
    return 'topic' in data && 'peerMetadata' in data;
  };

  const isSigningRequest = (data: any): data is SigningRequest => {
    return 'method' in data && 'params' in data && 'sessionId' in data;
  };

  const handleApprove = useCallback(() => {
    if (!confirmApprove) {
      setConfirmApprove(true);
      return;
    }
    onApprove();
    setConfirmApprove(false);
  }, [confirmApprove, onApprove]);

  const handleReject = useCallback(() => {
    onReject();
    setConfirmApprove(false);
  }, [onReject]);

  if (!isOpen) return null;

  const sessionData = isSessionApproval(data) ? data : null;
  const signingData = isSigningRequest(data) ? data : null;

  return (
    <div className={`approval-modal-overlay ${className}`}>
      <div className="approval-modal-content">
        <div className="approval-modal-header">
          <h2 className="approval-modal-title">
            {type === 'session' ? 'Approve Connection' : 'Approve Signing Request'}
          </h2>
          <button
            className="approval-modal-close"
            onClick={handleReject}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <div className="approval-modal-body">
          {sessionData && (
            <SessionApprovalContent session={sessionData} />
          )}
          {signingData && (
            <SigningApprovalContent signingRequest={signingData} />
          )}
        </div>

        <div className="approval-modal-actions">
          <button
            className="approval-modal-btn approval-modal-btn-reject"
            onClick={handleReject}
            disabled={isLoading}
          >
            {confirmApprove ? 'Cancel' : 'Reject'}
          </button>
          <button
            className="approval-modal-btn approval-modal-btn-approve"
            onClick={handleApprove}
            disabled={isLoading}
          >
            {confirmApprove ? 'Confirm Approval' : 'Approve'}
            {isLoading && <span className="approval-modal-spinner" />}
          </button>
        </div>

        {confirmApprove && (
          <div className="approval-modal-warning">
            <p className="approval-modal-warning-text">
              Please confirm you want to approve this request. This action cannot be undone.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

interface SessionApprovalContentProps {
  session: WalletSession;
}

const SessionApprovalContent: FC<SessionApprovalContentProps> = ({ session }) => {
  return (
    <div className="approval-content">
      <div className="approval-section">
        <h3 className="approval-section-title">Connection Request</h3>
        <div className="approval-app-info">
          {session.peerMetadata.icons && session.peerMetadata.icons.length > 0 && (
            <img
              src={session.peerMetadata.icons[0]}
              alt={session.peerMetadata.name}
              className="approval-app-icon"
            />
          )}
          <div className="approval-app-details">
            <p className="approval-app-name">{session.peerMetadata.name}</p>
            {session.peerMetadata.url && (
              <p className="approval-app-url">{session.peerMetadata.url}</p>
            )}
          </div>
        </div>
      </div>

      <div className="approval-section">
        <h3 className="approval-section-title">Permissions</h3>
        <div className="approval-permissions">
          <div className="approval-permission-item">
            <span className="approval-permission-icon">📍</span>
            <span className="approval-permission-text">
              Can view your addresses ({session.accounts.length} account{session.accounts.length !== 1 ? 's' : ''})
            </span>
          </div>
          <div className="approval-permission-item">
            <span className="approval-permission-icon">✍️</span>
            <span className="approval-permission-text">
              Can request signatures and transactions
            </span>
          </div>
          <div className="approval-permission-item">
            <span className="approval-permission-icon">⛓️</span>
            <span className="approval-permission-text">
              Chain: {session.chainId}
            </span>
          </div>
        </div>
      </div>

      {session.peerMetadata.description && (
        <div className="approval-section">
          <h3 className="approval-section-title">About</h3>
          <p className="approval-description">{session.peerMetadata.description}</p>
        </div>
      )}

      <div className="approval-warning-box">
        <p className="approval-warning-box-text">
          Only approve connections from applications you trust.
        </p>
      </div>
    </div>
  );
};

interface SigningApprovalContentProps {
  signingRequest: SigningRequest;
}

const SigningApprovalContent: FC<SigningApprovalContentProps> = ({ signingRequest }) => {
  const formatParams = (params: any): string => {
    try {
      if (typeof params === 'string') return params;
      if (typeof params === 'object') {
        return JSON.stringify(params, null, 2);
      }
      return String(params);
    } catch {
      return 'Unable to display parameters';
    }
  };

  return (
    <div className="approval-content">
      <div className="approval-section">
        <h3 className="approval-section-title">Signing Request</h3>
        <div className="approval-request-info">
          <p className="approval-request-app">{signingRequest.peerName}</p>
          <p className="approval-request-method">{signingRequest.method}</p>
        </div>
      </div>

      <div className="approval-section">
        <h3 className="approval-section-title">Details</h3>
        <div className="approval-details-grid">
          <div className="approval-detail-item">
            <span className="approval-detail-label">Chain</span>
            <span className="approval-detail-value">{signingRequest.chainId}</span>
          </div>
          <div className="approval-detail-item">
            <span className="approval-detail-label">Method</span>
            <span className="approval-detail-value">{signingRequest.method}</span>
          </div>
        </div>
      </div>

      <div className="approval-section">
        <h3 className="approval-section-title">Parameters</h3>
        <pre className="approval-params-display">
          {formatParams(signingRequest.params)}
        </pre>
      </div>

      <div className="approval-warning-box">
        <p className="approval-warning-box-text">
          Review the transaction details carefully before approving.
        </p>
      </div>
    </div>
  );
};

export default ApprovalModal;
