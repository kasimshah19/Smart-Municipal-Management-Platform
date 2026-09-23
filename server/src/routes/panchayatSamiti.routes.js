import express from 'express';
import {
  getPanchayatSamitis,
  getPanchayatSamitiById,
  createPanchayatSamiti,
  updatePanchayatSamiti,
  deactivatePanchayatSamiti
} from '../controllers/panchayatSamiti.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeRoles(ROLES.SUPER_ADMIN), getPanchayatSamitis);
router.get('/:id', authorizeRoles(ROLES.SUPER_ADMIN), getPanchayatSamitiById);
router.post('/', authorizeRoles(ROLES.SUPER_ADMIN), createPanchayatSamiti);
router.put('/:id', authorizeRoles(ROLES.SUPER_ADMIN), updatePanchayatSamiti);
router.delete('/:id', authorizeRoles(ROLES.SUPER_ADMIN), deactivatePanchayatSamiti);

export default router;
