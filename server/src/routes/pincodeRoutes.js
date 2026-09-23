import express from 'express';
import rateLimit from 'express-rate-limit';
import Pincode from '../models/Pincode.js';
import { protect, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// 15-minute window, max 20 requests per IP for the public pincode lookup
const pincodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many pincode lookup requests. Please try again later.'
  }
});

// Utility to escape user regex input
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * @route   GET /api/pincodes/admin/search
 * @desc    Get paginated pincodes for Admin Explorer
 * @access  Private/Admin
 */
router.get('/admin/search', protect, authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 50));
    const search = req.query.search || '';
    const postalDistrict = req.query.postalDistrictName || '';
    const officeType = req.query.officeType || '';
    const deliveryStatus = req.query.deliveryStatus || '';

    const query = {};
    if (search) {
      const safeSearch = escapeRegex(search);
      // If search is entirely numbers, match pincode, else match officeName
      if (/^\d+$/.test(search)) {
        query.pincode = { $regex: safeSearch, $options: 'i' };
      } else {
        query.officeName = { $regex: safeSearch, $options: 'i' };
      }
    }

    if (postalDistrict) {
      query.postalDistrictName = postalDistrict;
    }
    if (officeType) {
      query.officeType = officeType;
    }
    if (deliveryStatus) {
      query.deliveryStatus = deliveryStatus;
    }

    const startIndex = (page - 1) * limit;
    const total = await Pincode.countDocuments(query);

    const offices = await Pincode.find(query)
      .select('-__v')
      .skip(startIndex)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      count: offices.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: offices
    });
  } catch (error) {
    console.error(`Error in GET /api/pincodes/admin/search:`, error);
    res.status(500).json({
      success: false,
      message: 'Server Error fetching admin pincodes.'
    });
  }
});

/**
 * @route   GET /api/pincodes/admin/districts
 * @desc    Get unique postal district names for filter dropdown
 * @access  Private/Admin
 */
router.get('/admin/districts', protect, authorizeRoles('SUPER_ADMIN', 'MUNICIPAL_ADMIN'), async (req, res) => {
  try {
    const districts = await Pincode.distinct('postalDistrictName');
    // Remove empty/null values and sort alphabetically
    const validDistricts = districts.filter(d => d).sort((a, b) => a.localeCompare(b));
    
    res.status(200).json({
      success: true,
      data: validDistricts
    });
  } catch (error) {
    console.error('Error fetching postal districts:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error fetching postal districts.'
    });
  }
});

/**
 * @route   GET /api/pincodes/:pincode
 * @desc    Get area details by Pincode
 * @access  Public
 */
router.get('/:pincode', pincodeLimiter, async (req, res) => {
  try {
    const { pincode } = req.params;

    if (!pincode || !/^\d{6}$/.test(pincode.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 6-digit numeric Pincode.'
      });
    }

    const offices = await Pincode.find({ pincode: pincode.trim() }).select('-__v');

    if (!offices || offices.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No data found for this Pincode in Maharashtra.'
      });
    }

    res.status(200).json({
      success: true,
      count: offices.length,
      data: offices
    });
  } catch (error) {
    console.error(`Error in GET /api/pincodes/${req.params.pincode}:`, error);
    res.status(500).json({
      success: false,
      message: 'Server Error fetching pincode data.'
    });
  }
});

export default router;
