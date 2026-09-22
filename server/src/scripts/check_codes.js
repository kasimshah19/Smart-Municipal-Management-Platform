import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import Municipality from '../models/Municipality.js';

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-municipal');
  const invalid = await Municipality.find({ 
    code: { 
      $not: /^MH-[A-Z]+-[A-Z]+-[0-9]{3}$/, 
      $nin: ['DHULE-MC', 'BMC', 'TMC', 'NMMC', 'KDMC'] 
    } 
  }).limit(20);
  console.log('Invalid codes:', invalid.map(i => i.code));
  process.exit(0);
};

run();

run();
