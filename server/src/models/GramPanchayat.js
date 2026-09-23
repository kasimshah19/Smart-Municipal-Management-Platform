import mongoose from 'mongoose';

const gramPanchayatSchema = new mongoose.Schema(
  {
    lgdCode: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    marathiName: {
      type: String,
      trim: true,
      default: null
    },
    localBodyType: {
      type: String,
      default: 'GRAM_PANCHAYAT',
      trim: true
    },
    category: {
      type: String,
      default: 'RURAL',
      trim: true
    },
    talukaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taluka',
      default: null
    },
    talukaName: {
      type: String,
      trim: true,
      default: null
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      default: null
    },
    districtName: {
      type: String,
      required: true,
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
    parentLocalBodyCode: {
      type: String,
      trim: true,
      default: null
    },
    developmentBlockId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    developmentBlockName: {
      type: String,
      trim: true,
      default: null
    },
    developmentBlockLgdCode: {
      type: String,
      trim: true,
      default: null
    },
    state: {
      type: String,
      default: 'Maharashtra',
      trim: true
    },
    stateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'State',
      default: null
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    },
    source: {
      type: String,
      default: 'LGD'
    },
    sourceFile: {
      type: String,
      default: null
    },
    sourceVerified: {
      type: Boolean,
      default: true
    },
    sourceDownloadedAt: {
      type: Date,
      default: null
    },
    aliases: [{
      type: String,
      trim: true
    }]
  },
  {
    timestamps: true
  }
);

// Indexes for faster querying
gramPanchayatSchema.index({ districtId: 1, talukaId: 1, name: 1 });
gramPanchayatSchema.index({ talukaId: 1 });
gramPanchayatSchema.index({ districtId: 1 });
gramPanchayatSchema.index({ developmentBlockLgdCode: 1 });

export default mongoose.model('GramPanchayat', gramPanchayatSchema);

