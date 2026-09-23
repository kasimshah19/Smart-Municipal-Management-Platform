import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import readline from 'readline';
import Village from '../models/Village.js';
import District from '../models/District.js';
import State from '../models/State.js';
import Taluka from '../models/Taluka.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const CSV_FILE_PATH = path.join(__dirname, 'data', 'villages.csv');

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

async function importVillages() {
  console.log('--- PAN-INDIA VILLAGE IMPORTER (v2 - readline) ---');
  
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Pre-load lookups
  const states = await State.find().lean();
  const stateMap = {};
  states.forEach(s => { stateMap[s.lgdCode] = s; });
  
  const districts = await District.find().lean();
  const districtMap = {};
  districts.forEach(d => { districtMap[d.lgdCode] = d; });
  
  const talukas = await Taluka.find().lean();
  const talukaMap = {};
  talukas.forEach(t => { talukaMap[t.lgdCode] = t; });
  
  console.log(`Loaded: ${states.length} states, ${districts.length} districts, ${talukas.length} talukas`);

  const rl = readline.createInterface({
    input: fs.createReadStream(CSV_FILE_PATH),
    crlfDelay: Infinity
  });

  let lineNum = 0;
  let totalProcessed = 0;
  let batchNum = 0;
  let operations = [];

  for await (const line of rl) {
    lineNum++;
    // Skip title row and header row
    if (lineNum <= 2) continue;
    if (!line.trim()) continue;

    const cols = parseCsvLine(line);
    // Columns: S.No., State Code, State Name, District Code, District Name,
    //          Sub-District Code, Sub-District Name, Village Code, Village Version,
    //          Village Name (English), Village Name (Local), Village Category, Village Status,
    //          Census 2001 Code, Census 2011 Code
    const stateLgdCode = cols[1] || null;
    const districtLgdCode = cols[3] || null;
    const subDistrictLgdCode = cols[5] || null;
    const subDistrictName = cols[6] || null;
    const villageLgdCode = cols[7] || null;
    const name = cols[9] || null;
    const localName = cols[10] || null;
    const category = cols[11] || 'Rural';
    const status = cols[12] || 'Inhabitant';
    const censusCode2011 = cols[14] || null;

    if (!villageLgdCode || !name) continue;

    totalProcessed++;

    const state = stateMap[stateLgdCode];
    const district = districtMap[districtLgdCode];
    const taluka = talukaMap[subDistrictLgdCode];

    operations.push({
      updateOne: {
        filter: { lgdCode: villageLgdCode },
        update: {
          $set: {
            name,
            localName: localName || null,
            lgdCode: villageLgdCode,
            category,
            status,
            subDistrictId: taluka ? taluka._id : null,
            subDistrictName: taluka ? taluka.name : subDistrictName,
            districtId: district ? district._id : null,
            districtName: district ? district.name : (cols[4] || null),
            stateId: state ? state._id : null,
            stateName: state ? state.name : (cols[2] || null),
            censusCode2011,
            isActive: true
          }
        },
        upsert: true
      }
    });

    if (operations.length >= 2000) {
      batchNum++;
      try {
        await Village.bulkWrite(operations, { ordered: false });
      } catch (err) {
        // skip duplicate errors silently
      }
      if (batchNum % 50 === 0) {
        console.log(`Batch ${batchNum}: ${totalProcessed} records processed...`);
      }
      operations = [];
    }
  }

  // Final batch
  if (operations.length > 0) {
    batchNum++;
    try {
      await Village.bulkWrite(operations, { ordered: false });
    } catch (err) {
      // skip
    }
  }

  console.log('=== IMPORT COMPLETE ===');
  console.log(`Total Records Processed: ${totalProcessed}`);
  console.log(`Total Batches: ${batchNum}`);
  console.log('=======================');
  process.exit(0);
}

importVillages();
