import crypto from 'crypto';
import { findUserByEmail, createUser, findUserById } from './user.service.js';
import { Profile } from '../models/Profile.js';
import { generateToken, generateRandomToken } from '../utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service.js';
import { ROLES } from '../constants/roles.js';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const registerUser = async (userData) => {
  const existingUser = await findUserByEmail(userData.email);
  if (existingUser) {
    throw new Error('Email is already registered');
  }

  // Force role to CITIZEN for public registration to prevent privilege escalation
  userData.role = ROLES.CITIZEN;

  const user = await createUser(userData);

  const verifyToken = generateRandomToken();
  user.emailVerificationToken = hashToken(verifyToken);
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await user.save({ validateBeforeSave: false });

  // Create an empty profile associated with the new user
  await Profile.create({ userId: user._id });

  // Try to send email, but don't fail registration if it fails
  try {
    await sendVerificationEmail(user.email, verifyToken);
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }

  return user;
};

export const loginUser = async (email, password) => {
  const user = await findUserByEmail(email, true);
  if (!user || !(await user.comparePassword(password))) {
    throw new Error('Invalid email or password');
  }
  
  if (!user.isActive) {
    throw new Error('Your account has been deactivated. Please contact support.');
  }

  // Update last login
  user.lastLoginAt = Date.now();
  await user.save({ validateBeforeSave: false });

  const token = generateToken({ userId: user._id, role: user.role });

  // Remove password from returned user object
  user.password = undefined;
  
  return { user, token };
};

export const verifyEmail = async (token) => {
  const hashedToken = hashToken(token);
  
  const user = await import('../models/User.js').then(m => m.User).then(User => 
    User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    })
  );

  if (!user) {
    throw new Error('Token is invalid or has expired');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  return user;
};

export const forgotPassword = async (email) => {
  const user = await findUserByEmail(email);
  if (!user) return; // Generic response for security

  const resetToken = generateRandomToken();
  user.passwordResetToken = hashToken(resetToken);
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  try {
    await sendPasswordResetEmail(user.email, resetToken);
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.error('Failed to send reset email:', error);
  }
};

export const resetPassword = async (token, newPassword) => {
  const hashedToken = hashToken(token);
  
  const user = await import('../models/User.js').then(m => m.User).then(User => 
    User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    })
  );

  if (!user) {
    throw new Error('Token is invalid or has expired');
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.passwordChangedAt = Date.now();
  await user.save(); // Needs validation for password length

  return user;
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await findUserById(userId).select('+password');
  
  if (!(await user.comparePassword(currentPassword))) {
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  user.passwordChangedAt = Date.now();
  await user.save();
};
