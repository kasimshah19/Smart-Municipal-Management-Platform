import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../src/models/User.js';
import Municipality from '../src/models/Municipality.js';
import Ward from '../src/models/Ward.js';
import Department from '../src/models/Department.js';
import { ROLES } from '../src/constants/roles.js';
import * as authService from '../src/services/auth.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

const createUser = async (email, firstName, lastName, role, scopes = {}) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    console.log(`User ${email} already exists. Skipping.`);
    return existingUser;
  }

  const user = new User({
    firstName,
    lastName,
    email,
    password: 'Password123!', // Note: Service handles hashing
    role,
    isEmailVerified: true,
    ...scopes
  });
  
  // Hash password manually here for seeding bypassing authService if easier, 
  // or use authService (which forces CITIZEN for register, so we can't use registerUser directly).
  const salt = await import('bcryptjs').then(m => m.genSalt(10));
  user.password = await import('bcryptjs').then(m => m.hash(user.password, salt));

  await user.save();
  console.log(`Created user: ${email} (${role})`);
  return user;
};

const seedUsers = async () => {
  await connectDB();

  try {
    const municipality = await Municipality.findOne();
    if (!municipality) {
      console.log('No municipality found. Please run seed-municipality-demo.js first.');
      process.exit(1);
    }

    const ward = await Ward.findOne({ municipalityId: municipality._id });
    const department = await Department.findOne({ municipalityId: municipality._id });

    // Seed Municipal Admin
    await createUser(
      `admin@${municipality.name.toLowerCase().replace(/\s+/g, '')}.gov.in`,
      'Municipal',
      'Admin',
      ROLES.MUNICIPAL_ADMIN,
      { municipalityId: municipality._id }
    );

    // Seed Ward Officer
    if (ward) {
      await createUser(
        `ward.officer@${municipality.name.toLowerCase().replace(/\s+/g, '')}.gov.in`,
        'Ward',
        'Officer',
        ROLES.WARD_OFFICER,
        { municipalityId: municipality._id, wardId: ward._id }
      );
    }

    // Seed Department Officer
    if (department) {
      await createUser(
        `dept.officer@${municipality.name.toLowerCase().replace(/\s+/g, '')}.gov.in`,
        'Department',
        'Officer',
        ROLES.DEPARTMENT_OFFICER,
        { municipalityId: municipality._id, departmentId: department._id }
      );
    }

    // Seed Worker
    await createUser(
      `worker@${municipality.name.toLowerCase().replace(/\s+/g, '')}.gov.in`,
      'Field',
      'Worker',
      ROLES.WORKER,
      { municipalityId: municipality._id }
    );

    // Seed Citizen
    await createUser(
      `citizen@example.com`,
      'Local',
      'Citizen',
      ROLES.CITIZEN
    );

    console.log('User seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedUsers();
