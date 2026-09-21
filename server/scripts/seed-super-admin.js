import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/User.js';
import { ROLES } from '../src/constants/roles.js';

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env');
    }
    
    if (!process.env.SUPER_ADMIN_EMAIL || !process.env.SUPER_ADMIN_PASSWORD) {
      throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be defined in .env');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminEmail = process.env.SUPER_ADMIN_EMAIL.toLowerCase().trim();

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Super Admin already exists with this email.');
      process.exit(0);
    }

    const superAdmin = new User({
      firstName: 'System',
      lastName: 'Admin',
      email: adminEmail,
      password: process.env.SUPER_ADMIN_PASSWORD,
      role: ROLES.SUPER_ADMIN,
      isEmailVerified: true,
      isActive: true,
    });

    await superAdmin.save();
    console.log(`✅ Super Admin created successfully with email: ${adminEmail}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding Super Admin:', error.message);
    process.exit(1);
  }
};

seedSuperAdmin();
