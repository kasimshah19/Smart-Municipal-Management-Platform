import express from 'express';
import Pincode from '../models/Pincode.js';

const router = express.Router();

/**
 * @route   GET /api/pincodes/:pincode
 * @desc    Get area details by Pincode
 * @access  Public
 */
router.get('/:pincode', async (req, res) => {
  try {
    const { pincode } = req.params;

    if (!pincode || !/^\d{6}$/.test(pincode.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 6-digit numeric Pincode.'
      });
    }

    const offices = await Pincode.find({ pincode: pincode.trim() });

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
