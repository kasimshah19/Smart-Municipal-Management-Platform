import * as areaService from '../services/area.service.js';
import Profile from '../models/Profile.js';
import Area from '../models/Area.js';

const getUserMunicipalityId = async (userId) => {
  const profile = await Profile.findOne({ userId });
  return profile ? profile.municipalityId : null;
};

export const createArea = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { municipalityId } = req.body;

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (!myMunicipalityId || myMunicipalityId.toString() !== municipalityId) {
        return res.status(403).json({ success: false, message: 'You can only create areas for your own municipality' });
      }
    }

    const area = await areaService.createArea(req.body);
    res.status(201).json({ success: true, data: area });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Area code already exists in this municipality' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAreas = async (req, res) => {
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

    const result = await areaService.getAreas(query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAreaById = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const area = await areaService.getAreaById(req.params.id);
    
    if (!area) {
      return res.status(404).json({ success: false, message: 'Area not found' });
    }

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (myMunicipalityId && area.municipalityId && area.municipalityId._id.toString() !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to view this area' });
      }
    }
    
    res.status(200).json({ success: true, data: area });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateArea = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const existingArea = await Area.findById(req.params.id);
    if (!existingArea) {
      return res.status(404).json({ success: false, message: 'Area not found' });
    }

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (myMunicipalityId && existingArea.municipalityId.toString() !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to update this area' });
      }
      if (req.body.municipalityId && req.body.municipalityId !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Cannot move area to another municipality' });
      }
    }
    
    const area = await areaService.updateArea(req.params.id, req.body);
    res.status(200).json({ success: true, data: area });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Area code already exists in this municipality' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateAreaStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }
    
    const { role, _id } = req.user;
    const existingArea = await Area.findById(req.params.id);
    if (!existingArea) {
      return res.status(404).json({ success: false, message: 'Area not found' });
    }

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (myMunicipalityId && existingArea.municipalityId.toString() !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to update this area' });
      }
    }

    const area = await areaService.updateAreaStatus(req.params.id, isActive);
    res.status(200).json({ success: true, data: area });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const deleteArea = async (req, res) => {
  try {
    const area = await areaService.deleteArea(req.params.id);
    if (!area) {
      return res.status(404).json({ success: false, message: 'Area not found' });
    }
    res.status(200).json({ success: true, message: 'Area deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

