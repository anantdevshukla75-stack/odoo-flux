import jwt from 'jsonwebtoken';
import env from '../config/environment.js';
import AppError from './appError.js';

/**
 * Signs a short-lived access token
 * @param {{ id: string, email: string, role: string, fullName: string }} payload
 * @returns {string}
 */
export function signAccessToken(payload) {
  return jwt.sign(
    {
      sub: payload.id,
      email: payload.email,
      role: payload.role,
      fullName: payload.fullName
    },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      issuer: 'brightloop-api',
      audience: 'brightloop-client'
    }
  );
}

/**
 * Signs a refresh token
 * @param {{ id: string }} payload
 * @returns {string}
 */
export function signRefreshToken(payload) {
  return jwt.sign(
    {
      sub: payload.id
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      issuer: 'brightloop-api',
      audience: 'brightloop-client'
    }
  );
}

/**
 * Verifies an access token
 * @param {string} token
 * @returns {object}
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: 'brightloop-api',
      audience: 'brightloop-client'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw AppError.unauthorized('Access token has expired', null, 'TOKEN_EXPIRED');
    }
    throw AppError.unauthorized('Invalid or malformed access token', null, 'INVALID_TOKEN');
  }
}

/**
 * Verifies a refresh token
 * @param {string} token
 * @returns {object}
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'brightloop-api',
      audience: 'brightloop-client'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw AppError.unauthorized('Refresh token has expired', null, 'REFRESH_TOKEN_EXPIRED');
    }
    throw AppError.unauthorized('Invalid or malformed refresh token', null, 'INVALID_REFRESH_TOKEN');
  }
}
