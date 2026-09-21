import mongoose from 'mongoose';

const complaintUpdateSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
    },
    updatedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    previousStatus: {
      type: String,
      enum: [
        'SUBMITTED',
        'UNDER_REVIEW',
        'VERIFIED',
        'ASSIGNED',
        'IN_PROGRESS',
        'COMPLETION_SUBMITTED',
        'RESOLVED',
        'REJECTED',
        'CLOSED',
      ],
    },
    newStatus: {
      type: String,
      enum: [
        'SUBMITTED',
        'UNDER_REVIEW',
        'VERIFIED',
        'ASSIGNED',
        'IN_PROGRESS',
        'COMPLETION_SUBMITTED',
        'RESOLVED',
        'REJECTED',
        'CLOSED',
      ],
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

complaintUpdateSchema.index({ complaintId: 1, createdAt: -1 });

const ComplaintUpdate = mongoose.model('ComplaintUpdate', complaintUpdateSchema);

export default ComplaintUpdate;
