import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User.js';

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const roles = ['SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'DEPARTMENT_OFFICER', 'WARD_OFFICER', 'WORKER', 'CITIZEN'];
    
    console.log("=== TEST CREDENTIALS ===");
    console.log("Password for all accounts will be set to: password123\n");
    
    for (const role of roles) {
      const user = await User.findOne({ role });
      if (user) {
        user.password = "password123";
        await user.save();
        console.log(`Role: ${role.padEnd(20)} | Email: ${user.email}`);
      } else {
        console.log(`Role: ${role.padEnd(20)} | No user found in DB!`);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
