import express from 'express';
import complaintCategoryService from '../services/complaintCategory.service.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/complaint-categories
 * @desc    Create a new complaint category
 * @access  Admin only
 */
router.post(
  '/',
  authenticate,
  authorizeRoles('SYSTEM_ADMIN', 'MUNICIPAL_ADMIN'),
  async (req, res, next) => {
    try {
      // Must pass municipalityId (usually from the request or admin's own org)
      // Since an admin belongs to a municipality, we typically get it from req.user
      // We will allow passing it for SYS_ADMIN, but for MUNICIPAL_ADMIN, lock it.
      
      let municipalityId = req.body.municipalityId;
      if (req.user.role === 'MUNICIPAL_ADMIN' || !municipalityId) {
          municipalityId = req.user.municipalityId;
      }

      if (!municipalityId) {
        return res.status(400).json({ success: false, message: 'municipalityId is required' });
      }

      const category = await complaintCategoryService.createCategory(req.body, municipalityId);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/complaint-categories
 * @desc    Get all categories for a municipality
 * @access  Public (Citizens need to see categories to submit complaints)
 */
router.get('/', async (req, res, next) => {
  try {
    const { municipalityId, isActive } = req.query;
    
    if (!municipalityId) {
      return res.status(400).json({ success: false, message: 'municipalityId query param is required' });
    }

    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const categories = await complaintCategoryService.getCategories(municipalityId, query);
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/complaint-categories/:id
 * @desc    Get single category
 * @access  Public
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { municipalityId } = req.query;
    if (!municipalityId) {
      return res.status(400).json({ success: false, message: 'municipalityId query param is required' });
    }

    const category = await complaintCategoryService.getCategoryById(req.params.id, municipalityId);
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/complaint-categories/:id
 * @desc    Update category
 * @access  Admin only
 */
router.put(
  '/:id',
  authenticate,
  authorizeRoles('SYSTEM_ADMIN', 'MUNICIPAL_ADMIN'),
  async (req, res, next) => {
    try {
      let municipalityId = req.user.municipalityId;
      if (req.user.role === 'SYSTEM_ADMIN' && req.body.municipalityId) {
        municipalityId = req.body.municipalityId;
      }

      const category = await complaintCategoryService.updateCategory(
        req.params.id,
        municipalityId,
        req.body
      );
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   DELETE /api/complaint-categories/:id
 * @desc    Delete (deactivate) category
 * @access  Admin only
 */
router.delete(
  '/:id',
  authenticate,
  authorizeRoles('SYSTEM_ADMIN', 'MUNICIPAL_ADMIN'),
  async (req, res, next) => {
    try {
      let municipalityId = req.user.municipalityId;
      if (req.user.role === 'SYSTEM_ADMIN' && req.body.municipalityId) {
        municipalityId = req.body.municipalityId;
      }

      const category = await complaintCategoryService.deleteCategory(req.params.id, municipalityId);
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
