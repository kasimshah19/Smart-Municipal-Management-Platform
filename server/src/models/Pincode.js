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
  postalTalukaName: { 
    type: String,
    index: true
  },
  postalDistrictName: { 
    type: String,
    index: true
  },
  postalDivisionName: { 
    type: String 
  },
  stateName: { 
    type: String,
    required: true,
    index: true
  },
  latitude: {
    type: Number
  },
  longitude: {
    type: Number
  }
}, { timestamps: true });

// Compound indexes for common queries
pincodeSchema.index({ postalDistrictName: 1, postalTalukaName: 1 });
pincodeSchema.index({ pincode: 1, officeName: 1, officeType: 1 }, { unique: true });

const Pincode = mongoose.model('Pincode', pincodeSchema);

export default Pincode;
