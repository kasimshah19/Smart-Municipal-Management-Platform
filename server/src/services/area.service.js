import Area from '../models/Area.js';
import Ward from '../models/Ward.js';
import Municipality from '../models/Municipality.js';

export const createArea = async (data) => {
  // Validate Municipality exists
  const municipality = await Municipality.findById(data.municipalityId);
  if (!municipality || !municipality.isActive) {
    throw new Error('Valid and active Municipality is required');
  }

  // Validate Ward exists and belongs to Municipality
  const ward = await Ward.findById(data.wardId);
  if (!ward || !ward.isActive) {
    throw new Error('Valid and active Ward is required');
  }
  if (ward.municipalityId.toString() !== data.municipalityId.toString()) {
    throw new Error('Ward must belong to the selected Municipality');
  }

  const area = new Area(data);
  return await area.save();
};

export const getAreas = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
  const skip = (page - 1) * limit;

  const filter = {};
  
  if (query.municipalityId) filter.municipalityId = query.municipalityId;
  if (query.wardId) filter.wardId = query.wardId;
  
  if (query.search) {
    const searchRegex = new RegExp(query.search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
    filter.$or = [
      { name: searchRegex },
      { code: searchRegex },
      { pincode: searchRegex }
    ];
  }
  
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true';
  }

  const areas = await Area.find(filter)
    .populate('municipalityId', 'name code')
    .populate('wardId', 'name wardNumber')
    .skip(skip)
    .limit(limit)
    .sort({ name: 1 });
    
  const total = await Area.countDocuments(filter);
  
  return {
    data: areas,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getAreaById = async (id) => {
  return await Area.findById(id)
    .populate('municipalityId', 'name code')
    .populate('wardId', 'name wardNumber');
};

export const updateArea = async (id, updateData) => {
  // If changing ward, validate it belongs to the municipality
  if (updateData.wardId) {
    const ward = await Ward.findById(updateData.wardId);
    if (!ward) throw new Error('Valid Ward is required');
    
    // We need to fetch current area to know its municipality if it's not provided in updateData
    const currentArea = await Area.findById(id);
    const targetMunicipalityId = updateData.municipalityId || currentArea.municipalityId;
    
    if (ward.municipalityId.toString() !== targetMunicipalityId.toString()) {
      throw new Error('Ward must belong to the same Municipality as the Area');
    }
  }

  return await Area.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  })
    .populate('municipalityId', 'name code')
    .populate('wardId', 'name wardNumber');
};

export const updateAreaStatus = async (id, isActive) => {
  return await Area.findByIdAndUpdate(
    id, 
    { isActive }, 
    { new: true }
  )
    .populate('municipalityId', 'name code')
    .populate('wardId', 'name wardNumber');
};
