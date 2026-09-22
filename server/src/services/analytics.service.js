import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import Department from '../models/Department.js';
import Ward from '../models/Ward.js';
import Employee from '../models/Employee.js';
import ComplaintAssignment from '../models/ComplaintAssignment.js';
import WorkerTeam from '../models/WorkerTeam.js';
import ApiError from '../utils/ApiError.js';
import { ROLES } from '../constants/roles.js';

class AnalyticsService {
  /**
   * Builds the base scope filter based on the authenticated user's role and requested filters.
   * Ensures users cannot bypass their geographic or administrative scope.
   */
  async _buildScopeFilter(user, queryParams = {}) {
    const filter = {};

    // 1. Mandatory Scope Enforcement
    if (user.role === ROLES.CITIZEN) {
      filter.citizenId = new mongoose.Types.ObjectId(user._id);
    } else if (user.role === ROLES.MUNICIPAL_ADMIN) {
      filter.municipalityId = new mongoose.Types.ObjectId(user.municipalityId);
    } else if (user.role === ROLES.DEPARTMENT_OFFICER) {
      filter.municipalityId = new mongoose.Types.ObjectId(user.municipalityId);
      filter.departmentId = new mongoose.Types.ObjectId(user.departmentId);
    } else if (user.role === ROLES.WARD_OFFICER) {
      filter.municipalityId = new mongoose.Types.ObjectId(user.municipalityId);
      if (user.wardId) {
        filter.wardId = new mongoose.Types.ObjectId(user.wardId);
      }
    } else if (user.role === ROLES.WORKER) {
      // Workers only see their assigned complaints. 
      // We will look up their assignments and filter by those IDs.
      const employee = await Employee.findOne({ userId: user._id });
      if (employee) {
        const teams = await WorkerTeam.find({ 'members.employeeId': employee._id });
        const teamIds = teams.map(t => t._id);
        const assignments = await ComplaintAssignment.find({
          isActive: true,
          $or: [{ assignedToEmployeeId: employee._id }, { assignedToTeamId: { $in: teamIds } }],
        });
        const assignedComplaintIds = assignments.map(a => a.complaintId);
        filter._id = { $in: assignedComplaintIds };
      } else {
        filter._id = { $in: [] }; // No employee profile found, yield empty results
      }
    } else if (user.role === ROLES.SUPER_ADMIN) {
      // Super admin can see all, but can filter down
      if (queryParams.municipalityId) {
        filter.municipalityId = new mongoose.Types.ObjectId(queryParams.municipalityId);
      }
    }

    // 2. Refine with user-provided query parameters (only if they don't violate mandatory scope)
    if (queryParams.wardId && !filter.wardId) {
      filter.wardId = new mongoose.Types.ObjectId(queryParams.wardId);
    }
    if (queryParams.departmentId && !filter.departmentId) {
      filter.departmentId = new mongoose.Types.ObjectId(queryParams.departmentId);
    }
    if (queryParams.categoryId) {
      filter.categoryId = new mongoose.Types.ObjectId(queryParams.categoryId);
    }
    if (queryParams.status) {
      filter.status = queryParams.status;
    }
    if (queryParams.priority) {
      filter.priority = queryParams.priority;
    }

    // Date Range Filtering
    if (queryParams.startDate || queryParams.endDate) {
      filter.createdAt = {};
      if (queryParams.startDate) {
        filter.createdAt.$gte = new Date(queryParams.startDate);
      }
      if (queryParams.endDate) {
        filter.createdAt.$lte = new Date(queryParams.endDate);
      }
    }

    return filter;
  }

