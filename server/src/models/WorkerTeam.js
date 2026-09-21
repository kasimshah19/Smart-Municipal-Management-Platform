import mongoose from 'mongoose';

const workerTeamSchema = new mongoose.Schema(
  {
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
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true
    },
    code: {
      type: String,
      required: [true, 'Team code is required'],
      trim: true,
      uppercase: true
    },
    description: {
      type: String,
      trim: true
    },
    teamLeaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    memberIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    }],
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
workerTeamSchema.index({ municipalityId: 1, code: 1 }, { unique: true });
workerTeamSchema.index({ departmentId: 1 });
workerTeamSchema.index({ memberIds: 1 });
workerTeamSchema.index({ assignedWardIds: 1 });

export default mongoose.model('WorkerTeam', workerTeamSchema);
