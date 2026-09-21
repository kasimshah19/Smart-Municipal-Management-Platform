import express from 'express';
import complaintService from '../services/complaint.service.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.middleware.js';
import uploadEvidence from '../middlewares/uploadEvidence.js';
import ComplaintEvidence from '../models/ComplaintEvidence.js';

const router = express.Router();

/**
 * @route   POST /api/complaints
 * @desc    Submit a new complaint
 * @access  Private (Citizen or any user)
 */
router.post(
  '/',
  authenticate,
  async (req, res, next) => {
    try {
      const citizenId = req.user._id;
      // You can extract municipalityCode from req.user if present, or pass it
      const municipalityCode = req.body.municipalityCode || 'MUC';
      
      const complaint = await complaintService.submitComplaint(req.body, citizenId, municipalityCode);
      res.status(201).json({ success: true, data: complaint });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/complaints/:id/evidence
 * @desc    Upload evidence (photos) for a complaint
 * @access  Private (Citizen for SUBMITTED, Workers for others)
 */
router.post(
  '/:id/evidence',
  authenticate,
  uploadEvidence.array('files', 5), // allow up to 5 files
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files uploaded' });
      }

      const type = req.body.type || 'COMPLAINT_PHOTO';
      
      const evidenceDocs = [];
      for (const file of req.files) {
        // Build URL relative path
        const url = `/uploads/${file.filename}`;
        
        const evidence = new ComplaintEvidence({
          complaintId: req.params.id,
          uploadedByUserId: req.user._id,
          type,
          url,
          description: req.body.description
        });
        
        await evidence.save();
        evidenceDocs.push(evidence);
      }

      res.status(201).json({ success: true, data: evidenceDocs });
    } catch (error) {
      next(error);
    }
  }
);


/**
 * @route   GET /api/complaints
 * @desc    Get complaints (paginated and filtered)
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  async (req, res, next) => {
    try {
      const filter = {};
      
      // RBAC Filtering Strategy
      if (req.user.role === 'CITIZEN') {
        // Citizens can only see their own
        filter.citizenId = req.user._id;
      } else if (req.user.role === 'MUNICIPAL_ADMIN' || req.user.role === 'GRIEVANCE_OFFICER') {
        // Admin/Officers see all in their municipality
        filter.municipalityId = req.user.municipalityId;
      } else if (req.user.role === 'DEPARTMENT_HEAD' || req.user.role === 'DEPARTMENT_OFFICER') {
        // Dept officers see all in their municipality AND department
        filter.municipalityId = req.user.municipalityId;
        filter.departmentId = req.user.departmentId; // Assuming this is set on User or mapped.
      } else if (req.user.role === 'WORKER') {
         // Need complex logic for Workers to see assigned tasks. For now:
         filter.municipalityId = req.user.municipalityId;
      }

      // Add query filters if valid and present
      if (req.query.status) filter.status = req.query.status;
      if (req.query.departmentId) filter.departmentId = req.query.departmentId;
      if (req.query.categoryId) filter.categoryId = req.query.categoryId;
      if (req.query.wardId) filter.wardId = req.query.wardId;
      if (req.query.priority) filter.priority = req.query.priority;

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await complaintService.getComplaints(filter, { page, limit });
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/complaints/:id
 * @desc    Get complaint details by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  async (req, res, next) => {
    try {
      const filter = {};
      if (req.user.role === 'CITIZEN') filter.citizenId = req.user._id;
      if (req.user.municipalityId && req.user.role !== 'SYSTEM_ADMIN') {
         filter.municipalityId = req.user.municipalityId;
      }

      const complaint = await complaintService.getComplaintById(req.params.id, filter);
      
      // Fetch related parallel data
      const history = await complaintService.getHistory(req.params.id);
      const comments = await complaintService.getComments(req.params.id, req.user.role !== 'CITIZEN');
      const evidence = await ComplaintEvidence.find({ complaintId: req.params.id }).populate('uploadedByUserId', 'firstName lastName');

      res.json({ 
        success: true, 
        data: {
          ...complaint,
          history,
          comments,
          evidence
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PATCH /api/complaints/:id/status
 * @desc    Change complaint status
 * @access  Private (Staff only)
 */
router.patch(
  '/:id/status',
  authenticate,
  authorizeRoles('SYSTEM_ADMIN', 'MUNICIPAL_ADMIN', 'GRIEVANCE_OFFICER', 'DEPARTMENT_HEAD', 'DEPARTMENT_OFFICER', 'WORKER'),
  async (req, res, next) => {
    try {
      const filter = {};
      if (req.user.municipalityId && req.user.role !== 'SYSTEM_ADMIN') {
         filter.municipalityId = req.user.municipalityId;
      }

      const { status, note, rejectionReason, bypassTransitions } = req.body;

      const updatedComplaint = await complaintService.changeStatus(
        req.params.id,
        req.user._id,
        status,
        filter,
        { note, rejectionReason, bypassTransitions }
      );

      res.json({ success: true, data: updatedComplaint });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/complaints/:id/assign
 * @desc    Assign complaint to worker/team
 * @access  Private (Dept Head/Officer)
 */
router.post(
  '/:id/assign',
  authenticate,
  authorizeRoles('SYSTEM_ADMIN', 'MUNICIPAL_ADMIN', 'GRIEVANCE_OFFICER', 'DEPARTMENT_HEAD', 'DEPARTMENT_OFFICER'),
  async (req, res, next) => {
    try {
      const filter = {};
      if (req.user.municipalityId && req.user.role !== 'SYSTEM_ADMIN') {
         filter.municipalityId = req.user.municipalityId;
      }

      const updatedComplaint = await complaintService.assignComplaint(
        req.params.id,
        req.user._id,
        req.body, // { assignedToEmployeeId, assignedToTeamId, reason }
        filter
      );

      res.json({ success: true, data: updatedComplaint });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/complaints/:id/comments
 * @desc    Add a comment
 * @access  Private
 */
router.post(
  '/:id/comments',
  authenticate,
  async (req, res, next) => {
    try {
      // Basic check, in reality should verify user can see this complaint
      const isInternal = req.body.isInternal || false;
      
      // Citizens cannot make internal comments
      if (req.user.role === 'CITIZEN' && isInternal) {
         return res.status(403).json({ success: false, message: 'Citizens cannot make internal comments' });
      }

      const comment = await complaintService.addComment(
        req.params.id,
        req.user._id,
        req.body.message,
        isInternal
      );

      res.status(201).json({ success: true, data: comment });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
