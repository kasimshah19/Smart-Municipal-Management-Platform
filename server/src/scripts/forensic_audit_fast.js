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
  const talukas = await Taluka.find().lean();
  const districts = await District.find().lean();
  
  const tMap = new Map(talukas.map(t => [t._id.toString(), t]));
  const dMap = new Map(districts.map(d => [d._id.toString(), d]));
  
  let brokenGp = null;
  
  for (const gp of gps) {
    let isValid = true;
    if (!gp.talukaId) {
      isValid = false;
    } else {
      const taluka = tMap.get(gp.talukaId.toString());
      if (!taluka) {
        isValid = false;
      } else {
        const district = dMap.get(taluka.districtId.toString());
        if (!district) {
          isValid = false;
        } else {
          if (gp.districtId.toString() !== taluka.districtId.toString()) {
            isValid = false;
          }
          if (gp.divisionId && taluka.divisionId && gp.divisionId.toString() !== taluka.divisionId.toString()) {
            isValid = false;
          }
          if (!gp.divisionId) {
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
       const t = tMap.get(brokenGp.talukaId.toString());
       console.log("\n=== REFERENCED TALUKA ===");
       console.log(JSON.stringify(t, null, 2));
       if (t && t.districtId) {
          const d = dMap.get(t.districtId.toString());
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
