import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for a profile'],
      unique: true,
      index: true,
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
    },
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    pincode: {
      type: String,
    },
    emergencyContactName: {
      type: String,
    },
    emergencyContactPhone: {
      type: String,
    },
    // Future expansion fields for municipal structure
    municipalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Municipality',
      index: true,
    },
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward',
      index: true,
    },
    areaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Area',
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      index: true,
    },
    // Future expansion fields for municipal employees
    employeeId: {
      type: String, // String representation for employee IDs like "EMP-12345"
    },
    designation: {
      type: String,
    },
    joiningDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Profile = mongoose.model('Profile', profileSchema);
export { Profile };
export default Profile;
