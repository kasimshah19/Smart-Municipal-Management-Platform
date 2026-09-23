import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Count by aggregation
  const agg = await mongoose.connection.collection('villages').aggregate([
    { $count: 'total' }
  ]).toArray();
  console.log('Aggregation count:', agg);

  // Count per state
  const perState = await mongoose.connection.collection('villages').aggregate([
    { $group: { _id: '$stateName', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]).toArray();
  console.log('Top 10 states by village count:');
  perState.forEach(s => console.log(`  ${s._id}: ${s.count}`));

  // Latest records
  const sample = await mongoose.connection.collection('villages').find({}).sort({ _id: -1 }).limit(3).toArray();
  console.log('Latest 3:', sample.map(s => ({ name: s.name, lgdCode: s.lgdCode, stateName: s.stateName })));
  
  process.exit(0);
}
run();
