import jwt from 'jsonwebtoken';
import { config } from './env';
import { User } from '../types';

export interface TokenPayload {
  id: string;
  username: string;
  role: string;
  job_site_access?: string[];
}

/**
 * Generate access token
 */
export const generateAccessToken = (user: TokenPayload): string => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      job_site_access: user.job_site_access || [],
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
    }
  );
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (user: TokenPayload): string => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
      type: 'refresh',
    },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiresIn,
    }
  );
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as TokenPayload & {
      type?: string;
    };
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Generate password reset token
 */
export const generatePasswordResetToken = (userId: string): string => {
  return jwt.sign(
    {
      id: userId,
      type: 'password_reset',
    },
    config.jwt.secret,
    {
      expiresIn: '1h', // Password reset tokens expire in 1 hour
    }
  );
};

/**
 * Verify password reset token
 */
export const verifyPasswordResetToken = (token: string): { id: string } => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { id: string; type?: string };
    if (decoded.type !== 'password_reset') {
      throw new Error('Invalid token type');
    }
    return { id: decoded.id };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Password reset token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid password reset token');
    }
    throw error;
  }
};











