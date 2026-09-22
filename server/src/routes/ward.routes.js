import express from 'express';
import {
  createWard,
  getWards,
  getWardById,
  updateWard,
  updateWardStatus,
  deleteWard
} from '../controllers/ward.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { requireMunicipalityScope, injectScopeFilter, protectResource } from '../middlewares/scope.middleware.js';
import Ward from '../models/Ward.js';

const router = express.Router();

router.use(authenticate);

// SUPER_ADMIN and MUNICIPAL_ADMIN can create wards
router.post('/', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), requireMunicipalityScope, createWard);

// View accessible by many roles
router.get('/', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER', 'INSPECTOR'), injectScopeFilter, getWards);
router.get('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER', 'INSPECTOR'), protectResource(Ward), getWardById);

// SUPER_ADMIN and MUNICIPAL_ADMIN can edit wards
router.put('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), protectResource(Ward), updateWard);
router.patch('/:id/status', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), protectResource(Ward), updateWardStatus);

router.delete('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), protectResource(Ward), deleteWard);

export default router;

