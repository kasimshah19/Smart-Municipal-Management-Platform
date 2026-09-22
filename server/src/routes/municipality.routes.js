import express from 'express';
import {
  createMunicipality,
  getMunicipalities,
  getMunicipalityById,
  updateMunicipality,
  updateMunicipalityStatus
} from '../controllers/municipality.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticate);

// Only SUPER_ADMIN can create municipalities
router.post('/', authorizeRoles('SUPER_ADMIN'), createMunicipality);

// GET is accessible by various roles (handled in controller)
router.get('/', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER'), getMunicipalities);
router.get('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER'), getMunicipalityById);

// Update accessible by SUPER_ADMIN or MUNICIPAL_ADMIN for their own
router.put('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), updateMunicipality);
router.patch('/:id/status', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), updateMunicipalityStatus);

router.delete('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), municipalityController.deleteMunicipality);

export default router;

