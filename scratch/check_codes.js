const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../../server/.env') });

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-municipal').then(async () => {
  const Municipality = require('../../server/src/models/Municipality.js').default;
  const invalid = await Municipality.find({ code: { $not: /^MH-[A-Z]+-[A-Z]+-[0-9]{3}$/ }, abbreviation: { $exists: false } }).limit(5);
  console.log(invalid.map(i => i.code));
  process.exit(0);
});
