import express from 'express';
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  updateEmployeeStatus
} from '../controllers/employee.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';

const router = express.Router();

router.use(authenticate);

// SUPER_ADMIN and MUNICIPAL_ADMIN can create employees
router.post('/', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), createEmployee);

router.get('/', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER', 'INSPECTOR', 'WORKER'), getEmployees);
router.get('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'WARD_OFFICER', 'DEPARTMENT_OFFICER', 'INSPECTOR', 'WORKER'), getEmployeeById);

// SUPER_ADMIN and MUNICIPAL_ADMIN can edit employees
// DEPARTMENT_OFFICER shouldn't manage employee configuration globally, maybe just their team? We'll limit to MUNICIPAL_ADMIN for simplicity
router.put('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), updateEmployee);
router.patch('/:id/status', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), updateEmployeeStatus);

router.delete('/:id', authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), employeeController.deleteEmployee);

export default router;

