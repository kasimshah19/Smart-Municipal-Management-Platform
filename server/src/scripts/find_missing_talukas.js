import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Taluka from '../models/Taluka.js';
import PanchayatSamiti from '../models/PanchayatSamiti.js';
import District from '../models/District.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function findMissing() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const missingTalukas = await Taluka.find({ $or: [{ marathiName: null }, { marathiName: '' }] }).populate('districtId');
    
    console.log(`Found ${missingTalukas.length} Talukas missing Marathi names.`);
    
    // For each missing, let's see if we can find a close match in PanchayatSamiti
    const allPS = await PanchayatSamiti.find({ marathiName: { $exists: true, $ne: '' } });
    
    for (const taluka of missingTalukas) {
      // try to find a PS in the same district that starts with the same 3 letters
      const psMatch = allPS.find(ps => 
        ps.districtId && taluka.districtId &&
        ps.districtId.toString() === taluka.districtId._id.toString() &&
        (ps.name.substring(0, 3).toLowerCase() === taluka.name.substring(0, 3).toLowerCase() || 
         taluka.name.includes(ps.name) || 
         ps.name.includes(taluka.name))
      );
      
      if (psMatch) {
        console.log(`- MATCH FOUND: Taluka: ${taluka.name} (${taluka.districtId.name}) => PS: ${psMatch.name} (${psMatch.marathiName})`);
        taluka.marathiName = psMatch.marathiName;
        await taluka.save();
      } else {
        console.log(`- STILL MISSING: Taluka: ${taluka.name} (${taluka.districtId.name})`);
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    await mongoose.disconnect();
  }
}

findMissing();
