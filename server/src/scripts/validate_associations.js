import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import Municipality from '../models/Municipality.js';
import Ward from '../models/Ward.js';
import Department from '../models/Department.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function validateSystem() {
  console.log('Starting System Validation Suite...');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
    
    let errors = 0;
    
    // Check Users
    const users = await User.find({});
    console.log(`Validating ${users.length} Users...`);
    for (const user of users) {
      if (user.municipalityId) {
        const m = await Municipality.findById(user.municipalityId);
        if (!m) {
          console.error(`❌ User ${user._id} has invalid municipalityId ${user.municipalityId}`);
          errors++;
        }
      }
      if (user.wardId) {
        const w = await Ward.findById(user.wardId);
        if (!w) {
          console.error(`❌ User ${user._id} has invalid wardId ${user.wardId}`);
          errors++;
        }
      }
    }
    
    // Check Complaints
    const complaints = await Complaint.find({});
    console.log(`Validating ${complaints.length} Complaints...`);
    for (const complaint of complaints) {
      if (complaint.municipality) {
        const m = await Municipality.findById(complaint.municipality);
        if (!m) {
          console.error(`❌ Complaint ${complaint._id} has invalid municipality ${complaint.municipality}`);
          errors++;
        }
      }
      if (complaint.ward) {
        const w = await Ward.findById(complaint.ward);
        if (!w) {
          console.error(`❌ Complaint ${complaint._id} has invalid ward ${complaint.ward}`);
          errors++;
        }
      }
    }
    
    if (errors === 0) {
      console.log('✅ Validation passed! No broken associations found.');
    } else {
      console.log(`❌ Validation failed with ${errors} broken associations.`);
    }
    
  } catch (error) {
    console.error('Validation error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
    process.exit(0);
  }
}

validateSystem();
