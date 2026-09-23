import ZillaParishad from '../models/ZillaParishad.js';

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const getZillaParishads = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, districtId, status, lgdCode } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (districtId) query.districtId = districtId;
    if (status) query.status = status;
    if (lgdCode) query.lgdCode = lgdCode;

    const parsedLimit = Math.min(parseInt(limit) || 50, 100);
    const skip = (parseInt(page) - 1) * parsedLimit;
    const total = await ZillaParishad.countDocuments(query);
    const zillaParishads = await ZillaParishad.find(query)
      .skip(skip)
      .limit(parsedLimit)
      .sort({ districtName: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: zillaParishads,
      pagination: {
        total,
        page: parseInt(page),
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getZillaParishadById = async (req, res, next) => {
  try {
    const zp = await ZillaParishad.findById(req.params.id).lean();
    if (!zp) {
      return next(new AppError('Zilla Parishad not found', 404));
    }
    res.status(200).json({ success: true, data: zp });
  } catch (error) {
    next(error);
  }
};

export const createZillaParishad = async (req, res, next) => {
  try {
    const { name, marathiName, lgdCode, districtId, districtName, status } = req.body;
    const zp = await ZillaParishad.create({ name, marathiName, lgdCode, districtId, districtName, status });
    res.status(201).json({ success: true, data: zp });
  } catch (error) {
    next(error);
  }
};

export const updateZillaParishad = async (req, res, next) => {
  try {
    const { name, marathiName, lgdCode, districtId, districtName, status } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (marathiName !== undefined) updateData.marathiName = marathiName;
    if (lgdCode !== undefined) updateData.lgdCode = lgdCode;
    if (districtId !== undefined) updateData.districtId = districtId;
    if (districtName !== undefined) updateData.districtName = districtName;
    if (status !== undefined) updateData.status = status;

    const zp = await ZillaParishad.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });
    if (!zp) {
      return next(new AppError('Zilla Parishad not found', 404));
    }
    res.status(200).json({ success: true, data: zp });
  } catch (error) {
    next(error);
  }
};

export const deactivateZillaParishad = async (req, res, next) => {
  try {
    const zp = await ZillaParishad.findByIdAndUpdate(
      req.params.id,
      { status: 'INACTIVE' },
      { new: true }
    );
    if (!zp) {
      return next(new AppError('Zilla Parishad not found', 404));
    }
    res.status(200).json({ success: true, data: zp });
  } catch (error) {
    next(error);
  }
};
