import express from 'express';
import {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  updateDepartmentStatus,
  deleteDepartment
} from '../controllers/department.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { requireMunicipalityScope, injectScopeFilter, protectResource } from '../middlewares/scope.middleware.js';
import Department from '../models/Department.js';

const router = express.Router();

router.use(authenticate);

// SUPER_ADMIN and MUNICIPAL_ADMIN can create departments
router.post('/', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), requireMunicipalityScope, createDepartment);

router.get('/', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER', 'INSPECTOR', 'WORKER'), injectScopeFilter, getDepartments);
router.get('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER', 'INSPECTOR', 'WORKER'), protectResource(Department), getDepartmentById);

// SUPER_ADMIN and MUNICIPAL_ADMIN can edit departments
router.put('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), protectResource(Department), updateDepartment);
router.patch('/:id/status', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), protectResource(Department), updateDepartmentStatus);

router.delete('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), protectResource(Department), deleteDepartment);

export default router;

