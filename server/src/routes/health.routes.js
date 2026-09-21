import express from 'express';
import { getHealth } from '../controllers/health.controller.js';

const router = express.Router();

// GET /api/health — system health check
router.get('/', getHealth);

export default router;
