import mongoose from 'mongoose';

const villageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Village name is required'],
      trim: true
    },
    localName: {
      type: String,
      trim: true,
      default: null
    },
    lgdCode: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['Rural', 'Urban', null],
      default: 'Rural'
    },
    status: {
      type: String,
      enum: ['Inhabitant', 'Uninhabited', null],
      default: 'Inhabitant'
    },
    subDistrictId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taluka',
      default: null
    },
    subDistrictName: {
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
    stateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'State',
      default: null
    },
    stateName: {
      type: String,
      trim: true,
      default: null
    },
    censusCode2011: {
      type: String,
      trim: true,
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

// Indexes for fast lookups
villageSchema.index({ lgdCode: 1 }, { unique: true });
villageSchema.index({ subDistrictId: 1 });
villageSchema.index({ districtId: 1 });
villageSchema.index({ stateId: 1 });
villageSchema.index({ name: 1, districtId: 1 });

export default mongoose.model('Village', villageSchema);
