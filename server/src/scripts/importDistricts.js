import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { processCsvInBatches, logConflictReport } from './utils/masterDataImporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import District from '../models/District.js';
import State from '../models/State.js';

const isDryRun = process.argv.includes('--dry-run');
const FILE_PATH = path.join(__dirname, 'data/districts.csv'); 
const BATCH_SIZE = 500;

async function run() {
  console.log('--- PAN-INDIA DISTRICT IMPORTER ---');
  if (isDryRun) console.log('MODE: DRY-RUN (No Database Changes)');
  
  const report = { total: 0, inserted: 0, updated: 0, skipped: 0, invalid: 0, conflicts: 0, missingParent: 0 };
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Cache states to avoid hitting DB for every row
    const states = await State.find({});
    const stateMapByLgd = new Map();
    states.forEach(s => { if (s.lgdCode) stateMapByLgd.set(s.lgdCode, s._id); });

    await processCsvInBatches(FILE_PATH, BATCH_SIZE, async (batch) => {
      const operations = [];
      for (const row of batch) {
        report.total++;
        const districtName = row['District Name(In English)'];
        const districtLgdCode = row['District Code'];
        const stateLgdCode = row['State Code'];
        
        const stateLgdStr = stateLgdCode ? stateLgdCode.toString().trim() : '';
        const districtLgdStr = districtLgdCode ? districtLgdCode.toString().trim() : '';
        
        // ONLY IMPORT MAHARASHTRA
        if (stateLgdStr !== '27') {
          continue;
        }
        
        if (!districtName || !districtLgdStr || !stateLgdStr) {
          report.invalid++;
          console.warn(`[INVALID] Missing name or codes: ${JSON.stringify(row)}`);
          continue;
        }
        
        const stateId = stateMapByLgd.get(stateLgdStr);
        if (!stateId) {
          report.missingParent++;
          console.warn(`[INVALID] State not found for LGD Code: ${stateLgdStr}`);
          continue;
        }
        
        const existingByLgd = await District.findOne({ lgdCode: districtLgdStr });
        const existingByNameState = await District.findOne({ 
          stateId, 
          name: { $regex: new RegExp(`^${districtName.trim()}$`, 'i') } 
        });
        
        if (existingByLgd && existingByNameState && existingByLgd._id.toString() !== existingByNameState._id.toString()) {
          report.conflicts++;
          console.warn(`[CONFLICT] Name matches one district, LGD matches another. Row: ${districtName}`);
          continue;
        }

        const match = existingByLgd || existingByNameState;
        
        if (match) {
          report.updated++;
          if (!isDryRun) {
            operations.push({
              updateOne: {
                filter: { _id: match._id },
                update: {
                  $set: {
                    name: districtName.trim(), // Careful not to overwrite Maharashtra names blindly, but per requirement we preserve if match
                    lgdCode: districtLgdStr,
                    stateId: stateId
                  }
                }
              }
            });
          }
        } else {
          report.inserted++;
          if (!isDryRun) {
            // Note: Currently Division is required for Maharashtra Districts. New Districts might not have a Division.
            // This is a known risk requiring a schema update for non-Maharashtra states in the future.
            operations.push({
              insertOne: {
                document: {
                  name: districtName.trim(),
                  lgdCode: districtLgdStr,
                  stateId: stateId,
                  code: districtName.trim().substring(0,3).toUpperCase(), // Placeholder code
                  state: 'India' // Override default Maharashtra
                }
              }
            });
          }
        }
      }
      
      if (!isDryRun && operations.length > 0) {
        try {
          console.log(`Executing bulkWrite with ${operations.length} operations...`);
          const result = await District.bulkWrite(operations, { ordered: false });
          console.log(`BulkWrite result: inserted: ${result?.insertedCount}, modified: ${result?.modifiedCount}`);
        } catch (bwErr) {
          console.error(`[BULK WRITE ERROR in Batch]`, bwErr.message);
          // If it's a duplicate key error (E11000), it will still insert the non-duplicates because ordered: false
          if (bwErr.writeErrors) {
            console.error(`Number of write errors: ${bwErr.writeErrors.length}`);
            for (const we of bwErr.writeErrors.slice(0, 5)) {
              console.error(`- ${we.errmsg}`);
            }
          }
        }
      }
    });

  } catch (err) {
    if (err.message.includes('Authoritative source dataset not provided')) {
      console.error(err.message);
    } else {
      console.error('Execution Error:', err);
    }
  } finally {
    logConflictReport(report);
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
