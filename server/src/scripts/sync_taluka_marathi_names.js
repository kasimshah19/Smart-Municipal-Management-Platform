import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import Taluka from '../models/Taluka.js';
import PanchayatSamiti from '../models/PanchayatSamiti.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function syncMarathiNames() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const samitis = await PanchayatSamiti.find({ marathiName: { $exists: true, $ne: '' } });
    console.log(`Found ${samitis.length} Panchayat Samitis with Marathi names.`);

    let updated = 0;
    for (const ps of samitis) {
      if (ps.talukaId) {
        const taluka = await Taluka.findById(ps.talukaId);
        if (taluka && !taluka.marathiName) {
          taluka.marathiName = ps.marathiName;
          await taluka.save();
          updated++;
        }
      } else {
        // Fallback: match by name and district
        const taluka = await Taluka.findOne({ 
          name: { $regex: new RegExp(`^${ps.name}$`, 'i') },
          districtId: ps.districtId 
        });
        if (taluka && !taluka.marathiName) {
          taluka.marathiName = ps.marathiName;
          await taluka.save();
          updated++;
        }
      }
    }

    console.log(`Updated ${updated} Talukas with Marathi names.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

syncMarathiNames();
