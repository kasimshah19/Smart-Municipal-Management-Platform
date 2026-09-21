import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true // A user can only be mapped to one active employee record
    },
    municipalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Municipality',
      required: [true, 'Municipality ID is required']
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department ID is required']
    },
    designationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Designation',
      required: [true, 'Designation ID is required']
    },
    employeeCode: {
      type: String,
      required: [true, 'Employee code is required'],
      trim: true,
      uppercase: true
    },
    employeeType: {
      type: String,
      enum: ['OFFICER', 'WORKER', 'STAFF'],
      default: 'STAFF'
    },
    joiningDate: {
      type: Date
    },
    reportingManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    phone: {
      type: String,
      trim: true
    },
    workEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    assignedWardIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward'
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
employeeSchema.index({ municipalityId: 1, employeeCode: 1 }, { unique: true });
employeeSchema.index({ departmentId: 1 });
employeeSchema.index({ designationId: 1 });
employeeSchema.index({ employeeType: 1 });
employeeSchema.index({ assignedWardIds: 1 });

export default mongoose.model('Employee', employeeSchema);
