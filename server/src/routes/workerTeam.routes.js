import express from 'express';
import {
  createWorkerTeam,
  getWorkerTeams,
  getWorkerTeamById,
  updateWorkerTeam,
  updateWorkerTeamStatus,
  deleteWorkerTeam
} from '../controllers/workerTeam.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { requireMunicipalityScope, injectScopeFilter, protectResource } from '../middlewares/scope.middleware.js';
import WorkerTeam from '../models/WorkerTeam.js';

const router = express.Router();

router.use(authenticate);

router.post('/', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'DEPARTMENT_OFFICER'), requireMunicipalityScope, createWorkerTeam);
router.get('/', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER', 'INSPECTOR', 'WORKER'), injectScopeFilter, getWorkerTeams);
router.get('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER', 'INSPECTOR', 'WORKER'), protectResource(WorkerTeam), getWorkerTeamById);

router.put('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'DEPARTMENT_OFFICER'), protectResource(WorkerTeam), updateWorkerTeam);
router.patch('/:id/status', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'DEPARTMENT_OFFICER'), protectResource(WorkerTeam), updateWorkerTeamStatus);

router.delete('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), protectResource(WorkerTeam), deleteWorkerTeam);

export default router;

