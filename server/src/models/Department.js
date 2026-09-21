import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    municipalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Municipality',
      required: [true, 'Municipality ID is required']
    },
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      trim: true,
      uppercase: true
    },
    description: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: [
        'SANITATION', 'WATER_SUPPLY', 'ROADS', 'ELECTRICAL', 'DRAINAGE', 
        'HEALTH', 'GARDEN', 'BUILDING', 'REVENUE', 'ADMINISTRATION', 
        'PUBLIC_WORKS', 'OTHER'
      ],
      default: 'OTHER'
    },
    contactPhone: {
      type: String,
      trim: true
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    officeLocation: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
departmentSchema.index({ municipalityId: 1, code: 1 }, { unique: true });

export default mongoose.model('Department', departmentSchema);
