import Designation from '../models/Designation.js';
import Municipality from '../models/Municipality.js';

export const createDesignation = async (data) => {
  const municipality = await Municipality.findById(data.municipalityId);
  if (!municipality || !municipality.isActive) {
    throw new Error('Valid and active Municipality is required');
  }

  const designation = new Designation(data);
  return await designation.save();
};

export const getDesignations = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};
  
  if (query.municipalityId) filter.municipalityId = query.municipalityId;
  if (query.level) filter.level = query.level;
  
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

  const designations = await Designation.find(filter)
    .populate('municipalityId', 'name code')
    .skip(skip)
    .limit(limit)
    .sort({ name: 1 });
    
  const total = await Designation.countDocuments(filter);
  
  return {
    data: designations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getDesignationById = async (id) => {
  return await Designation.findById(id).populate('municipalityId', 'name code');
};

export const updateDesignation = async (id, updateData) => {
  return await Designation.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  }).populate('municipalityId', 'name code');
};

export const updateDesignationStatus = async (id, isActive) => {
  return await Designation.findByIdAndUpdate(
    id, 
    { isActive }, 
    { new: true }
  ).populate('municipalityId', 'name code');
};


export const deleteDesignation = async (id) => {
  return await Designation.findByIdAndDelete(id);
};

