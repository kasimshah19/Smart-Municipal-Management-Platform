import mongoose from 'mongoose';

const districtSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'District name is required'],
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
      required: [true, 'District code is required'],
      trim: true,
      uppercase: true
      // NOT unique — SN maps to Sindhudurg AND Sangli, DH maps to Dhule AND Dharashiv
    },
    divisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Division',
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
    lgdCode: {
      type: String,
      trim: true,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: null
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

// Non-unique index on code for lookups
districtSchema.index({ code: 1 });
districtSchema.index({ divisionId: 1 });
districtSchema.index({ stateId: 1, lgdCode: 1 });

export default mongoose.model('District', districtSchema);
