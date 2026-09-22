import express from 'express';
import {
  createArea,
  getAreas,
  getAreaById,
  updateArea,
  updateAreaStatus,
  deleteArea
} from '../controllers/area.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { requireMunicipalityScope, injectScopeFilter, protectResource } from '../middlewares/scope.middleware.js';
import Area from '../models/Area.js';

const router = express.Router();

router.use(authenticate);

// SUPER_ADMIN and MUNICIPAL_ADMIN can create areas
router.post('/', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), requireMunicipalityScope, createArea);

// View accessible by many roles
router.get('/', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER', 'INSPECTOR'), injectScopeFilter, getAreas);
router.get('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER', 'INSPECTOR'), protectResource(Area), getAreaById);

// SUPER_ADMIN and MUNICIPAL_ADMIN can edit areas
router.put('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), protectResource(Area), updateArea);
router.patch('/:id/status', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), protectResource(Area), updateAreaStatus);

router.delete('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), protectResource(Area), deleteArea);

export default router;

