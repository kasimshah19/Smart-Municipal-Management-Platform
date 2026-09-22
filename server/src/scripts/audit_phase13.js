import mongoose from 'mongoose';
import dotenv from 'dotenv';
import GramPanchayat from '../models/GramPanchayat.js';
import Taluka from '../models/Taluka.js';
import District from '../models/District.js';
import Division from '../models/Division.js';

// Load env vars
dotenv.config({ path: './.env' });

const normalizeName = (name) => {
    if (!name) return '';
    return name.toString().toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim();
};

async function runAudit() {
    console.log("--- PHASE 13 READ-ONLY TALUKA INTEGRITY AUDIT ---");
    console.log("Connecting to MongoDB...");

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected successfully.\n");

        // 1. Fetch Master Data
        const divisions = await Division.find().lean();
        const districts = await District.find().lean();
        const talukas = await Taluka.find().lean();
        const gps = await GramPanchayat.find().lean();

        // Build Lookups
        const divisionMap = new Map(divisions.map(d => [d._id.toString(), d]));
        const districtMap = new Map(districts.map(d => [d._id.toString(), d]));
        const talukaMap = new Map(talukas.map(t => [t._id.toString(), t]));

        // Check 16. Duplicate Talukas
        const talukaNormalizedIndex = new Map();
        const duplicateTalukas = [];
        for (const t of talukas) {
            const key = `${t.districtId}_${normalizeName(t.name)}`;
            if (talukaNormalizedIndex.has(key)) {
                duplicateTalukas.push(t);
            } else {
                talukaNormalizedIndex.set(key, t);
            }
        }

        // Check 9. Cross-District Collisions
        const talukaNameIndex = new Map();
        const crossDistrictCollisions = new Set();
        for (const t of talukas) {
            const nName = normalizeName(t.name);
            if (!talukaNameIndex.has(nName)) {
                talukaNameIndex.set(nName, new Set([t.districtId.toString()]));
            } else {
                talukaNameIndex.get(nName).add(t.districtId.toString());
            }
        }
        for (const [name, districts] of talukaNameIndex.entries()) {
            if (districts.size > 1) {
                crossDistrictCollisions.add(name);
            }
        }

        // Metrics
        const metrics = {
            totalGPs: gps.length,
            withTalukaId: 0,
            withoutTalukaId: 0,
            withTalukaName: 0,
            withoutTalukaName: 0,
            withDistrictId: 0,
            withoutDistrictId: 0,
            
            validTalukaRefs: 0,
            brokenTalukaRefs: 0,

            talukaIdNameMismatches: 0,
            districtMismatches: 0,
            
            districtNameExactMatches: 0,
            districtNameNormalizedMatches: 0,
            districtNameMismatches: 0,

            divisionMismatches: 0,
            missingDivisionRefs: 0,
            invalidDivisionRefs: 0,

            hierarchyValid: 0,
            hierarchyInvalid: 0,
            missingTaluka: 0,
            missingDistrict: 0,
            missingDivision: 0,
            brokenHierarchyRef: 0,
            
            lgdDuplicateCheck: { unique: new Set(), duplicates: [] },
            
            samples: [],
            samplesByDivision: {
                "Konkan": [],
                "Pune": [],
                "Nashik": [],
                "Chhatrapati Sambhajinagar": [],
                "Amravati": [],
                "Nagpur": []
            }
        };

        const failedListCheck = [
            'Peth', 'Ahemadpur', 'Saoner', 'Deogad', 'Ambernath', 'Chipalun', 'Wada', 
            'Jath', 'Parali V .', 'South Solapur', 'Shindkheda', 'Vaibhavawadi', 'Akarani',
            'Anjangaon S', 'Zari Jamni', 'Basmat', 'Nandgaon Kh', 'Yeola', 'Sailu', 'Kanand'
        ];
        const failedSamples = [];

        // Main Loop
        for (const gp of gps) {
            let hierarchyOk = true;

            if (gp.talukaId) metrics.withTalukaId++; else metrics.withoutTalukaId++;
            if (gp.talukaName) metrics.withTalukaName++; else metrics.withoutTalukaName++;
            if (gp.districtId) metrics.withDistrictId++; else metrics.withoutDistrictId++;

            // LGD Duplicate check
            if (gp.lgdCode) {
                if (metrics.lgdDuplicateCheck.unique.has(gp.lgdCode)) {
                    metrics.lgdDuplicateCheck.duplicates.push(gp.lgdCode);
                } else {
                    metrics.lgdDuplicateCheck.unique.add(gp.lgdCode);
                }
            }

            // Taluka Reference
            let referencedTaluka = null;
            if (gp.talukaId) {
                referencedTaluka = talukaMap.get(gp.talukaId.toString());
                if (referencedTaluka) {
                    metrics.validTalukaRefs++;
                } else {
                    metrics.brokenTalukaRefs++;
                    hierarchyOk = false;
                }
            } else {
                metrics.missingTaluka++;
                hierarchyOk = false;
            }

            // Taluka Name consistency
            if (referencedTaluka && gp.talukaName) {
                if (normalizeName(referencedTaluka.name) !== normalizeName(gp.talukaName)) {
                    metrics.talukaIdNameMismatches++;
                    // Don't necessarily fail hierarchy for purely name diff if ID is correct, but track it
                }
            }

            // District Consistency
            let referencedDistrict = null;
            if (gp.districtId) {
                referencedDistrict = districtMap.get(gp.districtId.toString());
                if (!referencedDistrict) {
                    metrics.missingDistrict++;
                    hierarchyOk = false;
                }
            } else {
                metrics.missingDistrict++;
                hierarchyOk = false;
            }

            if (referencedTaluka && referencedDistrict) {
                if (referencedTaluka.districtId.toString() !== gp.districtId.toString()) {
                    metrics.districtMismatches++;
                    hierarchyOk = false;
                }

                if (gp.districtName) {
                    if (gp.districtName === referencedDistrict.name) {
                        metrics.districtNameExactMatches++;
                    } else if (normalizeName(gp.districtName) === normalizeName(referencedDistrict.name)) {
                        metrics.districtNameNormalizedMatches++;
                    } else {
                        metrics.districtNameMismatches++;
                    }
                }

                // Division Consistency
                const division = divisionMap.get(referencedDistrict.divisionId.toString());
                if (!division) {
                    metrics.invalidDivisionRefs++;
                    hierarchyOk = false;
                } else {
                    // Collect division samples
                    let divName = "Unknown";
                    if (division.name.includes("Konkan")) divName = "Konkan";
                    if (division.name.includes("Pune")) divName = "Pune";
                    if (division.name.includes("Nashik")) divName = "Nashik";
                    if (division.name.includes("Sambhajinagar") || division.name.includes("Aurangabad")) divName = "Chhatrapati Sambhajinagar";
                    if (division.name.includes("Amravati")) divName = "Amravati";
                    if (division.name.includes("Nagpur")) divName = "Nagpur";

                    if (divName !== "Unknown" && metrics.samplesByDivision[divName].length < 5) {
                        metrics.samplesByDivision[divName].push({
                            gpName: gp.name,
                            gpDistrict: gp.districtName,
                            talukaAssigned: referencedTaluka.name,
                            talukaDistrict: referencedDistrict.name,
                            division: division.name,
                            matchMethod: "unknown" // We don't store match method in DB
                        });
                    }
                }
            }

            if (hierarchyOk) {
                metrics.hierarchyValid++;
            } else {
                metrics.hierarchyInvalid++;
            }

            // Collect 20 random samples
            if (metrics.samples.length < 20 && Math.random() < 0.05 && referencedTaluka) {
                metrics.samples.push({
                    gpName: gp.name,
                    gpDistrict: gp.districtName,
                    talukaAssigned: referencedTaluka.name,
                    talukaDistrict: referencedDistrict ? referencedDistrict.name : "N/A",
                    division: "N/A",
                    matchMethod: "N/A"
                });
            }

            // Failed samples tracking
            if (gp.talukaName && failedListCheck.includes(gp.talukaName)) {
                if (failedSamples.length < 20) {
                     failedSamples.push({
                        gpName: gp.name,
                        district: gp.districtName,
                        originalBlock: gp.talukaName,
                        assignedTaluka: referencedTaluka ? referencedTaluka.name : "NONE",
                        assignedDistrict: referencedDistrict ? referencedDistrict.name : "NONE",
                        valid: hierarchyOk
                     });
                     // prevent too many
                     const idx = failedListCheck.indexOf(gp.talukaName);
                     failedListCheck.splice(idx, 1);
                }
            }
        }

        console.log("\n================ REPORT DATA ================\n");
        console.log(JSON.stringify({
            duplicateTalukasCount: duplicateTalukas.length,
            crossDistrictCollisionsCount: crossDistrictCollisions.size,
            crossDistrictCollisionsNames: Array.from(crossDistrictCollisions),
            metrics,
            failedSamples
        }, null, 2));

        console.log("\n================ END REPORT DATA ================\n");
        
    } catch (e) {
        console.error("Error during audit:", e);
    } finally {
        await mongoose.disconnect();
    }
}

runAudit();
