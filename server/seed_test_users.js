import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check and create missing users
    const dummyUsers = [
      { role: 'SUPER_ADMIN', email: 'admin@smartmunicipal.com', firstName: 'System', lastName: 'Admin' },
      { role: 'MUNICIPAL_ADMIN', email: 'municipal_admin@example.com', firstName: 'Muni', lastName: 'Admin' },
      { role: 'DEPARTMENT_OFFICER', email: 'dept_officer@example.com', firstName: 'Dept', lastName: 'Officer' },
      { role: 'WARD_OFFICER', email: 'ward_officer@example.com', firstName: 'Ward', lastName: 'Officer' },
      { role: 'WORKER', email: 'worker@example.com', firstName: 'Field', lastName: 'Worker' },
      { role: 'CITIZEN', email: 'citizen@example.com', firstName: 'Test', lastName: 'Citizen' },
    ];

    console.log("=== TEST CREDENTIALS ===");
    console.log("Password for all test accounts is: password123\n");
    
    for (const data of dummyUsers) {
      let user = await User.findOne({ role: data.role });
      if (!user) {
        user = new User({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: "password123", // Will be hashed automatically by pre-save hook
          role: data.role,
          isActive: true,
          isEmailVerified: true
        });
        await user.save();
        console.log(`Role: ${data.role.padEnd(20)} | Email: ${data.email} (Newly Created)`);
      } else {
        // Reset password to password123 for existing users to make testing easy
        user.password = "password123";
        await user.save();
        console.log(`Role: ${data.role.padEnd(20)} | Email: ${user.email} (Existing)`);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
