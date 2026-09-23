import mongoose from 'mongoose';

const talukaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Taluka name is required'],
      trim: true
    },
    marathiName: {
      type: String,
      trim: true,
      default: null
    },
    aliases: [{
      type: String,
      trim: true
    }],
    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: null
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      required: [true, 'District ID is required']
    },
    districtName: {
      type: String,
      required: [true, 'District Name is required'],
      trim: true
    },
    divisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Division',
      default: null
    },
    divisionName: {
      type: String,
      trim: true,
      default: null
    },
    lgdCode: {
      type: String,
      trim: true,
      default: null
    },
    state: {
      type: String,
      trim: true,
      default: 'Maharashtra'
    },
    stateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'State',
      default: null
    },
    type: {
      type: String,
      enum: ['TALUKA', 'TEHSIL', 'MANDAL', 'CIRCLE', 'SUB_DISTRICT'],
      default: 'TALUKA'
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

// Compound index to ensure uniqueness within a district
talukaSchema.index({ districtId: 1, name: 1 }, { unique: true });
talukaSchema.index({ divisionId: 1 });
talukaSchema.index({ districtId: 1 });

export default mongoose.model('Taluka', talukaSchema);
