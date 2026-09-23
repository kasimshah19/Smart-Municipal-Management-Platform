import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import GramPanchayat from '../models/GramPanchayat.js';
import Taluka from '../models/Taluka.js';
import District from '../models/District.js';
import Division from '../models/Division.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const gps = await GramPanchayat.find().lean();
  let brokenGp = null;
  
  for (const gp of gps) {
    let isValid = true;
    if (!gp.talukaId) {
      console.log(`GP ${gp.name} (${gp.lgdCode}) has no talukaId`);
      isValid = false;
    } else {
      const taluka = await Taluka.findById(gp.talukaId).lean();
      if (!taluka) {
        console.log(`GP ${gp.name} (${gp.lgdCode}) references broken talukaId ${gp.talukaId}`);
        isValid = false;
      } else {
        const district = await District.findById(taluka.districtId).lean();
        if (!district) {
          isValid = false;
        } else {
          if (gp.districtId.toString() !== taluka.districtId.toString()) {
            console.log(`GP ${gp.name} (${gp.lgdCode}) district mismatch`);
            isValid = false;
          }
          if (gp.divisionId && taluka.divisionId && gp.divisionId.toString() !== taluka.divisionId.toString()) {
            console.log(`GP ${gp.name} (${gp.lgdCode}) division mismatch`);
            isValid = false;
          }
          if (!gp.divisionId) {
            console.log(`GP ${gp.name} (${gp.lgdCode}) is missing divisionId`);
            isValid = false;
          }
        }
      }
    }
    
    if (!isValid) {
      brokenGp = gp;
      break;
    }
  }
  
  if (brokenGp) {
    console.log("\n=== FAILING GP ===");
    console.log(JSON.stringify(brokenGp, null, 2));
    
    if (brokenGp.talukaId) {
       const t = await Taluka.findById(brokenGp.talukaId).lean();
       console.log("\n=== REFERENCED TALUKA ===");
       console.log(JSON.stringify(t, null, 2));
       if (t && t.districtId) {
          const d = await District.findById(t.districtId).lean();
          console.log("\n=== REFERENCED DISTRICT ===");
          console.log(JSON.stringify(d, null, 2));
          if (d && d.divisionId) {
             const div = await Division.findById(d.divisionId).lean();
             console.log("\n=== REFERENCED DIVISION ===");
             console.log(JSON.stringify(div, null, 2));
          }
       }
    }
  } else {
    console.log("No failing GP found.");
  }
  
  await mongoose.disconnect();
}
run();
