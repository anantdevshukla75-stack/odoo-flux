import React from 'react';
import { getStatusBadgeClass } from '../../utils/roleHelpers.js';

export function StatusBadge({ status, className = '' }) {
  if (!status) return null;

  const badgeClass = getStatusBadgeClass(status);

  return (
    <span className={`badge ${badgeClass} ${className}`.trim()}>
      {status.toLowerCase()}
    </span>
  );
}

export default StatusBadge;
