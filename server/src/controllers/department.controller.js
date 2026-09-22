import * as departmentService from '../services/department.service.js';
import Profile from '../models/Profile.js';
import Department from '../models/Department.js';

const getUserMunicipalityId = async (userId) => {
  const profile = await Profile.findOne({ userId });
  return profile ? profile.municipalityId : null;
};

export const createDepartment = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { municipalityId } = req.body;

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (!myMunicipalityId || myMunicipalityId.toString() !== municipalityId) {
        return res.status(403).json({ success: false, message: 'You can only create departments for your own municipality' });
      }
    }

    const department = await departmentService.createDepartment(req.body);
    res.status(201).json({ success: true, data: department });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Department code already exists in this municipality' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getDepartments = async (req, res) => {
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

    const result = await departmentService.getDepartments(query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDepartmentById = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const department = await departmentService.getDepartmentById(req.params.id);
    
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (myMunicipalityId && department.municipalityId && department.municipalityId._id.toString() !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to view this department' });
      }
    }
    
    res.status(200).json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const existingDepartment = await Department.findById(req.params.id);
    if (!existingDepartment) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (myMunicipalityId && existingDepartment.municipalityId.toString() !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to update this department' });
      }
      if (req.body.municipalityId && req.body.municipalityId !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Cannot move department to another municipality' });
      }
    }
    
    const department = await departmentService.updateDepartment(req.params.id, req.body);
    res.status(200).json({ success: true, data: department });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Department code already exists in this municipality' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateDepartmentStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }
    
    const { role, _id } = req.user;
    const existingDepartment = await Department.findById(req.params.id);
    if (!existingDepartment) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (myMunicipalityId && existingDepartment.municipalityId.toString() !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to update this department' });
      }
    }

    const department = await departmentService.updateDepartmentStatus(req.params.id, isActive);
    res.status(200).json({ success: true, data: department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const deleteDepartment = async (req, res) => {
  try {
    const department = await departmentService.deleteDepartment(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }
    res.status(200).json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

