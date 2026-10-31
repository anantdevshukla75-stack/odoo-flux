export const ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER'
};

export function isAdmin(user) {
  return user?.role === ROLES.ADMIN;
}

export function isStaff(user) {
  return user?.role === ROLES.STAFF;
}

export function isCustomer(user) {
  return user?.role === ROLES.CUSTOMER;
}

export function getRoleBadgeClass(role) {
  switch (role) {
    case ROLES.ADMIN:
      return 'badge-primary';
    case ROLES.STAFF:
      return 'badge-info';
    case ROLES.CUSTOMER:
      return 'badge-success';
    default:
      return 'badge-neutral';
  }
}

export function getStatusBadgeClass(status) {
  const normalized = (status || '').toUpperCase();
  switch (normalized) {
    case 'ACTIVE':
    case 'PAID':
    case 'ACCEPTED':
    case 'CONFIRMED':
      return 'badge-success';
    case 'DRAFT':
    case 'PENDING':
    case 'SENT':
      return 'badge-warning';
    case 'OVERDUE':
    case 'CANCELLED':
    case 'REJECTED':
    case 'FAILED':
    case 'VOID':
      return 'badge-danger';
    case 'PAUSED':
    case 'OPEN':
      return 'badge-info';
    case 'CLOSED':
    case 'EXPIRED':
    default:
      return 'badge-neutral';
  }
}
