import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import complaintService from '../services/complaintService.js';

// ────────────────────────── Async Thunks ──────────────────────────

export const fetchComplaints = createAsyncThunk(
  'complaints/fetchAll',
  async (params = {}, thunkAPI) => {
    try {
      const data = await complaintService.getComplaints(params);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch complaints';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchComplaintById = createAsyncThunk(
  'complaints/fetchById',
  async (id, thunkAPI) => {
    try {
      const data = await complaintService.getComplaintById(id);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch complaint';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const createComplaint = createAsyncThunk(
  'complaints/create',
  async (complaintData, thunkAPI) => {
    try {
      const data = await complaintService.submitComplaint(complaintData);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to submit complaint';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const uploadComplaintEvidence = createAsyncThunk(
  'complaints/uploadEvidence',
  async ({ complaintId, files }, thunkAPI) => {
    try {
      const data = await complaintService.uploadEvidence(complaintId, files);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to upload evidence';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'complaints/fetchCategories',
  async (municipalityId, thunkAPI) => {
    try {
      const data = await complaintService.getCategories(municipalityId);
      return data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch categories';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// ────────────────────────── Slice ──────────────────────────

const initialState = {
  // List
  items: [],
  pagination: null,
  isLoading: false,
  error: null,

  // Single detail
  current: null,
  isDetailLoading: false,
  detailError: null,

  // Create
  isCreating: false,
  createError: null,
  lastCreated: null,

  // Evidence upload
  isUploading: false,
  uploadError: null,

  // Categories
  categories: [],
  isCategoriesLoading: false,
};

const complaintsSlice = createSlice({
  name: 'complaints',
  initialState,
  reducers: {
    clearCurrentComplaint: (state) => {
      state.current = null;
      state.detailError = null;
    },
    clearCreateState: (state) => {
      state.createError = null;
      state.lastCreated = null;
    },
    clearError: (state) => {
      state.error = null;
      state.detailError = null;
      state.createError = null;
      state.uploadError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ── Fetch List ──
      .addCase(fetchComplaints.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchComplaints.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.results || [];
        state.pagination = action.payload.pagination || null;
      })
      .addCase(fetchComplaints.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ── Fetch Detail ──
      .addCase(fetchComplaintById.pending, (state) => {
        state.isDetailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchComplaintById.fulfilled, (state, action) => {
        state.isDetailLoading = false;
        state.current = action.payload.data || action.payload;
      })
      .addCase(fetchComplaintById.rejected, (state, action) => {
        state.isDetailLoading = false;
        state.detailError = action.payload;
      })

      // ── Create ──
      .addCase(createComplaint.pending, (state) => {
        state.isCreating = true;
        state.createError = null;
        state.lastCreated = null;
      })
      .addCase(createComplaint.fulfilled, (state, action) => {
        state.isCreating = false;
        state.lastCreated = action.payload.data || action.payload;
      })
      .addCase(createComplaint.rejected, (state, action) => {
        state.isCreating = false;
        state.createError = action.payload;
      })

      // ── Upload Evidence ──
      .addCase(uploadComplaintEvidence.pending, (state) => {
        state.isUploading = true;
        state.uploadError = null;
      })
      .addCase(uploadComplaintEvidence.fulfilled, (state) => {
        state.isUploading = false;
      })
      .addCase(uploadComplaintEvidence.rejected, (state, action) => {
        state.isUploading = false;
        state.uploadError = action.payload;
      })

      // ── Categories ──
      .addCase(fetchCategories.pending, (state) => {
        state.isCategoriesLoading = true;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isCategoriesLoading = false;
        state.categories = action.payload.data || [];
      })
      .addCase(fetchCategories.rejected, (state) => {
        state.isCategoriesLoading = false;
      });
  },
});

export const { clearCurrentComplaint, clearCreateState, clearError } = complaintsSlice.actions;
export default complaintsSlice.reducer;
