/**
 * Step 4B: WalletConnectUI Component
 * UI for WalletConnect pairing and signing request handling
 */

import type { FC } from "react";
import { useEffect, useState } from "react";
import { getWalletConnectManager, SigningRequest } from "./WalletConnectManager";

export interface WalletConnectUIProps {
  onPaired?: () => void;
  onSigningRequest?: (request: SigningRequest) => void;
  className?: string;
}

export const WalletConnectUI: FC<WalletConnectUIProps> = ({
  onPaired,
  onSigningRequest,
  className = "",
}: WalletConnectUIProps) => {
  const [pairingUri, setPairingUri] = useState<string>("");
  const [showQR, setShowQR] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<SigningRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SigningRequest | null>(
    null
  );

  const manager = getWalletConnectManager();

  useEffect(() => {
    if (!manager) return;

    // Subscribe to signing requests
    const unsubscribe = manager?.onSigningRequest?.((request: SigningRequest) => {
      setPendingRequests((prev: SigningRequest[]) => [...prev, request]);
      onSigningRequest?.(request);
    });

    return () => {
      unsubscribe?.();
    };
  }, [manager, onSigningRequest]);

  const handleGenerateQR = async (): Promise<void> => {
    if (!manager) {
      setError("WalletConnect not initialized");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const uri = await manager.generatePairingUri();
      setPairingUri(uri);
      setShowQR(true);
      onPaired?.();
    } catch (err) {
      setError((err as any).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveRequest = async (request: SigningRequest): Promise<void> => {
    if (!manager) return;

    try {
      // In production, you would get the actual signature from the signing backend
      const mockSignature =
        "0x" + Array(128).fill("0").join(""); // Mock signature
      await manager?.approveSigningRequest?.(request.id, mockSignature);

      setPendingRequests((prev: SigningRequest[]) =>
        prev.filter((r: SigningRequest) => r.id !== request.id)
      );
      setSelectedRequest(null);
    } catch (err) {
      setError((err as any).message);
    }
  };

  const handleRejectRequest = async (request: SigningRequest): Promise<void> => {
    if (!manager) return;

    try {
      await manager?.rejectSigningRequest?.(request.id, "User rejected");
      setPendingRequests((prev: SigningRequest[]) =>
        prev.filter((r: SigningRequest) => r.id !== request.id)
      );
      setSelectedRequest(null);
    } catch (err) {
      setError((err as any).message);
    }
  };

  return (
    <div className={`walletconnect-ui ${className}`}>
      <div className="walletconnect-container">
        {/* Generate QR Section */}
        <div className="section pairing-section">
          <h3>WalletConnect Pairing</h3>

          {!showQR ? (
            <button
              onClick={handleGenerateQR}
              disabled={isGenerating}
              className="btn btn-primary"
            >
              {isGenerating ? "Generating..." : "Generate Pairing QR"}
            </button>
          ) : (
            <div className="qr-section">
              <div className="qr-placeholder">
                <div className="qr-code-icon">📱</div>
                <p>QR Code would be displayed here</p>
                <code className="uri-code">{pairingUri.slice(0, 50)}...</code>
              </div>
              <button
                onClick={() => {
                  setShowQR(false);
                  setPairingUri("");
                }}
                className="btn btn-secondary"
              >
                New QR
              </button>
            </div>
          )}
        </div>

        {/* Active Sessions Section */}
        {sessions.length > 0 && (
          <div className="section sessions-section">
            <h3>Active Sessions ({sessions.length})</h3>
            <div className="sessions-list">
              {sessions.map((session) => (
                <div key={session.topic} className="session-card">
                  <div className="session-header">
                    <span className="session-name">
                      {session.peerMetadata?.name || "Unknown"}
                    </span>
                    <span className="session-badge">Connected</span>
                  </div>
                  <div className="session-details">
                    {session.peerMetadata?.description && (
                      <p>{session.peerMetadata.description}</p>
                    )}
                    <small>Topic: {session.topic.slice(0, 20)}...</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Signing Requests Section */}
        {pendingRequests.length > 0 && (
          <div className="section requests-section">
            <h3>Pending Signing Requests ({pendingRequests.length})</h3>

            {selectedRequest ? (
              <div className="request-detail">
                <h4>Request Details</h4>
                <div className="detail-item">
                  <span className="label">From:</span>
                  <span className="value">{selectedRequest.peerName}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Method:</span>
                  <span className="value">{selectedRequest.method}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Parameters:</span>
                  <code className="params-code">
                    {JSON.stringify(selectedRequest.params, null, 2).slice(0, 200)}...
                  </code>
                </div>

                <div className="action-buttons">
                  <button
                    onClick={() =>
                      handleApproveRequest(selectedRequest)
                    }
                    className="btn btn-approve"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() =>
                      handleRejectRequest(selectedRequest)
                    }
                    className="btn btn-reject"
                  >
                    Reject
                  </button>
                </div>

                <button
                  onClick={() => setSelectedRequest(null)}
                  className="btn btn-secondary btn-back"
                >
                  Back to List
                </button>
              </div>
            ) : (
              <div className="requests-list">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="request-card"
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="request-header">
                      <span className="request-method">{request.method}</span>
                      <span className="request-time">
                        {new Date(request.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="request-peer">{request.peerName}</div>
                    <div className="request-id">
                      ID: {request.id.slice(0, 16)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error Section */}
        {error && (
          <div className="section error-section">
            <div className="error-message">{error}</div>
            <button
              onClick={() => setError("")}
              className="btn btn-secondary btn-small"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Empty State */}
        {!showQR && sessions.length === 0 && pendingRequests.length === 0 && (
          <div className="section empty-state">
            <p>No active sessions or pending requests</p>
          </div>
        )}
      </div>

      <style>{`
        .walletconnect-ui {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #f8f6f1;
        }

        .walletconnect-container {
          max-width: 600px;
          margin: 0 auto;
        }

        .section {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 215, 0, 0.2);
          border-radius: 0.5rem;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .section h3 {
          margin: 0 0 1rem 0;
          font-size: 1.125rem;
          color: #ffd700;
        }

        .section h4 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          color: #f8f6f1;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
          background: rgba(255, 215, 0, 0.2);
          color: #ffd700;
          border: 1px solid rgba(255, 215, 0, 0.3);
        }

        .btn:hover:not(:disabled) {
          background: rgba(255, 215, 0, 0.3);
          border-color: rgba(255, 215, 0, 0.5);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #ffd700;
          color: #000;
          border: none;
          width: 100%;
          padding: 0.75rem;
        }

        .btn-primary:hover:not(:disabled) {
          background: #ffed4e;
        }

        .btn-secondary {
          background: rgba(255, 215, 0, 0.15);
          color: #ffd700;
        }

        .btn-approve {
          background: rgba(76, 175, 80, 0.2);
          color: #4caf50;
          border-color: rgba(76, 175, 80, 0.3);
        }

        .btn-approve:hover:not(:disabled) {
          background: rgba(76, 175, 80, 0.3);
        }

        .btn-reject {
          background: rgba(255, 107, 107, 0.2);
          color: #ff6b6b;
          border-color: rgba(255, 107, 107, 0.3);
        }

        .btn-reject:hover:not(:disabled) {
          background: rgba(255, 107, 107, 0.3);
        }

        .btn-small {
          padding: 0.375rem 0.75rem;
          font-size: 0.875rem;
        }

        .btn-back {
          width: 100%;
          margin-top: 1rem;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          margin: 1rem 0;
        }

        .action-buttons .btn {
          flex: 1;
        }

        .qr-placeholder {
          background: rgba(0, 0, 0, 0.3);
          border: 2px dashed rgba(255, 215, 0, 0.3);
          border-radius: 0.5rem;
          padding: 2rem;
          text-align: center;
          margin-bottom: 1rem;
        }

        .qr-code-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .qr-placeholder p {
          margin: 0.5rem 0;
          opacity: 0.7;
        }

        .uri-code {
          display: block;
          background: rgba(0, 0, 0, 0.5);
          padding: 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          margin-top: 0.5rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sessions-list,
        .requests-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .session-card,
        .request-card {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 215, 0, 0.15);
          border-radius: 0.25rem;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .session-card:hover,
        .request-card:hover {
          border-color: rgba(255, 215, 0, 0.3);
          background: rgba(0, 0, 0, 0.5);
        }

        .session-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .session-name {
          font-weight: 500;
        }

        .session-badge {
          background: rgba(76, 175, 80, 0.2);
          color: #4caf50;
          padding: 0.25rem 0.5rem;
          border-radius: 0.125rem;
          font-size: 0.75rem;
        }

        .session-details p {
          margin: 0.25rem 0;
          font-size: 0.875rem;
          opacity: 0.8;
        }

        .session-details small {
          display: block;
          margin-top: 0.5rem;
          opacity: 0.6;
          font-family: monospace;
        }

        .request-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .request-method {
          font-weight: 500;
          color: #ffd700;
        }

        .request-time {
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .request-peer {
          font-size: 0.875rem;
          opacity: 0.8;
          margin-bottom: 0.25rem;
        }

        .request-id {
          font-size: 0.75rem;
          opacity: 0.6;
          font-family: monospace;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          margin: 0.75rem 0;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255, 215, 0, 0.1);
        }

        .detail-item .label {
          font-weight: 500;
          opacity: 0.8;
        }

        .detail-item .value {
          opacity: 0.9;
          font-family: monospace;
        }

        .params-code {
          display: block;
          background: rgba(0, 0, 0, 0.5);
          padding: 0.75rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          overflow-x: auto;
          margin: 0.5rem 0;
        }

        .error-section {
          border-color: rgba(255, 107, 107, 0.3);
          background: rgba(255, 107, 107, 0.05);
        }

        .error-message {
          background: rgba(255, 107, 107, 0.1);
          color: #ff6b6b;
          padding: 0.75rem;
          border-radius: 0.25rem;
          margin-bottom: 0.75rem;
          font-size: 0.875rem;
        }

        .empty-state {
          text-align: center;
          opacity: 0.6;
        }

        .request-detail {
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};