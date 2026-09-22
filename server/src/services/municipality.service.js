import Municipality from '../models/Municipality.js';
import Ward from '../models/Ward.js';
import Department from '../models/Department.js';
import Profile from '../models/Profile.js';
import Complaint from '../models/Complaint.js';
import District from '../models/District.js';

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

  if (query.districtId) {
    const districtObj = await District.findById(query.districtId);
    if (districtObj) {
      filter.district = districtObj.name;
    } else {
      return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
  } else if (query.district) {
    filter.district = query.district;
  }

  if (query.divisionId) {
    const divisionDistricts = await District.find({ divisionId: query.divisionId });
    if (divisionDistricts.length > 0) {
      const districtNames = divisionDistricts.map(d => d.name);
      if (filter.district) {
        // If district is already set, ensure it falls within the requested division
        if (typeof filter.district === 'string') {
          if (!districtNames.includes(filter.district)) {
            return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
          }
        }
      } else {
        filter.district = { $in: districtNames };
      }
    } else {
      return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    }
  }

  if (query.talukaId) {
    filter.talukaId = query.talukaId;
  }

  if (query.type) {
    filter.type = query.type;
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
  // Check dependencies before hard delete
  const [wardCount, deptCount, profileCount, complaintCount] = await Promise.all([
    Ward.countDocuments({ municipalityId: id }),
    Department.countDocuments({ municipalityId: id }),
    Profile.countDocuments({ municipalityId: id }),
    Complaint.countDocuments({ municipalityId: id })
  ]);
  
  if (wardCount > 0 || deptCount > 0 || profileCount > 0 || complaintCount > 0) {
    throw new Error('Cannot delete this municipality because it has dependent records (Wards, Departments, Users, or Complaints). Please deactivate it instead.');
  }

  return await Municipality.findByIdAndDelete(id);
};

