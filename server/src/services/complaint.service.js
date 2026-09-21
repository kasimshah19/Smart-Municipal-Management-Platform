import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import ComplaintCategory from '../models/ComplaintCategory.js';
import ComplaintAssignment from '../models/ComplaintAssignment.js';
import ComplaintUpdate from '../models/ComplaintUpdate.js';
import ComplaintEvidence from '../models/ComplaintEvidence.js';
import ComplaintComment from '../models/ComplaintComment.js';
import Ward from '../models/Ward.js';
import Area from '../models/Area.js';

class ComplaintService {
  /**
   * Generate a unique human-readable Complaint ID
   */
  async _generateComplaintId(municipalityCode) {
    const prefix = municipalityCode ? municipalityCode.substring(0, 3).toUpperCase() : 'COM';
    const year = new Date().getFullYear();
    
    const latestComplaint = await Complaint.findOne(
      { complaintId: new RegExp(`^${prefix}-${year}-`) },
      { complaintId: 1 }
    ).sort({ createdAt: -1 });

    let nextSequence = 1;
    if (latestComplaint && latestComplaint.complaintId) {
      const parts = latestComplaint.complaintId.split('-');
      if (parts.length === 3) {
        nextSequence = parseInt(parts[2], 10) + 1;
      }
    }

    const sequenceStr = nextSequence.toString().padStart(6, '0');
    return `${prefix}-${year}-${sequenceStr}`;
  }

  /**
   * Submit a new complaint
   */
  async submitComplaint(data, citizenId, municipalityCode) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Verify Category & Department routing
      const category = await ComplaintCategory.findOne({ 
        _id: data.categoryId,
        isActive: true 
      });
      if (!category) throw new Error('Invalid or inactive complaint category');

      // 2. Validate location hierarchy
      const ward = await Ward.findOne({ _id: data.wardId, municipalityId: data.municipalityId });
      if (!ward) throw new Error('Ward does not belong to the selected municipality');

      const area = await Area.findOne({ _id: data.areaId, wardId: data.wardId });
      if (!area) throw new Error('Area does not belong to the selected ward');

      // 3. Generate ID
      const complaintId = await this._generateComplaintId(municipalityCode || 'MUC');

      // 4. Construct
      const newComplaint = new Complaint({
        complaintId,
        citizenId,
        categoryId: category._id,
        title: data.title,
        description: data.description,
        municipalityId: data.municipalityId,
        wardId: data.wardId,
        areaId: data.areaId,
        location: data.location, // GeoJSON
        departmentId: category.departmentId, // Derived from Category routing
        priority: category.defaultPriority || 'MEDIUM',
        status: 'SUBMITTED',
        isAnonymous: data.isAnonymous || false,
      });

      await newComplaint.save({ session });

      // 5. Initial History Log
      const updateLog = new ComplaintUpdate({
        complaintId: newComplaint._id,
        updatedByUserId: citizenId,
        newStatus: 'SUBMITTED',
        note: 'Complaint submitted by citizen.',
      });

      await updateLog.save({ session });

      await session.commitTransaction();
      return newComplaint;

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get Complaints with Pagination & Filtering
   */
  async getComplaints(filter = {}, options = { page: 1, limit: 20 }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    // Safety limit
    const safeLimit = Math.min(limit, 100);

    const [results, total] = await Promise.all([
      Complaint.find(filter)
        .populate('categoryId', 'name code')
        .populate('departmentId', 'name')
        .populate('wardId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Complaint.countDocuments(filter)
    ]);

    return {
      results,
      pagination: {
        total,
        page,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit)
      }
    };
  }

  /**
   * Get Complaint By ID
   */
  async getComplaintById(id, filter = {}) {
    const query = { _id: id, ...filter };
    
    const complaint = await Complaint.findOne(query)
      .populate('categoryId', 'name code icon')
      .populate('departmentId', 'name')
      .populate('wardId', 'name')
      .populate('areaId', 'name')
      .populate('currentAssignmentId')
      .lean();

    if (!complaint) throw new Error('Complaint not found or access denied');
    return complaint;
  }

