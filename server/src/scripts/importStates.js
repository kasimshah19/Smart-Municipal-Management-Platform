import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { processCsvInBatches, logConflictReport } from './utils/masterDataImporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import State from '../models/State.js';

const isDryRun = process.argv.includes('--dry-run');
const FILE_PATH = path.join(__dirname, '../data/india/states/states.csv'); 

const BATCH_SIZE = 500;

async function run() {
  console.log('--- PAN-INDIA STATE IMPORTER ---');
  if (isDryRun) console.log('MODE: DRY-RUN (No Database Changes)');
  
  const report = { total: 0, inserted: 0, updated: 0, skipped: 0, invalid: 0, conflicts: 0, missingParent: 0 };
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await processCsvInBatches(FILE_PATH, BATCH_SIZE, async (batch) => {
      const operations = [];
      for (const row of batch) {
        report.total++;
        
        const lgdCode = row['State Code'];
        const stateName = row['State Name (In English)'];
        const stateOrUT = row['State or UT'];
        const stateCode = row['Census 2011 Code'] || row['Census 2001 Code'];
        
        let type = '';
        if (stateOrUT === 'U') type = 'UNION_TERRITORY';
        else if (stateOrUT === 'S') type = 'STATE';
        
        if (!stateName || !type) {
          report.invalid++;
          console.warn(`[INVALID] Missing name or type: ${JSON.stringify(row)}`);
          continue;
        }
        
        if (!['STATE', 'UNION_TERRITORY'].includes(type.toUpperCase())) {
          report.invalid++;
          console.warn(`[INVALID] Invalid type: ${type}`);
          continue;
        }
        
        const existingByLgd = lgdCode ? await State.findOne({ lgdCode: Number(lgdCode) }) : null;
        const existingByName = await State.findOne({ name: { $regex: new RegExp(`^${stateName.trim()}$`, 'i') } });
        
        if (existingByLgd && existingByName && existingByLgd._id.toString() !== existingByName._id.toString()) {
          report.conflicts++;
          console.warn(`[CONFLICT] Name matches one record, but LGD matches another. Row: ${stateName}`);
          continue;
        }

        const match = existingByLgd || existingByName;
        
        if (match) {
          report.updated++;
          if (!isDryRun) {
            operations.push({
              updateOne: {
                filter: { _id: match._id },
                update: {
                  $set: {
                    name: stateName.trim(),
                    type: type.toUpperCase(),
                    lgdCode: lgdCode || match.lgdCode,
                    stateCode: stateCode || match.stateCode,
                    sourceAuthority: 'LGD',
                    sourceDataset: 'states.csv'
                  }
                }
              }
            });
          }
        } else {
          report.inserted++;
          if (!isDryRun) {
            operations.push({
              insertOne: {
                document: {
                  name: stateName.trim(),
                  type: type.toUpperCase(),
                  lgdCode,
                  stateCode,
                  sourceAuthority: 'LGD',
                  sourceDataset: 'states.csv'
                }
              }
            });
          }
        }
      }
      
      if (!isDryRun && operations.length > 0) {
        await State.bulkWrite(operations, { ordered: false });
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
