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
    <div className="empty-state">
      <Icon className="empty-state-icon" />
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{message}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
