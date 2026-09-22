import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import ComplaintAssignment from '../models/ComplaintAssignment.js';
import ComplaintUpdate from '../models/ComplaintUpdate.js';
import ComplaintEvidence from '../models/ComplaintEvidence.js';
import Employee from '../models/Employee.js';
import WorkerTeam from '../models/WorkerTeam.js';
import ApiError from '../utils/ApiError.js';
import { ROLES } from '../constants/roles.js';

class FieldOperationsService {
  /**
   * Helper to check if a user is an officer (has assign/approve rights)
   */
  isOfficer(role) {
    return [
      ROLES.SUPER_ADMIN,
      ROLES.MUNICIPAL_ADMIN,
      ROLES.WARD_OFFICER,
      ROLES.DEPARTMENT_OFFICER,
    ].includes(role);
  }

  /**
   * Helper to validate if an officer can operate on a complaint based on scope
   */
  async validateOfficerScope(user, complaint) {
    if (user.role === ROLES.SUPER_ADMIN) return true;

    // Must belong to the same municipality
    if (user.municipalityId.toString() !== complaint.municipalityId.toString()) {
      throw new ApiError(403, 'Not authorized for this municipality');
    }

    if (user.role === ROLES.MUNICIPAL_ADMIN) return true;

    if (user.role === ROLES.DEPARTMENT_OFFICER) {
      if (user.departmentId?.toString() !== complaint.departmentId?.toString()) {
        throw new ApiError(403, 'Not authorized for this department');
      }
      return true;
    }

    if (user.role === ROLES.WARD_OFFICER) {
      // Assuming user.wardId exists for ward officer
      if (user.wardId?.toString() !== complaint.wardId.toString()) {
        throw new ApiError(403, 'Not authorized for this ward');
      }
      return true;
    }

    throw new ApiError(403, 'Not authorized');
  }

  /**
   * Helper to validate worker scope on an assignment
   */
  async validateWorkerScope(user, assignment) {
    if (!assignment) {
      throw new ApiError(404, 'No active assignment found');
    }

    // Is it assigned directly to this worker?
    if (assignment.assignedToEmployeeId) {
      const employee = await Employee.findOne({ userId: user.userId, _id: assignment.assignedToEmployeeId });
      if (employee) return true;
    }

    // Is it assigned to a team this worker is part of?
    if (assignment.assignedToTeamId) {
      const employee = await Employee.findOne({ userId: user.userId });
      if (employee) {
        const team = await WorkerTeam.findOne({
          _id: assignment.assignedToTeamId,
          'members.employeeId': employee._id,
        });
        if (team) return true;
      }
    }

    throw new ApiError(403, 'You are not assigned to this task');
  }

