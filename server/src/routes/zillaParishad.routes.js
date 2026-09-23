import express from 'express';
import {
  getZillaParishads,
  getZillaParishadById,
  createZillaParishad,
  updateZillaParishad,
  deactivateZillaParishad
} from '../controllers/zillaParishad.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

router.use(authenticate);

router.get('/', authorizeRoles(ROLES.SUPER_ADMIN), getZillaParishads);
router.get('/:id', authorizeRoles(ROLES.SUPER_ADMIN), getZillaParishadById);
router.post('/', authorizeRoles(ROLES.SUPER_ADMIN), createZillaParishad);
router.put('/:id', authorizeRoles(ROLES.SUPER_ADMIN), updateZillaParishad);
router.delete('/:id', authorizeRoles(ROLES.SUPER_ADMIN), deactivateZillaParishad);

export default router;
