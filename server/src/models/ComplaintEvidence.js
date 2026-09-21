import mongoose from 'mongoose';

const complaintEvidenceSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
    },
    uploadedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['COMPLAINT_PHOTO', 'BEFORE_WORK', 'AFTER_WORK', 'DOCUMENT', 'OTHER'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

complaintEvidenceSchema.index({ complaintId: 1, createdAt: -1 });

const ComplaintEvidence = mongoose.model('ComplaintEvidence', complaintEvidenceSchema);

export default ComplaintEvidence;
