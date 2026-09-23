import GramPanchayat from '../models/GramPanchayat.js';
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const getGramPanchayats = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, districtId, talukaId, status, lgdCode } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (districtId) query.districtId = districtId;
    if (talukaId) query.talukaId = talukaId;
    if (status) query.status = status;
    if (lgdCode) query.lgdCode = lgdCode;

    // RBAC Scope Check removed. SUPER_ADMIN is the only allowed role, so they have global access.
    // Ensure limit is strictly bounded to prevent pagination abuse
    const parsedLimit = Math.min(parseInt(limit) || 50, 100);
    const parsedPage = Math.max(parseInt(page) || 1, 1);

    const skip = (parsedPage - 1) * parsedLimit;
    const total = await GramPanchayat.countDocuments(query);
    const gramPanchayats = await GramPanchayat.find(query)
      .skip(skip)
      .limit(parsedLimit)
      .sort({ districtName: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: gramPanchayats,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getGramPanchayatById = async (req, res, next) => {
  try {
    const gramPanchayat = await GramPanchayat.findById(req.params.id).lean();
    if (!gramPanchayat) {
      return next(new AppError('Gram Panchayat not found', 404));
    }



    res.status(200).json({ success: true, data: gramPanchayat });
  } catch (error) {
    next(error);
  }
};

export const getGramPanchayatByLgdCode = async (req, res, next) => {
  try {
    const gramPanchayat = await GramPanchayat.findOne({ lgdCode: req.params.lgdCode }).lean();
    if (!gramPanchayat) {
      return next(new AppError('Gram Panchayat not found', 404));
    }



    res.status(200).json({ success: true, data: gramPanchayat });
  } catch (error) {
    next(error);
  }
};

// Mutations restricted to Super Admin
export const createGramPanchayat = async (req, res, next) => {
  try {
    const { name, localBodyNameEnglish, localBodyNameLocal, lgdCode, districtId, districtName, talukaId, talukaName, villageCount, status } = req.body;
    const gp = await GramPanchayat.create({ name, localBodyNameEnglish, localBodyNameLocal, lgdCode, districtId, districtName, talukaId, talukaName, villageCount, status });
    res.status(201).json({ success: true, data: gp });
  } catch (error) {
    next(error);
  }
};

export const updateGramPanchayat = async (req, res, next) => {
  try {
    const { name, localBodyNameEnglish, localBodyNameLocal, lgdCode, districtId, districtName, talukaId, talukaName, villageCount, status } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (localBodyNameEnglish !== undefined) updateData.localBodyNameEnglish = localBodyNameEnglish;
    if (localBodyNameLocal !== undefined) updateData.localBodyNameLocal = localBodyNameLocal;
    if (lgdCode !== undefined) updateData.lgdCode = lgdCode;
    if (districtId !== undefined) updateData.districtId = districtId;
    if (districtName !== undefined) updateData.districtName = districtName;
    if (talukaId !== undefined) updateData.talukaId = talukaId;
    if (talukaName !== undefined) updateData.talukaName = talukaName;
    if (villageCount !== undefined) updateData.villageCount = villageCount;
    if (status !== undefined) updateData.status = status;

    const gp = await GramPanchayat.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });
    if (!gp) {
      return next(new AppError('Gram Panchayat not found', 404));
    }
    res.status(200).json({ success: true, data: gp });
  } catch (error) {
    next(error);
  }
};

export const deactivateGramPanchayat = async (req, res, next) => {
  try {
    const gp = await GramPanchayat.findByIdAndUpdate(
      req.params.id,
      { status: 'INACTIVE' },
      { new: true }
    );
    if (!gp) {
      return next(new AppError('Gram Panchayat not found', 404));
    }
    res.status(200).json({ success: true, data: gp });
  } catch (error) {
    next(error);
  }
};
