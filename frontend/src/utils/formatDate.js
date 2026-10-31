/**
 * Formats a Date object or ISO string into a clean, human-readable date.
 */
export function formatDate(dateInput) {
  if (!dateInput) return '—';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function formatDateTime(dateInput) {
  if (!dateInput) return '—';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export default formatDate;
