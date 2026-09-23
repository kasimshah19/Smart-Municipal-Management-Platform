import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const auditPincode = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for Phase 14 Audit.");

    // 1. Geography Regression
    const gpCount = await mongoose.connection.db.collection('grampanchayats').countDocuments();
    const talukaCount = await mongoose.connection.db.collection('talukas').countDocuments();
    const districtCount = await mongoose.connection.db.collection('districts').countDocuments();
    const divisionCount = await mongoose.connection.db.collection('divisions').countDocuments();
    const municipalityCount = await mongoose.connection.db.collection('municipalities').countDocuments();

    console.log(`\n--- Geography Regression ---`);
    console.log(`Gram Panchayats: ${gpCount} (Expected: 28087)`);
    console.log(`Talukas: ${talukaCount}`);
    console.log(`Districts: ${districtCount}`);
    console.log(`Divisions: ${divisionCount}`);
    console.log(`Municipalities: ${municipalityCount} (Expected: 395)`);

    // 2. Pincode Stats
    const pincodeCollection = mongoose.connection.db.collection('pincodes');
    const totalPincodeRows = await pincodeCollection.countDocuments();
    const uniquePincodes = (await pincodeCollection.distinct('pincode')).length;
    const uniqueOffices = (await pincodeCollection.distinct('officeName')).length;
    
    console.log(`\n--- Pincode Stats ---`);
    console.log(`Total Pincode Records (Maharashtra): ${totalPincodeRows}`);
    console.log(`Unique Pincodes: ${uniquePincodes}`);
    console.log(`Unique Office Names: ${uniqueOffices}`);

    // Check for exact duplicate records (same pincode, officeName, officeType)
    const duplicates = await pincodeCollection.aggregate([
      { $group: { _id: { pincode: "$pincode", officeName: "$officeName", officeType: "$officeType" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    console.log(`Duplicate Post Office records: ${duplicates.length}`);

    // Check for schema integrity (how many have valid taluka, coordinates)
    const withLat = await pincodeCollection.countDocuments({ latitude: { $ne: null } });
    const withLon = await pincodeCollection.countDocuments({ longitude: { $ne: null } });
    const withTaluka = await pincodeCollection.countDocuments({ talukaName: { $ne: null, $ne: "" } });

    console.log(`Records with Latitude: ${withLat}`);
    console.log(`Records with Longitude: ${withLon}`);
    console.log(`Records with raw Taluka mapping: ${withTaluka}`);

    console.log("\nAudit complete.");
    process.exit(0);
  } catch (error) {
    console.error("Audit error:", error);
    process.exit(1);
  }
};

auditPincode();
