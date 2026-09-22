import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import Municipality from '../models/Municipality.js';
import District from '../models/District.js';

const runVerification = async () => {
  console.log('--- Phase 10: Maharashtra Urban Local Bodies Verification ---');
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-municipal';
    await mongoose.connect(uri.replace('localhost', '127.0.0.1'));
    console.log('Connected to Database.');

    let passed = 0;
    let failed = 0;

    const assert = (condition, message) => {
      if (condition) {
        console.log(`✅ PASS: ${message}`);
        passed++;
      } else {
        console.error(`❌ FAIL: ${message}`);
        failed++;
      }
    };

    // 1. Check if Gram Panchayats are in grampanchayats
    const gpCount = await mongoose.connection.db.collection('grampanchayats').countDocuments({ localBodyType: 'GRAM_PANCHAYAT' });
    assert(gpCount > 0, `Gram Panchayats imported into grampanchayats collection (${gpCount} found)`);

    // 2. Check Municipalities collection for urban local bodies
    const ulbCount = await Municipality.countDocuments();
    assert(ulbCount > 0, `Urban Local Bodies imported into municipalities collection (${ulbCount} found)`);

    // 3. Verify LGD Code separation (LGD Code shouldn't be the internal business code)
    const ulbsWithLgd = await Municipality.find({ lgdCode: { $exists: true, $ne: null } }).limit(5);
    let lgdSeparationValid = true;
    for (const ulb of ulbsWithLgd) {
      if (ulb.code === String(ulb.lgdCode)) lgdSeparationValid = false;
    }
    assert(lgdSeparationValid || ulbsWithLgd.length === 0, 'Internal Business Code is separated from LGD Code');

    // 4. Verify deterministic sequence codes (Find a generated code)
    // We know 'Chimthane' or similar Nagar Panchayats have generated codes
    const generatedUlb = await Municipality.findOne({ code: /^MH-[A-Z]+-[A-Z]+-[0-9]{3}$/ });
    assert(generatedUlb !== null, 'Generated codes follow MH-{TYPE}-{DIST}-000 format');

    // 5. Verify coveredDistricts logic
    const multiDistrictUlb = await Municipality.findOne({ name: { $regex: /Brihanmumbai|Navi Mumbai/i } });
    if (multiDistrictUlb) {
      assert(multiDistrictUlb.coveredDistricts.length > 1, `coveredDistricts logic applied for ${multiDistrictUlb.name} (${multiDistrictUlb.coveredDistricts.join(', ')})`);
    } else {
      console.log('⚠️ SKIP: No multi-district ULB found to test coveredDistricts.');
    }

    // 6. Verify existing indexes (ensure district_1_taluka_1_name_1 unique index is dropped)
    const indexes = await Municipality.collection.indexes();
    const hasRestrictiveIndex = indexes.some(idx => idx.name === 'district_1_taluka_1_name_1' && idx.unique);
    assert(!hasRestrictiveIndex, 'Overly restrictive district+taluka+name index has been dropped');
    
    // 7. Verify Idempotency (run import script in dry-run if possible, or just check for exact duplicates)
    const duplicateCodes = await Municipality.aggregate([
      { $group: { _id: "$code", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    assert(duplicateCodes.length === 0, 'No duplicate internal business codes found in Municipalities');

    // 8. Cascading filters check via service logic
    const dhuleDistrict = await District.findOne({ name: 'Dhule' });
    if (dhuleDistrict) {
      const dhuleUlbs = await Municipality.countDocuments({ district: dhuleDistrict.name });
      assert(dhuleUlbs > 0, `Cascading filters can resolve: Found ${dhuleUlbs} ULBs for Dhule district name.`);
    } else {
       console.log('⚠️ SKIP: Dhule district not found in District collection.');
    }

    console.log(`\n--- Verification Complete ---`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

  } catch (error) {
    console.error('Verification script failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

runVerification();
