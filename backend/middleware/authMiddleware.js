import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

export async function authenticate(request, response, next) {
  const authorizationHeader = request.get('authorization') || '';
  const tokenMatch = authorizationHeader.match(/^Bearer\s+(\S+)$/i);

  if (!tokenMatch) {
    return response.status(401).json({
      success: false,
      message: 'A bearer token is required.'
    });
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error('JWT_SECRET is not configured.');
    return response.status(500).json({
      success: false,
      message: 'Authentication is not configured on the server.'
    });
  }

  let tokenPayload;

  try {
    tokenPayload = jwt.verify(tokenMatch[1], secret);
  } catch {
    return response.status(401).json({
      success: false,
      message: 'The token is invalid or has expired.'
    });
  }

  if (
    !tokenPayload
    || typeof tokenPayload !== 'object'
    || typeof tokenPayload.userId !== 'string'
    || !mongoose.Types.ObjectId.isValid(tokenPayload.userId)
  ) {
    return response.status(401).json({
      success: false,
      message: 'The token is invalid or has expired.'
    });
  }

  try {
    const user = await User.findById(tokenPayload.userId);

    if (!user || !user.isActive) {
      return response.status(401).json({
        success: false,
        message: 'The account is unavailable.'
      });
    }

    request.user = user;
    return next();
  } catch (error) {
    console.error('Token user lookup failed:', error.message);
    return response.status(500).json({
      success: false,
      message: 'Unable to verify the account right now.'
    });
  }
}

export function authenticateIfProvided(request, response, next) {
  if (!request.get('authorization')) {
    return next();
  }

  return authenticate(request, response, next);
}
