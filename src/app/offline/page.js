// --- Offline Page for VIP Learning Realm ---
'use client';

import { useEffect, useState } from 'react';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      window.location.reload();
    }
  }, [isOnline]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f8fafc',
      color: '#1e293b'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '500px',
        background: 'white',
        padding: '3rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '1rem'
        }}>
          📡
        </div>
        
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          marginBottom: '1rem',
          color: '#1e293b'
        }}>
          You're Offline
        </h1>
        
        <p style={{
          fontSize: '1.1rem',
          marginBottom: '2rem',
          color: '#64748b',
          lineHeight: '1.6'
        }}>
          It looks like you've lost your internet connection. Don't worry - we'll automatically reconnect you when your connection is restored.
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            backgroundColor: isOnline ? '#dcfce7' : '#fef3c7',
            borderRadius: '8px',
            fontWeight: '500',
            color: isOnline ? '#166534' : '#92400e'
          }}>
            <span style={{ fontSize: '1.2rem' }}>
              {isOnline ? '🟢' : '🟡'}
            </span>
            {isOnline ? 'Connection restored! Reloading...' : 'Connection status: Offline'}
          </div>

          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            Try Again
          </button>
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f1f5f9',
          borderRadius: '8px',
          fontSize: '0.9rem',
          color: '#475569'
        }}>
          <strong>💡 Tip:</strong> Some course content may be available offline. Check your course downloads in the app menu.
        </div>
      </div>
    </div>
  );
}
