import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function cleanupDatabase() {
  console.log('--- DB CLEANUP: RESTRICTING TO MAHARASHTRA ---');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Delete Non-MH Villages
    const villageResult = await mongoose.connection.collection('villages').deleteMany({
      stateName: { $ne: 'Maharashtra' }
    });
    console.log(`Deleted ${villageResult.deletedCount} non-Maharashtra Villages`);

    // 2. Delete Non-MH Talukas
    const talukaResult = await mongoose.connection.collection('talukas').deleteMany({
      stateName: { $ne: 'Maharashtra' }
    });
    console.log(`Deleted ${talukaResult.deletedCount} non-Maharashtra Talukas`);

    // 3. Delete Non-MH Districts
    const districtResult = await mongoose.connection.collection('districts').deleteMany({
      stateName: { $ne: 'Maharashtra' }
    });
    console.log(`Deleted ${districtResult.deletedCount} non-Maharashtra Districts`);

    // 4. Delete Non-MH States
    const stateResult = await mongoose.connection.collection('states').deleteMany({
      name: { $ne: 'Maharashtra' }
    });
    console.log(`Deleted ${stateResult.deletedCount} non-Maharashtra States`);

    // 5. Delete Non-MH Pincodes
    const pincodeResult = await mongoose.connection.collection('pincodes').deleteMany({
      StateName: { $ne: 'MAHARASHTRA' }
    });
    console.log(`Deleted ${pincodeResult.deletedCount} non-Maharashtra Pincodes`);

    console.log('\n--- CLEANUP COMPLETE ---');
    console.log('Database is now restricted to Maharashtra.');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupDatabase();
