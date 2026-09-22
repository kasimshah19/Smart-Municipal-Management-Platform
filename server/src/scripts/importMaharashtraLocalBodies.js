import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Municipality from '../models/Municipality.js';
import District from '../models/District.js';
import { LOCAL_BODY_TYPES } from '../constants/localBodyTypes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const DRY_RUN = process.argv.includes('--dry-run');

const loadJSON = (filename) => {
  const filePath = path.join(__dirname, '../data/maharashtra/localBodies', filename);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const normalizeName = (name) => {
  return name.trim().replace(/\s+/g, ' ');
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
  console.log('Starting Maharashtra Local Bodies Import...');
  if (DRY_RUN) console.log('*** DRY RUN MODE ***');

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-municipal');
    console.log('Connected to Database.');

    const districts = await District.find({}).lean();
    const districtMap = new Map();
    districts.forEach(d => districtMap.set(d.name.toLowerCase(), d.name));

    const corporations = loadJSON('municipalCorporations.json');
    const councils = loadJSON('municipalCouncils.json');
    const panchayats = loadJSON('nagarPanchayats.json');

    const allRecords = [...corporations, ...councils, ...panchayats];
    
    // Sort records to guarantee deterministic sequence generation
    allRecords.sort((a, b) => {
      const typeDiff = (a.type || '').localeCompare(b.type || '');
      if (typeDiff !== 0) return typeDiff;
      const distDiff = (a.district || '').localeCompare(b.district || '');
      if (distDiff !== 0) return distDiff;
      return (a.name || '').localeCompare(b.name || '');
    });

    console.log(`Source Records Found:\n- Municipal Corporations: ${corporations.length}\n- Municipal Councils: ${councils.length}\n- Nagar Panchayats: ${panchayats.length}\nTotal: ${allRecords.length}`);

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let conflicts = 0;
    let missingDistricts = 0;

    const seqMap = new Map();

    for (const record of allRecords) {
      const name = normalizeName(record.name);
      const districtRaw = record.district;
      const type = record.type || 'MUNICIPAL_CORPORATION';
      
      let canonicalDistrict = null;
      let coveredDistricts = [];

      // Special cases
      if (name.includes('Brihanmumbai')) {
        canonicalDistrict = districtMap.get('mumbai city') || 'Mumbai City';
        coveredDistricts = ['Mumbai City', 'Mumbai Suburban'];
      } else if (name.includes('Navi Mumbai')) {
        canonicalDistrict = districtMap.get('thane') || 'Thane';
        coveredDistricts = ['Thane', 'Raigad'];
      } else {
        const dMatch = districtMap.get(districtRaw.toLowerCase());
        if (dMatch) {
          canonicalDistrict = dMatch;
          coveredDistricts = [canonicalDistrict];
        } else {
          console.warn(`WARNING: Missing or unknown district '${districtRaw}' for '${name}'`);
          missingDistricts++;
          canonicalDistrict = districtRaw; // Fallback
          coveredDistricts = [canonicalDistrict];
        }
      }

      const query = { name: name, district: canonicalDistrict, type: type };
      
      // Match Priority: 1. LGD Code (if verified), 2. Explicit source code, 3. Name+District+Type
      let existing = null;
      
      if (record.lgdCode && record.sourceVerified) {
         existing = await Municipality.findOne({ lgdCode: record.lgdCode });
      }
      if (!existing && (record.code || record.abbreviation)) {
         existing = await Municipality.findOne({ code: record.code || record.abbreviation });
      }
      if (!existing) {
         existing = await Municipality.findOne(query);
      }

      let code = existing ? existing.code : (record.code || record.abbreviation);

      if (!code) {
        const distKey = canonicalDistrict.substring(0, 4).toUpperCase();
        const typeShort = getTypeShort(type);
        const seqKey = `${typeShort}-${distKey}`;
        const seq = (seqMap.get(seqKey) || 0) + 1;
        seqMap.set(seqKey, seq);
        code = `MH-${typeShort}-${distKey}-${String(seq).padStart(3, '0')}`;
      }

      // If we're creating a new record, verify the generated code doesn't mysteriously collide
      if (!existing) {
         const codeConflict = await Municipality.findOne({ code });
         if (codeConflict) {
            console.error(`Conflict: Generated/Provided code ${code} for ${name} is already used by ${codeConflict.name}`);
            conflicts++;
            continue;
         }
      }

      const updateData = {
        name,
        code,
        type,
        district: canonicalDistrict,
        coveredDistricts,
        sourceVerified: record.sourceVerified || false,
        marathiName: record.marathiName || null,
        source: 'Maharashtra ULB Master Data',
        isActive: true
      };
      
      // Only set lgdCode if the source explicitly marks it as verified
      if (record.lgdCode && record.sourceVerified) {
         updateData.lgdCode = record.lgdCode;
      }

      if (!DRY_RUN) {
        try {
          if (existing) {
            let changed = false;
            // Simple dirty check
            if (existing.name !== updateData.name) changed = true;
            if (existing.district !== updateData.district) changed = true;
            if (JSON.stringify(existing.coveredDistricts) !== JSON.stringify(updateData.coveredDistricts)) changed = true;
            if (!existing.sourceVerified && updateData.sourceVerified) changed = true;
            if (updateData.lgdCode && existing.lgdCode !== updateData.lgdCode) changed = true;

            if (changed) {
              await Municipality.updateOne({ _id: existing._id }, { $set: updateData });
              updated++;
            } else {
              skipped++;
            }
          } else {
            await Municipality.create(updateData);
            inserted++;
          }
        } catch (err) {
          if (err.code === 11000) {
            console.error(`Conflict (Duplicate Key) for ${name} [${code}]`);
            conflicts++;
          } else {
            console.error(`Error saving ${name}: ${err.message}`);
          }
        }
      } else {
        if (!existing) inserted++; // Estimate for dry run
        else skipped++;
      }
    }

    console.log(`\nImport Summary:`);
    console.log(`- Inserted: ${inserted}`);
    console.log(`- Updated: ${updated}`);
    console.log(`- Skipped: ${skipped}`);
    console.log(`- Conflicts: ${conflicts}`);
    console.log(`- Missing/Unknown Districts: ${missingDistricts}`);

  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

runImport();
