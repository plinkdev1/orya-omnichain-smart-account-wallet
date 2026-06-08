import { useEffect, useState } from 'react';
import { humanNetworkService, PassportStamp } from './index';

interface PassportEmbedProps {
  userId: string;
  onComplete?: (stamps: PassportStamp[]) => void;
  onError?: (error: Error) => void;
  height?: string;
  width?: string;
}

export function PassportEmbed({
  userId,
  onComplete,
  onError,
  height = '600px',
  width = '100%',
}: PassportEmbedProps) {
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const session = await humanNetworkService.initializePassport(userId);
        setEmbedUrl(session.embedUrl);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error.message);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [userId, onError]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'PASSPORT_COMPLETE') {
        try {
          const stamps = await humanNetworkService.getPassportStamps(userId);
          onComplete?.(stamps);
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          onError?.(error);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [userId, onComplete, onError]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height,
          width,
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
        }}
      >
        <div>Loading Passport...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height,
          width,
          backgroundColor: '#ffebee',
          borderRadius: '8px',
          color: '#c62828',
        }}
      >
        <div>Error: {error}</div>
      </div>
    );
  }

  return (
    <iframe
      src={embedUrl}
      width={width}
      height={height}
      frameBorder="0"
      title="Human Network Passport"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      style={{
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
      }}
    />
  );
}
