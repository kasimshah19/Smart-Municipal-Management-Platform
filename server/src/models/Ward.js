import mongoose from 'mongoose';

const wardSchema = new mongoose.Schema(
  {
    municipalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Municipality',
      required: [true, 'Municipality ID is required']
    },
    wardNumber: {
      type: String,
      required: [true, 'Ward number is required'],
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Ward name is required'],
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
    boundaries: {
      type: mongoose.Schema.Types.Mixed, // Flexible for now, can support GeoJSON later
    },
    population: {
      type: Number,
      default: 0
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
wardSchema.index({ municipalityId: 1, wardNumber: 1 }, { unique: true });
wardSchema.index({ municipalityId: 1, code: 1 }, { unique: true, partialFilterExpression: { code: { $type: 'string' } } });

export default mongoose.model('Ward', wardSchema);
