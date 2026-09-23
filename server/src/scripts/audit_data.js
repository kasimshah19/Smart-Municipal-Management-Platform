import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart-municipal-platform';

import GramPanchayat from '../models/GramPanchayat.js';
import Taluka from '../models/Taluka.js';
import District from '../models/District.js';
import Division from '../models/Division.js';
import Municipality from '../models/Municipality.js';
import Ward from '../models/Ward.js';

// Copied cleanString from reconcile script
const MANUAL_MAPPING = {
  "karvir": "karveer", "dharashiv": "osmanabad", "chhatrapati sambhajinagar": "aurangabad",
  "ahilyanagar": "ahmednagar", "kalyan panchayat samiti": "kalyan", "peth": "peint",
  "ahemadpur": "ahmedpur", "saoner": "savner", "deogad": "devgad", "ambernath": "ambarnath",
  "chipalun": "chiplun", "wada": "vada", "jath": "jat", "parali v .": "parli",
  "south solapur": "solapur south", "north solapur": "solapur north", "shindkheda": "sindkheda",
  "vaibhavawadi": "vaibhavwadi", "akarani": "akrani", "anjangaon s": "anjangaon surji",
  "zari jamni": "zari-jamani", "basmat": "basmath", "nandgaon kh": "nandgaon khandeshwar",
  "yeola": "yevala", "sailu": "selu", "kanand": "kannad", "kankavali": "kankavli",
  "sawantwadi": "sawantwadi", "mumbai": "mumbai city", "mumbai suburban": "mumbai suburban",
  "sindkhedraja": "sindkhed raja", "mhasala": "mhasla", "mokhed": "mukhed",
  "jalgaonjamod": "jalgaon jamod", "brahmapuri": "bramhapuri", "jawali": "jaoli",
  "kavathemahankal": "kavathe mahankal", "valva-islampur": "walwa", "khanapur-vita": "khanapur",
  "dhamangaon ril": "dhamangaon railway", "buldana": "buldhana", "chandur bz": "chandurbazar",
  "ambajogai": "ambejogai", "mangalvedhe": "mangalwedha", "murtijapur": "murtizapur",
  "d. raja": "deulgaon raja", "hatkanangale": "hatkanangle", "trimbak": "trimbakeshwar",
  "sangmeshwar": "sangameshwar", "kurkheda": "kurkheda", "malegav": "malegaon",
  "malshiras": "malshiras", "manwat": "manwath", "modkhed": "mudkhed",
  "desaiganj (wadsa)": "desaiganj", "chandur ril": "chandur railway", "gagan bavada": "gaganbawda",
  "shirur ( ka )": "shirur", "ajara": "ajra", "bhamaragad": "bhamragad",
  "bhadrawati": "bhadravati", "khultabad": "khuldabad"
};

const cleanString = (str) => {
  if (!str) return '';
  let cleaned = str.toLowerCase().trim();
  cleaned = cleaned.replace(/\s*\(?rural\)?\s*/g, '');
  cleaned = cleaned.replace(/\s*panchayat\s*samiti\s*/g, '');
  cleaned = cleaned.replace(/\s*block\s*/g, '');
  cleaned = cleaned.replace(/\s*\(\s*kh\s*\)\s*/g, '');
  cleaned = cleaned.replace(/\s*\(\s*bk\s*\)\s*/g, '');
  cleaned = cleaned.replace(/\s*\(\s*ka\s*\)\s*/g, '');
  cleaned = cleaned.replace(/\s*\(\s*wadsa\s*\)\s*/g, '');
  cleaned = cleaned.trim();
  if (MANUAL_MAPPING[cleaned]) return MANUAL_MAPPING[cleaned];
  return cleaned;
};

