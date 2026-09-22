import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Municipality from './src/models/Municipality.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const MAHARASHTRA_DISTRICTS = [
  "Mumbai City", "Mumbai Suburban", "Thane", "Palghar", "Raigad",
  "Ratnagiri", "Sindhudurg", "Nashik", "Dhule", "Nandurbar",
  "Jalgaon", "Ahilyanagar", "Pune", "Satara", "Sangli",
  "Kolhapur", "Solapur", "Chhatrapati Sambhajinagar", "Jalna", "Beed",
  "Dharashiv", "Latur", "Nanded", "Parbhani", "Hingoli",
  "Amravati", "Akola", "Buldhana", "Washim", "Yavatmal",
  "Nagpur", "Wardha", "Bhandara", "Gondia", "Chandrapur", "Gadchiroli"
];

async function checkDistricts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-municipal');
    console.log('Connected to DB');
    
    const allMunis = await Municipality.find({});
    console.log(`Found ${allMunis.length} municipalities`);
    
    let invalidCount = 0;
    for (const m of allMunis) {
      if (m.district && !MAHARASHTRA_DISTRICTS.includes(m.district)) {
        console.log(`Invalid district found: ${m.district} in Municipality ${m.name}`);
        invalidCount++;
      }
    }
    
    if (invalidCount === 0) {
      console.log('No migration required. All existing districts are valid or empty.');
    } else {
      console.log(`Migration required for ${invalidCount} records.`);
    }
  } catch (error) {
    console.error('Error connecting to DB or querying:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDistricts();
