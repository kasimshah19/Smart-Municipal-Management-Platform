import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csvParser from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Municipality from '../models/Municipality.js';
import District from '../models/District.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runAudit() {
  console.log('--- PHASE 19C: MUNICIPALITY COUNT FORENSIC AUDIT ---');
  
  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const municipalities = await Municipality.find().lean();
  const districts = await District.find().lean();
  
  const report = {
    baseline: {
      count: municipalities.length,
      byType: {},
      byDistrict: {},
      active: 0,
      inactive: 0,
      sourceVerified: 0,
      hasLgdCode: 0,
      hasStateId: 0,
      hasDistrictId: 0
    },
    forensicList: [],
    duplicateAnalysis: {
      duplicateCodes: {},
      businessIdentityCollisions: {},
      normalizedCollisions: {},
      lgdCodeDuplicates: {},
      aliasCollisions: [] // simpler for now
    },
    sourceReconciliation: {
      sourceFiles: [],
      matchStatus: {} // id -> status
    },
    relationshipIntegrity: {
      valid: 0,
      missingParent: 0,
      mismatchedState: 0,
      mismatchedDistrict: 0,
      danglingDistrictId: 0,
      legacyDistrictMismatch: 0,
      issues: []
    }
  };

  const districtMap = new Map();
  for (const dist of districts) {
    districtMap.set(dist._id.toString(), dist);
  }

  const nameDistTypeMap = new Map();
  const normNameDistTypeMap = new Map();
  const codeMap = new Map();
  const lgdMap = new Map();

  for (const m of municipalities) {
    // Collect data
    const mData = {
      _id: m._id.toString(),
      name: m.name,
      code: m.code,
      type: m.type,
      district: m.district,
      state: m.state,
      stateId: m.stateId ? m.stateId.toString() : null,
      districtId: m.districtId ? m.districtId.toString() : null,
      talukaId: m.talukaId ? m.talukaId.toString() : null,
      lgdCode: m.lgdCode || null,
      aliases: m.aliases || [],
      sourceVerified: !!m.sourceVerified,
      isActive: m.isActive !== false,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt
    };
    report.forensicList.push(mData);

    // Grouping Analysis
    report.baseline.byType[m.type] = (report.baseline.byType[m.type] || 0) + 1;
    report.baseline.byDistrict[m.district] = (report.baseline.byDistrict[m.district] || 0) + 1;
    if (mData.isActive) report.baseline.active++; else report.baseline.inactive++;
    if (mData.sourceVerified) report.baseline.sourceVerified++;
    if (mData.lgdCode) report.baseline.hasLgdCode++;
    if (mData.stateId) report.baseline.hasStateId++;
    if (mData.districtId) report.baseline.hasDistrictId++;

    // Duplicates
    if (!codeMap.has(m.code)) codeMap.set(m.code, []);
    codeMap.get(m.code).push(m.name);

    const bizKey = `${m.name}|${m.district}|${m.type}`;
    if (!nameDistTypeMap.has(bizKey)) nameDistTypeMap.set(bizKey, []);
    nameDistTypeMap.get(bizKey).push(m.code);

    const normKey = `${m.name.toLowerCase().replace(/[^a-z0-9]/g, '')}|${m.district.toLowerCase()}|${m.type}`;
    if (!normNameDistTypeMap.has(normKey)) normNameDistTypeMap.set(normKey, []);
    normNameDistTypeMap.get(normKey).push(m.code);

    if (m.lgdCode) {
      if (!lgdMap.has(m.lgdCode)) lgdMap.set(m.lgdCode, []);
      lgdMap.get(m.lgdCode).push(m.name);
    }

    // Relationship Integrity
    let rIssues = [];
    if (!m.districtId) {
      report.relationshipIntegrity.missingParent++;
      rIssues.push('missing districtId');
    } else {
      const parent = districtMap.get(m.districtId.toString());
      if (!parent) {
        report.relationshipIntegrity.danglingDistrictId++;
        rIssues.push('dangling districtId');
      } else {
        if (!m.stateId || (parent.stateId && m.stateId.toString() !== parent.stateId.toString())) {
          report.relationshipIntegrity.mismatchedState++;
          rIssues.push('mismatched stateId');
        }
        if (m.district !== parent.name) {
          report.relationshipIntegrity.legacyDistrictMismatch++;
          rIssues.push(`legacy district mismatch: expected ${parent.name}, got ${m.district}`);
        }
      }
    }
    
    if (rIssues.length === 0) {
      report.relationshipIntegrity.valid++;
    } else {
      report.relationshipIntegrity.issues.push({ id: m._id.toString(), issues: rIssues });
    }
  }

  // Duplicate checks
  codeMap.forEach((names, code) => {
    if (names.length > 1) report.duplicateAnalysis.duplicateCodes[code] = names;
  });
  nameDistTypeMap.forEach((codes, bizKey) => {
    if (codes.length > 1) report.duplicateAnalysis.businessIdentityCollisions[bizKey] = codes;
  });
  normNameDistTypeMap.forEach((codes, normKey) => {
    if (codes.length > 1) report.duplicateAnalysis.normalizedCollisions[normKey] = codes;
  });
  lgdMap.forEach((names, lgd) => {
    if (names.length > 1) report.duplicateAnalysis.lgdCodeDuplicates[lgd] = names;
  });

  // Read CSV
  const csvPath = path.join(__dirname, 'municipalities.csv');
  const sourceRecords = [];
  if (fs.existsSync(csvPath)) {
    report.sourceReconciliation.sourceFiles.push('municipalities.csv');
    await new Promise((resolve) => {
      fs.createReadStream(csvPath)
        .pipe(csvParser())
        .on('data', (row) => sourceRecords.push(row))
        .on('end', resolve);
    });
    
    // Simple reconciliation
    const sourceCodes = new Set(sourceRecords.map(r => r.code || r.Code));
    for (const m of municipalities) {
      if (sourceCodes.has(m.code)) {
        report.sourceReconciliation.matchStatus[m._id.toString()] = 'FOUND_IN_SOURCE';
      } else {
        report.sourceReconciliation.matchStatus[m._id.toString()] = 'NOT_FOUND_IN_SOURCE';
      }
    }
  } else {
    for (const m of municipalities) {
      report.sourceReconciliation.matchStatus[m._id.toString()] = 'SOURCE_FILE_NOT_AVAILABLE';
    }
  }

  // Save report
  const reportsDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }
  const timestamp = Date.now();
  const reportPath = path.join(reportsDir, `municipality_420_forensic_report_${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`Saved forensic report to ${reportPath}`);
  console.log('--- SUMMARY ---');
  console.log(`Total Municipalities: ${report.baseline.count}`);
  console.log(`Types:`, report.baseline.byType);
  console.log(`Codes Duplicate:`, Object.keys(report.duplicateAnalysis.duplicateCodes).length);
  console.log(`Normalized Collisions:`, Object.keys(report.duplicateAnalysis.normalizedCollisions).length);
  console.log(`Not Found in CSV:`, Object.values(report.sourceReconciliation.matchStatus).filter(s => s === 'NOT_FOUND_IN_SOURCE').length);

  await mongoose.disconnect();
}

runAudit().catch(console.error);
