import mongoose from 'mongoose';

const pincodeSchema = new mongoose.Schema({
  pincode: { 
    type: String, 
    required: true,
    index: true
  },
  officeName: { 
    type: String,
    required: true
  },
  officeType: { 
    type: String 
  },
  deliveryStatus: { 
    type: String 
  },
  talukaName: { 
    type: String,
    index: true
  },
  districtName: { 
    type: String,
    index: true
  },
  divisionName: { 
    type: String 
  },
  stateName: { 
    type: String,
    required: true,
    index: true
  },
  latitude: {
    type: String
  },
  longitude: {
    type: String
  }
}, { timestamps: true });

// Compound indexes for common queries
pincodeSchema.index({ districtName: 1, talukaName: 1 });

const Pincode = mongoose.model('Pincode', pincodeSchema);

export default Pincode;
