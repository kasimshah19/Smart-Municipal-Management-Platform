import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { ROLES } from '../constants/roles.js';

dotenv.config();

const API_URL = 'http://localhost:5000/api';

async function generateTestToken(role) {
  const email = `test_${role.toLowerCase()}@test.com`;
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      firstName: 'Test',
      lastName: role,
      email,
      password: 'Password123!',
      role,
      mobileNumber: `99999999${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`,
      isActive: true
    });
  }
  return generateToken({ userId: user._id });
}

async function runTests() {
  console.log('--- STARTING PHASE 12 SECURITY VERIFICATION ---');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const superAdminToken = await generateTestToken(ROLES.SUPER_ADMIN);
  const municipalAdminToken = await generateTestToken(ROLES.MUNICIPAL_ADMIN);
  const citizenToken = await generateTestToken(ROLES.CITIZEN);

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

  try {
    // 1. Unauthenticated Access
    let res = await fetch(`${API_URL}/gram-panchayats`);
    assert(res.status === 401, 'Unauthenticated user gets 401 on GET');

    // 2. Citizen Access (IDOR Check)
    res = await fetch(`${API_URL}/gram-panchayats`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    assert(res.status === 403, 'CITIZEN gets 403 on GET');

    // 3. Municipal Admin Access (Urban Role vs Rural Domain Check)
    res = await fetch(`${API_URL}/gram-panchayats`, {
      headers: { Authorization: `Bearer ${municipalAdminToken}` }
    });
    assert(res.status === 403, 'MUNICIPAL_ADMIN gets 403 on GET');

    // 4. Super Admin Access
    res = await fetch(`${API_URL}/gram-panchayats?limit=5`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert(res.status === 200, 'SUPER_ADMIN gets 200 on GET');

    // 5. Pagination Abuse Protection
    res = await fetch(`${API_URL}/gram-panchayats?limit=10000`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    let data = await res.json();
    assert(data.data.length <= 100, 'Pagination is strictly bounded (max 100 limit enforced even if 10000 requested)');

    // 6. Mass Assignment Protection
    const payload = {
      name: 'TEST GP INJECTION',
      lgdCode: 999999,
      districtId: new mongoose.Types.ObjectId().toString(),
      districtName: 'TEST DISTRICT',
      talukaId: new mongoose.Types.ObjectId().toString(),
      talukaName: 'TEST TALUKA',
      status: 'ACTIVE',
      maliciousField: 'I am a hacker', // Should be ignored
      __v: 999 // Should be ignored
    };

    res = await fetch(`${API_URL}/gram-panchayats`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    data = await res.json();
    if (res.status !== 201) console.error(data);
    assert(res.status === 201, 'SUPER_ADMIN successfully creates a GP');
    
    const createdGp = data.data;
    assert(createdGp.maliciousField === undefined, 'Mass assignment protection successfully ignored malicious fields');
    
    // Clean up
    await fetch(`${API_URL}/gram-panchayats/${createdGp._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });

    console.log(`\n--- SUMMARY ---`);
    console.log(`Tests Passed: ${passed}`);
    console.log(`Tests Failed: ${failed}`);

  } catch (err) {
    console.error('Fatal Error during tests:', err);
  } finally {
    // Cleanup temporary users
    await User.deleteMany({ email: { $in: [
      `test_${ROLES.SUPER_ADMIN.toLowerCase()}@test.com`,
      `test_${ROLES.MUNICIPAL_ADMIN.toLowerCase()}@test.com`,
      `test_${ROLES.CITIZEN.toLowerCase()}@test.com`
    ]}});
    await mongoose.connection.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
