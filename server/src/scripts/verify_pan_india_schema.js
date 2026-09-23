import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
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

const isDryRun = process.argv.includes('--dry-run');

// Baseline Maharashtra records to ensure they haven't been deleted
const BASELINE = {
  divisions: 6,
  districts: 36,
  talukas: 359,
  gramPanchayats: 28087,
  municipalities: 395
};

async function checkCounts() {
  console.log('\n--- CURRENT DATA COUNTS (REGRESSION PROTECTION) ---');
  let failures = 0;
  const counts = {
    divisions: await Division.countDocuments(),
    districts: await District.countDocuments(),
    talukas: await Taluka.countDocuments(),
    municipalities: await Municipality.countDocuments(),
    gramPanchayats: await GramPanchayat.countDocuments(),
    pincodes: await Pincode.countDocuments()
  };

  for (const [key, val] of Object.entries(counts)) {
    console.log(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${val}`);
    if (BASELINE[key] && val < BASELINE[key]) {
      console.error(`[CRITICAL] Data loss detected in ${key}. Expected at least ${BASELINE[key]}, got ${val}.`);
      failures++;
    }
  }

  if (failures > 0) {
    console.error(`[FAIL] Regression check failed with ${failures} data loss issues.`);
  } else {
    console.log('[SUCCESS] No data loss detected compared to baseline.');
  }
}

async function verifyRelationships() {
  console.log('\n--- VERIFYING SCHEMA RELATIONSHIPS ---');
  let issues = 0;

  // 1. Verify District -> State
  const districts = await District.find({});
  for (const dist of districts) {
    if (!dist.stateId) {
      // It's acceptable for legacy ones not to have it yet if not migrated, but let's warn
      console.warn(`[WARNING] District ${dist.name} (${dist._id}) has missing stateId.`);
    } else {
      const stateExists = await State.exists({ _id: dist.stateId });
      if (!stateExists) {
        console.error(`[ERROR] District ${dist.name} (${dist._id}) references dangling stateId: ${dist.stateId}`);
        issues++;
      }
    }
  }

  // 2. Verify Taluka -> District & State
  const talukas = await Taluka.find({});
  for (const tal of talukas) {
    if (!tal.districtId) {
      console.warn(`[WARNING] Taluka ${tal.name} (${tal._id}) has missing districtId.`);
    } else {
      const dist = await District.findById(tal.districtId);
      if (!dist) {
        console.error(`[ERROR] Taluka ${tal.name} (${tal._id}) references dangling districtId: ${tal.districtId}`);
        issues++;
      } else if (tal.stateId && dist.stateId && tal.stateId.toString() !== dist.stateId.toString()) {
        console.error(`[ERROR] Cross-state reference: Taluka ${tal.name} state is ${tal.stateId} but District state is ${dist.stateId}`);
        issues++;
      }
    }
  }

  // Duplicate LGD Codes Check
  console.log('\n--- CHECKING DUPLICATE EXTERNAL CODES ---');
  for (const model of [District, Taluka, GramPanchayat, Municipality]) {
    const lgdAggregation = await model.aggregate([
      { $match: { lgdCode: { $ne: null, $exists: true } } },
      { $group: { _id: "$lgdCode", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    if (lgdAggregation.length > 0) {
      console.error(`[ERROR] Found ${lgdAggregation.length} duplicate LGD codes in ${model.modelName}.`);
      issues += lgdAggregation.length;
    }
  }
  
  // Duplicate child records under same parent check
  const talukaAggregation = await Taluka.aggregate([
    { $group: { _id: { name: "$name", districtId: "$districtId" }, count: { $sum: 1 } } },
    { $match: { count: { $gt: 1 }, "_id.districtId": { $ne: null } } }
  ]);
  if (talukaAggregation.length > 0) {
    console.error(`[ERROR] Found ${talukaAggregation.length} duplicate Talukas under the same District.`);
    issues += talukaAggregation.length;
  }

  if (issues === 0) {
    console.log('[SUCCESS] All relationship validations passed without issues.');
  } else {
    console.log(`[WARNING] Found ${issues} schema or relationship issues.`);
  }
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    if (isDryRun) {
      console.log('Running in DRY-RUN mode. No changes will be made.');
    }

    await checkCounts();
    await verifyRelationships();

  } catch (error) {
    console.error('Execution Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

run();
