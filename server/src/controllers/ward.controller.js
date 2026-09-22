import * as wardService from '../services/ward.service.js';
import Profile from '../models/Profile.js';
import Ward from '../models/Ward.js';

const getUserMunicipalityId = async (userId) => {
  const profile = await Profile.findOne({ userId });
  return profile ? profile.municipalityId : null;
};

export const createWard = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { municipalityId } = req.body;

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (!myMunicipalityId || myMunicipalityId.toString() !== municipalityId) {
        return res.status(403).json({ success: false, message: 'You can only create wards for your own municipality' });
      }
    }

    const ward = await wardService.createWard(req.body);
    res.status(201).json({ success: true, data: ward });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ward code or number already exists in this municipality' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getWards = async (req, res) => {
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

    const result = await wardService.getWards(query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWardById = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const ward = await wardService.getWardById(req.params.id);
    
    if (!ward) {
      return res.status(404).json({ success: false, message: 'Ward not found' });
    }

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (myMunicipalityId && ward.municipalityId && ward.municipalityId._id.toString() !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to view this ward' });
      }
    }
    
    res.status(200).json({ success: true, data: ward });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateWard = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const existingWard = await Ward.findById(req.params.id);
    if (!existingWard) {
      return res.status(404).json({ success: false, message: 'Ward not found' });
    }

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (myMunicipalityId && existingWard.municipalityId.toString() !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to update this ward' });
      }
      // Do not allow changing municipalityId if not super admin
      if (req.body.municipalityId && req.body.municipalityId !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Cannot move ward to another municipality' });
      }
    }
    
    const ward = await wardService.updateWard(req.params.id, req.body);
    res.status(200).json({ success: true, data: ward });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Ward code or number already exists in this municipality' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateWardStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }
    
    const { role, _id } = req.user;
    const existingWard = await Ward.findById(req.params.id);
    if (!existingWard) {
      return res.status(404).json({ success: false, message: 'Ward not found' });
    }

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (myMunicipalityId && existingWard.municipalityId.toString() !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to update this ward' });
      }
    }

    const ward = await wardService.updateWardStatus(req.params.id, isActive);
    res.status(200).json({ success: true, data: ward });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const deleteWard = async (req, res) => {
  try {
    const ward = await wardService.deleteWard(req.params.id);
    if (!ward) {
      return res.status(404).json({ success: false, message: 'Ward not found' });
    }
    res.status(200).json({ success: true, message: 'Ward deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

