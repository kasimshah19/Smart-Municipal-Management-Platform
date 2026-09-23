import mongoose from 'mongoose';

const panchayatSamitiSchema = new mongoose.Schema(
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
    zillaParishadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ZillaParishad',
      default: null
    },
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      default: null
    },
    districtName: {
      type: String,
      trim: true,
      default: null
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
    localBodyType: {
      type: String,
      default: 'PANCHAYAT_SAMITI',
      trim: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    }
  },
  {
    timestamps: true
  }
);

panchayatSamitiSchema.index({ districtId: 1 });
panchayatSamitiSchema.index({ talukaId: 1 });
panchayatSamitiSchema.index({ zillaParishadId: 1 });

export default mongoose.model('PanchayatSamiti', panchayatSamitiSchema);
