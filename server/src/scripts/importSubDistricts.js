import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import csv from 'csv-parser';
import Taluka from '../models/Taluka.js';
import District from '../models/District.js';
import State from '../models/State.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const CSV_FILE_PATH = path.join(__dirname, 'data', 'subDistricts.csv');

async function importSubDistricts() {
  console.log('--- PAN-INDIA SUB-DISTRICT IMPORTER ---');
  
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is missing in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    if (!fs.existsSync(CSV_FILE_PATH)) {
      console.error(`CSV file not found at: ${CSV_FILE_PATH}`);
      process.exit(1);
    }

    // Pre-load states and districts for fast memory lookup
    const states = await State.find().lean();
    const stateMap = {};
    states.forEach(s => stateMap[s.lgdCode] = s);
    
    const districts = await District.find().lean();
    const districtMap = {};
    districts.forEach(d => districtMap[d.lgdCode] = d);
    
    console.log(`Loaded ${states.length} states and ${districts.length} districts into memory.`);

    const operations = [];
    let batchCount = 0;
    let totalProcessed = 0;
    
    const processBatch = async () => {
      if (operations.length === 0) return;
      const currentBatch = [...operations];
      operations.length = 0; // clear array
      
      console.log(`Executing bulkWrite with ${currentBatch.length} operations...`);
      try {
        const result = await Taluka.bulkWrite(currentBatch, { ordered: false });
        console.log(`BulkWrite result: inserted: ${result.upsertedCount}, modified: ${result.modifiedCount}`);
      } catch (err) {
        console.error('[BULK WRITE ERROR in Batch]', err.message);
        if (err.writeErrors) {
          console.error(`Number of write errors: ${err.writeErrors.length}`);
          console.error(`- ${err.writeErrors[0].errmsg}`);
        }
      }
    };

    const stream = fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv({ skipLines: 1 })); // Skip the title row "All Sub-Districts of India,,,"

    stream.on('data', async (row) => {
      // Keys from LGD CSV: State Code, District Code, Sub-district Code, Sub-district Name
      const stateLgdCode = row['State Code'] ? row['State Code'].trim() : null;
      
      // ONLY IMPORT MAHARASHTRA
      if (stateLgdCode !== '27') {
        return;
      }
      
      const districtLgdCode = row['District Code'] ? row['District Code'].trim() : null;
      const subDistrictLgdCode = row['Sub-district Code'] ? row['Sub-district Code'].trim() : null;
      const name = row['Sub-district Name'] ? row['Sub-district Name'].trim() : null;

      if (!subDistrictLgdCode || !name || !districtLgdCode) {
        return; // Skip invalid rows
      }
      
      totalProcessed++;

      const district = districtMap[districtLgdCode];
      if (!district) {
        console.warn(`Warning: District with LGD Code ${districtLgdCode} not found for Taluka ${name}. Skipping.`);
        return;
      }
      
      const state = stateMap[stateLgdCode];

      // Build update operation
      const code = name.substring(0, 3).toUpperCase();
      
      operations.push({
        updateOne: {
          filter: { lgdCode: subDistrictLgdCode },
          update: {
            $set: {
              name,
              lgdCode: subDistrictLgdCode,
              code,
              districtId: district._id,
              districtName: district.name,
              stateId: state ? state._id : district.stateId,
              state: state ? state.name : 'India',
              type: 'TALUKA',
              isActive: true
            }
          },
          upsert: true
        }
      });

      if (operations.length >= 500) {
        stream.pause();
        await processBatch();
        stream.resume();
      }
    });

    stream.on('end', async () => {
      if (operations.length > 0) {
        await processBatch();
      }
      console.log('--- IMPORT REPORT ---');
      console.log(`Total Records Processed: ${totalProcessed}`);
      console.log('---------------------');
      process.exit(0);
    });
    
    stream.on('error', (err) => {
      console.error('CSV Stream Error:', err);
      process.exit(1);
    });

  } catch (error) {
    console.error('Fatal Error:', error);
    process.exit(1);
  }
}

importSubDistricts();
