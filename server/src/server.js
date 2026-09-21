import env, { validateEnv } from './config/env.js';
import connectDB from './config/db.js';
import app from './app.js';

/**
 * Server entry point.
 *
 * Startup sequence:
 *   1. Validate environment variables
 *   2. Connect to MongoDB
 *   3. Start Express server
 */
const startServer = async () => {
  // 1. Validate required environment variables
  validateEnv();

  // 2. Connect to MongoDB
  await connectDB();

  // 3. Start listening
  const PORT = env.PORT;
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${PORT}`);
  });
};

startServer();
