import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ZillaParishad from '../models/ZillaParishad.js';
import PanchayatSamiti from '../models/PanchayatSamiti.js';
import District from '../models/District.js';
import Taluka from '../models/Taluka.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-municipal';
const CSV_FILE_PATH = path.resolve(__dirname, 'data/maharashtra_gram_panchayats.csv');

// Legacy mappings
const DISTRICT_NAME_MAPPING = {
  'Ahilyanagar': 'Ahmednagar',
  'Chhatrapati Sambhajinagar': 'Aurangabad',
  'Dharashiv': 'Osmanabad'
};

async function runImport() {
  const isDryRun = process.argv.includes('--dry-run');

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully.');

    const districts = await District.find({}).lean();
    const talukas = await Taluka.find({}).lean();

    const dbDistrictsMap = new Map();
    for (const d of districts) {
      dbDistrictsMap.set(d.name.toLowerCase(), d);
    }
    
    const dbTalukasMap = new Map();
    for (const t of talukas) {
      dbTalukasMap.set(`${t.districtId.toString()}-${t.name.toLowerCase()}`, t);
    }

    const zillaParishadsData = [];
    const blockPanchayatsData = [];

    const parseCSV = () => {
      return new Promise((resolve, reject) => {
        fs.createReadStream(CSV_FILE_PATH)
          .pipe(csv({ skipLines: 1 }))
          .on('data', (row) => {
            const type = row['Localbody Type Name'];
            if (type === 'Zilla Parishad') {
              zillaParishadsData.push(row);
            } else if (type === 'Block Panchayat') {
              blockPanchayatsData.push(row);
            }
          })
          .on('error', reject)
          .on('end', resolve);
      });
    };

    console.log('Parsing CSV...');
    await parseCSV();
    console.log(`Found ${zillaParishadsData.length} Zilla Parishads and ${blockPanchayatsData.length} Panchayat Samitis.`);

    // Map to hold inserted ZPs so we can get their IDs for the Samitis
    const zpMap = new Map();

    console.log('Inserting Zilla Parishads...');
    let zpInserted = 0, zpUpdated = 0;
    
    for (const row of zillaParishadsData) {
      const lgdCode = row['Localbody Code'];
      const name = row['Localbody Name (In English)'];
      const marathiName = row['Localbody Name (In Local)'];

      let mappedDistName = DISTRICT_NAME_MAPPING[name] || name;
      let dbDistrict = dbDistrictsMap.get(mappedDistName.toLowerCase()) || dbDistrictsMap.get(name.toLowerCase());
      
      let districtId = dbDistrict ? dbDistrict._id : null;
      let districtName = dbDistrict ? dbDistrict.name : null;

      const updateDoc = {
        name,
        marathiName,
        districtId,
        districtName
      };

      if (!isDryRun) {
        const result = await ZillaParishad.findOneAndUpdate(
          { lgdCode },
          { $set: updateDoc },
          { upsert: true, new: true }
        );
        zpMap.set(lgdCode, result._id);
        if (result.createdAt === result.updatedAt) zpInserted++; else zpUpdated++;
      } else {
        zpInserted++;
      }
    }
    console.log(`Zilla Parishad: ${zpInserted} Inserted, ${zpUpdated} Updated.`);

    console.log('Inserting Panchayat Samitis...');
    let psInserted = 0, psUpdated = 0;

    for (const row of blockPanchayatsData) {
      const lgdCode = row['Localbody Code'];
      const name = row['Localbody Name (In English)'];
      const marathiName = row['Localbody Name (In Local)'];
      const parentCode = row['Parent Localbody Code'];

      let zillaParishadId = zpMap.get(parentCode) || null;
      let districtId = null;
      let districtName = null;
      let talukaId = null;
      let talukaName = null;

      // Find the ZP to get the district
      const zpRow = zillaParishadsData.find(zp => zp['Localbody Code'] === parentCode);
      if (zpRow) {
          const zpName = zpRow['Localbody Name (In English)'];
          let mappedDistName = DISTRICT_NAME_MAPPING[zpName] || zpName;
          let dbDistrict = dbDistrictsMap.get(mappedDistName.toLowerCase()) || dbDistrictsMap.get(zpName.toLowerCase());
          
          if (dbDistrict) {
             districtId = dbDistrict._id;
             districtName = dbDistrict.name;
             
             // Try to map to Taluka
             const talukaKey = `${districtId.toString()}-${name.toLowerCase()}`;
             const dbTaluka = dbTalukasMap.get(talukaKey);
             if (dbTaluka) {
                 talukaId = dbTaluka._id;
                 talukaName = dbTaluka.name;
             }
          }
      }

      const updateDoc = {
        name,
        marathiName,
        zillaParishadId,
        districtId,
        districtName,
        talukaId,
        talukaName
      };

      if (!isDryRun) {
        const result = await PanchayatSamiti.findOneAndUpdate(
          { lgdCode },
          { $set: updateDoc },
          { upsert: true, new: true }
        );
        if (result.createdAt === result.updatedAt) psInserted++; else psUpdated++;
      } else {
        psInserted++;
      }
    }
    
    console.log(`Panchayat Samiti: ${psInserted} Inserted, ${psUpdated} Updated.`);
    console.log('Import Finished Successfully.');

  } catch (error) {
    console.error('Import Error:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('Database disconnected.');
    }
  }
}

runImport();
