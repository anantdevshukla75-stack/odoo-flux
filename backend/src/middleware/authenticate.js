import { verifyAccessToken } from '../utils/jwt.js';
import prisma from '../config/database.js';
import AppError from '../utils/appError.js';

/**
 * Authentication middleware
 * Reads Bearer token from Authorization header, verifies signature & expiry,
 * checks user active status in database, and attaches user info to req.user.
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Authentication token is missing or malformed', null, 'MISSING_TOKEN');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw AppError.unauthorized('Authentication token is missing', null, 'MISSING_TOKEN');
    }

    // Verify token signature and expiration
    const decoded = verifyAccessToken(token);

    // Verify account existence and active status in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true
      }
    });

    if (!user) {
      throw AppError.unauthorized('User account belonging to this token no longer exists', null, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw AppError.forbidden('User account has been deactivated. Contact an administrator.', null, 'ACCOUNT_DEACTIVATED');
    }

    // Attach validated user to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export default authenticate;
