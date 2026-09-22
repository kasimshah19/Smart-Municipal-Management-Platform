import * as authService from '../services/auth.service.js';

export const register = async (req, res) => {
  try {
    // Prevent privilege escalation: Strip sensitive scope fields from public registration
    const { role, municipalityId, wardId, departmentId, ...safeUserData } = req.body;
    
    const user = await authService.registerUser(safeUserData);
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const { user, token } = await authService.loginUser(email, password);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
        }
      }
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  // Since we are using stateless JWT, we rely on the client to remove the token.
  res.status(200).json({ success: true, message: 'Logout successful' });
};

export const getMe = async (req, res) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
      }
    }
  });
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token is required' });

    await authService.verifyEmail(token);
    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    await authService.forgotPassword(email);
    // Generic response for security
    res.status(200).json({ success: true, message: 'If an account exists, password reset instructions have been sent.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error processing request' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ success: false, message: 'Token and new password are required' });

    await authService.resetPassword(token, newPassword);
    res.status(200).json({ success: true, message: 'Password has been reset successfully. Please log in.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Current and new passwords are required' });

    await authService.changePassword(req.user._id, currentPassword, newPassword);
    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
