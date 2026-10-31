import { verifyAccessToken } from '../utils/jwt.js';
import prisma from '../config/database.js';

/**
 * Optional authentication middleware:
 * If an Authorization header is present, it validates the token and attaches req.user.
 * If no token is provided, it proceeds with req.user = null (guest / public access).
 */
export async function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = verifyAccessToken(token);
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

    if (user && user.isActive) {
      req.user = user;
    } else {
      req.user = null;
    }
  } catch (err) {
    // If token is invalid or expired, continue as guest
    req.user = null;
  }

  return next();
}

export default optionalAuthenticate;
