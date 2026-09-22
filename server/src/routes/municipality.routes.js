import express from 'express';
import {
  createMunicipality,
  getMunicipalities,
  getMunicipalityById,
  updateMunicipality,
  updateMunicipalityStatus,
  deleteMunicipality
} from '../controllers/municipality.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { requireMunicipalityScope, injectScopeFilter, protectResource } from '../middlewares/scope.middleware.js';
import Municipality from '../models/Municipality.js';

const router = express.Router();

router.use(authenticate);

// Only SUPER_ADMIN can create municipalities
router.post('/', authorizeRoles('SUPER_ADMIN'), createMunicipality);

// GET is accessible by various roles (handled in controller)
router.get('/', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER'), injectScopeFilter, getMunicipalities);
router.get('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER'), protectResource(Municipality), getMunicipalityById);

// Update accessible by SUPER_ADMIN or MUNICIPAL_ADMIN for their own
router.put('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), protectResource(Municipality), updateMunicipality);
router.patch('/:id/status', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), protectResource(Municipality), updateMunicipalityStatus);

router.delete('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), protectResource(Municipality), deleteMunicipality);

export default router;

