import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Taluka from '../models/Taluka.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const manualMappings = {
  'Mumbai City': 'मुंबई शहर',
  'Andheri': 'अंधेरी',
  'Borivali': 'बोरीवली',
  'Kurla': 'कुर्ला',
  'Thane': 'ठाणे',
  'Ulhasnagar': 'उल्हासनगर',
  'Vada': 'वाडा',
  'Devgad': 'देवगड',
  'Pune City': 'पुणे शहर',
  'Jaoli': 'जावळी',
  'Ajra': 'आजरा',
  'Walwa': 'वाळवा',
  'Peint': 'पेठ',
  'Yevala': 'येवला',
  'Sindkheda': 'शिंदखेडा',
  'Akrani': 'अक्राणी',
  'Selu': 'सेलू',
  'Mudkhed': 'मुदखेड',
  'Mukhed': 'मुखेड',
  'Ahmedpur': 'अहमदपूर',
  'Deulgaon Raja': 'देऊळगाव राजा',
  'Savner': 'सावनेर'
};

async function updateManual() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    let updatedCount = 0;
    for (const [englishName, marathiName] of Object.entries(manualMappings)) {
      const taluka = await Taluka.findOne({ name: englishName });
      if (taluka) {
        taluka.marathiName = marathiName;
        await taluka.save();
        updatedCount++;
      }
    }
    
    console.log(`Manually updated ${updatedCount} remaining Talukas with Marathi names.`);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

updateManual();
