import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_FILE_PATH = path.resolve(__dirname, 'data/maharashtra_gram_panchayats.csv');

async function runAudit() {
  console.log(`Auditing file: ${CSV_FILE_PATH}`);
  
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error('File not found!');
    process.exit(1);
  }

  const stats = fs.statSync(CSV_FILE_PATH);
  console.log(`File size: ${stats.size} bytes`);

  let physicalRows = 0;
  let blankRows = 0;
  let headerRows = 0;
  
  const typeCounts = {};
  let uniqueLgdCodes = new Set();
  let duplicateLgdCodes = new Set();
  
  let uniqueNames = new Set();
  let duplicateNames = 0;
  
  let validDataRows = 0;
  let malformedRows = 0;

  const readline = await import('readline');
  const fileStream = fs.createReadStream(CSV_FILE_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    physicalRows++;
    if (line.trim() === '') {
      blankRows++;
    }
  }
  
  console.log(`Physical lines: ${physicalRows}`);
  console.log(`Blank lines: ${blankRows}`);
  
  fs.createReadStream(CSV_FILE_PATH)
    .pipe(csv({ skipLines: 1 }))
    .on('data', (row) => {
      if (Object.keys(row).length < 2) {
        malformedRows++;
        return;
      }
      
      validDataRows++;
      
      const lgdCode = row['Localbody Code'];
      const type = row['Localbody Type Name'];
      const name = row['Localbody Name (In English)'];
      const parentCode = row['Parent Localbody Code'];
      
      if (type) {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      }
      
      if (lgdCode) {
        if (uniqueLgdCodes.has(lgdCode)) {
          duplicateLgdCodes.add(lgdCode);
        } else {
          uniqueLgdCodes.add(lgdCode);
        }
      }
      
      if (name) {
        const key = `${name}-${parentCode}`;
        if (uniqueNames.has(key)) {
          duplicateNames++;
        } else {
          uniqueNames.add(key);
        }
      }
    })
    .on('end', () => {
      console.log('\n--- AUDIT RESULTS ---');
      console.log(`Valid Data Rows: ${validDataRows}`);
      console.log(`Malformed/Empty Rows: ${malformedRows}`);
      console.log('\nEntity Types:');
      for (const [t, c] of Object.entries(typeCounts)) {
        console.log(`  ${t}: ${c}`);
      }
      console.log(`\nUnique LGD Codes: ${uniqueLgdCodes.size}`);
      console.log(`Duplicate LGD Codes: ${duplicateLgdCodes.size}`);
      console.log(`Unique Names (with Parent): ${uniqueNames.size}`);
      console.log(`Duplicate Names (with Parent): ${duplicateNames}`);
      
      if (duplicateLgdCodes.size > 0) {
        console.log('Duplicate LGD Codes list:', Array.from(duplicateLgdCodes).slice(0, 10), '...');
      }
    });
}

runAudit();
