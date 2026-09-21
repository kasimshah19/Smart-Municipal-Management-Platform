import * as designationService from '../services/designation.service.js';
import Profile from '../models/Profile.js';
import Designation from '../models/Designation.js';

const getUserMunicipalityId = async (userId) => {
  const profile = await Profile.findOne({ userId });
  return profile ? profile.municipalityId : null;
};

export const createDesignation = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { municipalityId } = req.body;

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (!myMunicipalityId || myMunicipalityId.toString() !== municipalityId) {
        return res.status(403).json({ success: false, message: 'You can only create designations for your own municipality' });
      }
    }

    const designation = await designationService.createDesignation(req.body);
    res.status(201).json({ success: true, data: designation });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Designation code already exists in this municipality' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getDesignations = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const query = { ...req.query };
    
    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (!myMunicipalityId) {
        return res.status(403).json({ success: false, message: 'You are not assigned to a municipality' });
      }
      query.municipalityId = myMunicipalityId;
    }

    const result = await designationService.getDesignations(query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDesignationById = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const designation = await designationService.getDesignationById(req.params.id);
    
    if (!designation) {
      return res.status(404).json({ success: false, message: 'Designation not found' });
    }

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (myMunicipalityId && designation.municipalityId && designation.municipalityId._id.toString() !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to view this designation' });
      }
    }
    
    res.status(200).json({ success: true, data: designation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDesignation = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const existingDesignation = await Designation.findById(req.params.id);
    if (!existingDesignation) {
      return res.status(404).json({ success: false, message: 'Designation not found' });
    }

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (myMunicipalityId && existingDesignation.municipalityId.toString() !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to update this designation' });
      }
      if (req.body.municipalityId && req.body.municipalityId !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Cannot move designation to another municipality' });
      }
    }
    
    const designation = await designationService.updateDesignation(req.params.id, req.body);
    res.status(200).json({ success: true, data: designation });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Designation code already exists in this municipality' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateDesignationStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }
    
    const { role, _id } = req.user;
    const existingDesignation = await Designation.findById(req.params.id);
    if (!existingDesignation) {
      return res.status(404).json({ success: false, message: 'Designation not found' });
    }

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (myMunicipalityId && existingDesignation.municipalityId.toString() !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to update this designation' });
      }
    }

    const designation = await designationService.updateDesignationStatus(req.params.id, isActive);
    res.status(200).json({ success: true, data: designation });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
