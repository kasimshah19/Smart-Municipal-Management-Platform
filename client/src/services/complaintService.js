import api from './api.js';

/**
 * Complaint Service — centralised API layer for all complaint operations.
 */

// ────────────────────────── Categories ──────────────────────────

export const getCategories = async (municipalityId) => {
  const res = await api.get('/complaint-categories', {
    params: { municipalityId, isActive: true },
  });
  return res.data;
};

// ────────────────────────── Submit ──────────────────────────

export const submitComplaint = async (data) => {
  const res = await api.post('/complaints', data);
  return res.data;
};

// ────────────────────────── Evidence ──────────────────────────

export const uploadEvidence = async (complaintId, files, type = 'COMPLAINT_PHOTO') => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('type', type);

  const res = await api.post(`/complaints/${complaintId}/evidence`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// ────────────────────────── Listing ──────────────────────────

export const getComplaints = async (params = {}) => {
  const res = await api.get('/complaints', { params });
  return res.data;
};

// ────────────────────────── Detail ──────────────────────────

export const getComplaintById = async (id) => {
  const res = await api.get(`/complaints/${id}`);
  return res.data;
};

// ────────────────────────── Status ──────────────────────────

export const updateStatus = async (id, statusData) => {
  const res = await api.patch(`/complaints/${id}/status`, statusData);
  return res.data;
};

// ────────────────────────── Assignment ──────────────────────────

export const assignComplaint = async (id, assignmentData) => {
  const res = await api.post(`/complaints/${id}/assign`, assignmentData);
  return res.data;
};

// ────────────────────────── Comments ──────────────────────────

export const addComment = async (id, message, isInternal = false) => {
  const res = await api.post(`/complaints/${id}/comments`, { message, isInternal });
  return res.data;
};

// ────────────────────────── Location hierarchy ──────────────────────────

export const getWards = async (municipalityId) => {
  const res = await api.get('/wards', { params: { municipalityId } });
  return res.data;
};

export const getAreas = async (wardId) => {
  const res = await api.get('/areas', { params: { wardId } });
  return res.data;
};

export const getMunicipalities = async () => {
  const res = await api.get('/municipalities');
  return res.data;
};

const complaintService = {
  getCategories,
  submitComplaint,
  uploadEvidence,
  getComplaints,
  getComplaintById,
  updateStatus,
  assignComplaint,
  addComment,
  getWards,
  getAreas,
  getMunicipalities,
};

export default complaintService;
