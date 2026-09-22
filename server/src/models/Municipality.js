import mongoose from 'mongoose';
import { LOCAL_BODY_TYPES } from '../constants/localBodyTypes.js';
import { MAHARASHTRA_DISTRICTS } from '../constants/maharashtraDistricts.js';

const municipalitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Municipality name is required'],
      trim: true
    },
    marathiName: {
      type: String,
      trim: true,
      default: null
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
      enum: Object.keys(LOCAL_BODY_TYPES),
      default: LOCAL_BODY_TYPES.MUNICIPAL_COUNCIL.value
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
      enum: {
        values: MAHARASHTRA_DISTRICTS,
        message: '{VALUE} is not a valid Maharashtra district'
      }
    },
    talukaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taluka',
      default: null
    },
    aliases: [{
      type: String,
      trim: true
    }],
    coveredDistricts: [{
      type: String,
      trim: true
    }],
    // Optional classification for Municipal Councils (A/B/C)
    classification: {
      type: String,
      enum: ['A', 'B', 'C', null],
      default: null
    },
    // URBAN or RURAL
    jurisdictionCategory: {
      type: String,
      enum: ['URBAN', 'RURAL', null],
      default: null
    },
    lgdCode: {
      type: String,
      trim: true,
      default: null
    },
    source: {
      type: String,
      trim: true,
      default: null
    },
    sourceVerified: {
      type: Boolean,
      default: false
    },
    sourceVerifiedAt: {
      type: Date,
      default: null
    },
    state: {
      type: String,
      trim: true,
      default: 'Maharashtra'
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

municipalitySchema.index({ name: 1, district: 1, type: 1 }, { unique: true });
municipalitySchema.index({ talukaId: 1 });
municipalitySchema.index({ district: 1 });
municipalitySchema.index({ type: 1 });

export default mongoose.model('Municipality', municipalitySchema);
