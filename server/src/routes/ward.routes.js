import express from 'express';
import {
  createWard,
  getWards,
  getWardById,
  updateWard,
  updateWardStatus
} from '../controllers/ward.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticate);

// SUPER_ADMIN and MUNICIPAL_ADMIN can create wards
router.post('/', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), createWard);

// View accessible by many roles
router.get('/', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER', 'INSPECTOR'), getWards);
router.get('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER', 'INSPECTOR'), getWardById);

// SUPER_ADMIN and MUNICIPAL_ADMIN can edit wards
router.put('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), updateWard);
router.patch('/:id/status', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), updateWardStatus);

export default router;
