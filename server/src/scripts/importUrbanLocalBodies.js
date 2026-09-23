import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import State from '../models/State.js';
import Municipality from '../models/Municipality.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const BATCH_SIZE = 500;

async function importUrbanLocalBodies() {
  console.log('--- PAN-INDIA URBAN LOCAL BODIES IMPORTER ---');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Pre-load states for ObjectId mapping
    const statesMap = new Map();
    const states = await State.find({}, '_id lgdCode name');
    states.forEach(s => {
      statesMap.set(s.lgdCode, s._id);
      statesMap.set(s.name.toUpperCase(), s._id);
    });
    console.log(`Loaded ${states.length} states.`);

    const filePath = path.join(__dirname, 'data', 'urbanLocalBodies.csv');
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    let records = [];
    let count = 0;
    let totalProcessed = 0;

    const stream = fs.createReadStream(filePath).pipe(csv({
      mapHeaders: ({ header }) => header.trim(),
      skipLines: 1
    }));

    for await (const row of stream) {
      // Row fields: 
      // S.No.,State Code,State Name,Local Body Code,Local Body Version,Local Body Name (In English),Local Body Name (In Local),Localbody Type Code,Census 2011 Code
      
      const lgdCode = row['Local Body Code']?.trim();
      if (!lgdCode) continue; // Skip invalid rows or the title row if present

      const name = row['Local Body Name (In English)']?.trim();
      const marathiName = row['Local Body Name (In Local)']?.trim();
      const stateName = row['State Name']?.trim();
      
      // ONLY IMPORT MAHARASHTRA DATA TO STAY WITHIN DB LIMITS
      if (stateName !== 'Maharashtra') {
        continue;
      }
      
      const stateCode = row['State Code']?.trim();
      
      const stateId = statesMap.get(stateCode) || statesMap.get(stateName?.toUpperCase()) || null;

      const municipality = {
        name: name || `ULB-${lgdCode}`,
        marathiName: marathiName && marathiName !== name ? marathiName : null,
        code: lgdCode,
        lgdCode: lgdCode,
        state: stateName,
        stateId: stateId,
        source: 'LGD_URBAN_LOCAL_BODIES',
        jurisdictionCategory: 'URBAN',
        isActive: true
      };

      records.push({
        updateOne: {
          filter: { lgdCode: lgdCode },
          update: { $set: municipality },
          upsert: true
        }
      });

      count++;
      totalProcessed++;

      if (count >= BATCH_SIZE) {
        await Municipality.bulkWrite(records, { ordered: false });
        console.log(`Processed ${totalProcessed} ULBs...`);
        records = [];
        count = 0;
      }
    }

    if (records.length > 0) {
      await Municipality.bulkWrite(records, { ordered: false });
      console.log(`Processed ${totalProcessed} ULBs...`);
    }

    console.log(`\n=== IMPORT COMPLETE ===`);
    console.log(`Total ULBs Processed: ${totalProcessed}`);
    console.log(`=======================`);
    process.exit(0);

  } catch (error) {
    console.error('Error importing ULBs:', error);
    process.exit(1);
  }
}

importUrbanLocalBodies();
