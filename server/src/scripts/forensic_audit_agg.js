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

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Find GP where divisionId is missing or taluka reference is broken
  const brokenGps = await GramPanchayat.find({
    $or: [
      { divisionId: { $exists: false } },
      { divisionId: null },
      { talukaId: { $exists: false } },
      { talukaId: null }
    ]
  }).lean();
  
  if (brokenGps.length > 0) {
    console.log("=== FAILING GPs (Missing fields) ===");
    for (const gp of brokenGps) {
      console.log(JSON.stringify(gp, null, 2));
      const t = await Taluka.findById(gp.talukaId).lean();
      if (t) {
         console.log("\n--- TALUKA ---");
         console.log(JSON.stringify(t, null, 2));
         const d = await District.findById(t.districtId).lean();
         if (d) {
            console.log("\n--- DISTRICT ---");
            console.log(JSON.stringify(d, null, 2));
         }
      }
    }
  } else {
    // Check mismatched districtId or divisionId
    const badGps = await GramPanchayat.aggregate([
      {
        $lookup: {
          from: "talukas",
          localField: "talukaId",
          foreignField: "_id",
          as: "taluka"
        }
      },
      {
        $unwind: "$taluka"
      },
      {
        $match: {
          $expr: {
            $or: [
              { $ne: ["$districtId", "$taluka.districtId"] },
              { $ne: ["$divisionId", "$taluka.divisionId"] }
            ]
          }
        }
      }
    ]);
    if (badGps.length > 0) {
       console.log("=== FAILING GPs (Mismatch) ===");
       console.log(JSON.stringify(badGps[0], null, 2));
    } else {
       console.log("No failures found via aggregation.");
    }
  }

  await mongoose.disconnect();
}
run();
