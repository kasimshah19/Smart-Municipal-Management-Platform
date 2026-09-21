import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Centralized environment configuration.
 * All environment variables are accessed through this module
 * to keep a single source of truth and enable validation.
 */
const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET,
};

/**
 * Validate that all required environment variables are set.
 * Exits the process with a clear error if any are missing.
 */
export const validateEnv = () => {
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('\nPlease check your .env file. See .env.example for reference.');
    process.exit(1);
  }
};

export default env;
