import express from 'express';
import analyticsController from '../controllers/analytics.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/overview', analyticsController.getOverview);
router.get('/status', analyticsController.getStatusDistribution);
router.get('/priority', analyticsController.getPriorityDistribution);
router.get('/trends', analyticsController.getTrends);
router.get('/category', analyticsController.getCategoryAnalytics);
router.get('/department', analyticsController.getDepartmentWorkload);
router.get('/ward', analyticsController.getWardWorkload);
router.get('/workers', analyticsController.getWorkerWorkload);
router.get('/municipalities', analyticsController.getMunicipalityAnalytics);
router.get('/districts', analyticsController.getDistrictAnalytics);
router.get('/sla', analyticsController.getSLAAnalytics);
router.get('/export', analyticsController.exportCsv);
router.get('/system-structure', analyticsController.getSystemStructure);
router.get('/areas', analyticsController.getAreaWorkload);
router.get('/recent-activity', analyticsController.getRecentActivity);

export default router;
