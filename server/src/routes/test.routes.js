import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

// All test routes require authentication
router.use(authenticate);

router.get('/citizen', authorizeRoles(ROLES.CITIZEN), (req, res) => {
  res.json({ success: true, message: 'Citizen access granted' });
});

router.get('/worker', authorizeRoles(ROLES.WORKER), (req, res) => {
  res.json({ success: true, message: 'Worker access granted' });
});

router.get('/inspector', authorizeRoles(ROLES.INSPECTOR), (req, res) => {
  res.json({ success: true, message: 'Inspector access granted' });
});

router.get('/department-officer', authorizeRoles(ROLES.DEPARTMENT_OFFICER), (req, res) => {
  res.json({ success: true, message: 'Department Officer access granted' });
});

router.get('/ward-officer', authorizeRoles(ROLES.WARD_OFFICER), (req, res) => {
  res.json({ success: true, message: 'Ward Officer access granted' });
});

router.get('/admin', authorizeRoles(ROLES.MUNICIPAL_ADMIN, ROLES.SUPER_ADMIN), (req, res) => {
  res.json({ success: true, message: 'Municipal Admin access granted' });
});

router.get('/super-admin', authorizeRoles(ROLES.SUPER_ADMIN), (req, res) => {
  res.json({ success: true, message: 'Super Admin access granted' });
});

export default router;
