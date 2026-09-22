import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  updateUserRoleAndScope
} from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { injectScopeFilter, protectResource } from '../middlewares/scope.middleware.js';
import { User } from '../models/User.js';

const router = express.Router();

router.use(authenticate);

// Get users with scope filtering (e.g. MUNICIPAL_ADMIN only sees users in their municipality)
router.get('/', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER'), injectScopeFilter, getUsers);

// Get a specific user (protected by IDOR middleware)
router.get('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER'), protectResource(User), getUserById);

// Update basic user profile info (accessible by admins)
router.put('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), protectResource(User), updateUser);

// Important: Specific route to safely update role & scope, preventing MUNICIPAL_ADMINs from elevating someone to SUPER_ADMIN
router.patch('/:id/role-scope', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), protectResource(User), updateUserRoleAndScope);

export default router;
