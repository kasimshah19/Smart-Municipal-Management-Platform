import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import GramPanchayat from '../models/GramPanchayat.js';
import District from '../models/District.js';
import Division from '../models/Division.js';
import Taluka from '../models/Taluka.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'smart_municipal';
const CSV_FILE_PATH = path.resolve(__dirname, 'data/maharashtra_gram_panchayats.csv');
const BATCH_SIZE = 1000;

// Mapping legacy names in LGD to our DB canonical names
const DISTRICT_NAME_MAPPING = {
  'Ahilyanagar': 'Ahmednagar', // Or vice-versa, depending on what's in our DB
  'Chhatrapati Sambhajinagar': 'Aurangabad',
  'Dharashiv': 'Osmanabad'
};

async function importGramPanchayats() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  if (isDryRun) {
    console.log('--- DRY RUN MODE --- (No database modifications)');
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully.');

    // 1. Preload DB Maps
    console.log('Loading Divisions, Districts, and Talukas from DB...');
    const divisions = await Division.find({}).lean();
    const districts = await District.find({}).lean();
    const talukas = await Taluka.find({}).lean();

    const dbDistrictsMap = new Map();
    for (const d of districts) {
      dbDistrictsMap.set(d.name.toLowerCase(), d);
    }
    
    const dbTalukasMap = new Map();
    for (const t of talukas) {
      // Key: districtId + taluka name (lowercase) to avoid cross-district collisions
      dbTalukasMap.set(`${t.districtId.toString()}-${t.name.toLowerCase()}`, t);
    }

    // 2. Preload CSV Maps (Block Panchayat and Zilla Parishad)
    console.log(`Parsing CSV: ${CSV_FILE_PATH} to build Block/Zilla maps...`);
    const zillaParishads = new Map();
    const blockPanchayats = new Map();

    const parseMappings = () => {
      return new Promise((resolve, reject) => {
        fs.createReadStream(CSV_FILE_PATH)
          .pipe(csv({ skipLines: 1 }))
          .on('data', (row) => {
            const type = row['Localbody Type Name'];
            const lgdCode = row['Localbody Code'];
            const nameEng = row['Localbody Name (In English)'];
            const nameLocal = row['Localbody Name (In Local)'];
            const parentCode = row['Parent Localbody Code'];
            
            if (type === 'Zilla Parishad') {
              zillaParishads.set(lgdCode, { name: nameEng, marathiName: nameLocal });
            } else if (type === 'Block Panchayat') {
              blockPanchayats.set(lgdCode, { name: nameEng, marathiName: nameLocal, parentCode });
            }
          })
          .on('error', reject)
          .on('end', resolve);
      });
    };
    
    await parseMappings();
    console.log(`Loaded ${zillaParishads.size} Zilla Parishads and ${blockPanchayats.size} Block Panchayats.`);

    // 3. Parse Village Panchayats and Prepare Operations
    console.log('Processing Village Panchayats...');
    const operations = [];
    const stats = {
      totalRows: 0,
      villagePanchayats: 0,
      otherTypes: 0,
      unresolvedDistricts: 0,
      unresolvedTalukas: 0,
      inserted: 0,
      updated: 0,
      unchanged: 0
    };

    // To verify against existing DB records
    const existingGPs = await GramPanchayat.find({}, { lgdCode: 1, name: 1, districtId: 1, talukaId: 1 }).lean();
    const existingGPLgdCodes = new Map();
    for (const gp of existingGPs) {
      // Handle the fact that lgdCode could have been Number previously
      existingGPLgdCodes.set(gp.lgdCode.toString(), gp);
    }
    
    const parseGPs = () => {
      return new Promise((resolve, reject) => {
        fs.createReadStream(CSV_FILE_PATH)
          .pipe(csv({ skipLines: 1 }))
          .on('data', (row) => {
            if (Object.keys(row).length < 2) return;
            stats.totalRows++;
            
            const type = row['Localbody Type Name'];
            if (type !== 'Village Panchayat') {
              stats.otherTypes++;
              return;
            }
            stats.villagePanchayats++;

            const lgdCode = row['Localbody Code']?.trim();
            const name = row['Localbody Name (In English)']?.trim();
            const marathiName = row['Localbody Name (In Local)']?.trim();
            const parentCode = row['Parent Localbody Code']?.trim();

            let districtId = null;
            let districtName = null;
            let divisionId = null;
            let divisionName = null;
            let talukaId = null;
            let talukaName = null;
            let developmentBlockName = null;
            let developmentBlockLgdCode = null;

            // Resolve Hierarchy
            const blockPanchayat = blockPanchayats.get(parentCode);
            if (blockPanchayat) {
              developmentBlockName = blockPanchayat.name;
              developmentBlockLgdCode = parentCode;
              
              const zillaParishad = zillaParishads.get(blockPanchayat.parentCode);
              if (zillaParishad) {
                // Map to District
                let rawDistName = zillaParishad.name;
                let mappedDistName = DISTRICT_NAME_MAPPING[rawDistName] || rawDistName;
                
                // For Dharashiv -> Osmanabad, etc. Let's try both if one fails
                let dbDistrict = dbDistrictsMap.get(mappedDistName.toLowerCase());
                if (!dbDistrict) {
                  dbDistrict = dbDistrictsMap.get(rawDistName.toLowerCase());
                }
                
                if (dbDistrict) {
                  districtId = dbDistrict._id;
                  districtName = dbDistrict.name;
                  divisionId = dbDistrict.divisionId;
                  // The divisions might not be populated in dbDistricts if not lean populated, let's find it:
                  const div = divisions.find(d => d._id.toString() === dbDistrict.divisionId?.toString());
                  if (div) {
                      divisionName = div.name;
                  }

                  // Map Taluka via Block Panchayat name
                  const talukaKey = `${districtId.toString()}-${developmentBlockName.toLowerCase()}`;
                  const dbTaluka = dbTalukasMap.get(talukaKey);
                  if (dbTaluka) {
                    talukaId = dbTaluka._id;
                    talukaName = dbTaluka.name;
                  } else {
                    stats.unresolvedTalukas++;
                  }
                } else {
                  stats.unresolvedDistricts++;
                }
              } else {
                stats.unresolvedDistricts++;
              }
            } else {
              stats.unresolvedDistricts++;
            }
            
            const updateDoc = {
              $set: {
                name,
                marathiName,
                lgdCode,
                localBodyType: 'GRAM_PANCHAYAT',
                category: 'RURAL',
                talukaId,
                talukaName,
                districtId,
                districtName,
                divisionId,
                divisionName,
                parentLocalBodyCode: parentCode,
                developmentBlockName,
                developmentBlockLgdCode,
                state: 'Maharashtra',
                source: 'LGD',
                sourceFile: 'maharashtra_gram_panchayats.csv',
                sourceVerified: true,
                sourceDownloadedAt: new Date()
              }
            };
            
            // Check idempotency metrics
            const existing = existingGPLgdCodes.get(lgdCode);
            if (!existing) {
              stats.inserted++;
            } else {
              // Simple diffing logic (we'll just assume they're updated or unchanged)
              if (existing.name !== name || existing.districtId?.toString() !== districtId?.toString() || existing.talukaId?.toString() !== talukaId?.toString()) {
                stats.updated++;
              } else {
                stats.unchanged++;
              }
            }

            if (!isDryRun) {
              operations.push({
                updateOne: {
                  filter: { lgdCode },
                  update: updateDoc,
                  upsert: true
                }
              });
            }
          })
          .on('error', reject)
          .on('end', resolve);
      });
    };

    await parseGPs();

    if (!isDryRun && operations.length > 0) {
      console.log(`Executing ${operations.length} bulkWrite operations in batches of ${BATCH_SIZE}...`);
      let processed = 0;
      for (let i = 0; i < operations.length; i += BATCH_SIZE) {
        const batch = operations.slice(i, i + BATCH_SIZE);
        await GramPanchayat.bulkWrite(batch, { ordered: false });
        processed += batch.length;
        if (processed % 5000 === 0) {
          console.log(`Processed ${processed} / ${operations.length} operations...`);
        }
      }
      console.log('Bulk operations completed successfully.');
    }

    const report = {
      sourceFile: CSV_FILE_PATH,
      dryRun: isDryRun,
      totalRowsProcessed: stats.totalRows,
      villagePanchayats: stats.villagePanchayats,
      otherTypes: stats.otherTypes,
      dbRecordsBefore: existingGPLgdCodes.size,
      unresolvedDistricts: stats.unresolvedDistricts,
      unresolvedTalukas: stats.unresolvedTalukas,
      inserted: stats.inserted,
      updated: stats.updated,
      unchanged: stats.unchanged
    };

    console.log('\n--- IMPORT REPORT ---');
    console.log(JSON.stringify(report, null, 2));
    
    // Save report to file
    const reportPath = path.resolve(__dirname, 'gp-import-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nReport saved to: ${reportPath}`);

  } catch (error) {
    console.error('An error occurred during import:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('Database connection closed.');
    }
  }
}

importGramPanchayats();
