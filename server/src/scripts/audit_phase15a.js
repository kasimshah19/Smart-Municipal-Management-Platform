import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Pincode from '../models/Pincode.js';
import District from '../models/geography/District.js';
import Taluka from '../models/geography/Taluka.js';
import Municipality from '../models/geography/Municipality.js';
import GramPanchayat from '../models/geography/GramPanchayat.js';
import Division from '../models/geography/Division.js';

async function runAudit() {
  console.log('=== PHASE 15A: BACKEND AUDIT ===\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to DB');

    // 1. Regression Check
    console.log('\n--- 1. DATABASE REGRESSION ---');
    const divCount = await Division.countDocuments();
    const distCount = await District.countDocuments();
    const talCount = await Taluka.countDocuments();
    const munCount = await Municipality.countDocuments();
    const gpCount = await GramPanchayat.countDocuments();
    
    console.log(`Divisions: ${divCount} (Expected 6) -> ${divCount === 6 ? '✅' : '❌'}`);
    console.log(`Districts: ${distCount} (Expected 36) -> ${distCount === 36 ? '✅' : '❌'}`);
    console.log(`Talukas: ${talCount} (Expected 359) -> ${talCount === 359 ? '✅' : '❌'}`);
    console.log(`Municipalities: ${munCount} (Expected 395) -> ${munCount === 395 ? '✅' : '❌'}`);
    console.log(`Gram Panchayats: ${gpCount} (Expected 28087) -> ${gpCount === 28087 ? '✅' : '❌'}`);

    const pinCount = await Pincode.countDocuments();
    const uniquePins = (await Pincode.distinct('pincode')).length;
    const uniqueOffices = (await Pincode.distinct('officeName')).length;

    console.log(`\nPincode Records: ${pinCount} (Expected 13762) -> ${pinCount === 13762 ? '✅' : '❌'}`);
    console.log(`Unique Pincodes: ${uniquePins} (Expected 1600) -> ${uniquePins === 1600 ? '✅' : '❌'}`);
    console.log(`Unique Post Offices: ${uniqueOffices} (Expected 11876) -> ${uniqueOffices === 11876 ? '✅' : '❌'}`);

    // 2. Admin Search Test (Direct query level)
    console.log('\n--- 2. ADMIN PAGINATION/SEARCH ---');
    const searchRegex = new RegExp('400001', 'i');
    const offices400001 = await Pincode.find({ pincode: searchRegex }).lean();
    console.log(`Offices for 400001: ${offices400001.length}`);
    offices400001.forEach(o => console.log(`  - ${o.officeName} (${o.officeType})`));

    const searchByName = new RegExp('Dharavi', 'i');
    const officesDharavi = await Pincode.find({ officeName: searchByName }).lean();
    console.log(`\nOffices matching 'Dharavi': ${officesDharavi.length}`);
    officesDharavi.forEach(o => console.log(`  - ${o.officeName} (${o.pincode})`));

  } catch (err) {
    console.error('Audit Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from DB');
  }
}

runAudit();
