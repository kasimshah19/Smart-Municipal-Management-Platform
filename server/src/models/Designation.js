import mongoose from 'mongoose';

const designationSchema = new mongoose.Schema(
  {
    municipalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Municipality',
      required: [true, 'Municipality ID is required']
    },
    name: {
      type: String,
      required: [true, 'Designation name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Designation code is required'],
      trim: true,
      uppercase: true
    },
    level: {
      type: String,
      enum: ['EXECUTIVE', 'OFFICER', 'SUPERVISOR', 'STAFF', 'WORKER'],
      default: 'STAFF'
    },
    description: {
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
designationSchema.index({ municipalityId: 1, code: 1 }, { unique: true });

export default mongoose.model('Designation', designationSchema);
