import mongoose from 'mongoose';

const complaintAssignmentSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
    },
    assignedToEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    assignedToTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkerTeam',
    },
    assignedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    unassignedAt: {
      type: Date,
    },
    reason: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Require at least one assignee (Employee or Team)
complaintAssignmentSchema.pre('validate', function(next) {
  if (!this.assignedToEmployeeId && !this.assignedToTeamId) {
    this.invalidate('assignedToEmployeeId', 'Either employee or team must be assigned');
    this.invalidate('assignedToTeamId', 'Either employee or team must be assigned');
  }
  next();
});

complaintAssignmentSchema.index({ complaintId: 1 });
complaintAssignmentSchema.index({ assignedToEmployeeId: 1 });
complaintAssignmentSchema.index({ assignedToTeamId: 1 });
complaintAssignmentSchema.index({ isActive: 1 });
complaintAssignmentSchema.index({ complaintId: 1, isActive: 1 });

const ComplaintAssignment = mongoose.model('ComplaintAssignment', complaintAssignmentSchema);

export default ComplaintAssignment;
