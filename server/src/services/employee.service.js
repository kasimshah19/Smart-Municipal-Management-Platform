import Employee from '../models/Employee.js';
import Municipality from '../models/Municipality.js';
import Department from '../models/Department.js';
import Designation from '../models/Designation.js';
import { User } from '../models/User.js';

export const createEmployee = async (data) => {
  // Validate User
  const user = await User.findById(data.userId);
  if (!user || !user.isActive) {
    throw new Error('Valid and active User is required');
  }

  // Validate Municipality
  const municipality = await Municipality.findById(data.municipalityId);
  if (!municipality || !municipality.isActive) {
    throw new Error('Valid and active Municipality is required');
  }

  // Validate Department
  const department = await Department.findById(data.departmentId);
  if (!department || !department.isActive) {
    throw new Error('Valid and active Department is required');
  }
  if (department.municipalityId.toString() !== data.municipalityId.toString()) {
    throw new Error('Department must belong to the selected Municipality');
  }

  // Validate Designation
  const designation = await Designation.findById(data.designationId);
  if (!designation || !designation.isActive) {
    throw new Error('Valid and active Designation is required');
  }
  if (designation.municipalityId.toString() !== data.municipalityId.toString()) {
    throw new Error('Designation must belong to the selected Municipality');
  }

  const employee = new Employee(data);
  return await employee.save();
};

export const getEmployees = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};
  
  if (query.municipalityId) filter.municipalityId = query.municipalityId;
  if (query.departmentId) filter.departmentId = query.departmentId;
  if (query.designationId) filter.designationId = query.designationId;
  if (query.employeeType) filter.employeeType = query.employeeType;
  
  if (query.search) {
    const searchRegex = new RegExp(query.search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
    filter.$or = [
      { employeeCode: searchRegex },
      { workEmail: searchRegex },
      { phone: searchRegex }
    ];
  }
  
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true';
  }

  const employees = await Employee.find(filter)
    .populate('userId', 'firstName lastName email role')
    .populate('municipalityId', 'name code')
    .populate('departmentId', 'name code')
    .populate('designationId', 'name code level')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
    
  const total = await Employee.countDocuments(filter);
  
  return {
    data: employees,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getEmployeeById = async (id) => {
  return await Employee.findById(id)
    .populate('userId', 'firstName lastName email role')
    .populate('municipalityId', 'name code')
    .populate('departmentId', 'name code')
    .populate('designationId', 'name code level')
    .populate('reportingManagerId', 'employeeCode')
    .populate('assignedWardIds', 'name wardNumber');
};

export const updateEmployee = async (id, updateData) => {
  // If changing department or designation, validate them (simplified here)
  return await Employee.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  })
    .populate('userId', 'firstName lastName email role')
    .populate('municipalityId', 'name code')
    .populate('departmentId', 'name code')
    .populate('designationId', 'name code level');
};

export const updateEmployeeStatus = async (id, isActive) => {
  return await Employee.findByIdAndUpdate(
    id, 
    { isActive }, 
    { new: true }
  )
    .populate('userId', 'firstName lastName email role')
    .populate('municipalityId', 'name code')
    .populate('departmentId', 'name code')
    .populate('designationId', 'name code level');
};


export const deleteEmployee = async (id) => {
  return await Employee.findByIdAndDelete(id);
};

