import AppError from './appError.js';

/**
 * Enforces customer data ownership.
 * Allows ADMIN and STAFF to access any customer record,
 * but restricts CUSTOMER users strictly to their own records.
 * 
 * @param {object} currentUser - Authenticated user from req.user
 * @param {string} targetUserId - The owner user ID of the resource
 * @param {string} [resourceName='resource'] - Name of resource for error messaging
 */
export function assertCustomerOwnership(currentUser, targetUserId, resourceName = 'resource') {
  if (!currentUser) {
    throw AppError.unauthorized('Authentication required', null, 'UNAUTHENTICATED');
  }

  // Administrators and Staff have elevated operational permissions
  if (currentUser.role === 'ADMIN' || currentUser.role === 'STAFF') {
    return true;
  }

  // Customer role: strictly check user ID equality
  if (currentUser.role === 'CUSTOMER' && currentUser.id === targetUserId) {
    return true;
  }

  // Disallow access without disclosing resource existence
  throw AppError.forbidden(
    `Access denied. You do not have permission to view or manage this ${resourceName}.`,
    null,
    'OWNERSHIP_CHECK_FAILED'
  );
}

/**
 * Resolves the effective customer ID for a query.
 * If user is CUSTOMER, forces query to use currentUser.id regardless of request input.
 * If user is ADMIN or STAFF, allows optional customerId filter.
 * 
 * @param {object} currentUser - Authenticated user from req.user
 * @param {string} [requestedCustomerId] - Optional ID passed in query/body
 * @returns {string|undefined}
 */
export function getEffectiveCustomerId(currentUser, requestedCustomerId) {
  if (currentUser.role === 'CUSTOMER') {
    // Zero-trust: always enforce current authenticated customer's ID
    return currentUser.id;
  }

  // Staff and Admin can view specific customer or all
  return requestedCustomerId || undefined;
}

export default {
  assertCustomerOwnership,
  getEffectiveCustomerId
};
