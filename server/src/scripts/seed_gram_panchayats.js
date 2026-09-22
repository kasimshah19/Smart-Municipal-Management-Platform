import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';
import csv from 'csv-parser';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') }); // Load root .env if run from scripts dir

// MongoDB Connection Configuration
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
// Extract DB name from URI or use default
const DB_NAME = MONGO_URI.includes('?') 
  ? MONGO_URI.substring(MONGO_URI.lastIndexOf('/') + 1, MONGO_URI.indexOf('?'))
  : (MONGO_URI.substring(MONGO_URI.lastIndexOf('/') + 1) || 'smart_municipal');

const COLLECTION_NAME = 'grampanchayats'; // Mongoose creates lowercase plural collections
const CSV_FILE_PATH = path.resolve('./data/maharashtra_gram_panchayats.csv');

// Batch size for MongoDB bulkWrite
const BATCH_SIZE = 1000;

async function seedGramPanchayats() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await client.connect();
    console.log('Connected successfully!');

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    // 1. Create unique index on lgdCode & composite index on district + taluka
    console.log('Creating database indexes...');
    await collection.createIndex({ lgdCode: 1 }, { unique: true, sparse: true });
    // Note: GP names can be duplicate in the same taluka
    await collection.createIndex({ district: 1, taluka: 1, name: 1 }, { unique: false });

    if (!fs.existsSync(CSV_FILE_PATH)) {
      console.log(`CSV File not found at ${CSV_FILE_PATH}. Please ensure the data file exists.`);
      return;
    }

    console.log(`Reading and parsing CSV data into memory...`);
    const allRecords = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream(CSV_FILE_PATH)
        .pipe(csv({ skipLines: 1 }))
        .on('data', (data) => allRecords.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`Loaded ${allRecords.length} records from CSV.`);

    // Map to hold parent relationships
    const localBodiesMap = {}; // localBodyCode -> { name, type, parentCode }

    // First pass: Build hierarchy mapping
    for (const row of allRecords) {
      const typeCode = parseInt(row['Localbody Type Code'], 10);
      const code = parseInt(row['Localbody Code'], 10);
      const name = (row['Localbody Name (In English)'] || '').trim();
      const parentCode = parseInt(row['Parent Localbody Code'], 10);

      if (!isNaN(code) && name) {
        localBodiesMap[code] = {
          name,
          typeCode,
          parentCode: isNaN(parentCode) ? 0 : parentCode
        };
      }
    }

    let batch = [];
    let totalProcessed = 0;
    let totalInserted = 0;

    console.log('Processing Village Panchayats...');

    // Second pass: Process Village Panchayats
    for (const row of allRecords) {
      const typeCode = parseInt(row['Localbody Type Code'], 10);
      if (typeCode !== 3) continue; // Only process Village Panchayats

      const lgdCode = parseInt(row['Localbody Code'], 10);
      const name = (row['Localbody Name (In English)'] || '').trim();
      const parentCode = parseInt(row['Parent Localbody Code'], 10);

      if (!name || isNaN(lgdCode)) continue;

      let taluka = '';
      let district = '';

      // Resolve Hierarchy
      const blockPanchayat = localBodiesMap[parentCode];
      if (blockPanchayat && blockPanchayat.typeCode === 2) {
        taluka = blockPanchayat.name;
        
        const zillaParishad = localBodiesMap[blockPanchayat.parentCode];
        if (zillaParishad && zillaParishad.typeCode === 1) {
          district = zillaParishad.name;
        }
      }

      // Prepare upsert operation
      batch.push({
        updateOne: {
          filter: { lgdCode: lgdCode },
          update: {
            $set: {
              name: name,
              lgdCode: lgdCode,
              localBodyType: 'GRAM_PANCHAYAT',
              category: 'RURAL',
              taluka: taluka,
              district: district,
              state: 'Maharashtra',
              status: 'ACTIVE',
              updatedAt: new Date()
            },
            $setOnInsert: {
              createdAt: new Date()
            }
          },
          upsert: true
        }
      });

      totalProcessed++;

      // When batch fills up, write to MongoDB
      if (batch.length >= BATCH_SIZE) {
        const result = await collection.bulkWrite(batch, { ordered: false });
        totalInserted += (result.upsertedCount + result.modifiedCount);
        console.log(`Processed: ${totalProcessed} rows | Flushed: ${batch.length} records to DB`);
        batch = [];
      }
    }

    // Flush remaining documents
    if (batch.length > 0) {
      const result = await collection.bulkWrite(batch, { ordered: false });
      totalInserted += (result.upsertedCount + result.modifiedCount);
      console.log(`Flushed final batch of ${batch.length} records.`);
    }

    console.log(`-------------------------------------------------`);
    console.log(`Seeding Completed Successfully!`);
    console.log(`Total Village Panchayats Processed: ${totalProcessed}`);
    console.log(`Total Documents Upserted/Updated: ${totalInserted}`);
    console.log(`-------------------------------------------------`);

  } catch (error) {
    if (error.code === 11000) {
      console.error('Duplicate key error during bulkWrite.', error.message);
    } else {
      console.error('Error during database seeding:', error);
    }
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

seedGramPanchayats();
