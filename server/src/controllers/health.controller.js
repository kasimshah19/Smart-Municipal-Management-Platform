import env from '../config/env.js';

/**
 * @desc    Health check endpoint
 * @route   GET /api/health
 * @access  Public
 */
export const getHealth = (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Municipal Platform API is running',
    environment: env.NODE_ENV,
  });
};
