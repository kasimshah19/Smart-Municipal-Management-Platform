import mongoose from 'mongoose';

const complaintCommentSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    isInternal: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

complaintCommentSchema.index({ complaintId: 1, createdAt: 1 });

const ComplaintComment = mongoose.model('ComplaintComment', complaintCommentSchema);

export default ComplaintComment;