  /**
   * Change Complaint Status (Workflow Engine)
   */
  async changeStatus(complaintId, updatedByUserId, newStatus, filter, options = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const complaint = await Complaint.findOne({ _id: complaintId, ...filter }).session(session);
      if (!complaint) throw new Error('Complaint not found or access denied');

      const previousStatus = complaint.status;

      // Status State Machine Logic
      const validTransitions = {
        'SUBMITTED': ['UNDER_REVIEW'],
        'UNDER_REVIEW': ['VERIFIED', 'REJECTED'],
        'VERIFIED': ['ASSIGNED'],
        'ASSIGNED': ['IN_PROGRESS'],
        'IN_PROGRESS': ['RESOLVED'],
        'RESOLVED': ['CLOSED'],
      };

      // Super Admins/Municipal Admins can technically bypass some linear flow for corrections, 
      // but we strongly encourage linear flow.
      // For now, enforce strict transitions unless bypass is provided.
      const bypassTransitions = options.bypassTransitions || false;
      
      if (!bypassTransitions) {
        if (!validTransitions[previousStatus] || !validTransitions[previousStatus].includes(newStatus)) {
            throw new Error(`Invalid status transition from ${previousStatus} to ${newStatus}`);
        }
      }

      if (newStatus === 'REJECTED' && !options.rejectionReason) {
        throw new Error('Rejection reason is required');
      }

      // Update Dates
      if (newStatus === 'VERIFIED') complaint.verifiedAt = Date.now();
      if (newStatus === 'RESOLVED') complaint.resolvedAt = Date.now();
      if (newStatus === 'CLOSED') complaint.closedAt = Date.now();
      if (newStatus === 'REJECTED') complaint.rejectionReason = options.rejectionReason;

      complaint.status = newStatus;
      await complaint.save({ session });

      // Save History
      const updateLog = new ComplaintUpdate({
        complaintId: complaint._id,
        updatedByUserId,
        previousStatus,
        newStatus,
        note: options.note || `Status updated to ${newStatus}`,
      });
      await updateLog.save({ session });

      await session.commitTransaction();
      return complaint;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Assign Complaint
   */
  async assignComplaint(complaintId, assignedByUserId, assignmentData, filter) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const complaint = await Complaint.findOne({ _id: complaintId, ...filter }).session(session);
      if (!complaint) throw new Error('Complaint not found or access denied');

      if (!assignmentData.assignedToEmployeeId && !assignmentData.assignedToTeamId) {
        throw new Error('Must provide employee ID or team ID to assign');
      }

      // If an assignment exists, mark it inactive
      if (complaint.currentAssignmentId) {
        await ComplaintAssignment.updateOne(
          { _id: complaint.currentAssignmentId },
          { $set: { isActive: false, unassignedAt: Date.now() } }
        ).session(session);
      }

      // Create new assignment
      const newAssignment = new ComplaintAssignment({
        complaintId,
        assignedByUserId,
        departmentId: complaint.departmentId,
        assignedToEmployeeId: assignmentData.assignedToEmployeeId,
        assignedToTeamId: assignmentData.assignedToTeamId,
        reason: assignmentData.reason,
      });

      await newAssignment.save({ session });

      complaint.currentAssignmentId = newAssignment._id;
      
      // Auto-transition to ASSIGNED if previously VERIFIED
      if (complaint.status === 'VERIFIED') {
        const updateLog = new ComplaintUpdate({
          complaintId,
          updatedByUserId: assignedByUserId,
          previousStatus: complaint.status,
          newStatus: 'ASSIGNED',
          note: 'Complaint assigned to worker/team',
        });
        await updateLog.save({ session });
        complaint.status = 'ASSIGNED';
      }

      await complaint.save({ session });

      await session.commitTransaction();
      return complaint;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Add Comment
   */
  async addComment(complaintId, userId, message, isInternal = false) {
    const comment = new ComplaintComment({
      complaintId,
      userId,
      message,
      isInternal,
    });
    return await comment.save();
  }

  /**
   * Get Comments
   */
  async getComments(complaintId, includeInternal = false) {
    const filter = { complaintId };
    if (!includeInternal) {
      filter.isInternal = false;
    }

    return await ComplaintComment.find(filter)
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: 1 });
  }

  /**
   * Get History
   */
  async getHistory(complaintId) {
    return await ComplaintUpdate.find({ complaintId })
      .populate('updatedByUserId', 'firstName lastName')
      .sort({ createdAt: 1 });
  }
}

export default new ComplaintService();
