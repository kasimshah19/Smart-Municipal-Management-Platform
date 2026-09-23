import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import State from '../models/State.js';

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const mh = await State.findOne({ name: 'Maharashtra' });
    if (mh) {
      console.log('Maharashtra state already exists:', mh._id);
    } else {
      const newState = await State.create({
        name: 'Maharashtra',
        type: 'STATE',
        lgdCode: '27',
        stateCode: 'MH',
        sourceAuthority: 'LGD',
        sourceDataset: 'Manual Seed'
      });
      console.log('Successfully seeded Maharashtra state:', newState._id);
    }
  } catch (error) {
    console.error('Error seeding state:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
