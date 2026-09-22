import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import GramPanchayat from '../models/GramPanchayat.js';
import Taluka from '../models/Taluka.js';
import District from '../models/District.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';

// Mapping rules: keys are specific LGD block names that didn't match directly.
const MANUAL_MAPPING = {
  "karvir": "karveer",
  "dharashiv": "osmanabad",
  "chhatrapati sambhajinagar": "aurangabad",
  "ahilyanagar": "ahmednagar",
  "kalyan panchayat samiti": "kalyan",
  "peth": "peint",
  "ahemadpur": "ahmedpur",
  "saoner": "savner",
  "deogad": "devgad",
  "ambernath": "ambarnath",
  "chipalun": "chiplun",
  "wada": "vada",
  "jath": "jat",
  "parali v .": "parli",
  "south solapur": "solapur south",
  "north solapur": "solapur north",
  "shindkheda": "sindkheda",
  "vaibhavawadi": "vaibhavwadi",
  "akarani": "akrani",
  "anjangaon s": "anjangaon surji",
  "zari jamni": "zari-jamani",
  "basmat": "basmath",
  "nandgaon kh": "nandgaon khandeshwar",
  "yeola": "yevala",
  "sailu": "selu",
  "kanand": "kannad",
  "kankavali": "kankavli",
  "sawantwadi": "sawantwadi", // Just in case
  "mumbai": "mumbai city",
  "mumbai suburban": "mumbai suburban",
  "sindkhedraja": "sindkhed raja",
  "mhasala": "mhasla",
  "mokhed": "mukhed",
  "jalgaonjamod": "jalgaon jamod",
  "brahmapuri": "bramhapuri",
  "jawali": "jaoli",
  "kavathemahankal": "kavathe mahankal",
  "valva-islampur": "walwa",
  "khanapur-vita": "khanapur",
  "dhamangaon ril": "dhamangaon railway",
  "buldana": "buldhana",
  "chandur bz": "chandurbazar",
  "ambajogai": "ambejogai",
  "mangalvedhe": "mangalwedha",
  "murtijapur": "murtizapur",
  "d. raja": "deulgaon raja",
  "hatkanangale": "hatkanangle",
  "trimbak": "trimbakeshwar",
  "sangmeshwar": "sangameshwar",
  "kurkheda": "kurkheda",
  "malegav": "malegaon",
  "malshiras": "malshiras",
  "manwat": "manwath",
  "modkhed": "mudkhed",
  "desaiganj (wadsa)": "desaiganj",
  "chandur ril": "chandur railway",
  "gagan bavada": "gaganbawda",
  "shirur ( ka )": "shirur",
  "ajara": "ajra",
  "bhamaragad": "bhamragad",
  "bhadrawati": "bhadravati",
  "khultabad": "khuldabad"
};

// Function to clean and standardize strings for comparison
const cleanString = (str) => {
  if (!str) return '';
  let cleaned = str.toLowerCase().trim();
  // Remove common suffixes from Block names
  cleaned = cleaned.replace(/\s*\(?rural\)?\s*/g, '');
  cleaned = cleaned.replace(/\s*panchayat\s*samiti\s*/g, '');
  cleaned = cleaned.replace(/\s*block\s*/g, '');
  // Remove (kh) and (bk)
  cleaned = cleaned.replace(/\s*\(\s*kh\s*\)\s*/g, '');
  cleaned = cleaned.replace(/\s*\(\s*bk\s*\)\s*/g, '');
  cleaned = cleaned.replace(/\s*\(\s*ka\s*\)\s*/g, '');
  cleaned = cleaned.replace(/\s*\(\s*wadsa\s*\)\s*/g, '');
  cleaned = cleaned.trim();
  
  if (MANUAL_MAPPING[cleaned]) {
    return MANUAL_MAPPING[cleaned];
  }
  return cleaned;
};

async function reconcileTalukas() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  if (isDryRun) {
    console.log('--- DRY RUN MODE --- (No database modifications)');
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected successfully.');

    // Preload Talukas
    const talukas = await Taluka.find({}).lean();
    const talukaMap = new Map();
    
    // Create mapping keys
    for (const t of talukas) {
      const distIdStr = t.districtId.toString();
      const cleanedName = cleanString(t.name);
      
      const key1 = `${distIdStr}-${cleanedName}`;
      talukaMap.set(key1, t);
    }

    // Find Gram Panchayats with null talukaId
    const unmappedGPs = await GramPanchayat.find({ 
      talukaId: null, 
      developmentBlockName: { $ne: null } 
    });

    console.log(`Found ${unmappedGPs.length} Gram Panchayats with unresolved Talukas.`);

    let mappedCount = 0;
    let failedCount = 0;
    const failedBlocks = new Set();
    const operations = [];

    for (const gp of unmappedGPs) {
      const distIdStr = gp.districtId?.toString();
      if (!distIdStr) {
        failedCount++;
        continue; // Cannot map without district
      }

      const blockName = gp.developmentBlockName;
      const cleanedBlockName = cleanString(blockName);
      
      const searchKey = `${distIdStr}-${cleanedBlockName}`;
      const matchedTaluka = talukaMap.get(searchKey);

      if (matchedTaluka) {
        mappedCount++;
        if (!isDryRun) {
          operations.push({
            updateOne: {
              filter: { _id: gp._id },
              update: {
                $set: {
                  talukaId: matchedTaluka._id,
                  talukaName: matchedTaluka.name
                }
              }
            }
          });
        }
      } else {
        failedCount++;
        failedBlocks.add(`${gp.districtName} -> ${blockName} (cleaned: ${cleanedBlockName})`);
      }
    }

    console.log(`\nReconciliation Results:`);
    console.log(`Successfully mapped: ${mappedCount}`);
    console.log(`Failed to map: ${failedCount}`);

    if (failedBlocks.size > 0) {
      console.log(`\nSample of failed blocks (up to 20):`);
      Array.from(failedBlocks).slice(0, 20).forEach(b => console.log(` - ${b}`));
    }

    if (!isDryRun && operations.length > 0) {
      console.log(`\nExecuting ${operations.length} bulk updates...`);
      await GramPanchayat.bulkWrite(operations, { ordered: false });
      console.log('Bulk operations completed successfully.');
    }

  } catch (error) {
    console.error('An error occurred during reconciliation:', error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('Database connection closed.');
    }
  }
}

reconcileTalukas();
