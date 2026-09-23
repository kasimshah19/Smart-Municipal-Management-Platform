import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Municipality from '../models/Municipality.js';
import District from '../models/District.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Load JSON data to use as a dictionary for mapping districts
const loadJSON = (filename) => {
  const filePath = path.join(__dirname, '../data/maharashtra/localBodies', filename);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const normalizeName = (name) => {
  if (!name) return '';
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
};

const getTypeShort = (type) => {
  switch (type) {
    case 'MUNICIPAL_CORPORATION': return 'MC';
    case 'MUNICIPAL_COUNCIL': return 'NP';
    case 'NAGAR_PANCHAYAT': return 'NPAN';
    default: return 'ULB';
  }
};

const runImport = async () => {
  console.log('Starting LGD Municipalities CSV Import...');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-municipal');
    console.log('Connected to Database.');

    const districts = await District.find({}).lean();
    const districtMap = new Map();
    districts.forEach(d => districtMap.set(d.name.toLowerCase(), d.name));

    // Load reference JSONs to map names to districts
    const corps = loadJSON('municipalCorporations.json');
    const councils = loadJSON('municipalCouncils.json');
    const panchayats = loadJSON('nagarPanchayats.json');
    const allRefRecords = [...corps, ...councils, ...panchayats];

    const refMap = new Map();
    for (const ref of allRefRecords) {
        const type = ref.type || (ref.code?.includes('MC') ? 'MUNICIPAL_CORPORATION' : 'MUNICIPAL_COUNCIL'); // very loose fallback
        const normName = normalizeName(ref.name).replace(' municipal corporation', '').replace(' municipal council', '').replace(' nagar panchayat', '');
        // Keep it simple
        refMap.set(normName, ref.district);
    }

    const csvPath = path.join(__dirname, 'municipalities.csv');
    if (!fs.existsSync(csvPath)) {
      console.error('municipalities.csv not found!');
      process.exit(1);
    }

    const records = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv({ skipLines: 1 }))
        .on('data', (data) => records.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`Parsed ${records.length} records from CSV.`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let conflicts = 0;
    let missingDistricts = 0;

    const seqMap = new Map();

    for (const record of records) {
      if (!record['Localbody Name (In English)']) continue;

      const rawName = record['Localbody Name (In English)'].trim();
      let type = 'MUNICIPAL_COUNCIL';
      const rawType = record['Localbody Type Name'] || '';
      
      if (rawType.toLowerCase().includes('corporation')) type = 'MUNICIPAL_CORPORATION';
      else if (rawType.toLowerCase().includes('panchayat')) type = 'NAGAR_PANCHAYAT';
      
      const lgdCode = record['Localbody Code'];
      const marathiName = record['Localbody Name (In Local)'] || null;
      
      const normName = normalizeName(rawName);
      
      // Try to find district
      let districtRaw = refMap.get(normName);
      if (!districtRaw) {
         // try finding substring match
         for (const [key, val] of refMap.entries()) {
             if (normName.includes(key) || key.includes(normName)) {
                 districtRaw = val;
                 break;
             }
         }
      }

      let canonicalDistrict = null;
      let coveredDistricts = [];

      if (districtRaw) {
        const dMatch = districtMap.get(districtRaw.toLowerCase());
        if (dMatch) {
          canonicalDistrict = dMatch;
          coveredDistricts = [canonicalDistrict];
        }
      }

      // Try finding in DB just by name if district is missing
      let existing = null;
      if (lgdCode) {
         existing = await Municipality.findOne({ lgdCode: lgdCode });
      }
      
      if (!existing) {
         // try exact name match
         existing = await Municipality.findOne({ name: { $regex: new RegExp(`^${rawName}$`, 'i') } });
      }
      
      if (!existing) {
         // try partial name match (e.g., ignoring 'Municipal Council')
         const cleanName = rawName.replace(/municipal council|nagar panchayat|municipal corporation/gi, '').trim();
         existing = await Municipality.findOne({ name: { $regex: new RegExp(`^${cleanName}`, 'i') } });
      }

      if (!existing && !canonicalDistrict) {
        console.warn(`Skipping ${rawName} [${type}] - Not found in DB and could not determine district.`);
        missingDistricts++;
        continue;
      }

      if (existing) {
         canonicalDistrict = existing.district;
         coveredDistricts = existing.coveredDistricts;
         type = existing.type; // keep existing type
      }

      let code = existing ? existing.code : null;

      if (!code) {
        const distKey = canonicalDistrict.substring(0, 4).toUpperCase();
        const typeShort = getTypeShort(type);
        const seqKey = `${typeShort}-${distKey}`;
        const seq = (seqMap.get(seqKey) || 0) + 1;
        seqMap.set(seqKey, seq);
        code = `MH-${typeShort}-${distKey}-${String(seq).padStart(3, '0')}`;
      }

      const updateData = {
        name: rawName,
        code,
        type,
        district: canonicalDistrict,
        coveredDistricts,
        lgdCode: lgdCode,
        marathiName: marathiName,
        source: 'LGD Directory',
        sourceVerified: true,
        isActive: true
      };
      
      try {
        if (existing) {
          await Municipality.updateOne({ _id: existing._id }, { $set: updateData });
          updated++;
        } else {
          await Municipality.create(updateData);
          inserted++;
        }
      } catch (err) {
        if (err.code === 11000) {
          console.error(`Conflict (Duplicate Key) for ${rawName} [${code}]`);
          conflicts++;
        } else {
          console.error(`Error saving ${rawName}: ${err.message}`);
        }
      }
    }

    console.log(`\nImport Summary:`);
    console.log(`- Inserted: ${inserted}`);
    console.log(`- Updated: ${updated}`);
    console.log(`- Skipped: ${skipped}`);
    console.log(`- Conflicts: ${conflicts}`);
    console.log(`- Skipped due to Missing District: ${missingDistricts}`);

  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

runImport();
