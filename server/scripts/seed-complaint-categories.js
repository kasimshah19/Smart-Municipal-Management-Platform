import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Municipality from '../src/models/Municipality.js';
import Department from '../src/models/Department.js';
import ComplaintCategory from '../src/models/ComplaintCategory.js';

// Setup env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const dhule = await Municipality.findOne({ code: 'DHULE-MC' });
    if (!dhule) {
      console.log('Please run seed-municipality-demo.js first.');
      process.exit(1);
    }

    const sanitation = await Department.findOne({ municipalityId: dhule._id, code: 'SAN' });
    const water = await Department.findOne({ municipalityId: dhule._id, code: 'WAT' });
    const electrical = await Department.findOne({ municipalityId: dhule._id, code: 'ELE' });
    const roads = await Department.findOne({ municipalityId: dhule._id, code: 'ROA' });

    if (!sanitation || !water || !electrical || !roads) {
       console.log('Departments missing, run seed-municipality-demo.js first.');
       process.exit(1);
    }

    console.log('Creating demo complaint categories...');

    const categoriesData = [
      // Sanitation
      { code: 'GARBAGE', name: 'Garbage Collection Issue', departmentId: sanitation._id, defaultPriority: 'MEDIUM' },
      { code: 'DEAD_ANIMAL', name: 'Dead Animal Removal', departmentId: sanitation._id, defaultPriority: 'HIGH' },
      { code: 'DRAINAGE', name: 'Blocked Drainage/Gutter', departmentId: sanitation._id, defaultPriority: 'HIGH' },
      
      // Water
      { code: 'NO_WATER', name: 'No Water Supply', departmentId: water._id, defaultPriority: 'CRITICAL' },
      { code: 'PIPE_LEAK', name: 'Pipeline Leakage', departmentId: water._id, defaultPriority: 'HIGH' },
      { code: 'CONTAMINATED', name: 'Contaminated Water', departmentId: water._id, defaultPriority: 'CRITICAL' },
      
      // Electrical
      { code: 'STREETLIGHT', name: 'Streetlight Not Working', departmentId: electrical._id, defaultPriority: 'MEDIUM' },
      { code: 'OPEN_WIRE', name: 'Open Electrical Wires', departmentId: electrical._id, defaultPriority: 'CRITICAL' },
      
      // Roads
      { code: 'POTHOLE', name: 'Pothole on Road', departmentId: roads._id, defaultPriority: 'MEDIUM' },
      { code: 'ROAD_DAMAGE', name: 'Major Road Damage', departmentId: roads._id, defaultPriority: 'HIGH' },
    ];

    for (const cat of categoriesData) {
      await ComplaintCategory.findOneAndUpdate(
        { municipalityId: dhule._id, code: cat.code },
        { ...cat, municipalityId: dhule._id },
        { upsert: true }
      );
    }
    
    console.log(`Created ${categoriesData.length} Complaint Categories.`);
    console.log('\n✅ Demo Complaint Categories Seed completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seedData();
