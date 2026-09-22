import { ROLES } from '../constants/roles.js';
import Ward from '../models/Ward.js';
import Area from '../models/Area.js';
import Department from '../models/Department.js';
import Employee from '../models/Employee.js';

// Verifies that body/query municipalityId matches user's municipalityId
export const requireMunicipalityScope = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  if (req.user.role === ROLES.SUPER_ADMIN) {
    return next();
  }

  const targetMunicipalityId = req.body.municipalityId || req.query.municipalityId;
  
  if (targetMunicipalityId && targetMunicipalityId.toString() !== req.user.municipalityId?.toString()) {
    return res.status(403).json({ success: false, message: 'Forbidden: Outside of your administrative scope' });
  }

  next();
};

// Verifies that body/query wardId matches user's wardId (if applicable)
export const requireWardScope = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  if (req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.MUNICIPAL_ADMIN) {
    return next();
  }

  if (req.user.role === ROLES.WARD_OFFICER) {
    const targetWardId = req.body.wardId || req.query.wardId;
    if (targetWardId && targetWardId.toString() !== req.user.wardId?.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: Outside of your assigned ward scope' });
    }
  }

  next();
};

export const requireDepartmentScope = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  if (req.user.role === ROLES.SUPER_ADMIN || req.user.role === ROLES.MUNICIPAL_ADMIN) {
    return next();
  }

  if (req.user.role === ROLES.DEPARTMENT_OFFICER) {
    const targetDepartmentId = req.body.departmentId || req.query.departmentId;
    if (targetDepartmentId && targetDepartmentId.toString() !== req.user.departmentId?.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: Outside of your assigned department scope' });
    }
  }

  next();
};

// Protects /api/RESOURCE/:id by fetching the resource and verifying ownership
export const protectResource = (Model, parentField = 'municipalityId') => {
  return async (req, res, next) => {
    if (!req.user || req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    try {
      const resourceId = req.params.id;
      if (!resourceId) return next();

      const resource = await Model.findById(resourceId);
      if (!resource) {
        return res.status(404).json({ success: false, message: 'Resource not found' });
      }

      // Check Municipality Admin scope
      if (req.user.role === ROLES.MUNICIPAL_ADMIN) {
        // If the resource is the municipality itself
        if (Model.modelName === 'Municipality' && resource._id.toString() !== req.user.municipalityId?.toString()) {
          return res.status(403).json({ success: false, message: 'Forbidden: Outside of your administrative scope' });
        }
        // If the resource is a child of the municipality
        if (Model.modelName !== 'Municipality' && resource[parentField]?.toString() !== req.user.municipalityId?.toString()) {
          return res.status(403).json({ success: false, message: 'Forbidden: Outside of your administrative scope' });
        }
      }

      // Check Ward Officer scope
      if (req.user.role === ROLES.WARD_OFFICER) {
        if (Model.modelName === 'Municipality') {
          if (resource._id.toString() !== req.user.municipalityId?.toString()) return res.status(403).json({ success: false, message: 'Forbidden' });
        } else if (Model.modelName === 'Ward') {
          if (resource._id.toString() !== req.user.wardId?.toString()) return res.status(403).json({ success: false, message: 'Forbidden' });
        } else if (Model.modelName === 'Area') {
          if (resource.wardId?.toString() !== req.user.wardId?.toString()) return res.status(403).json({ success: false, message: 'Forbidden' });
        } else {
           // other resources not generally allowed for WARD_OFFICER unless specified
           if (resource.municipalityId?.toString() !== req.user.municipalityId?.toString()) return res.status(403).json({ success: false, message: 'Forbidden' });
        }
      }

      // Check Department Officer scope
      if (req.user.role === ROLES.DEPARTMENT_OFFICER) {
        if (Model.modelName === 'Municipality') {
          if (resource._id.toString() !== req.user.municipalityId?.toString()) return res.status(403).json({ success: false, message: 'Forbidden' });
        } else if (Model.modelName === 'Department') {
          if (resource._id.toString() !== req.user.departmentId?.toString()) return res.status(403).json({ success: false, message: 'Forbidden' });
        } else if (resource.departmentId && resource.departmentId.toString() !== req.user.departmentId?.toString()) {
          return res.status(403).json({ success: false, message: 'Forbidden' });
        }
      }

      next();
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error checking authorization scope' });
    }
  };
};

// Middleware to inject implicit filtering based on scope to prevent IDOR and limit search space
export const injectScopeFilter = (req, res, next) => {
  if (!req.user || req.user.role === ROLES.SUPER_ADMIN) {
    return next();
  }
  
  if (req.user.role === ROLES.MUNICIPAL_ADMIN && req.user.municipalityId) {
    req.query.municipalityId = req.user.municipalityId.toString();
  }

  if (req.user.role === ROLES.WARD_OFFICER && req.user.wardId) {
    req.query.municipalityId = req.user.municipalityId.toString();
    req.query.wardId = req.user.wardId.toString();
  }

  if (req.user.role === ROLES.DEPARTMENT_OFFICER && req.user.departmentId) {
    req.query.municipalityId = req.user.municipalityId.toString();
    req.query.departmentId = req.user.departmentId.toString();
  }

  next();
};
