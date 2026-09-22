import express from 'express';
import {
  createArea,
  getAreas,
  getAreaById,
  updateArea,
  updateAreaStatus
} from '../controllers/area.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticate);

// SUPER_ADMIN and MUNICIPAL_ADMIN can create areas
router.post('/', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), createArea);

// View accessible by many roles
router.get('/', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER', 'INSPECTOR'), getAreas);
router.get('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER', 'INSPECTOR'), getAreaById);

// SUPER_ADMIN and MUNICIPAL_ADMIN can edit areas
router.put('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), updateArea);
router.patch('/:id/status', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), updateAreaStatus);

router.delete('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), areaController.deleteArea);

export default router;

