import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import State from '../models/State.js';
import District from '../models/District.js';
import Taluka from '../models/Taluka.js';
import Municipality from '../models/Municipality.js';
import GramPanchayat from '../models/GramPanchayat.js';
import Division from '../models/Division.js';
import Pincode from '../models/Pincode.js';

const isExecute = process.argv.includes('--execute');
const BATCH_SIZE = 1000;

const baselineCounts = {
  Divisions: 0,
  Districts: 0,
  Talukas: 0,
  GramPanchayats: 0,
  Municipalities: 0,
  Pincodes: 0
};

async function captureBaseline() {
  baselineCounts.Divisions = await Division.countDocuments();
  baselineCounts.Districts = await District.countDocuments();
  baselineCounts.Talukas = await Taluka.countDocuments();
  baselineCounts.GramPanchayats = await GramPanchayat.countDocuments();
  baselineCounts.Municipalities = await Municipality.countDocuments();
  baselineCounts.Pincodes = await Pincode.countDocuments();

  console.log('\n--- BASELINE COUNTS ---');
  console.log(`Divisions: ${baselineCounts.Divisions} (Expected: 6)`);
  console.log(`Districts: ${baselineCounts.Districts} (Expected: 36)`);
  console.log(`Talukas: ${baselineCounts.Talukas} (Expected: 359)`);
  console.log(`Gram Panchayats: ${baselineCounts.GramPanchayats} (Expected: 28087)`);
  console.log(`Municipalities: ${baselineCounts.Municipalities} (Expected: 395)`);
  console.log(`Pincodes: ${baselineCounts.Pincodes} (Expected: 13762)`);
  console.log('-----------------------\n');
}

