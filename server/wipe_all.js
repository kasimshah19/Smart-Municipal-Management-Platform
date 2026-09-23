import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

async function wipeDatabase() {
  console.log('--- DB FULL WIPE ---');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const collections = ['states', 'divisions', 'districts', 'talukas', 'villages', 'grampanchayats', 'municipalities', 'pincodes'];
    
    for (const coll of collections) {
      await mongoose.connection.collection(coll).deleteMany({});
      console.log(`Wiped ${coll}`);
    }
    
    console.log('Database wiped successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error during wipe:', error);
    process.exit(1);
  }
}
wipeDatabase();
