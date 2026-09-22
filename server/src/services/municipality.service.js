import Municipality from '../models/Municipality.js';

export const createMunicipality = async (data) => {
  const municipality = new Municipality(data);
  return await municipality.save();
};

export const getMunicipalities = async (query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  
  if (query.search) {
    // Escape regex
    const searchRegex = new RegExp(query.search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
    filter.$or = [
      { name: searchRegex },
      { code: searchRegex }
    ];
  }
  
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true';
  }

  const municipalities = await Municipality.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
    
  const total = await Municipality.countDocuments(filter);
  
  return {
    data: municipalities,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getMunicipalityById = async (id) => {
  return await Municipality.findById(id);
};

export const updateMunicipality = async (id, updateData) => {
  return await Municipality.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true
  });
};

export const updateMunicipalityStatus = async (id, isActive) => {
  return await Municipality.findByIdAndUpdate(
    id, 
    { isActive }, 
    { new: true }
  );
};


export const deleteMunicipality = async (id) => {
  return await Municipality.findByIdAndDelete(id);
};

