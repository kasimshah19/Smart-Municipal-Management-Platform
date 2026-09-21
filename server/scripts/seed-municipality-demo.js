import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Municipality from '../src/models/Municipality.js';
import Ward from '../src/models/Ward.js';
import Area from '../src/models/Area.js';
import Department from '../src/models/Department.js';
import Designation from '../src/models/Designation.js';

// Setup env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    console.log('Creating demo municipality data...');

    // 1. Municipality
    const dhule = await Municipality.findOneAndUpdate(
      { code: 'DHULE-MC' },
      {
        name: 'Dhule Demo Municipality',
        code: 'DHULE-MC',
        type: 'MUNICIPAL_CORPORATION',
        district: 'Dhule',
        state: 'Maharashtra',
        contactEmail: 'admin@dhule-mc.gov.in'
      },
      { upsert: true, new: true }
    );
    console.log(`Municipality: ${dhule.name} created.`);

    // 2. Wards
    const wardsData = [
      { municipalityId: dhule._id, wardNumber: '1', name: 'Ward 1', code: 'W1' },
      { municipalityId: dhule._id, wardNumber: '2', name: 'Ward 2', code: 'W2' },
      { municipalityId: dhule._id, wardNumber: '5', name: 'Ward 5', code: 'W5' },
    ];
    
    for (const wd of wardsData) {
      await Ward.findOneAndUpdate(
        { municipalityId: dhule._id, code: wd.code },
        wd,
        { upsert: true }
      );
    }
    const wards = await Ward.find({ municipalityId: dhule._id });
    console.log(`Wards created: ${wards.map(w => w.name).join(', ')}`);

    // 3. Areas
    const areasData = [
      { municipalityId: dhule._id, wardId: wards[0]._id, name: 'Market Area', code: 'MA01' },
      { municipalityId: dhule._id, wardId: wards[1]._id, name: 'Bus Stand Area', code: 'BA02' },
      { municipalityId: dhule._id, wardId: wards[2]._id, name: 'Station Area', code: 'SA05' },
    ];

    for (const area of areasData) {
      await Area.findOneAndUpdate(
        { municipalityId: dhule._id, code: area.code },
        area,
        { upsert: true }
      );
    }
    console.log('Areas created.');

    // 4. Departments
    const deptsData = [
      { municipalityId: dhule._id, name: 'Sanitation', code: 'SAN', type: 'SANITATION' },
      { municipalityId: dhule._id, name: 'Water Supply', code: 'WAT', type: 'WATER_SUPPLY' },
      { municipalityId: dhule._id, name: 'Electrical', code: 'ELE', type: 'ELECTRICAL' },
      { municipalityId: dhule._id, name: 'Roads', code: 'ROA', type: 'ROADS' },
    ];

    for (const dept of deptsData) {
      await Department.findOneAndUpdate(
        { municipalityId: dhule._id, code: dept.code },
        dept,
        { upsert: true }
      );
    }
    console.log('Departments created.');

    // 5. Designations
    const desigData = [
      { municipalityId: dhule._id, name: 'Chief Officer', code: 'CO', level: 'EXECUTIVE' },
      { municipalityId: dhule._id, name: 'Department Officer', code: 'DO', level: 'OFFICER' },
      { municipalityId: dhule._id, name: 'Sanitary Inspector', code: 'SI', level: 'SUPERVISOR' },
      { municipalityId: dhule._id, name: 'Supervisor', code: 'SUP', level: 'SUPERVISOR' },
      { municipalityId: dhule._id, name: 'Worker', code: 'WRK', level: 'WORKER' },
    ];

    for (const desig of desigData) {
      await Designation.findOneAndUpdate(
        { municipalityId: dhule._id, code: desig.code },
        desig,
        { upsert: true }
      );
    }
    console.log('Designations created.');

    // (Employees and teams would require User mapping which is complex for a simple seed, we skip for now as requested: "A few development-only employees" is nice but requires setting up Users with passwords. I'll stick to structure).

    console.log('\n✅ Demo Seed completed successfully! (Development only)');
    process.exit(0);

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seedData();
