import mongoose from 'mongoose';

const divisionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Division name is required'],
      unique: true,
      trim: true
    },
    marathiName: {
      type: String,
      trim: true,
      default: null
    },
    code: {
      type: String,
      required: [true, 'Division code is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    aliases: [{
      type: String,
      trim: true
    }],
    state: {
      type: String,
      trim: true,
      default: 'Maharashtra'
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

export default mongoose.model('Division', divisionSchema);
