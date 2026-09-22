import Department from '../models/Department.js';
import Municipality from '../models/Municipality.js';

export const createDepartment = async (data) => {
  const municipality = await Municipality.findById(data.municipalityId);
  if (!municipality || !municipality.isActive) {
    throw new Error('Valid and active Municipality is required');
  }

  const department = new Department(data);
  return await department.save();
};

export const getDepartments = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};
  
  if (query.municipalityId) filter.municipalityId = query.municipalityId;
  if (query.type) filter.type = query.type;
  
  if (query.search) {
    const searchRegex = new RegExp(query.search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
    filter.$or = [
      { name: searchRegex },
      { code: searchRegex }
    ];
  }
  
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true';
  }

  const departments = await Department.find(filter)
    .populate('municipalityId', 'name code')
    .skip(skip)
    .limit(limit)
    .sort({ name: 1 });
    
  const total = await Department.countDocuments(filter);
  
  return {
    data: departments,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getDepartmentById = async (id) => {
  return await Department.findById(id).populate('municipalityId', 'name code');
};

export const updateDepartment = async (id, updateData) => {
  return await Department.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  }).populate('municipalityId', 'name code');
};

export const updateDepartmentStatus = async (id, isActive) => {
  return await Department.findByIdAndUpdate(
    id, 
    { isActive }, 
    { new: true }
  ).populate('municipalityId', 'name code');
};


import Employee from '../models/Employee.js';
import WorkerTeam from '../models/WorkerTeam.js';
import Complaint from '../models/Complaint.js';

export const deleteDepartment = async (id) => {
  // Check dependencies before deletion
  const employeesCount = await Employee.countDocuments({ departmentId: id });
  if (employeesCount > 0) {
    throw new Error('Cannot delete Department. It has associated Employees. Please deactivate it instead.');
  }

  const teamsCount = await WorkerTeam.countDocuments({ departmentId: id });
  if (teamsCount > 0) {
    throw new Error('Cannot delete Department. It has associated Worker Teams. Please deactivate it instead.');
  }

  const complaintsCount = await Complaint.countDocuments({ departmentId: id });
  if (complaintsCount > 0) {
    throw new Error('Cannot delete Department. It has associated Complaints. Please deactivate it instead.');
  }

  return await Department.findByIdAndDelete(id);
};

