import * as employeeService from '../services/employee.service.js';
import Profile from '../models/Profile.js';
import Employee from '../models/Employee.js';

const getUserMunicipalityId = async (userId) => {
  const profile = await Profile.findOne({ userId });
  return profile ? profile.municipalityId : null;
};

export const createEmployee = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const { municipalityId } = req.body;

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (!myMunicipalityId || myMunicipalityId.toString() !== municipalityId) {
        return res.status(403).json({ success: false, message: 'You can only create employees for your own municipality' });
      }
    }

    const employee = await employeeService.createEmployee(req.body);
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Employee code already exists or User is already assigned as an employee' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getEmployees = async (req, res) => {
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

    const result = await employeeService.getEmployees(query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const employee = await employeeService.getEmployeeById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (myMunicipalityId && employee.municipalityId && employee.municipalityId._id.toString() !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to view this employee' });
      }
    }
    
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const existingEmployee = await Employee.findById(req.params.id);
    if (!existingEmployee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (myMunicipalityId && existingEmployee.municipalityId.toString() !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to update this employee' });
      }
      if (req.body.municipalityId && req.body.municipalityId !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Cannot move employee to another municipality' });
      }
    }
    
    const employee = await employeeService.updateEmployee(req.params.id, req.body);
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Employee code already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateEmployeeStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }
    
    const { role, _id } = req.user;
    const existingEmployee = await Employee.findById(req.params.id);
    if (!existingEmployee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (role !== 'SUPER_ADMIN') {
      const myMunicipalityId = await getUserMunicipalityId(_id);
      if (myMunicipalityId && existingEmployee.municipalityId.toString() !== myMunicipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to update this employee' });
      }
    }

    const employee = await employeeService.updateEmployeeStatus(req.params.id, isActive);
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const deleteEmployee = async (req, res) => {
  try {
    const employee = await employeeService.deleteEmployee(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.status(200).json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

