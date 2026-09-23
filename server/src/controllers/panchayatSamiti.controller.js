import PanchayatSamiti from '../models/PanchayatSamiti.js';

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const getPanchayatSamitis = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, districtId, talukaId, zillaParishadId, status, lgdCode } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (districtId) query.districtId = districtId;
    if (talukaId) query.talukaId = talukaId;
    if (zillaParishadId) query.zillaParishadId = zillaParishadId;
    if (status) query.status = status;
    if (lgdCode) query.lgdCode = lgdCode;

    const parsedLimit = Math.min(parseInt(limit) || 50, 100);
    const skip = (parseInt(page) - 1) * parsedLimit;
    const total = await PanchayatSamiti.countDocuments(query);
    const panchayatSamitis = await PanchayatSamiti.find(query)
      .skip(skip)
      .limit(parsedLimit)
      .sort({ districtName: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: panchayatSamitis,
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

export const getPanchayatSamitiById = async (req, res, next) => {
  try {
    const ps = await PanchayatSamiti.findById(req.params.id).lean();
    if (!ps) {
      return next(new AppError('Panchayat Samiti not found', 404));
    }
    res.status(200).json({ success: true, data: ps });
  } catch (error) {
    next(error);
  }
};

export const createPanchayatSamiti = async (req, res, next) => {
  try {
    const { name, marathiName, lgdCode, districtId, districtName, talukaId, talukaName, zillaParishadId, status } = req.body;
    const ps = await PanchayatSamiti.create({ name, marathiName, lgdCode, districtId, districtName, talukaId, talukaName, zillaParishadId, status });
    res.status(201).json({ success: true, data: ps });
  } catch (error) {
    next(error);
  }
};

export const updatePanchayatSamiti = async (req, res, next) => {
  try {
    const { name, marathiName, lgdCode, districtId, districtName, talukaId, talukaName, zillaParishadId, status } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (marathiName !== undefined) updateData.marathiName = marathiName;
    if (lgdCode !== undefined) updateData.lgdCode = lgdCode;
    if (districtId !== undefined) updateData.districtId = districtId;
    if (districtName !== undefined) updateData.districtName = districtName;
    if (talukaId !== undefined) updateData.talukaId = talukaId;
    if (talukaName !== undefined) updateData.talukaName = talukaName;
    if (zillaParishadId !== undefined) updateData.zillaParishadId = zillaParishadId;
    if (status !== undefined) updateData.status = status;

    const ps = await PanchayatSamiti.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });
    if (!ps) {
      return next(new AppError('Panchayat Samiti not found', 404));
    }
    res.status(200).json({ success: true, data: ps });
  } catch (error) {
    next(error);
  }
};

export const deactivatePanchayatSamiti = async (req, res, next) => {
  try {
    const ps = await PanchayatSamiti.findByIdAndUpdate(
      req.params.id,
      { status: 'INACTIVE' },
      { new: true }
    );
    if (!ps) {
      return next(new AppError('Panchayat Samiti not found', 404));
    }
    res.status(200).json({ success: true, data: ps });
  } catch (error) {
    next(error);
  }
};
