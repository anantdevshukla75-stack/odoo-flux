import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Loading data...' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        gap: '0.75rem',
        color: 'var(--text-secondary)'
      }}
    >
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
      <span style={{ fontSize: '0.875rem' }}>{message}</span>
    </div>
  );
}

export default LoadingState;