async function run() {
  console.log('--- PHASE 19A: MAHARASHTRA REFERENCE BACKFILL ---');
  if (!isExecute) {
    console.log('MODE: SAFE / DRY-RUN (Pass --execute to modify database)');
  } else {
    console.log('MODE: EXECUTE');
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await captureBaseline();

    // 1. Resolve Maharashtra State
    const mhState = await State.findOne({ name: { $regex: /^Maharashtra$/i } });
    if (!mhState) {
      console.error('[CRITICAL] Maharashtra State master record missing. Please ensure it was seeded properly.');
      process.exit(1);
    }
    const stateId = mhState._id;

    // Caching districts for mapping
    const allDistricts = await District.find({});
    const districtMapByName = new Map();
    const districtMapById = new Map();
    allDistricts.forEach(d => {
      districtMapByName.set(d.name.toLowerCase(), d._id);
      districtMapById.set(d._id.toString(), d);
    });

    if (allDistricts.length !== 36) {
      console.warn(`[WARNING] District count is ${allDistricts.length}, expected 36.`);
    }

    // Reports
    const reports = {
      Districts: { total: 0, alreadyCorrect: 0, wouldUpdate: 0, missingParent: 0, conflict: 0, invalid: 0 },
      Municipalities: { total: 0, alreadyCorrect: 0, wouldUpdate: 0, missingParent: 0, conflict: 0, invalid: 0 },
      Talukas: { total: 0, alreadyCorrect: 0, wouldUpdate: 0, missingParent: 0, conflict: 0, invalid: 0 },
      GramPanchayats: { total: 0, alreadyCorrect: 0, wouldUpdate: 0, missingParent: 0, conflict: 0, invalid: 0 }
    };

    let hasConflictsOrMissing = false;

    // 2. DISTRICT BACKFILL
    console.log('Processing Districts...');
    let distOps = [];
    for (const district of allDistricts) {
      reports.Districts.total++;
      if (district.stateId && district.stateId.toString() === stateId.toString()) {
        reports.Districts.alreadyCorrect++;
      } else {
        reports.Districts.wouldUpdate++;
        distOps.push({
          updateOne: {
            filter: { _id: district._id },
            update: { $set: { stateId } }
          }
        });
      }
    }

    // 3. MUNICIPALITY BACKFILL
    console.log('Processing Municipalities...');
    let munOps = [];
    const municipalities = await Municipality.find({});
    for (const mun of municipalities) {
      reports.Municipalities.total++;
      let mappedDistrictId = mun.districtId;

      if (!mappedDistrictId && mun.district) {
        mappedDistrictId = districtMapByName.get(mun.district.toLowerCase());
      }

      if (!mappedDistrictId) {
        reports.Municipalities.missingParent++;
        console.warn(`[MISSING PARENT] Municipality ${mun.name} has unresolvable district: ${mun.district}`);
        hasConflictsOrMissing = true;
        continue;
      }

      const isStateCorrect = mun.stateId && mun.stateId.toString() === stateId.toString();
      const isDistrictCorrect = mun.districtId && mun.districtId.toString() === mappedDistrictId.toString();

      if (isStateCorrect && isDistrictCorrect) {
        reports.Municipalities.alreadyCorrect++;
      } else {
        reports.Municipalities.wouldUpdate++;
        munOps.push({
          updateOne: {
            filter: { _id: mun._id },
            update: { $set: { stateId, districtId: mappedDistrictId } }
          }
        });
      }
    }

    // 4. TALUKA BACKFILL
    console.log('Processing Talukas...');
    let talOps = [];
    const talukas = await Taluka.find({});
    for (const tal of talukas) {
      reports.Talukas.total++;
      if (!tal.districtId || !districtMapById.has(tal.districtId.toString())) {
        reports.Talukas.missingParent++;
        console.warn(`[MISSING PARENT] Taluka ${tal.name} has missing/invalid districtId: ${tal.districtId}`);
        hasConflictsOrMissing = true;
        continue;
      }

      if (tal.stateId && tal.stateId.toString() === stateId.toString()) {
        reports.Talukas.alreadyCorrect++;
      } else {
        reports.Talukas.wouldUpdate++;
        talOps.push({
          updateOne: {
            filter: { _id: tal._id },
            update: { $set: { stateId } }
          }
        });
      }
    }

    // 5. GRAM PANCHAYAT BACKFILL
    console.log('Processing Gram Panchayats...');
    let gpOps = [];
    // Using batch cursor for memory efficiency
    const gpCursor = GramPanchayat.find({}).cursor();
    let currentBatchOps = [];
    
    for (let gp = await gpCursor.next(); gp != null; gp = await gpCursor.next()) {
      reports.GramPanchayats.total++;
      
      if (!gp.districtId || !districtMapById.has(gp.districtId.toString())) {
        reports.GramPanchayats.missingParent++;
        hasConflictsOrMissing = true;
        continue;
      }

      if (gp.stateId && gp.stateId.toString() === stateId.toString()) {
        reports.GramPanchayats.alreadyCorrect++;
      } else {
        reports.GramPanchayats.wouldUpdate++;
        if (isExecute && !hasConflictsOrMissing) {
          currentBatchOps.push({
            updateOne: {
              filter: { _id: gp._id },
              update: { $set: { stateId } }
            }
          });
          if (currentBatchOps.length >= BATCH_SIZE) {
            gpOps.push([...currentBatchOps]);
            currentBatchOps = [];
          }
        }
      }
    }
    if (currentBatchOps.length > 0) {
      gpOps.push([...currentBatchOps]);
    }

    // PRINT REPORT
    console.log('\n--- PRE-WRITE RECONCILIATION REPORT ---');
    for (const [collection, report] of Object.entries(reports)) {
      console.log(`${collection}:`);
      console.log(`  Total: ${report.total}`);
      console.log(`  Already correct: ${report.alreadyCorrect}`);
      console.log(`  Would update: ${report.wouldUpdate}`);
      console.log(`  Missing parent: ${report.missingParent}`);
      console.log(`  Conflict: ${report.conflict}`);
      console.log(`  Invalid: ${report.invalid}`);
      console.log('');
    }

    if (hasConflictsOrMissing) {
      console.error('\n[ABORT] Conflicts or missing parents detected. Write operations cancelled.');
      process.exit(1);
    }

    if (!isExecute) {
      console.log('\n[SUCCESS] Dry-run complete. No conflicts found. Run with --execute to apply changes.');
    } else {
      console.log('\n[EXECUTE] Writing updates to database...');
      
      if (distOps.length > 0) {
        await District.bulkWrite(distOps, { ordered: false });
        console.log(`Updated ${distOps.length} Districts.`);
      }
      
      if (munOps.length > 0) {
        const batches = chunkArray(munOps, BATCH_SIZE);
        for (const b of batches) await Municipality.bulkWrite(b, { ordered: false });
        console.log(`Updated ${munOps.length} Municipalities.`);
      }

      if (talOps.length > 0) {
        const batches = chunkArray(talOps, BATCH_SIZE);
        for (const b of batches) await Taluka.bulkWrite(b, { ordered: false });
        console.log(`Updated ${talOps.length} Talukas.`);
      }

      let totalGpWritten = 0;
      for (const batch of gpOps) {
        await GramPanchayat.bulkWrite(batch, { ordered: false });
        totalGpWritten += batch.length;
      }
      console.log(`Updated ${totalGpWritten} Gram Panchayats.`);

      console.log('\n--- POST-MIGRATION VERIFICATION ---');
      const finalDist = await District.countDocuments({ stateId });
      const finalTal = await Taluka.countDocuments({ stateId });
      const finalMunState = await Municipality.countDocuments({ stateId });
      const finalMunDist = await Municipality.countDocuments({ districtId: { $ne: null } });
      const finalGp = await GramPanchayat.countDocuments({ stateId });

      console.log(`Districts: ${finalDist}/${allDistricts.length} have correct stateId`);
      console.log(`Talukas: ${finalTal}/${talukas.length} have correct stateId`);
      console.log(`Municipalities: ${finalMunState}/${municipalities.length} have correct stateId`);
      console.log(`Municipalities: ${finalMunDist}/${municipalities.length} have valid districtId`);
      console.log(`Gram Panchayats: ${finalGp}/${reports.GramPanchayats.total} have correct stateId`);
      
      console.log('\nMigration Executed Successfully.');
    }

  } catch (err) {
    console.error('Execution Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

function chunkArray(array, size) {
  const chunked_arr = [];
  let index = 0;
  while (index < array.length) {
    chunked_arr.push(array.slice(index, size + index));
    index += size;
  }
  return chunked_arr;
}

run();
