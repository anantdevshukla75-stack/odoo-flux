import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingState({ message = 'Loading data...', variant = 'spinner' }) {
  if (variant === 'skeleton') {
    return (
      <div className="w-full space-y-3 p-4 animate-pulse">
        <div className="h-6 bg-slate-200 rounded-md w-1/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-slate-100 rounded-md"></div>
          <div className="h-4 bg-slate-100 rounded-md w-5/6"></div>
          <div className="h-4 bg-slate-100 rounded-md w-4/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2.5">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      <span className="text-xs font-medium text-slate-500">{message}</span>
    </div>
  );
}

export default LoadingState;
