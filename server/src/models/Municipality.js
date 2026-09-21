import mongoose from 'mongoose';

const municipalitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Municipality name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Municipality code is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    type: {
      type: String,
      enum: ['MUNICIPAL_COUNCIL', 'MUNICIPAL_CORPORATION', 'NAGAR_PANCHAYAT'],
      default: 'MUNICIPAL_COUNCIL'
    },
    district: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      default: 'India',
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    pincode: {
      type: String,
      trim: true
    },
    contactPhone: {
      type: String,
      trim: true
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    website: {
      type: String,
      trim: true
    },
    logo: {
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

export default mongoose.model('Municipality', municipalitySchema);
