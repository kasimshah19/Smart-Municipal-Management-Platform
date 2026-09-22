import mongoose from 'mongoose';
import GramPanchayat from '../models/GramPanchayat.js';
mongoose.connect('mongodb+srv://smp_admin:JRY48aMlVBnzNHXB@cluster0.nyfcsro.mongodb.net/smart_municipal?appName=Cluster0').then(async () => {
  const res = await GramPanchayat.deleteMany({ lgdCode: { $type: 'number' } });
  console.log('Deleted:', res.deletedCount);
  process.exit(0);
});
