import jwt from 'jsonwebtoken';

export function createAuthToken(user) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return jwt.sign(
    { userId: user._id.toString() },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}
