import Division from '../models/Division.js';
import District from '../models/District.js';
import Taluka from '../models/Taluka.js';
import Municipality from '../models/Municipality.js';

// ---- SUMMARY ----

export const getGeographySummary = async (req, res) => {
  try {
    const [divisionCount, districtCount, talukaCount, mcCorpCount, mcCouncilCount, npCount, totalLocalBodies] = await Promise.all([
      Division.countDocuments({ isActive: true }),
      District.countDocuments({ isActive: true }),
      Taluka.countDocuments({ isActive: true }),
      Municipality.countDocuments({ type: 'MUNICIPAL_CORPORATION', isActive: true }),
      Municipality.countDocuments({ type: 'MUNICIPAL_COUNCIL', isActive: true }),
      Municipality.countDocuments({ type: 'NAGAR_PANCHAYAT', isActive: true }),
      Municipality.countDocuments({ isActive: true })
    ]);

    res.json({
      success: true,
      data: {
        divisions: divisionCount,
        districts: districtCount,
        talukas: talukaCount,
        localBodies: {
          total: totalLocalBodies,
          municipalCorporations: mcCorpCount,
          municipalCouncils: mcCouncilCount,
          nagarPanchayats: npCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- TREE ----

export const getGeographyTree = async (req, res) => {
  try {
    const divisions = await Division.find({ isActive: true }).sort({ name: 1 }).lean();
    const districts = await District.find({ isActive: true }).sort({ name: 1 }).lean();
    const talukas = await Taluka.find({ isActive: true }).sort({ name: 1 }).lean();

    // Build tree
    const tree = divisions.map(div => ({
      ...div,
      districts: districts
        .filter(d => d.divisionId.toString() === div._id.toString())
        .map(dist => ({
          ...dist,
          talukas: talukas.filter(t => t.districtId.toString() === dist._id.toString())
        }))
    }));

    res.json({ success: true, data: tree });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- DIVISIONS ----

export const getDivisions = async (req, res) => {
  try {
    const { isActive, search } = req.query;
    let query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) query.name = { $regex: search, $options: 'i' };

    const divisions = await Division.find(query).sort({ name: 1 });
    res.json({ success: true, data: divisions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDivisionById = async (req, res) => {
  try {
    const division = await Division.findById(req.params.id);
    if (!division) return res.status(404).json({ success: false, message: 'Division not found' });
    
    const districtCount = await District.countDocuments({ divisionId: division._id, isActive: true });
    res.json({ success: true, data: { ...division.toObject(), districtCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDivision = async (req, res) => {
  try {
    const division = await Division.create(req.body);
    res.status(201).json({ success: true, data: division });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateDivision = async (req, res) => {
  try {
    const division = await Division.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!division) return res.status(404).json({ success: false, message: 'Division not found' });
    res.json({ success: true, data: division });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteDivision = async (req, res) => {
  try {
    const districtCount = await District.countDocuments({ divisionId: req.params.id });
    if (districtCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete division because ${districtCount} dependent districts exist. Deactivate it instead.` });
    }
    const division = await Division.findByIdAndDelete(req.params.id);
    if (!division) return res.status(404).json({ success: false, message: 'Division not found' });
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- DISTRICTS ----

export const getDistricts = async (req, res) => {
  try {
    const { isActive, divisionId, search } = req.query;
    let query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (divisionId) query.divisionId = divisionId;
    if (search) query.name = { $regex: search, $options: 'i' };

    const districts = await District.find(query).populate('divisionId', 'name').sort({ name: 1 });
    res.json({ success: true, data: districts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDistrictById = async (req, res) => {
  try {
    const district = await District.findById(req.params.id).populate('divisionId', 'name');
    if (!district) return res.status(404).json({ success: false, message: 'District not found' });
    
    const [talukaCount, localBodyCount] = await Promise.all([
      Taluka.countDocuments({ districtId: district._id, isActive: true }),
      Municipality.countDocuments({ district: district.name, isActive: true })
    ]);
    res.json({ success: true, data: { ...district.toObject(), talukaCount, localBodyCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDistrict = async (req, res) => {
  try {
    const district = await District.create(req.body);
    res.status(201).json({ success: true, data: district });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateDistrict = async (req, res) => {
  try {
    const district = await District.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!district) return res.status(404).json({ success: false, message: 'District not found' });
    res.json({ success: true, data: district });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteDistrict = async (req, res) => {
  try {
    const talukaCount = await Taluka.countDocuments({ districtId: req.params.id });
    if (talukaCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete district because ${talukaCount} dependent talukas exist. Deactivate it instead.` });
    }
    const district = await District.findByIdAndDelete(req.params.id);
    if (!district) return res.status(404).json({ success: false, message: 'District not found' });
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- TALUKAS ----

export const getTalukas = async (req, res) => {
  try {
    const { isActive, districtId, divisionId, search } = req.query;
    let query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (districtId) query.districtId = districtId;
    if (divisionId) query.divisionId = divisionId;
    if (search) query.name = { $regex: search, $options: 'i' };

    const talukas = await Taluka.find(query)
      .populate('districtId', 'name')
      .populate('divisionId', 'name')
      .sort({ districtName: 1, name: 1 });
    res.json({ success: true, data: talukas });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTalukaById = async (req, res) => {
  try {
    const taluka = await Taluka.findById(req.params.id)
      .populate('districtId', 'name')
      .populate('divisionId', 'name');
    if (!taluka) return res.status(404).json({ success: false, message: 'Taluka not found' });

    const localBodyCount = await Municipality.countDocuments({ talukaId: taluka._id, isActive: true });
    res.json({ success: true, data: { ...taluka.toObject(), localBodyCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTaluka = async (req, res) => {
  try {
    const district = await District.findById(req.body.districtId);
    if (!district) return res.status(400).json({ success: false, message: 'Invalid district ID' });
    req.body.districtName = district.name;
    req.body.divisionId = district.divisionId;
    
    const division = await Division.findById(district.divisionId);
    req.body.divisionName = division?.name || null;
    
    const taluka = await Taluka.create(req.body);
    res.status(201).json({ success: true, data: taluka });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateTaluka = async (req, res) => {
  try {
    if (req.body.districtId) {
      const district = await District.findById(req.body.districtId);
      if (!district) return res.status(400).json({ success: false, message: 'Invalid district ID' });
      req.body.districtName = district.name;
      req.body.divisionId = district.divisionId;
      const division = await Division.findById(district.divisionId);
      req.body.divisionName = division?.name || null;
    }
    const taluka = await Taluka.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!taluka) return res.status(404).json({ success: false, message: 'Taluka not found' });
    res.json({ success: true, data: taluka });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteTaluka = async (req, res) => {
  try {
    const municipalityCount = await Municipality.countDocuments({ talukaId: req.params.id });
    if (municipalityCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete taluka because ${municipalityCount} dependent municipalities exist. Deactivate it instead.` });
    }

    const taluka = await Taluka.findByIdAndDelete(req.params.id);
    if (!taluka) return res.status(404).json({ success: false, message: 'Taluka not found' });
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
