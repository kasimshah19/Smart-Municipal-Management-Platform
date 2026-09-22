import express from 'express';
import {
  getGramPanchayats,
  getGramPanchayatById,
  getGramPanchayatByLgdCode,
  createGramPanchayat,
  updateGramPanchayat,
  deactivateGramPanchayat
} from '../controllers/gramPanchayat.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Read APIs
router.get('/', authorizeRoles(ROLES.SUPER_ADMIN), getGramPanchayats);
router.get('/lgd/:lgdCode', authorizeRoles(ROLES.SUPER_ADMIN), getGramPanchayatByLgdCode);
router.get('/:id', authorizeRoles(ROLES.SUPER_ADMIN), getGramPanchayatById);

// Mutation APIs (Strictly for SUPER_ADMIN to avoid CITIZEN/WARD_OFFICER manipulation)
router.post('/', authorizeRoles(ROLES.SUPER_ADMIN), createGramPanchayat);
router.put('/:id', authorizeRoles(ROLES.SUPER_ADMIN), updateGramPanchayat);
router.delete('/:id', authorizeRoles(ROLES.SUPER_ADMIN), deactivateGramPanchayat);

export default router;
