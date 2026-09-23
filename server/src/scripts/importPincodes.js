import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import csv from 'csv-parser';
import Pincode from '../models/Pincode.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const CSV_FILE_PATH = path.join(__dirname, 'data', 'original', 'india_post_pincodes.csv');

async function importPincodes() {
  console.log('--- PAN-INDIA PINCODE IMPORTER ---');
  
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

    const operations = [];
    let batchCount = 0;
    let totalProcessed = 0;
    
    const processBatch = async () => {
      if (operations.length === 0) return;
      const currentBatch = [...operations];
      operations.length = 0; // clear array
      
      console.log(`Executing bulkWrite with ${currentBatch.length} operations...`);
      try {
        const result = await Pincode.bulkWrite(currentBatch, { ordered: false });
        // result summary is omitted to reduce noise for large datasets
      } catch (err) {
        if (err.writeErrors) {
          // ignore duplicate key errors during upsert
        } else {
          console.error('[BULK WRITE ERROR in Batch]', err.message);
        }
      }
    };

    const stream = fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv());

    stream.on('data', async (row) => {
      // Headers: circlename,regionname,divisionname,officename,pincode,officetype,delivery,district,statename,latitude,longitude
      const pincode = row['pincode'] ? row['pincode'].trim() : null;
      const officeName = row['officename'] ? row['officename'].trim() : null;
      const officeType = row['officetype'] ? row['officetype'].trim() : null;
      const deliveryStatus = row['delivery'] ? row['delivery'].trim() : null;
      const postalDistrictName = row['district'] ? row['district'].trim() : null;
      const postalDivisionName = row['divisionname'] ? row['divisionname'].trim() : null;
      const stateName = row['statename'] ? row['statename'].trim() : null;
      
      // ONLY IMPORT MAHARASHTRA
      if (stateName !== 'MAHARASHTRA') {
        return;
      }
      
      const latRaw = row['latitude'] ? row['latitude'].trim() : 'NA';
      const lonRaw = row['longitude'] ? row['longitude'].trim() : 'NA';

      if (!pincode || !officeName) {
        return; // Skip invalid rows
      }
      
      totalProcessed++;

      let latitude = null;
      let longitude = null;
      if (latRaw !== 'NA' && !isNaN(parseFloat(latRaw))) {
        latitude = parseFloat(latRaw);
      }
      if (lonRaw !== 'NA' && !isNaN(parseFloat(lonRaw))) {
        longitude = parseFloat(lonRaw);
      }

      operations.push({
        updateOne: {
          filter: { pincode, officeName, officeType },
          update: {
            $set: {
              pincode,
              officeName,
              officeType,
              deliveryStatus,
              postalDistrictName,
              postalDivisionName,
              stateName,
              latitude,
              longitude
            }
          },
          upsert: true
        }
      });

      if (operations.length >= 1000) {
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

importPincodes();
