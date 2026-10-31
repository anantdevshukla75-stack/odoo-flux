import AppError from '../utils/appError.js';

/**
 * Role-based authorization middleware factory
 * @param {...string} allowedRoles - e.g. 'ADMIN', 'STAFF', 'CUSTOMER'
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required before checking permissions', null, 'UNAUTHENTICATED'));
    }

    // Flatten if an array was passed
    const roles = allowedRoles.flat();

    if (!roles.includes(req.user.role)) {
      return next(AppError.forbidden(
        `Access denied. Role '${req.user.role}' is not authorized to perform this operation.`,
        { requiredRoles: roles, currentRole: req.user.role },
        'INSUFFICIENT_PERMISSIONS'
      ));
    }

    next();
  };
}

export default authorize;
