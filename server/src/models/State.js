import mongoose from 'mongoose';

const stateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'State name is required'],
      trim: true,
      unique: true
    },
    type: {
      type: String,
      enum: ['STATE', 'UNION_TERRITORY'],
      required: [true, 'State type is required']
    },
    lgdCode: {
      type: String,
      trim: true,
      default: null
    },
    stateCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: null
    },
    aliases: [{
      type: String,
      trim: true
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    // Source Metadata for Master Data Provenance
    sourceAuthority: {
      type: String,
      trim: true,
      default: null
    },
    sourceDataset: {
      type: String,
      trim: true,
      default: null
    },
    sourceUrl: {
      type: String,
      trim: true,
      default: null
    },
    sourceVersion: {
      type: String,
      trim: true,
      default: null
    },
    sourceRetrievedAt: {
      type: Date,
      default: null
    },
    sourceCode: {
      type: String,
      trim: true,
      default: null
    }
  },
  {
    timestamps: true
  }
);

stateSchema.index({ lgdCode: 1 });

export default mongoose.model('State', stateSchema);
