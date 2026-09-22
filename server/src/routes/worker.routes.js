import express from 'express';
import fieldOperationsService from '../services/fieldOperations.service.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/role.middleware.js';
import { ROLES } from '../constants/roles.js';

const router = express.Router();

/**
 * @route   GET /api/worker/tasks
 * @desc    Get assigned tasks for the worker
 * @access  Private (Worker only)
 */
router.get(
  '/tasks',
  authenticate,
  authorizeRoles(ROLES.WORKER),
  async (req, res, next) => {
    try {
      const result = await fieldOperationsService.getWorkerTasks(req.user, req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/worker/tasks/stats
 * @desc    Get stats for worker dashboard
 * @access  Private (Worker only)
 */
router.get(
  '/tasks/stats',
  authenticate,
  authorizeRoles(ROLES.WORKER),
  async (req, res, next) => {
    try {
      const stats = await fieldOperationsService.getWorkerStats(req.user);
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
