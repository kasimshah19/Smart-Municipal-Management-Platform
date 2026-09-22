import { User } from '../models/User.js';
import { ROLES } from '../constants/roles.js';

export const getUsers = async (req, res) => {
  try {
    const filter = { ...req.query };
    
    // Pagination
    const page = parseInt(filter.page) || 1;
    const limit = parseInt(filter.limit) || 20;
    const skip = (page - 1) * limit;

    delete filter.page;
    delete filter.limit;

    const users = await User.find(filter)
      .select('-password -emailVerificationToken -passwordResetToken') // exclude sensitive
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -emailVerificationToken -passwordResetToken');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, phone, isActive } = req.body;
    
    // Disallow role/scope changes in this generic update route
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, phone, isActive },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateUserRoleAndScope = async (req, res) => {
  try {
    const { role, municipalityId, wardId, departmentId } = req.body;
    
    // Security check: MUNICIPAL_ADMIN cannot assign SUPER_ADMIN
    if (req.user.role === ROLES.MUNICIPAL_ADMIN && role === ROLES.SUPER_ADMIN) {
      return res.status(403).json({ success: false, message: 'Cannot elevate user to SUPER_ADMIN' });
    }
    
    // Security check: MUNICIPAL_ADMIN can only assign users within their municipality
    if (req.user.role === ROLES.MUNICIPAL_ADMIN) {
      if (municipalityId && municipalityId !== req.user.municipalityId.toString()) {
        return res.status(403).json({ success: false, message: 'Cannot assign user to a different municipality' });
      }
    }

    const updates = { role };

    // Update scopes based on role. Clean up irrelevant scopes.
    if (role === ROLES.SUPER_ADMIN) {
      updates.municipalityId = null;
      updates.wardId = null;
      updates.departmentId = null;
    } else if (role === ROLES.MUNICIPAL_ADMIN) {
      updates.municipalityId = municipalityId || req.user.municipalityId;
      updates.wardId = null;
      updates.departmentId = null;
    } else if (role === ROLES.WARD_OFFICER) {
      updates.municipalityId = municipalityId || req.user.municipalityId;
      updates.wardId = wardId;
      updates.departmentId = null;
    } else if (role === ROLES.DEPARTMENT_OFFICER) {
      updates.municipalityId = municipalityId || req.user.municipalityId;
      updates.departmentId = departmentId;
      updates.wardId = null;
    } else {
      // Worker, Inspector, Citizen
      updates.municipalityId = municipalityId || req.user.municipalityId;
      updates.wardId = wardId || null;
      updates.departmentId = departmentId || null;
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
