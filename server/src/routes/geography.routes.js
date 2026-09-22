import express from 'express';
import {
  getDivisions, getDivisionById, createDivision, updateDivision, deleteDivision,
  getDistricts, getDistrictById, createDistrict, updateDistrict, deleteDistrict,
  getTalukas, getTalukaById, createTaluka, updateTaluka, deleteTaluka,
  getGeographySummary, getGeographyTree
} from '../controllers/geography.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

// All geography routes require authentication
router.use(authenticate);

// Summary & Tree (read-only)
router.get('/summary', getGeographySummary);
router.get('/tree', getGeographyTree);

// Divisions
router.get('/divisions', getDivisions);
router.get('/divisions/:id', getDivisionById);
router.post('/divisions', authorizeRoles(ROLES.SUPER_ADMIN), createDivision);
router.put('/divisions/:id', authorizeRoles(ROLES.SUPER_ADMIN), updateDivision);
router.delete('/divisions/:id', authorizeRoles(ROLES.SUPER_ADMIN), deleteDivision);

// Districts
router.get('/districts', getDistricts);
router.get('/districts/:id', getDistrictById);
router.post('/districts', authorizeRoles(ROLES.SUPER_ADMIN), createDistrict);
router.put('/districts/:id', authorizeRoles(ROLES.SUPER_ADMIN), updateDistrict);
router.delete('/districts/:id', authorizeRoles(ROLES.SUPER_ADMIN), deleteDistrict);

// Talukas
router.get('/talukas', getTalukas);
router.get('/talukas/:id', getTalukaById);
router.post('/talukas', authorizeRoles(ROLES.SUPER_ADMIN), createTaluka);
router.put('/talukas/:id', authorizeRoles(ROLES.SUPER_ADMIN), updateTaluka);
router.delete('/talukas/:id', authorizeRoles(ROLES.SUPER_ADMIN), deleteTaluka);

export default router;
