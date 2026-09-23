import mongoose from 'mongoose';

const zillaParishadSchema = new mongoose.Schema(
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
    localBodyType: {
      type: String,
      default: 'ZILLA_PARISHAD',
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

zillaParishadSchema.index({ districtId: 1 });

export default mongoose.model('ZillaParishad', zillaParishadSchema);
