import Ward from '../models/Ward.js';
import Municipality from '../models/Municipality.js';

export const createWard = async (data) => {
  // Validate Municipality exists
  const municipality = await Municipality.findById(data.municipalityId);
  if (!municipality || !municipality.isActive) {
    throw new Error('Valid and active Municipality is required');
  }

  const ward = new Ward(data);
  return await ward.save();
};

export const getWards = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};
  
  if (query.municipalityId) {
    filter.municipalityId = query.municipalityId;
  }
  
  if (query.search) {
    const searchRegex = new RegExp(query.search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
    filter.$or = [
      { name: searchRegex },
      { code: searchRegex },
      { wardNumber: searchRegex }
    ];
  }
  
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true';
  }

  const wards = await Ward.find(filter)
    .populate('municipalityId', 'name code')
    .skip(skip)
    .limit(limit)
    .sort({ wardNumber: 1 });
    
  const total = await Ward.countDocuments(filter);
  
  return {
    data: wards,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getWardById = async (id) => {
  return await Ward.findById(id).populate('municipalityId', 'name code');
};

export const updateWard = async (id, updateData) => {
  return await Ward.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  }).populate('municipalityId', 'name code');
};

export const updateWardStatus = async (id, isActive) => {
  return await Ward.findByIdAndUpdate(
    id, 
    { isActive }, 
    { new: true }
  ).populate('municipalityId', 'name code');
};
