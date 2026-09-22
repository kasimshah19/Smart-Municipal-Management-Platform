import WorkerTeam from '../models/WorkerTeam.js';
import Municipality from '../models/Municipality.js';
import Department from '../models/Department.js';
import Employee from '../models/Employee.js';

export const createWorkerTeam = async (data) => {
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

  // Ensure unique members
  if (data.memberIds) {
    data.memberIds = [...new Set(data.memberIds)];
  }

  const team = new WorkerTeam(data);
  return await team.save();
};

export const getWorkerTeams = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};
  
  if (query.municipalityId) filter.municipalityId = query.municipalityId;
  if (query.departmentId) filter.departmentId = query.departmentId;
  if (query.wardId) filter.assignedWardIds = query.wardId;
  
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

  const teams = await WorkerTeam.find(filter)
    .populate('municipalityId', 'name code')
    .populate('departmentId', 'name code')
    .populate('teamLeaderId', 'employeeCode')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
    
  const total = await WorkerTeam.countDocuments(filter);
  
  return {
    data: teams,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getWorkerTeamById = async (id) => {
  return await WorkerTeam.findById(id)
    .populate('municipalityId', 'name code')
    .populate('departmentId', 'name code')
    .populate({
      path: 'teamLeaderId',
      populate: { path: 'userId', select: 'firstName lastName email' }
    })
    .populate({
      path: 'memberIds',
      populate: { path: 'userId', select: 'firstName lastName email' }
    })
    .populate('assignedWardIds', 'name wardNumber');
};

export const updateWorkerTeam = async (id, updateData) => {
  if (updateData.memberIds) {
    updateData.memberIds = [...new Set(updateData.memberIds)];
  }
  return await WorkerTeam.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  })
    .populate('municipalityId', 'name code')
    .populate('departmentId', 'name code');
};

export const updateWorkerTeamStatus = async (id, isActive) => {
  return await WorkerTeam.findByIdAndUpdate(
    id, 
    { isActive }, 
    { new: true }
  )
    .populate('municipalityId', 'name code')
    .populate('departmentId', 'name code');
};


export const deleteWorkerTeam = async (id) => {
  return await WorkerTeam.findByIdAndDelete(id);
};

