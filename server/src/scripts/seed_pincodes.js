import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Pincode from '../models/Pincode.js';

// Setup environment and paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const BATCH_SIZE = 5000;
const DATA_FILE = path.join(__dirname, 'data', 'original', 'india_post_pincodes.csv');

async function seedPincodes() {
  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected successfully.');
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }

  if (!fs.existsSync(DATA_FILE)) {
    console.error(`Data file not found at ${DATA_FILE}`);
    process.exit(1);
  }

  let batch = [];
  let totalProcessed = 0;
  let totalInserted = 0;

  console.log('Reading CSV and seeding Maharashtra pincodes...');

  return new Promise((resolve, reject) => {
    fs.createReadStream(DATA_FILE)
      .pipe(csv())
      .on('data', (row) => {
        totalProcessed++;
        
        // Filter only Maharashtra records
        if (row.statename && row.statename.trim().toUpperCase() === 'MAHARASHTRA') {
          const pincodeStr = row.pincode ? row.pincode.trim() : '';
          const officeNameStr = row.officename ? row.officename.trim() : '';
          const officeTypeStr = row.officetype ? row.officetype.trim() : '';
          
          let lat = null;
          let lon = null;
          if (row.latitude && row.latitude.trim() !== 'NA' && !isNaN(parseFloat(row.latitude))) {
            lat = parseFloat(row.latitude);
          }
          if (row.longitude && row.longitude.trim() !== 'NA' && !isNaN(parseFloat(row.longitude))) {
            lon = parseFloat(row.longitude);
          }

          batch.push({
            updateOne: {
              filter: { pincode: pincodeStr, officeName: officeNameStr, officeType: officeTypeStr },
              update: {
                $set: {
                  pincode: pincodeStr,
                  officeName: officeNameStr,
                  officeType: officeTypeStr,
                  deliveryStatus: row.delivery ? row.delivery.trim() : '',
                  postalTalukaName: row.district ? row.district.trim().toUpperCase() : '',
                  postalDistrictName: row.district ? row.district.trim().toUpperCase() : '',
                  postalDivisionName: row.divisionname ? row.divisionname.trim().toUpperCase() : '',
                  stateName: 'MAHARASHTRA',
                  latitude: lat,
                  longitude: lon,
                }
              },
              upsert: true
            }
          });
        }

        if (batch.length >= BATCH_SIZE) {
          // Pause stream while we write to DB
          fs.createReadStream(DATA_FILE).pause();
          
          const currentBatch = [...batch];
          batch = [];
          
          Pincode.bulkWrite(currentBatch, { ordered: false })
            .then(res => {
              totalInserted += (res.insertedCount || 0);
              console.log(`Processed ${totalProcessed} rows. Inserted ${totalInserted} MH pincodes so far...`);
              fs.createReadStream(DATA_FILE).resume();
            })
            .catch(err => {
              console.error(`Batch error at row ${totalProcessed}:`, err.message || 'Unknown Error');
              // Resume stream even on error to keep processing valid rows
              fs.createReadStream(DATA_FILE).resume();
            });
        }
      })
      .on('end', async () => {
        // Process any remaining items in the batch
        if (batch.length > 0) {
          try {
            const res = await Pincode.bulkWrite(batch, { ordered: false });
            totalInserted += (res.insertedCount || 0);
            console.log(`Processed ${totalProcessed} rows. Inserted ${totalInserted} MH pincodes.`);
          } catch (err) {
            console.error('Error during final bulkWrite:', err.message || 'Unknown Error');
          }
        }
        
        console.log(`✅ Seeding complete! Total Maharashtra Pincodes inserted: ${totalInserted}`);
        await mongoose.connection.close();
        resolve();
      })
      .on('error', (error) => {
        console.error('Stream error:', error);
        reject(error);
      });
  });
}

seedPincodes();
