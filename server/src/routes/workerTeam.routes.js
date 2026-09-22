import express from 'express';
import {
  createWorkerTeam,
  getWorkerTeams,
  getWorkerTeamById,
  updateWorkerTeam,
  updateWorkerTeamStatus
} from '../controllers/workerTeam.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'DEPARTMENT_OFFICER'), createWorkerTeam);
router.get('/', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER', 'INSPECTOR', 'WORKER'), getWorkerTeams);
router.get('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER', 'INSPECTOR', 'WORKER'), getWorkerTeamById);

router.put('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'DEPARTMENT_OFFICER'), updateWorkerTeam);
router.patch('/:id/status', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'DEPARTMENT_OFFICER'), updateWorkerTeamStatus);

router.delete('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), workerTeamController.deleteWorkerTeam);

export default router;

