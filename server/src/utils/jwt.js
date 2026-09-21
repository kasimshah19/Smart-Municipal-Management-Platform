import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || '1d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

// Generates a random alphanumeric token for email verification / password reset
export const generateRandomToken = () => {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
};