  /**
   * Common aggregate function to calculate KPIs (Total, Active, Resolved, Overdue, SLA Compliance)
   */
  async getOverview(user, queryParams) {
    const filter = await this._buildScopeFilter(user, queryParams);

    const now = new Date();
    
    // Using aggregation to efficiently count in one pass
    const result = await Complaint.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          submitted: {
            $sum: { $cond: [{ $eq: ["$status", "SUBMITTED"] }, 1, 0] }
          },
          active: {
            $sum: { $cond: [{ $in: ["$status", ["SUBMITTED", "ACKNOWLEDGED", "UNDER_REVIEW", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "REOPENED", "COMPLETION_SUBMITTED"]] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $in: ["$status", ["RESOLVED", "CLOSED"]] }, 1, 0] }
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $not: { $in: ["$status", ["RESOLVED", "CLOSED", "REJECTED", "CANCELLED"]] } },
                    { $lt: ["$slaDueAt", now] },
                    { $ne: ["$slaDueAt", null] }
                  ]
                },
                1, 0
              ]
            }
          },
        }
      }
    ]);

    if (result.length === 0) {
      return { total: 0, submitted: 0, active: 0, resolved: 0, overdue: 0, slaCompliancePercent: 100 };
    }

    const { total, submitted, active, resolved, overdue } = result[0];
    
    // SLA Compliance: (Total - Overdue) / Total * 100
    // But this depends on definition. A simple definition is: 
    // What % of active complaints are NOT overdue, or what % of all complaints met SLA.
    // Let's use (Total - Overdue) / Total * 100 for now.
    const slaCompliancePercent = total > 0 ? ((total - overdue) / total) * 100 : 100;

    return { total, submitted, active, resolved, overdue, slaCompliancePercent: parseFloat(slaCompliancePercent.toFixed(2)) };
  }

  /**
   * Status Distribution
   */
  async getStatusDistribution(user, queryParams) {
    const filter = await this._buildScopeFilter(user, queryParams);
    const result = await Complaint.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    const distribution = {
      SUBMITTED: 0, ACKNOWLEDGED: 0, UNDER_REVIEW: 0, VERIFIED: 0, ASSIGNED: 0,
      IN_PROGRESS: 0, COMPLETION_SUBMITTED: 0, RESOLVED: 0, CLOSED: 0, REOPENED: 0,
      REJECTED: 0, CANCELLED: 0
    };
    
    result.forEach(item => {
      if (distribution[item._id] !== undefined) {
        distribution[item._id] = item.count;
      }
    });

    return distribution;
  }

  /**
   * Priority Distribution
   */
  async getPriorityDistribution(user, queryParams) {
    const filter = await this._buildScopeFilter(user, queryParams);
    const result = await Complaint.aggregate([
      { $match: filter },
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);

    const distribution = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    result.forEach(item => {
      if (distribution[item._id] !== undefined) {
        distribution[item._id] = item.count;
      }
    });

    return distribution;
  }

  /**
   * Trend Data (Daily)
   */
  async getTrends(user, queryParams) {
    const filter = await this._buildScopeFilter(user, queryParams);
    
    // Default to last 30 days if no date range is provided
    if (!filter.createdAt) {
      filter.createdAt = {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      };
    }

    const result = await Complaint.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          submitted: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $in: ["$status", ["RESOLVED", "CLOSED"]] }, 1, 0] }
          },
          reopened: {
            $sum: { $cond: [{ $eq: ["$status", "REOPENED"] }, 1, 0] }
          }
        }
      },
      { $sort: { "_id": 1 } } // Sort chronologically
    ]);

    return result.map(item => ({
      date: item._id,
      submitted: item.submitted,
      resolved: item.resolved,
      reopened: item.reopened
    }));
  }

  /**
   * Category Analytics
   */
  async getCategoryAnalytics(user, queryParams) {
    const filter = await this._buildScopeFilter(user, queryParams);
    const now = new Date();
    
    const result = await Complaint.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$categoryId",
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $in: ["$status", ["SUBMITTED", "ACKNOWLEDGED", "UNDER_REVIEW", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "REOPENED", "COMPLETION_SUBMITTED"]] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $in: ["$status", ["RESOLVED", "CLOSED"]] }, 1, 0] }
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $not: { $in: ["$status", ["RESOLVED", "CLOSED", "REJECTED", "CANCELLED"]] } },
                    { $lt: ["$slaDueAt", now] },
                    { $ne: ["$slaDueAt", null] }
                  ]
                },
                1, 0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "complaintcategories",
          localField: "_id",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      {
        $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          _id: 1,
          name: { $ifNull: ["$categoryDetails.name", "Unknown Category"] },
          total: 1,
          active: 1,
          resolved: 1,
          overdue: 1
        }
      },
      { $sort: { total: -1 } }
    ]);
    return result;
  }

  /**
   * Department Workload
   */
  async getDepartmentWorkload(user, queryParams) {
    const filter = await this._buildScopeFilter(user, queryParams);
    const now = new Date();

    const result = await Complaint.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$departmentId",
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $in: ["$status", ["SUBMITTED", "ACKNOWLEDGED", "UNDER_REVIEW", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "REOPENED", "COMPLETION_SUBMITTED"]] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $in: ["$status", ["RESOLVED", "CLOSED"]] }, 1, 0] }
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $not: { $in: ["$status", ["RESOLVED", "CLOSED", "REJECTED", "CANCELLED"]] } },
                    { $lt: ["$slaDueAt", now] },
                    { $ne: ["$slaDueAt", null] }
                  ]
                },
                1, 0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "departmentDetails"
        }
      },
      {
        $unwind: { path: "$departmentDetails", preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          _id: 1,
          name: { $ifNull: ["$departmentDetails.name", "Unassigned Department"] },
          total: 1,
          active: 1,
          resolved: 1,
          overdue: 1
        }
      },
      { $sort: { total: -1 } }
    ]);
    return result;
  }

  /**
   * Ward Workload
   */
  async getWardWorkload(user, queryParams) {
    const filter = await this._buildScopeFilter(user, queryParams);
    const now = new Date();

    const result = await Complaint.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$wardId",
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $in: ["$status", ["SUBMITTED", "ACKNOWLEDGED", "UNDER_REVIEW", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "REOPENED", "COMPLETION_SUBMITTED"]] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $in: ["$status", ["RESOLVED", "CLOSED"]] }, 1, 0] }
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $not: { $in: ["$status", ["RESOLVED", "CLOSED", "REJECTED", "CANCELLED"]] } },
                    { $lt: ["$slaDueAt", now] },
                    { $ne: ["$slaDueAt", null] }
                  ]
                },
                1, 0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "wards",
          localField: "_id",
          foreignField: "_id",
          as: "wardDetails"
        }
      },
      {
        $unwind: { path: "$wardDetails", preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          _id: 1,
          wardNumber: { $ifNull: ["$wardDetails.wardNumber", "N/A"] },
          name: { $ifNull: ["$wardDetails.name", "Unassigned Ward"] },
          total: 1,
          active: 1,
          resolved: 1,
          overdue: 1
        }
      },
      { $sort: { total: -1 } }
    ]);
    return result;
  }

  /**
   * SLA Analytics
   */
  async getSLAAnalytics(user, queryParams) {
    const filter = await this._buildScopeFilter(user, queryParams);
    const now = new Date();

    const result = await Complaint.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalEligible: {
            $sum: { $cond: [{ $ne: ["$slaDueAt", null] }, 1, 0] }
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $not: { $in: ["$status", ["RESOLVED", "CLOSED", "REJECTED", "CANCELLED"]] } },
                    { $lt: ["$slaDueAt", now] },
                    { $ne: ["$slaDueAt", null] }
                  ]
                },
                1, 0
              ]
            }
          },
          resolvedWithinSla: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ["$status", ["RESOLVED", "CLOSED"]] },
                    { $lte: ["$resolvedAt", "$slaDueAt"] },
                    { $ne: ["$slaDueAt", null] }
                  ]
                },
                1, 0
              ]
            }
          },
          // Calculate resolution duration for resolved complaints
          totalResolutionDurationMs: {
            $sum: {
              $cond: [
                { $and: [{ $in: ["$status", ["RESOLVED", "CLOSED"]] }, { $ne: ["$resolvedAt", null] }] },
                { $subtract: ["$resolvedAt", "$createdAt"] },
                0
              ]
            }
          },
          resolvedCount: {
            $sum: { $cond: [{ $in: ["$status", ["RESOLVED", "CLOSED"]] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalEligible: 1,
          overdue: 1,
          resolvedWithinSla: 1,
          avgResolutionTimeHours: {
            $cond: [
              { $gt: ["$resolvedCount", 0] },
              { $divide: ["$totalResolutionDurationMs", { $multiply: ["$resolvedCount", 3600000] }] },
              0
            ]
          }
        }
      }
    ]);

    if (result.length === 0) {
      return { totalEligible: 0, overdue: 0, resolvedWithinSla: 0, compliancePercent: 100, avgResolutionTimeHours: 0 };
    }

    const data = result[0];
    const compliancePercent = data.totalEligible > 0 ? ((data.totalEligible - data.overdue) / data.totalEligible) * 100 : 100;
    
    return {
      ...data,
      compliancePercent: parseFloat(compliancePercent.toFixed(2)),
      avgResolutionTimeHours: parseFloat(data.avgResolutionTimeHours.toFixed(2))
    };
  }

  /**
   * Worker / Team Workload
   */
  async getWorkerWorkload(user, queryParams) {
    const filter = await this._buildScopeFilter(user, queryParams);
    const now = new Date();

    const result = await Complaint.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "complaintassignments",
          localField: "_id",
          foreignField: "complaintId",
          as: "assignment"
        }
      },
      { $unwind: { path: "$assignment", preserveNullAndEmptyArrays: false } },
      { $match: { "assignment.isActive": true } },
      {
        $group: {
          _id: {
            employee: "$assignment.assignedToEmployeeId",
            team: "$assignment.assignedToTeamId"
          },
          assigned: { $sum: 1 },
          inProgress: { $sum: { $cond: [{ $eq: ["$status", "IN_PROGRESS"] }, 1, 0] } },
          completionSubmitted: { $sum: { $cond: [{ $eq: ["$status", "COMPLETION_SUBMITTED"] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $in: ["$status", ["RESOLVED", "CLOSED"]] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $not: { $in: ["$status", ["RESOLVED", "CLOSED", "REJECTED", "CANCELLED"]] } },
                    { $lt: ["$slaDueAt", now] },
                    { $ne: ["$slaDueAt", null] }
                  ]
                },
                1, 0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "employees",
          localField: "_id.employee",
          foreignField: "_id",
          as: "employeeDetails"
        }
      },
      {
        $lookup: {
          from: "workerteams",
          localField: "_id.team",
          foreignField: "_id",
          as: "teamDetails"
        }
      },
      {
        $project: {
          _id: 0,
          entityId: { $ifNull: ["$_id.employee", "$_id.team"] },
          type: { $cond: [{ $ifNull: ["$_id.employee", false] }, "EMPLOYEE", "TEAM"] },
          name: {
            $cond: [
              { $ifNull: ["$_id.employee", false] },
              { $concat: [{ $arrayElemAt: ["$employeeDetails.firstName", 0] }, " ", { $arrayElemAt: ["$employeeDetails.lastName", 0] }] },
              { $arrayElemAt: ["$teamDetails.name", 0] }
            ]
          },
          assigned: 1,
          inProgress: 1,
          completionSubmitted: 1,
          resolved: 1,
          overdue: 1
        }
      },
      { $sort: { assigned: -1 } }
    ]);
    return result;
  }

  /**
   * Municipality Analytics
   */
  async getMunicipalityAnalytics(user, queryParams) {
    if (user.role !== ROLES.SUPER_ADMIN) {
      throw new ApiError(403, 'Only SUPER_ADMIN can access aggregate municipality analytics');
    }
    const filter = await this._buildScopeFilter(user, queryParams);
    const now = new Date();

    const result = await Complaint.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$municipalityId",
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $in: ["$status", ["SUBMITTED", "ACKNOWLEDGED", "UNDER_REVIEW", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "REOPENED", "COMPLETION_SUBMITTED"]] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $in: ["$status", ["RESOLVED", "CLOSED"]] }, 1, 0] }
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $not: { $in: ["$status", ["RESOLVED", "CLOSED", "REJECTED", "CANCELLED"]] } },
                    { $lt: ["$slaDueAt", now] },
                    { $ne: ["$slaDueAt", null] }
                  ]
                },
                1, 0
              ]
            }
          },
          reopened: {
            $sum: { $cond: [{ $eq: ["$status", "REOPENED"] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: "municipalities",
          localField: "_id",
          foreignField: "_id",
          as: "municipalityDetails"
        }
      },
      { $unwind: { path: "$municipalityDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: { $ifNull: ["$municipalityDetails.name", "Unknown Municipality"] },
          district: "$municipalityDetails.district",
          total: 1,
          active: 1,
          resolved: 1,
          overdue: 1,
          reopened: 1,
          slaCompliance: {
            $cond: [
              { $gt: ["$total", 0] },
              { $multiply: [{ $divide: [{ $subtract: ["$total", "$overdue"] }, "$total"] }, 100] },
              100
            ]
          }
        }
      },
      { $sort: { total: -1 } }
    ]);
    return result;
  }

  /**
   * District Analytics
   */
  async getDistrictAnalytics(user, queryParams) {
    if (user.role !== ROLES.SUPER_ADMIN) {
      throw new ApiError(403, 'Only SUPER_ADMIN can access district analytics');
    }
    const filter = await this._buildScopeFilter(user, queryParams);
    const now = new Date();

    const result = await Complaint.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "municipalities",
          localField: "municipalityId",
          foreignField: "_id",
          as: "municipalityDetails"
        }
      },
      { $unwind: { path: "$municipalityDetails", preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: "$municipalityDetails.district",
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $in: ["$status", ["SUBMITTED", "ACKNOWLEDGED", "UNDER_REVIEW", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "REOPENED", "COMPLETION_SUBMITTED"]] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $in: ["$status", ["RESOLVED", "CLOSED"]] }, 1, 0] }
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $not: { $in: ["$status", ["RESOLVED", "CLOSED", "REJECTED", "CANCELLED"]] } },
                    { $lt: ["$slaDueAt", now] },
                    { $ne: ["$slaDueAt", null] }
                  ]
                },
                1, 0
              ]
            }
          },
          reopened: {
            $sum: { $cond: [{ $eq: ["$status", "REOPENED"] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 1,
          district: "$_id",
          total: 1,
          active: 1,
          resolved: 1,
          overdue: 1,
          reopened: 1,
          slaCompliance: {
            $cond: [
              { $gt: ["$total", 0] },
              { $multiply: [{ $divide: [{ $subtract: ["$total", "$overdue"] }, "$total"] }, 100] },
              100
            ]
          }
        }
      },
      { $sort: { total: -1 } }
    ]);
    return result;
  }

  /**
   * Export to CSV
   */
  async exportCsv(user, queryParams) {
    const filter = await this._buildScopeFilter(user, queryParams);
    
    const complaints = await Complaint.find(filter)
      .populate('categoryId', 'name')
      .populate('wardId', 'name')
      .populate('departmentId', 'name')
      .populate('municipalityId', 'name')
      .lean();

    // Generate CSV string
    const headers = [
      'Complaint ID', 'Created At', 'Municipality', 'Ward', 'Department',
      'Category', 'Priority', 'Status', 'SLA Due Date', 'Resolved At'
    ];

    const rows = complaints.map(c => [
      c.complaintId || '',
      c.createdAt ? new Date(c.createdAt).toISOString() : '',
      c.municipalityId ? c.municipalityId.name : '',
      c.wardId ? c.wardId.name : '',
      c.departmentId ? c.departmentId.name : '',
      c.categoryId ? c.categoryId.name : '',
      c.priority || '',
      c.status || '',
      c.slaDueAt ? new Date(c.slaDueAt).toISOString() : '',
      c.resolvedAt ? new Date(c.resolvedAt).toISOString() : ''
    ]);

    // CSV Injection Protection (escape fields starting with =, +, -, @)
    const sanitizeCsvField = (str) => {
      let val = String(str);
      if (/^[=+\-@]/.test(val)) {
        val = "'" + val;
      }
      return `"${val.replace(/"/g, '""')}"`;
    };

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(sanitizeCsvField).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * System Structure — Real counts of all entities (SUPER_ADMIN only)
   */
  async getSystemStructure(user) {
    if (user.role !== ROLES.SUPER_ADMIN) {
      throw new ApiError(403, 'Only SUPER_ADMIN can access system structure');
    }

    const Municipality = (await import('../models/Municipality.js')).default;
    const Area = (await import('../models/Area.js')).default;
    const Designation = (await import('../models/Designation.js')).default;
    const { User } = await import('../models/User.js');

    const [municipalities, wards, areas, departments, designations, employees, workerTeams, users] = await Promise.all([
      Municipality.countDocuments(),
      Ward.countDocuments(),
      Area.countDocuments(),
      Department.countDocuments(),
      Designation.countDocuments(),
      Employee.countDocuments(),
      WorkerTeam.countDocuments(),
      User.countDocuments(),
    ]);

    return { municipalities, wards, areas, departments, designations, employees, workerTeams, users };
  }

  /**
   * Area Workload — complaint breakdown by area (for Ward Officers)
   */
  async getAreaWorkload(user, queryParams) {
    const filter = await this._buildScopeFilter(user, queryParams);
    const now = new Date();

    const result = await Complaint.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$areaId",
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $in: ["$status", ["SUBMITTED", "ACKNOWLEDGED", "UNDER_REVIEW", "VERIFIED", "ASSIGNED", "IN_PROGRESS", "REOPENED", "COMPLETION_SUBMITTED"]] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $in: ["$status", ["RESOLVED", "CLOSED"]] }, 1, 0] }
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $not: { $in: ["$status", ["RESOLVED", "CLOSED", "REJECTED", "CANCELLED"]] } },
                    { $lt: ["$slaDueAt", now] },
                    { $ne: ["$slaDueAt", null] }
                  ]
                },
                1, 0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: "areas",
          localField: "_id",
          foreignField: "_id",
          as: "areaDetails"
        }
      },
      { $unwind: { path: "$areaDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: { $ifNull: ["$areaDetails.name", "Unknown Area"] },
          total: 1,
          active: 1,
          resolved: 1,
          overdue: 1
        }
      },
      { $sort: { total: -1 } }
    ]);
    return result;
  }

  /**
   * Recent Activity — real ComplaintUpdate-based activity feed, scoped by role
   */
  async getRecentActivity(user, queryParams) {
    const filter = await this._buildScopeFilter(user, queryParams);
    const limit = parseInt(queryParams?.limit) || 10;

    // Get complaint IDs the user can access
    let complaintIds;
    if (user.role === ROLES.SUPER_ADMIN && !queryParams?.municipalityId) {
      // Super admin without filter: get recent from all
      complaintIds = null; // no filter on complaintId
    } else {
      const complaints = await Complaint.find(filter, { _id: 1 }).limit(500).lean();
      complaintIds = complaints.map(c => c._id);
    }

    const updateFilter = {};
    if (complaintIds) {
      updateFilter.complaintId = { $in: complaintIds };
    }

    const updates = await ComplaintUpdate.find(updateFilter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('complaintId', 'complaintId title')
      .populate('updatedByUserId', 'firstName lastName role')
      .lean();

    // Map to activity format
    const STATUS_ICONS = {
      SUBMITTED: { icon: '📝', iconBg: 'bg-blue-100 text-blue-600' },
      ACKNOWLEDGED: { icon: '👁️', iconBg: 'bg-cyan-100 text-cyan-600' },
      ASSIGNED: { icon: '📋', iconBg: 'bg-indigo-100 text-indigo-600' },
      IN_PROGRESS: { icon: '🔧', iconBg: 'bg-yellow-100 text-yellow-600' },
      COMPLETION_SUBMITTED: { icon: '✅', iconBg: 'bg-green-100 text-green-600' },
      RESOLVED: { icon: '🎉', iconBg: 'bg-green-100 text-green-600' },
      REOPENED: { icon: '🔄', iconBg: 'bg-orange-100 text-orange-600' },
      REJECTED: { icon: '❌', iconBg: 'bg-red-100 text-red-600' },
      CANCELLED: { icon: '🚫', iconBg: 'bg-gray-100 text-gray-600' },
      CLOSED: { icon: '🔒', iconBg: 'bg-gray-100 text-gray-600' },
    };

    return updates.map(u => {
      const iconData = STATUS_ICONS[u.newStatus] || { icon: '📝', iconBg: 'bg-gray-100 text-gray-600' };
      const complaintRef = u.complaintId?.complaintId || 'Unknown';
      const userName = u.updatedByUserId ? `${u.updatedByUserId.firstName || ''} ${u.updatedByUserId.lastName || ''}`.trim() : 'System';
      const timeAgo = getTimeAgo(u.createdAt);

      return {
        title: `${u.previousStatus || 'NEW'} → ${u.newStatus}`,
        description: `${complaintRef} — ${u.note || 'Status changed'} (by ${userName})`,
        time: timeAgo,
        ...iconData,
      };
    });
  }
}

/**
 * Helper: relative time ago string
 */
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default new AnalyticsService();

