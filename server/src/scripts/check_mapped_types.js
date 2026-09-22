import mongoose from 'mongoose';
import GramPanchayat from '../models/GramPanchayat.js';
mongoose.connect('mongodb+srv://smp_admin:JRY48aMlVBnzNHXB@cluster0.nyfcsro.mongodb.net/smart_municipal?appName=Cluster0').then(async () => {
  const stringMapped = await GramPanchayat.countDocuments({ lgdCode: { $type: 'string' }, talukaId: { $ne: null } });
  const numMapped = await GramPanchayat.countDocuments({ lgdCode: { $type: 'number' }, talukaId: { $ne: null } });
  console.log('String mapped:', stringMapped, 'Number mapped:', numMapped);
  process.exit(0);
});
