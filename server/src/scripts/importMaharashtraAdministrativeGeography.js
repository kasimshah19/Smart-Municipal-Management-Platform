import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import Division from '../models/Division.js';
import District from '../models/District.js';
import Taluka from '../models/Taluka.js';
import Municipality from '../models/Municipality.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const DATA_DIR = path.join(__dirname, '../data/maharashtra');

// --- Utilities ---
const normalize = (str) => str?.trim().replace(/\s+/g, ' ') || '';

const loadJSON = (filename) => {
  const filePath = path.join(DATA_DIR, filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
};

// --- Config ---
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

const report = {
  divisions: { inserted: 0, updated: 0, unchanged: 0, errors: [] },
  districts: { inserted: 0, updated: 0, unchanged: 0, codeCollisions: [], errors: [] },
  talukas: { inserted: 0, updated: 0, unchanged: 0, duplicatesSkipped: 0, errors: [] },
  municipalCorporations: { inserted: 0, updated: 0, unchanged: 0, errors: [] },
  municipalCouncils: { inserted: 0, updated: 0, unchanged: 0, errors: [] },
  nagarPanchayats: { inserted: 0, updated: 0, unchanged: 0, errors: [] },
  warnings: [],
  nameCorrections: []
};

// --- Phase 1: Divisions ---
async function importDivisions() {
  console.log('\n=== PHASE 1: Importing Divisions ===');
  const data = loadJSON('divisions.json');
  
  for (const div of data) {
    const existing = await Division.findOne({ name: div.name });
    if (existing) {
      // Update if marathiName missing
      let updated = false;
      if (!existing.marathiName && div.marathiName) {
        if (!DRY_RUN) {
          existing.marathiName = div.marathiName;
          await existing.save();
        }
        updated = true;
      }
      if (updated) {
        report.divisions.updated++;
        if (VERBOSE) console.log(`  Updated: ${div.name}`);
      } else {
        report.divisions.unchanged++;
      }
    } else {
      if (!DRY_RUN) {
        await Division.create({
          name: div.name,
          code: div.code,
          marathiName: div.marathiName || null,
          state: 'Maharashtra'
        });
      }
      report.divisions.inserted++;
      if (VERBOSE) console.log(`  Inserted: ${div.name}`);
    }
  }
  console.log(`  Divisions — inserted: ${report.divisions.inserted}, updated: ${report.divisions.updated}, unchanged: ${report.divisions.unchanged}`);
}

// --- Phase 2: Districts ---
async function importDistricts() {
  console.log('\n=== PHASE 2: Importing Districts ===');
  const data = loadJSON('districts.json');
  
  // Detect code collisions
  const codeMap = {};
  for (const dist of data) {
    if (!codeMap[dist.code]) codeMap[dist.code] = [];
    codeMap[dist.code].push(dist.name);
  }
  for (const [code, names] of Object.entries(codeMap)) {
    if (names.length > 1) {
      report.districts.codeCollisions.push({ code, districts: names });
      console.log(`  CODE COLLISION: ${code} → ${names.join(', ')}`);
    }
  }

  for (const dist of data) {
    const division = await Division.findOne({ name: dist.division });
    if (!division) {
      report.districts.errors.push(`Division not found for district ${dist.name}: ${dist.division}`);
      continue;
    }

    // Legacy name corrections
    const legacyMap = { 'Ahmednagar': 'Ahilyanagar', 'Aurangabad': 'Chhatrapati Sambhajinagar', 'Osmanabad': 'Dharashiv' };
    if (legacyMap[dist.name]) {
      report.nameCorrections.push({ input: dist.name, canonical: legacyMap[dist.name] });
    }

    const existing = await District.findOne({ name: dist.name });
    if (existing) {
      let updated = false;
      if (!existing.marathiName && dist.marathiName) {
        if (!DRY_RUN) { existing.marathiName = dist.marathiName; }
        updated = true;
      }
      if (dist.aliases?.length && (!existing.aliases || existing.aliases.length === 0)) {
        if (!DRY_RUN) { existing.aliases = dist.aliases; }
        updated = true;
      }
      if (updated && !DRY_RUN) await existing.save();
      updated ? report.districts.updated++ : report.districts.unchanged++;
    } else {
      if (!DRY_RUN) {
        await District.create({
          name: dist.name,
          code: dist.code,
          marathiName: dist.marathiName || null,
          aliases: dist.aliases || [],
          divisionId: division._id,
          state: 'Maharashtra'
        });
      }
      report.districts.inserted++;
      if (VERBOSE) console.log(`  Inserted: ${dist.name}`);
    }
  }
  console.log(`  Districts — inserted: ${report.districts.inserted}, updated: ${report.districts.updated}, unchanged: ${report.districts.unchanged}`);
}

// --- Phase 3: Talukas ---
async function importTalukas() {
  console.log('\n=== PHASE 3: Importing Talukas ===');
  const data = loadJSON('talukas.json');
  
  for (const entry of data) {
    const district = await District.findOne({ name: entry.district });
    if (!district) {
      report.talukas.errors.push(`District not found for talukas: ${entry.district}`);
      continue;
    }
    const division = await Division.findById(district.divisionId);

    // Deduplicate within the JSON array
    const seen = new Set();
    for (const talukaName of entry.talukas) {
      const normalized = normalize(talukaName);
      if (seen.has(normalized)) {
        report.talukas.duplicatesSkipped++;
        report.warnings.push(`Duplicate taluka in data: ${talukaName} in ${entry.district}`);
        continue;
      }
      seen.add(normalized);

      const existing = await Taluka.findOne({ districtId: district._id, name: talukaName });
      if (existing) {
        let updated = false;
        if (!existing.divisionName && division) {
          if (!DRY_RUN) { existing.divisionName = division.name; await existing.save(); }
          updated = true;
        }
        updated ? report.talukas.updated++ : report.talukas.unchanged++;
      } else {
        if (!DRY_RUN) {
          await Taluka.create({
            name: talukaName,
            districtId: district._id,
            districtName: district.name,
            divisionId: district.divisionId,
            divisionName: division?.name || null,
            state: 'Maharashtra'
          });
        }
        report.talukas.inserted++;
      }
    }
  }
  console.log(`  Talukas — inserted: ${report.talukas.inserted}, updated: ${report.talukas.updated}, unchanged: ${report.talukas.unchanged}, duplicates skipped: ${report.talukas.duplicatesSkipped}`);
}

// --- Phase 4: Municipal Corporations ---
async function importMunicipalCorporations() {
  console.log('\n=== PHASE 4: Importing Municipal Corporations ===');
  const data = loadJSON('municipalCorporations.json');
  
  for (const mc of data) {
    const existing = await Municipality.findOne({ code: mc.code });
    if (existing) {
      let updated = false;
      if (!existing.marathiName && mc.marathiName) {
        if (!DRY_RUN) { existing.marathiName = mc.marathiName; await existing.save(); }
        updated = true;
      }
      updated ? report.municipalCorporations.updated++ : report.municipalCorporations.unchanged++;
    } else {
      if (!DRY_RUN) {
        await Municipality.create({
          name: mc.name,
          code: mc.code,
          type: 'MUNICIPAL_CORPORATION',
          district: mc.district,
          marathiName: mc.marathiName || null,
          jurisdictionCategory: 'URBAN',
          source: 'Phase 9B requirements',
          sourceVerifiedAt: null,
          state: 'Maharashtra',
          country: 'India',
          isActive: true
        });
      }
      report.municipalCorporations.inserted++;
      if (VERBOSE) console.log(`  Inserted MC: ${mc.name}`);
    }
  }
  console.log(`  Municipal Corporations — inserted: ${report.municipalCorporations.inserted}, updated: ${report.municipalCorporations.updated}, unchanged: ${report.municipalCorporations.unchanged}`);
}

// --- Phase 5: Municipal Councils ---
async function importMunicipalCouncils() {
  console.log('\n=== PHASE 5: Importing Municipal Councils ===');
  const data = loadJSON('municipalCouncils.json');
  
  for (const mc of data.records) {
    const code = `MC-${mc.district.substring(0, 3).toUpperCase()}-${mc.name.substring(0, 4).toUpperCase()}`.replace(/\s/g, '');
    const existing = await Municipality.findOne({ name: mc.name, district: mc.district, type: 'MUNICIPAL_COUNCIL' });
    if (existing) {
      report.municipalCouncils.unchanged++;
    } else {
      // Check if code already taken
      const codeExists = await Municipality.findOne({ code });
      const finalCode = codeExists ? `${code}-${Date.now().toString(36).slice(-4).toUpperCase()}` : code;
      
      if (!DRY_RUN) {
        try {
          await Municipality.create({
            name: mc.name,
            code: finalCode,
            type: 'MUNICIPAL_COUNCIL',
            district: mc.district,
            jurisdictionCategory: 'URBAN',
            source: 'Phase 9B requirements (unverified)',
            sourceVerifiedAt: null,
            state: 'Maharashtra',
            country: 'India',
            isActive: true
          });
          report.municipalCouncils.inserted++;
        } catch (err) {
          report.municipalCouncils.errors.push(`${mc.name} (${mc.district}): ${err.message}`);
        }
      } else {
        report.municipalCouncils.inserted++;
      }
    }
  }
  console.log(`  Municipal Councils — inserted: ${report.municipalCouncils.inserted}, unchanged: ${report.municipalCouncils.unchanged}, errors: ${report.municipalCouncils.errors.length}`);
}

// --- Phase 6: Nagar Panchayats ---
async function importNagarPanchayats() {
  console.log('\n=== PHASE 6: Importing Nagar Panchayats ===');
  const data = loadJSON('nagarPanchayats.json');
  
  for (const np of data.records) {
    const code = `NP-${np.district.substring(0, 3).toUpperCase()}-${np.name.substring(0, 4).toUpperCase()}`.replace(/\s/g, '');
    const existing = await Municipality.findOne({ name: np.name, district: np.district, type: 'NAGAR_PANCHAYAT' });
    if (existing) {
      report.nagarPanchayats.unchanged++;
    } else {
      const codeExists = await Municipality.findOne({ code });
      const finalCode = codeExists ? `${code}-${Date.now().toString(36).slice(-4).toUpperCase()}` : code;
      
      if (!DRY_RUN) {
        try {
          await Municipality.create({
            name: np.name,
            code: finalCode,
            type: 'NAGAR_PANCHAYAT',
            district: np.district,
            jurisdictionCategory: 'URBAN',
            source: 'Phase 9B requirements (unverified)',
            sourceVerifiedAt: null,
            state: 'Maharashtra',
            country: 'India',
            isActive: true
          });
          report.nagarPanchayats.inserted++;
        } catch (err) {
          report.nagarPanchayats.errors.push(`${np.name} (${np.district}): ${err.message}`);
        }
      } else {
        report.nagarPanchayats.inserted++;
      }
    }
  }
  console.log(`  Nagar Panchayats — inserted: ${report.nagarPanchayats.inserted}, unchanged: ${report.nagarPanchayats.unchanged}, errors: ${report.nagarPanchayats.errors.length}`);
}

// --- Main ---
async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`MAHARASHTRA MASTER DATA IMPORT ${DRY_RUN ? '(DRY RUN)' : '(LIVE)'}`);
  console.log(`${'='.repeat(60)}`);

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    await importDivisions();
    await importDistricts();
    await importTalukas();
    await importMunicipalCorporations();
    await importMunicipalCouncils();
    await importNagarPanchayats();

    // --- Final Summary ---
    console.log(`\n${'='.repeat(60)}`);
    console.log('FINAL IMPORT REPORT');
    console.log(`${'='.repeat(60)}`);
    
    console.log('\n--- Counts ---');
    const divCount = DRY_RUN ? '(dry run)' : await Division.countDocuments();
    const distCount = DRY_RUN ? '(dry run)' : await District.countDocuments();
    const talCount = DRY_RUN ? '(dry run)' : await Taluka.countDocuments();
    const mcCorpCount = DRY_RUN ? '(dry run)' : await Municipality.countDocuments({ type: 'MUNICIPAL_CORPORATION' });
    const mcCouncilCount = DRY_RUN ? '(dry run)' : await Municipality.countDocuments({ type: 'MUNICIPAL_COUNCIL' });
    const npCount = DRY_RUN ? '(dry run)' : await Municipality.countDocuments({ type: 'NAGAR_PANCHAYAT' });
    
    console.log(`Divisions in DB:              ${divCount}`);
    console.log(`Districts in DB:              ${distCount}`);
    console.log(`Talukas in DB:                ${talCount}`);
    console.log(`Municipal Corporations in DB: ${mcCorpCount}`);
    console.log(`Municipal Councils in DB:     ${mcCouncilCount}`);
    console.log(`Nagar Panchayats in DB:       ${npCount}`);

    if (report.districts.codeCollisions.length > 0) {
      console.log('\n--- District Code Collisions (Expected) ---');
      report.districts.codeCollisions.forEach(c => console.log(`  ${c.code} → ${c.districts.join(', ')}`));
    }

    if (report.nameCorrections.length > 0) {
      console.log('\n--- Name Corrections ---');
      report.nameCorrections.forEach(c => console.log(`  ${c.input} → ${c.canonical}`));
    }

    if (report.warnings.length > 0) {
      console.log('\n--- Warnings ---');
      report.warnings.forEach(w => console.log(`  ⚠ ${w}`));
    }

    const allErrors = [
      ...report.divisions.errors,
      ...report.districts.errors,
      ...report.talukas.errors,
      ...report.municipalCorporations.errors,
      ...report.municipalCouncils.errors,
      ...report.nagarPanchayats.errors
    ];
    if (allErrors.length > 0) {
      console.log('\n--- Errors ---');
      allErrors.forEach(e => console.log(`  ✗ ${e}`));
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`IMPORT ${DRY_RUN ? 'DRY RUN' : ''} COMPLETE`);
    console.log(`${'='.repeat(60)}\n`);

    process.exit(0);
  } catch (error) {
    console.error(`FATAL ERROR: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
