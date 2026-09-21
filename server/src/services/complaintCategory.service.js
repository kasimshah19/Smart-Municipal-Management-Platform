import ComplaintCategory from '../models/ComplaintCategory.js';

class ComplaintCategoryService {
  /**
   * Create a new complaint category
   */
  async createCategory(data, municipalityId) {
    const { code } = data;

    const existing = await ComplaintCategory.findOne({
      municipalityId,
      code: code.toUpperCase(),
    });

    if (existing) {
      throw new Error('Category code already exists in this municipality');
    }

    const category = new ComplaintCategory({
      ...data,
      municipalityId,
    });

    return await category.save();
  }

  /**
   * Get categories for a municipality
   */
  async getCategories(municipalityId, query = {}) {
    const filter = { municipalityId, ...query };
    
    // Only return active by default unless explicitly asked for all
    if (!query.hasOwnProperty('isActive')) {
      filter.isActive = true;
    }

    return await ComplaintCategory.find(filter).populate('departmentId', 'name code');
  }

  /**
   * Get single category
   */
  async getCategoryById(categoryId, municipalityId) {
    const category = await ComplaintCategory.findOne({
      _id: categoryId,
      municipalityId,
    }).populate('departmentId', 'name code');

    if (!category) {
      throw new Error('Complaint category not found');
    }

    return category;
  }

  /**
   * Update category
   */
  async updateCategory(categoryId, municipalityId, updateData) {
    const category = await ComplaintCategory.findOneAndUpdate(
      { _id: categoryId, municipalityId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!category) {
      throw new Error('Complaint category not found');
    }

    return category;
  }

  /**
   * Delete / Deactivate category
   */
  async deleteCategory(categoryId, municipalityId) {
    const category = await ComplaintCategory.findOneAndUpdate(
      { _id: categoryId, municipalityId },
      { isActive: false },
      { new: true }
    );

    if (!category) {
      throw new Error('Complaint category not found');
    }

    return category;
  }
}

export default new ComplaintCategoryService();
