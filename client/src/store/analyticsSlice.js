import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '../utils/axiosConfig.js';

// We can just use the globally configured axios that already has the interceptors
// for adding the Bearer token and handling 401s.
const axiosInstance = axios;

export const fetchOverview = createAsyncThunk(
  'analytics/fetchOverview',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/analytics/overview', { params: filters });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch overview');
    }
  }
);

export const fetchStatusDistribution = createAsyncThunk(
  'analytics/fetchStatusDistribution',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/analytics/status', { params: filters });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch status distribution');
    }
  }
);

export const fetchPriorityDistribution = createAsyncThunk(
  'analytics/fetchPriorityDistribution',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/analytics/priority', { params: filters });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch priority distribution');
    }
  }
);

export const fetchTrends = createAsyncThunk(
  'analytics/fetchTrends',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/analytics/trends', { params: filters });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch trends');
    }
  }
);

export const fetchCategoryAnalytics = createAsyncThunk(
  'analytics/fetchCategoryAnalytics',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/analytics/category', { params: filters });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch category analytics');
    }
  }
);

export const fetchDepartmentWorkload = createAsyncThunk(
  'analytics/fetchDepartmentWorkload',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/analytics/department', { params: filters });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch department workload');
    }
  }
);

export const fetchWardWorkload = createAsyncThunk(
  'analytics/fetchWardWorkload',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/analytics/ward', { params: filters });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch ward workload');
    }
  }
);

export const fetchSLAAnalytics = createAsyncThunk(
  'analytics/fetchSLAAnalytics',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/analytics/sla', { params: filters });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch SLA analytics');
    }
  }
);

export const fetchWorkerWorkload = createAsyncThunk(
  'analytics/fetchWorkerWorkload',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/analytics/workers', { params: filters });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch worker workload');
    }
  }
);

export const fetchMunicipalityAnalytics = createAsyncThunk(
  'analytics/fetchMunicipalityAnalytics',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/analytics/municipalities', { params: filters });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch municipality analytics');
    }
  }
);

export const fetchDistrictAnalytics = createAsyncThunk(
  'analytics/fetchDistrictAnalytics',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/analytics/districts', { params: filters });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch district analytics');
    }
  }
);

export const fetchSystemStructure = createAsyncThunk(
  'analytics/fetchSystemStructure',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/analytics/system-structure');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch system structure');
    }
  }
);

export const fetchAreaWorkload = createAsyncThunk(
  'analytics/fetchAreaWorkload',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/analytics/areas', { params: filters });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch area workload');
    }
  }
);

export const fetchRecentActivity = createAsyncThunk(
  'analytics/fetchRecentActivity',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/analytics/recent-activity', { params: filters });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recent activity');
    }
  }
);

