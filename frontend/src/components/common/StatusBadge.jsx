import React from 'react';

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',

  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  sent: 'bg-amber-50 text-amber-700 border-amber-200',
  partially_paid: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'partially paid': 'bg-indigo-50 text-indigo-700 border-indigo-200',

  overdue: 'bg-red-50 text-red-700 border-red-200',
  unpaid: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  failed: 'bg-red-50 text-red-700 border-red-200',

  paused: 'bg-sky-50 text-sky-700 border-sky-200',
  open: 'bg-sky-50 text-sky-700 border-sky-200',

  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
  expired: 'bg-slate-100 text-slate-600 border-slate-200'
};

export function StatusBadge({ status, className = '' }) {
  if (!status) return null;

  const key = String(status).toLowerCase();
  const styles = STATUS_STYLES[key] || 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize tracking-wide ${styles} ${className}`.trim()}
    >
      {String(status).replace(/_/g, ' ').toLowerCase()}
    </span>
  );
}

export default StatusBadge;
