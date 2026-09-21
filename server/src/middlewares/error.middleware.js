import env from '../config/env.js';

/**
 * Handle requests to undefined routes.
 */
export const notFoundHandler = (_req, res, _next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
};

/**
 * Global error handler middleware.
 * In production, internal error details are hidden from the client.
 */
// eslint-disable-next-line no-unused-vars
export const globalErrorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
