import mongoose from 'mongoose';
import GramPanchayat from '../models/GramPanchayat.js';
mongoose.connect('mongodb+srv://smp_admin:JRY48aMlVBnzNHXB@cluster0.nyfcsro.mongodb.net/smart_municipal?appName=Cluster0').then(async () => {
  const gps = await GramPanchayat.aggregate([{ $group: { _id: '$lgdCode', count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }]);
  console.log('Duplicates:', gps.length);
  const duplicates = gps.slice(0, 5);
  console.log(duplicates);
  const total = await GramPanchayat.countDocuments();
  console.log('Total GPs:', total);
  process.exit(0);
});
