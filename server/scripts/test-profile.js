import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Profile } from '../src/models/Profile.js';

dotenv.config();

const checkProfile = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const profiles = await Profile.find({});
  console.log('Profiles found:', profiles);
  process.exit(0);
};

checkProfile();
