import mongoose from 'mongoose';
import env from './env.js';

/**
 * Establish connection to MongoDB using Mongoose.
 * Logs the connection host on success.
 * Exits the process gracefully on failure.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
