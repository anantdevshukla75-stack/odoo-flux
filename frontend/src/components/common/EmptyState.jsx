import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button.jsx';

export function EmptyState({
  title = 'No records found',
  message = 'There are no items to display at this time.',
  actionLabel,
  onAction,
  icon: Icon = Inbox
}) {
  return (
    <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed">{message}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
