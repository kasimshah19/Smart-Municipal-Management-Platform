import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Municipality from '../models/Municipality.js';
import { MAHARASHTRA_DISTRICT_SET } from '../constants/maharashtraDistricts.js';
import { LOCAL_BODY_TYPES } from '../constants/localBodyTypes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars (adjust path if needed)
dotenv.config({ path: path.join(__dirname, '../../.env') });

const parseCSVLine = (line) => {
  // A simple CSV parser assuming no commas inside values for now
  return line.split(',').map(val => val.trim());
};

const runImport = async () => {
  console.log('Starting Municipality Bulk Import...');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-municipal');
    console.log('Connected to Database.');

    const csvPath = path.join(__dirname, 'municipalities.csv');
    if (!fs.existsSync(csvPath)) {
      console.error('municipalities.csv not found!');
      process.exit(1);
    }

    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
      console.log('No data rows found in CSV.');
      process.exit(0);
    }

    const headers = parseCSVLine(lines[0]);
    const requiredHeaders = ['name', 'code', 'type', 'district', 'state', 'status'];
    
    for (const reqH of requiredHeaders) {
      if (!headers.includes(reqH)) {
        console.error(`Missing required header column: ${reqH}`);
        process.exit(1);
      }
    }

    const getIndex = (header) => headers.indexOf(header);

    const bulkOps = [];
    let validCount = 0;
    let invalidCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length !== headers.length) {
        console.error(`Row ${i + 1}: Skipping due to mismatched column count.`);
        invalidCount++;
        continue;
      }

      const name = row[getIndex('name')];
      const code = row[getIndex('code')];
      const type = row[getIndex('type')];
      const district = row[getIndex('district')];
      const state = row[getIndex('state')];
      const status = row[getIndex('status')];
      const isActive = status?.toUpperCase() === 'ACTIVE';

      const errors = [];

      if (!name) errors.push('Missing name');
      if (!code) errors.push('Missing code');
      if (!type) errors.push('Missing type');
      else if (!LOCAL_BODY_TYPES[type]) errors.push(`Invalid type: ${type}`);
      
      if (!district) errors.push('Missing district');
      else if (!MAHARASHTRA_DISTRICT_SET.has(district)) errors.push(`Invalid district: ${district}`);
      
      if (state !== 'Maharashtra') errors.push(`Invalid state: ${state}`);

      if (errors.length > 0) {
        console.error(`Row ${i + 1}: ${errors.join(', ')}`);
        invalidCount++;
        continue;
      }

      // Prepare bulk operation (upsert by code)
      bulkOps.push({
        updateOne: {
          filter: { code: code },
          update: {
            $set: {
              name,
              code,
              type,
              district,
              state,
              isActive
            }
          },
          upsert: true
        }
      });
      
      validCount++;
    }

    if (bulkOps.length > 0) {
      console.log(`Executing bulk write for ${bulkOps.length} valid records...`);
      const result = await Municipality.bulkWrite(bulkOps, { ordered: false });
      console.log('Bulk write completed successfully.');
      console.log(`Matched: ${result.matchedCount}, Inserted/Upserted: ${result.upsertedCount}, Modified: ${result.modifiedCount}`);
    } else {
      console.log('No valid records to insert.');
    }
    
    console.log(`\nImport Summary:\n- Valid Rows: ${validCount}\n- Invalid Rows: ${invalidCount}`);

  } catch (error) {
    if (error.code === 11000) {
      console.error('Duplicate key error during bulk write (likely name+district+type clash).');
    } else {
      console.error('Import failed:', error.message);
    }
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

runImport();