const initialState = {
  overview: {
    data: { total: 0, active: 0, resolved: 0, overdue: 0, slaCompliancePercent: 100 },
    loading: false,
    error: null,
  },
  statusDistribution: {
    data: {},
    loading: false,
    error: null,
  },
  priorityDistribution: {
    data: {},
    loading: false,
    error: null,
  },
  trends: {
    data: [],
    loading: false,
    error: null,
  },
  categoryAnalytics: {
    data: [],
    loading: false,
    error: null,
  },
  departmentWorkload: {
    data: [],
    loading: false,
    error: null,
  },
  wardWorkload: {
    data: [],
    loading: false,
    error: null,
  },
  slaAnalytics: {
    data: null,
    loading: false,
    error: null,
  },
  workerWorkload: {
    data: [],
    loading: false,
    error: null,
  },
  municipalityAnalytics: {
    data: [],
    loading: false,
    error: null,
  },
  districtAnalytics: {
    data: [],
    loading: false,
    error: null,
  },
  systemStructure: {
    data: null,
    loading: false,
    error: null,
  },
  areaWorkload: {
    data: [],
    loading: false,
    error: null,
  },
  recentActivity: {
    data: [],
    loading: false,
    error: null,
  },
  globalFilters: {
    municipalityId: '',
    wardId: '',
    departmentId: '',
    startDate: '',
    endDate: '',
  }
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setGlobalFilters: (state, action) => {
      state.globalFilters = { ...state.globalFilters, ...action.payload };
    },
    clearGlobalFilters: (state) => {
      state.globalFilters = initialState.globalFilters;
    }
  },
  extraReducers: (builder) => {
    // Overview
    builder.addCase(fetchOverview.pending, (state) => {
      state.overview.loading = true;
      state.overview.error = null;
    });
    builder.addCase(fetchOverview.fulfilled, (state, action) => {
      state.overview.loading = false;
      state.overview.data = action.payload;
    });
    builder.addCase(fetchOverview.rejected, (state, action) => {
      state.overview.loading = false;
      state.overview.error = action.payload;
    });

    // Status
    builder.addCase(fetchStatusDistribution.pending, (state) => {
      state.statusDistribution.loading = true;
    });
    builder.addCase(fetchStatusDistribution.fulfilled, (state, action) => {
      state.statusDistribution.loading = false;
      state.statusDistribution.data = action.payload;
    });
    builder.addCase(fetchStatusDistribution.rejected, (state, action) => {
      state.statusDistribution.loading = false;
      state.statusDistribution.error = action.payload;
    });

    // Priority
    builder.addCase(fetchPriorityDistribution.pending, (state) => {
      state.priorityDistribution.loading = true;
    });
    builder.addCase(fetchPriorityDistribution.fulfilled, (state, action) => {
      state.priorityDistribution.loading = false;
      state.priorityDistribution.data = action.payload;
    });
    builder.addCase(fetchPriorityDistribution.rejected, (state, action) => {
      state.priorityDistribution.loading = false;
      state.priorityDistribution.error = action.payload;
    });

    // Trends
    builder.addCase(fetchTrends.pending, (state) => {
      state.trends.loading = true;
    });
    builder.addCase(fetchTrends.fulfilled, (state, action) => {
      state.trends.loading = false;
      state.trends.data = action.payload;
    });
    builder.addCase(fetchTrends.rejected, (state, action) => {
      state.trends.loading = false;
      state.trends.error = action.payload;
    });

    // Category Analytics
    builder.addCase(fetchCategoryAnalytics.pending, (state) => {
      state.categoryAnalytics.loading = true;
    });
    builder.addCase(fetchCategoryAnalytics.fulfilled, (state, action) => {
      state.categoryAnalytics.loading = false;
      state.categoryAnalytics.data = action.payload;
    });
    builder.addCase(fetchCategoryAnalytics.rejected, (state, action) => {
      state.categoryAnalytics.loading = false;
      state.categoryAnalytics.error = action.payload;
    });

    // Department Workload
    builder.addCase(fetchDepartmentWorkload.pending, (state) => {
      state.departmentWorkload.loading = true;
    });
    builder.addCase(fetchDepartmentWorkload.fulfilled, (state, action) => {
      state.departmentWorkload.loading = false;
      state.departmentWorkload.data = action.payload;
    });
    builder.addCase(fetchDepartmentWorkload.rejected, (state, action) => {
      state.departmentWorkload.loading = false;
      state.departmentWorkload.error = action.payload;
    });

    // Ward Workload
    builder.addCase(fetchWardWorkload.pending, (state) => {
      state.wardWorkload.loading = true;
    });
    builder.addCase(fetchWardWorkload.fulfilled, (state, action) => {
      state.wardWorkload.loading = false;
      state.wardWorkload.data = action.payload;
    });
    builder.addCase(fetchWardWorkload.rejected, (state, action) => {
      state.wardWorkload.loading = false;
      state.wardWorkload.error = action.payload;
    });

    // SLA Analytics
    builder.addCase(fetchSLAAnalytics.pending, (state) => {
      state.slaAnalytics.loading = true;
    });
    builder.addCase(fetchSLAAnalytics.fulfilled, (state, action) => {
      state.slaAnalytics.loading = false;
      state.slaAnalytics.data = action.payload;
    });
    builder.addCase(fetchSLAAnalytics.rejected, (state, action) => {
      state.slaAnalytics.loading = false;
      state.slaAnalytics.error = action.payload;
    });

    // Worker Workload
    builder.addCase(fetchWorkerWorkload.pending, (state) => {
      state.workerWorkload.loading = true;
    });
    builder.addCase(fetchWorkerWorkload.fulfilled, (state, action) => {
      state.workerWorkload.loading = false;
      state.workerWorkload.data = action.payload;
    });
    builder.addCase(fetchWorkerWorkload.rejected, (state, action) => {
      state.workerWorkload.loading = false;
      state.workerWorkload.error = action.payload;
    });

    // Municipality Analytics
    builder.addCase(fetchMunicipalityAnalytics.pending, (state) => {
      state.municipalityAnalytics.loading = true;
    });
    builder.addCase(fetchMunicipalityAnalytics.fulfilled, (state, action) => {
      state.municipalityAnalytics.loading = false;
      state.municipalityAnalytics.data = action.payload;
    });
    builder.addCase(fetchMunicipalityAnalytics.rejected, (state, action) => {
      state.municipalityAnalytics.loading = false;
      state.municipalityAnalytics.error = action.payload;
    });

    // District Analytics
    builder.addCase(fetchDistrictAnalytics.pending, (state) => {
      state.districtAnalytics.loading = true;
    });
    builder.addCase(fetchDistrictAnalytics.fulfilled, (state, action) => {
      state.districtAnalytics.loading = false;
      state.districtAnalytics.data = action.payload;
    });
    builder.addCase(fetchDistrictAnalytics.rejected, (state, action) => {
      state.districtAnalytics.loading = false;
      state.districtAnalytics.error = action.payload;
    });

    // System Structure
    builder.addCase(fetchSystemStructure.pending, (state) => {
      state.systemStructure.loading = true;
    });
    builder.addCase(fetchSystemStructure.fulfilled, (state, action) => {
      state.systemStructure.loading = false;
      state.systemStructure.data = action.payload;
    });
    builder.addCase(fetchSystemStructure.rejected, (state, action) => {
      state.systemStructure.loading = false;
      state.systemStructure.error = action.payload;
    });

    // Area Workload
    builder.addCase(fetchAreaWorkload.pending, (state) => {
      state.areaWorkload.loading = true;
    });
    builder.addCase(fetchAreaWorkload.fulfilled, (state, action) => {
      state.areaWorkload.loading = false;
      state.areaWorkload.data = action.payload;
    });
    builder.addCase(fetchAreaWorkload.rejected, (state, action) => {
      state.areaWorkload.loading = false;
      state.areaWorkload.error = action.payload;
    });

    // Recent Activity
    builder.addCase(fetchRecentActivity.pending, (state) => {
      state.recentActivity.loading = true;
    });
    builder.addCase(fetchRecentActivity.fulfilled, (state, action) => {
      state.recentActivity.loading = false;
      state.recentActivity.data = action.payload;
    });
    builder.addCase(fetchRecentActivity.rejected, (state, action) => {
      state.recentActivity.loading = false;
      state.recentActivity.error = action.payload;
    });
  }
});

export const { setGlobalFilters, clearGlobalFilters } = analyticsSlice.actions;

export default analyticsSlice.reducer;
