import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    // IDENTITY
    complaintId: {
      type: String,
      required: true,
      unique: true,
    },
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // CLASSIFICATION
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ComplaintCategory',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },

    // LOCATION
    municipalityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Municipality',
      required: true,
    },
    zillaParishadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ZillaParishad',
    },
    panchayatSamitiId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PanchayatSamiti',
    },
    gramPanchayatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GramPanchayat',
    },
    wardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ward',
      required: true,
    },
    areaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Area',
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        trim: true,
      },
    },

    // ORGANIZATION
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },

    // PRIORITY
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },

    // STATUS
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'ACKNOWLEDGED',
        'UNDER_REVIEW',
        'VERIFIED',
        'ASSIGNED',
        'IN_PROGRESS',
        'COMPLETION_SUBMITTED',
        'RESOLVED',
        'REJECTED',
        'CLOSED',
        'REOPENED',
        'CANCELLED'
      ],
      default: 'SUBMITTED',
    },

    // ASSIGNMENT SUMMARY
    currentAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ComplaintAssignment',
    },

    // ADDITIONAL
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    slaDueAt: {
      type: Date,
    },
    acknowledgedAt: {
      type: Date,
    },
    assignedAt: {
      type: Date,
    },
    startedAt: {
      type: Date,
    },
    verifiedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
    reopenedAt: {
      type: Date,
    },
    reopenedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reopenReason: {
      type: String,
      trim: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Indexes
complaintSchema.index({ citizenId: 1, createdAt: -1 });
complaintSchema.index({ municipalityId: 1, createdAt: -1 });
complaintSchema.index({ municipalityId: 1, status: 1, createdAt: -1 });
complaintSchema.index({ municipalityId: 1, departmentId: 1, createdAt: -1 });
complaintSchema.index({ wardId: 1, createdAt: -1 });
complaintSchema.index({ areaId: 1 });
complaintSchema.index({ categoryId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ location: '2dsphere' });
complaintSchema.index({ currentAssignmentId: 1 });

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
