import mongoose from 'mongoose';
import GramPanchayat from '../models/GramPanchayat.js';
mongoose.connect('mongodb+srv://smp_admin:JRY48aMlVBnzNHXB@cluster0.nyfcsro.mongodb.net/smart_municipal?appName=Cluster0').then(async () => {
  const asString = await GramPanchayat.countDocuments({ lgdCode: { $type: 'string' } });
  const asNum = await GramPanchayat.countDocuments({ lgdCode: { $type: 'number' } });
  const total = await GramPanchayat.countDocuments();
  console.log('Strings:', asString, 'Numbers:', asNum, 'Total:', total);
  
  // Clean up if there are duplicates with string vs number
  if (asString > 0 && asNum > 0 && asString + asNum === total) {
      console.log('Duplicate sets identified based on type. To delete numbers:');
      console.log('await GramPanchayat.deleteMany({ lgdCode: { $type: "number" } });');
  }
  process.exit(0);
});