async function runAudit() {
  await mongoose.connect(MONGO_URI);
  
  const report = {};
  
  // 2. Current Gram Panchayat Counts
  const gps = await GramPanchayat.find({}).lean();
  report.counts = {
    total: gps.length,
    withTalukaId: gps.filter(g => g.talukaId).length,
    withoutTalukaId: gps.filter(g => !g.talukaId).length,
    withTalukaName: gps.filter(g => g.talukaName).length,
    withoutTalukaName: gps.filter(g => !g.talukaName).length,
    withDistrictId: gps.filter(g => g.districtId).length,
    withoutDistrictId: gps.filter(g => !g.districtId).length,
    withDivisionId: gps.filter(g => g.divisionId).length,
    withoutDivisionId: gps.filter(g => !g.divisionId).length,
  };
  
  // Load lookups
  const talukas = await Taluka.find({}).lean();
  const districts = await District.find({}).lean();
  const divisions = await Division.find({}).lean();
  
  const tMap = new Map(talukas.map(t => [t._id.toString(), t]));
  const dMap = new Map(districts.map(d => [d._id.toString(), d]));
  const divMap = new Map(divisions.map(d => [d._id.toString(), d]));
  
  let brokenTalukaRefs = 0;
  let exactTalukaName = 0, normalizedTalukaName = 0, mismatchedTalukaName = 0, missingTalukaName = 0;
  let districtMismatch = 0;
  let divisionValid = 0, divisionInvalid = 0, divisionMissing = 0;
  let hierValid = 0, hierInvalid = 0, hierIncomplete = 0;
  
  let exactMatch = 0, normMatch = 0, aliasMatch = 0, fuzzyMatch = 0;
  
  for (const gp of gps) {
    if (!gp.talukaId) {
      hierIncomplete++;
      continue;
    }
    
    const taluka = tMap.get(gp.talukaId.toString());
    if (!taluka) {
      brokenTalukaRefs++;
      hierInvalid++;
      continue;
    }
    
    // Name integrity
    if (!gp.talukaName) {
      missingTalukaName++;
    } else if (gp.talukaName === taluka.name) {
      exactTalukaName++;
    } else if (cleanString(gp.talukaName) === cleanString(taluka.name)) {
      normalizedTalukaName++;
    } else {
      mismatchedTalukaName++;
    }
    
    // District consistency
    let distValid = true;
    if (gp.districtId?.toString() !== taluka.districtId?.toString()) {
      districtMismatch++;
      distValid = false;
    }
    const district = dMap.get(taluka.districtId?.toString());
    if (district && gp.districtName !== district.name) {
      distValid = false;
    }
    
    // Division consistency
    let divOk = false;
    if (!gp.divisionId || !taluka.divisionId || !district?.divisionId) {
      divisionMissing++;
    } else if (gp.divisionId.toString() === taluka.divisionId.toString() && taluka.divisionId.toString() === district.divisionId.toString()) {
      divisionValid++;
      divOk = true;
    } else {
      divisionInvalid++;
    }
    
    if (distValid && divOk) hierValid++;
    else hierInvalid++;
    
    // Match quality
    if (gp.developmentBlockName) {
      const bName = gp.developmentBlockName.trim().toLowerCase();
      const tName = taluka.name.trim().toLowerCase();
      const cBlock = cleanString(bName);
      const cTaluka = cleanString(tName);
      
      if (bName === tName) exactMatch++;
      else if (cBlock === cTaluka && !MANUAL_MAPPING[bName.replace(/\s*\(?rural\)?\s*/g, '').replace(/\s*panchayat\s*samiti\s*/g, '').replace(/\s*block\s*/g, '').trim()]) normMatch++;
      else if (MANUAL_MAPPING[bName.replace(/\s*\(?rural\)?\s*/g, '').replace(/\s*panchayat\s*samiti\s*/g, '').replace(/\s*block\s*/g, '').trim()]) aliasMatch++;
      else fuzzyMatch++;
    }
  }
  
  report.talukaRef = { valid: gps.length - brokenTalukaRefs - report.counts.withoutTalukaId, broken: brokenTalukaRefs };
  report.talukaName = { exact: exactTalukaName, normalized: normalizedTalukaName, mismatched: mismatchedTalukaName, missing: missingTalukaName };
  report.districtCons = { mismatches: districtMismatch };
  report.divisionCons = { valid: divisionValid, invalid: divisionInvalid, missing: divisionMissing };
  report.hierarchy = { valid: hierValid, invalid: hierInvalid, incomplete: hierIncomplete };
  report.matchQuality = { exact: exactMatch, normalized: normMatch, alias: aliasMatch, fuzzy: fuzzyMatch };
  
  // 8. Cross-district Name Collision
  const nameToDistricts = {};
  for (const t of talukas) {
    const cname = cleanString(t.name);
    if (!nameToDistricts[cname]) nameToDistricts[cname] = new Set();
    nameToDistricts[cname].add(t.districtId.toString());
  }
  const collisions = Object.entries(nameToDistricts).filter(([k, v]) => v.size > 1).map(x => x[0]);
  report.crossDistrictCollisions = collisions;
  
  // 10. Normalization Examples
  const normEx = ["Ahemadpur", "Ahmedpur", "Ahmadpur", "Akarani", "Akkarani", "Deogad", "Devgad", "Chipalun", "Chiplun", "Basmat", "Basmath", "Desaiganj", "Desaiganj (Wadsa)", "Parali V.", "Anjangaon S.", "Nandgaon Kh.", "D. Raja", "Zari Jamni"];
  report.normalization = normEx.map(e => ({ orig: e, clean: cleanString(e) }));
  
  // 11. Previously Failed Samples
  const failedSamples = [
    {d: "Nashik", b: "Peth"}, {d: "Latur", b: "Ahemadpur"}, {d: "Nagpur", b: "Saoner"},
    {d: "Sindhudurg", b: "Deogad"}, {d: "Thane", b: "Ambernath"}, {d: "Ratnagiri", b: "Chipalun"},
    {d: "Palghar", b: "Wada"}, {d: "Sangli", b: "Jath"}, {d: "Beed", b: "Parali V."},
    {d: "Solapur", b: "South Solapur"}, {d: "Dhule", b: "Shindkheda"}, {d: "Sindhudurg", b: "Vaibhavawadi"},
    {d: "Nandurbar", b: "Akarani"}, {d: "Amravati", b: "Anjangaon S."}, {d: "Yavatmal", b: "Zari Jamni"},
    {d: "Hingoli", b: "Basmat"}, {d: "Amravati", b: "Nandgaon Kh."}, {d: "Nashik", b: "Yeola"},
    {d: "Parbhani", b: "Sailu"}, {d: "Chhatrapati Sambhajinagar", b: "Kanand"}
  ];
  report.failedSamplesValidation = failedSamples.map(fs => {
    // Find GP matching this
    const gp = gps.find(g => g.districtName === fs.d && g.developmentBlockName === fs.b);
    if (!gp) return { ...fs, status: 'Not Found' };
    const t = tMap.get(gp.talukaId?.toString());
    return {
      district: fs.d, source: fs.b, assignedTaluka: t?.name, assignedDist: dMap.get(t?.districtId?.toString())?.name,
      valid: t && dMap.get(t.districtId.toString())?.name === fs.d ? 'PASS' : 'FAIL'
    };
  });
  
  // 14. Duplicate Taluka Master Audit
  const tDups = {};
  talukas.forEach(t => {
    const key = `${t.districtId.toString()}-${cleanString(t.name)}`;
    tDups[key] = (tDups[key] || 0) + 1;
  });
  report.duplicateTalukas = Object.entries(tDups).filter(x => x[1] > 1);
  
  // 15. Index audit
  const indexes = await Taluka.collection.indexes();
  report.talukaIndexes = indexes;
  
  // 16. Record Count
  const lgdCounts = {};
  let dupLgd = 0;
  gps.forEach(g => {
    if (g.lgdCode) {
      if (lgdCounts[g.lgdCode]) dupLgd++;
      lgdCounts[g.lgdCode] = true;
    }
  });
  report.recordCount = { duplicates: dupLgd };
  
  // 22. Urban Regression
  const munis = await Municipality.find({}).lean();
  report.urbanRegression = { municipalityCount: munis.length };
  
  fs.writeFileSync('audit_out.json', JSON.stringify(report, null, 2));
  console.log("Done");
  process.exit(0);
}
runAudit().catch(console.error);
