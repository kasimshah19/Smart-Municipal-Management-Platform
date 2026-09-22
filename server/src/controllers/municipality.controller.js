import * as municipalityService from '../services/municipality.service.js';
import { Profile } from '../models/Profile.js';

// Helper to get user's municipalityId
const getUserMunicipalityId = async (userId) => {
  const profile = await Profile.findOne({ userId });
  return profile ? profile.municipalityId : null;
};

export const createMunicipality = async (req, res) => {
  try {
    const municipality = await municipalityService.createMunicipality(req.body);
    res.status(201).json({ success: true, data: municipality });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Municipality code already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMunicipalities = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const query = { ...req.query };
    
    // MUNICIPAL_ADMIN can only see their own municipality.
    // SUPER_ADMIN can see all.
    // WARD_OFFICER, DEPARTMENT_OFFICER, etc. usually only need to see their own.
    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (!myMunicipalityId) {
        return res.status(403).json({ success: false, message: 'You are not assigned to a municipality' });
      }
      // Force filter for non-super admins to their own municipality
      // We will handle this gracefully. If they try to get a list, just return theirs.
      // We'll actually modify the query passed to the service.
      // Wait, Municipality Service doesn't take municipalityId as a filter because the entity IS the municipality.
      // So we will fetch theirs directly.
      const municipality = await municipalityService.getMunicipalityById(myMunicipalityId);
      return res.status(200).json({
        success: true,
        data: municipality ? [municipality] : [],
        pagination: { page: 1, limit: 20, total: municipality ? 1 : 0, totalPages: 1 }
      });
    }

    const result = await municipalityService.getMunicipalities(query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMunicipalityById = async (req, res) => {
  try {
    const { role, _id } = req.user;
    
    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (myMunicipalityId && myMunicipalityId.toString() !== req.params.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to view this municipality' });
      }
    }
    
    const municipality = await municipalityService.getMunicipalityById(req.params.id);
    if (!municipality) {
      return res.status(404).json({ success: false, message: 'Municipality not found' });
    }
    res.status(200).json({ success: true, data: municipality });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMunicipality = async (req, res) => {
  try {
    const { role, _id } = req.user;
    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (myMunicipalityId && myMunicipalityId.toString() !== req.params.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to update this municipality' });
      }
    }
    
    const municipality = await municipalityService.updateMunicipality(req.params.id, req.body);
    if (!municipality) {
      return res.status(404).json({ success: false, message: 'Municipality not found' });
    }
    res.status(200).json({ success: true, data: municipality });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Municipality code already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateMunicipalityStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }
    
    const { role, _id } = req.user;
    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (myMunicipalityId && myMunicipalityId.toString() !== req.params.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized to update this municipality' });
      }
    }

    const municipality = await municipalityService.updateMunicipalityStatus(req.params.id, isActive);
    if (!municipality) {
      return res.status(404).json({ success: false, message: 'Municipality not found' });
    }
    res.status(200).json({ success: true, data: municipality });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const deleteMunicipality = async (req, res) => {
  try {
    const municipality = await municipalityService.deleteMunicipality(req.params.id);
    if (!municipality) {
      return res.status(404).json({ success: false, message: 'Municipality not found' });
    }
    res.status(200).json({ success: true, message: 'Municipality deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

