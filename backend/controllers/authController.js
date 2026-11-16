import User from '../models/User.js';
import { createAuthToken } from '../config/jwt.js';

const emailPattern = /^\S+@\S+\.\S+$/;
const phonePattern = /^\+?[\d\s()-]{7,20}$/;

function getPublicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt
  };
}

function isDuplicateEmailError(error) {
  return error.code === 11000 && error.keyPattern?.email;
}

export async function register(request, response) {
  const body = request.body && typeof request.body === 'object'
    ? request.body
    : {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!name || !email || !phone || !password) {
    return response.status(400).json({
      success: false,
      message: 'Name, email, phone, and password are required.'
    });
  }

  if (name.length < 2 || name.length > 80 || !emailPattern.test(email)) {
    return response.status(400).json({
      success: false,
      message: 'Enter a valid name and email address.'
    });
  }

  if (!phonePattern.test(phone)) {
    return response.status(400).json({
      success: false,
      message: 'Enter a valid phone number.'
    });
  }

  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return response.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters and no more than 72 bytes.'
    });
  }

  try {
    const user = new User({
      name,
      email,
      phone,
      password,
      role: 'patient'
    });

    await user.save();

    return response.status(201).json({
      success: true,
      message: 'Patient account created successfully.',
      user: getPublicUser(user)
    });
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return response.status(409).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    if (error.name === 'ValidationError') {
      return response.status(400).json({
        success: false,
        message: 'Please check the submitted account details.'
      });
    }

    console.error('Registration failed:', error.message);
    return response.status(500).json({
      success: false,
      message: 'Unable to create the account right now.'
    });
  }
}

export async function login(request, response) {
  const body = request.body && typeof request.body === 'object'
    ? request.body
    : {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    return response.status(400).json({
      success: false,
      message: 'Email and password are required.'
    });
  }

  if (!emailPattern.test(email)) {
    return response.status(400).json({
      success: false,
      message: 'Enter a valid email address.'
    });
  }

  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user || !user.isActive || !(await user.comparePassword(password))) {
      return response.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = createAuthToken(user);

    return response.json({
      success: true,
      message: 'Login successful.',
      token,
      user: getPublicUser(user)
    });
  } catch (error) {
    console.error('Login failed:', error.message);
    return response.status(500).json({
      success: false,
      message: 'Unable to log in right now.'
    });
  }
}

export function getCurrentUser(request, response) {
  return response.json({
    success: true,
    user: getPublicUser(request.user)
  });
}
