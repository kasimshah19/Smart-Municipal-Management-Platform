import fs from 'fs';
import csvParser from 'csv-parser';

export async function processCsvInBatches(filePath, batchSize, processBatch) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Authoritative source dataset not provided: ${filePath}`);
  }

  let batch = [];
  let totalProcessed = 0;
  
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath).pipe(csvParser({ skipLines: 1 }));
    
    stream.on('data', async (row) => {
      batch.push(row);
      if (batch.length >= batchSize) {
        stream.pause();
        try {
          await processBatch([...batch], totalProcessed);
          totalProcessed += batch.length;
          batch = [];
          stream.resume();
        } catch (err) {
          reject(err);
        }
      }
    });
    
    stream.on('end', async () => {
      if (batch.length > 0) {
        try {
          await processBatch(batch, totalProcessed);
          totalProcessed += batch.length;
        } catch (err) {
          return reject(err);
        }
      }
      resolve(totalProcessed);
    });
    
    stream.on('error', (err) => {
      reject(err);
    });
  });
}

export function logConflictReport(report) {
  console.log('\n--- IMPORT REPORT ---');
  console.log(`Total Records Processed: ${report.total}`);
  console.log(`Inserted (or would insert): ${report.inserted}`);
  console.log(`Updated (or would update): ${report.updated}`);
  console.log(`Skipped (or would skip): ${report.skipped}`);
  console.log(`Invalid: ${report.invalid}`);
  if (report.missingParent !== undefined) {
    console.log(`Missing Parent: ${report.missingParent}`);
  }
  console.log(`Conflicts: ${report.conflicts}`);
  console.log('---------------------\n');
}
