import mongoose from 'mongoose';

const areaSchema = new mongoose.Schema(
  {
    municipalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Municipality',
      required: [true, 'Municipality ID is required']
    },
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward',
      required: [true, 'Ward ID is required']
    },
    name: {
      type: String,
      required: [true, 'Area name is required'],
      trim: true
    },
    code: {
      type: String,
      trim: true,
      uppercase: true
    },
    description: {
      type: String,
      trim: true
    },
    pincode: {
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
areaSchema.index({ municipalityId: 1, code: 1 }, { unique: true, partialFilterExpression: { code: { $type: 'string' } } });
areaSchema.index({ wardId: 1 });

export default mongoose.model('Area', areaSchema);