  /**
   * Assign a complaint to a worker or team
   */
  async assignTask(complaintId, assignData, user) {
    const { assignedToEmployeeId, assignedToTeamId, reason } = assignData;

    if (!this.isOfficer(user.role)) {
      throw new ApiError(403, 'Only authorized officers can assign tasks');
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw new ApiError(404, 'Complaint not found');

    if (['CLOSED', 'REJECTED', 'RESOLVED', 'CANCELLED'].includes(complaint.status)) {
      throw new ApiError(400, 'Cannot assign a closed, rejected, resolved, or cancelled complaint');
    }

    await this.validateOfficerScope(user, complaint);

    if (!assignedToEmployeeId && !assignedToTeamId) {
      throw new ApiError(400, 'Must provide either assignedToEmployeeId or assignedToTeamId');
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Inactivate any current active assignments
      await ComplaintAssignment.updateMany(
        { complaintId: complaint._id, isActive: true },
        { isActive: false, unassignedAt: new Date() },
        { session }
      );

      // Validate Employee/Team exists and is in the same municipality/department
      if (assignedToEmployeeId) {
        const employee = await Employee.findById(assignedToEmployeeId).session(session);
        if (!employee || !employee.isActive) throw new ApiError(400, 'Invalid or inactive employee');
        if (employee.municipalityId.toString() !== complaint.municipalityId.toString()) {
          throw new ApiError(400, 'Employee does not belong to this municipality');
        }
      }

      if (assignedToTeamId) {
        const team = await WorkerTeam.findById(assignedToTeamId).session(session);
        if (!team || !team.isActive) throw new ApiError(400, 'Invalid or inactive team');
        if (team.municipalityId.toString() !== complaint.municipalityId.toString()) {
          throw new ApiError(400, 'Team does not belong to this municipality');
        }
      }

      // Create new assignment
      const newAssignment = new ComplaintAssignment({
        complaintId: complaint._id,
        assignedToEmployeeId,
        assignedToTeamId,
        assignedByUserId: user.userId,
        departmentId: complaint.departmentId,
        reason,
        isActive: true,
      });

      await newAssignment.save({ session });

      // Update complaint
      const previousStatus = complaint.status;
      complaint.status = 'ASSIGNED';
      complaint.assignedAt = new Date();
      complaint.currentAssignmentId = newAssignment._id;
      await complaint.save({ session });

      // Create history record
      await ComplaintUpdate.create(
        [
          {
            complaintId: complaint._id,
            updatedByUserId: user.userId,
            previousStatus,
            newStatus: 'ASSIGNED',
            note: reason || 'Task assigned',
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return newAssignment;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Worker starts a task
   */
  async startWork(complaintId, user) {
    if (user.role !== ROLES.WORKER) throw new ApiError(403, 'Only workers can start work');

    const complaint = await Complaint.findById(complaintId).populate('currentAssignmentId');
    if (!complaint) throw new ApiError(404, 'Complaint not found');

    if (!['ASSIGNED', 'REOPENED'].includes(complaint.status)) {
      throw new ApiError(400, 'Complaint must be in ASSIGNED or REOPENED status to start work');
    }

    await this.validateWorkerScope(user, complaint.currentAssignmentId);

    const previousStatus = complaint.status;
    complaint.status = 'IN_PROGRESS';
    complaint.startedAt = new Date();
    await complaint.save();

    await ComplaintUpdate.create({
      complaintId: complaint._id,
      updatedByUserId: user.userId,
      previousStatus: previousStatus,
      newStatus: 'IN_PROGRESS',
      note: 'Work started',
    });

    return complaint;
  }

  /**
   * Upload Evidence
   */
  async addEvidence(complaintId, fileData, type, description, user) {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw new ApiError(404, 'Complaint not found');

    // Basic authorization check - can be improved based on roles
    // If worker, must be assigned
    if (user.role === ROLES.WORKER) {
       const assignment = await ComplaintAssignment.findOne({ complaintId, isActive: true });
       await this.validateWorkerScope(user, assignment);
    } else if (this.isOfficer(user.role)) {
       await this.validateOfficerScope(user, complaint);
    } else if (user.role === ROLES.CITIZEN) {
      if (complaint.citizenId.toString() !== user.userId.toString()) {
        throw new ApiError(403, 'Not authorized');
      }
    }

    const evidence = new ComplaintEvidence({
      complaintId,
      uploadedByUserId: user.userId,
      type,
      url: `/uploads/evidence/${fileData.filename}`, // Using local storage path convention from phase 4
      description,
    });

    await evidence.save();
    return evidence;
  }

  /**
   * Worker submits completion
   */
  async submitCompletion(complaintId, completionNote, user) {
    if (user.role !== ROLES.WORKER) throw new ApiError(403, 'Only workers can submit completion');

    const complaint = await Complaint.findById(complaintId).populate('currentAssignmentId');
    if (!complaint) throw new ApiError(404, 'Complaint not found');

    if (complaint.status !== 'IN_PROGRESS') {
      throw new ApiError(400, 'Complaint must be IN_PROGRESS to submit completion');
    }

    await this.validateWorkerScope(user, complaint.currentAssignmentId);

    complaint.status = 'COMPLETION_SUBMITTED';
    await complaint.save();

    await ComplaintUpdate.create({
      complaintId: complaint._id,
      updatedByUserId: user.userId,
      previousStatus: 'IN_PROGRESS',
      newStatus: 'COMPLETION_SUBMITTED',
      note: completionNote || 'Work completion submitted for review',
    });

    return complaint;
  }

  /**
   * Officer approves completion
   */
  async approveCompletion(complaintId, note, user) {
    if (!this.isOfficer(user.role)) throw new ApiError(403, 'Not authorized');

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw new ApiError(404, 'Complaint not found');

    await this.validateOfficerScope(user, complaint);

    if (complaint.status !== 'COMPLETION_SUBMITTED') {
      throw new ApiError(400, 'Complaint must be awaiting completion review');
    }

    complaint.status = 'RESOLVED';
    complaint.resolvedAt = new Date();
    await complaint.save();

    await ComplaintUpdate.create({
      complaintId: complaint._id,
      updatedByUserId: user.userId,
      previousStatus: 'COMPLETION_SUBMITTED',
      newStatus: 'RESOLVED',
      note: note || 'Completion verified and approved',
    });

    return complaint;
  }

  /**
   * Officer rejects completion
   */
  async rejectCompletion(complaintId, reason, user) {
    if (!this.isOfficer(user.role)) throw new ApiError(403, 'Not authorized');
    if (!reason) throw new ApiError(400, 'Rejection reason is required');

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) throw new ApiError(404, 'Complaint not found');

    await this.validateOfficerScope(user, complaint);

    if (complaint.status !== 'COMPLETION_SUBMITTED') {
      throw new ApiError(400, 'Complaint must be awaiting completion review');
    }

    complaint.status = 'IN_PROGRESS';
    await complaint.save();

    await ComplaintUpdate.create({
      complaintId: complaint._id,
      updatedByUserId: user.userId,
      previousStatus: 'COMPLETION_SUBMITTED',
      newStatus: 'IN_PROGRESS',
      note: `Completion rejected: ${reason}`,
    });

    return complaint;
  }

  /**
   * Get worker tasks
   */
  async getWorkerTasks(user, query = {}) {
    if (user.role !== ROLES.WORKER) throw new ApiError(403, 'Not authorized');

    const employee = await Employee.findOne({ userId: user.userId });
    if (!employee) throw new ApiError(404, 'Employee profile not found');

    const teams = await WorkerTeam.find({ 'members.employeeId': employee._id });
    const teamIds = teams.map((t) => t._id);

    // Find active assignments for this worker or their teams
    const assignments = await ComplaintAssignment.find({
      isActive: true,
      $or: [{ assignedToEmployeeId: employee._id }, { assignedToTeamId: { $in: teamIds } }],
    });

    const complaintIds = assignments.map((a) => a.complaintId);

    // Build filter
    const filter = { _id: { $in: complaintIds } };
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.wardId) filter.wardId = query.wardId;

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const complaints = await Complaint.find(filter)
      .populate('categoryId', 'name')
      .populate('wardId', 'name')
      .populate('areaId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Complaint.countDocuments(filter);

    return {
      complaints,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get worker stats
   */
  async getWorkerStats(user) {
    if (user.role !== ROLES.WORKER) throw new ApiError(403, 'Not authorized');

    const employee = await Employee.findOne({ userId: user.userId });
    if (!employee) throw new ApiError(404, 'Employee profile not found');

    const teams = await WorkerTeam.find({ 'members.employeeId': employee._id });
    const teamIds = teams.map((t) => t._id);

    const assignments = await ComplaintAssignment.find({
      isActive: true,
      $or: [{ assignedToEmployeeId: employee._id }, { assignedToTeamId: { $in: teamIds } }],
    });

    const complaintIds = assignments.map((a) => a.complaintId);

    const stats = await Complaint.aggregate([
      { $match: { _id: { $in: complaintIds } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      TOTAL_ACTIVE: 0,
      ASSIGNED: 0,
      IN_PROGRESS: 0,
      COMPLETION_SUBMITTED: 0,
    };

    stats.forEach((stat) => {
      if (['ASSIGNED', 'IN_PROGRESS', 'COMPLETION_SUBMITTED'].includes(stat._id)) {
        formattedStats[stat._id] = stat.count;
        formattedStats.TOTAL_ACTIVE += stat.count;
      }
    });

    return formattedStats;
  }
}

export default new FieldOperationsService();
