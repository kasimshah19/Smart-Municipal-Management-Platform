import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User.js';

dotenv.config();

const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminEmail = process.env.SUPER_ADMIN_EMAIL.toLowerCase().trim();
    const user = await User.findOne({ email: adminEmail });

    if (!user) {
      console.log('User not found.');
    } else {
      user.password = process.env.SUPER_ADMIN_PASSWORD;
      user.isActive = true;
      user.isEmailVerified = true;
      await user.save();
      console.log('Password reset to', process.env.SUPER_ADMIN_PASSWORD);
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetPassword();
