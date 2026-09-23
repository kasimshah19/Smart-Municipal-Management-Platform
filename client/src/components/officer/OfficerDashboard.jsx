import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchOverview, 
  fetchStatusDistribution, 
  fetchTrends,
  fetchCategoryAnalytics,
  fetchDepartmentWorkload,
  fetchWardWorkload,
  fetchWorkerWorkload,
  fetchSLAAnalytics,
  fetchRecentActivity
} from '../../store/analyticsSlice';
import { 
  StatusPieChart, 
  TrendsBarChart,
  CategoryBarChart,
  DepartmentWorkloadChart,
  WardWorkloadChart,
  WorkerWorkloadChart
} from '../analytics/AnalyticsCharts';
import MetricCard from './MetricCard';
import DashboardFilters from '../analytics/DashboardFilters';
import ComplaintTable from './ComplaintTable';
import { fetchComplaints } from '../../store/complaintsSlice';
import SLAMonitoring from '../dashboard/SLAMonitoring';
import QuickActions from '../dashboard/QuickActions';
import RecentActivity from '../dashboard/RecentActivity';

export default function OfficerDashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: complaints, isLoading: isComplaintsLoading } = useSelector((state) => state.complaints);
  const { 
    overview, 
    statusDistribution, 
    trends,
    categoryAnalytics,
    departmentWorkload,
    wardWorkload,
    workerWorkload,
    slaAnalytics,
    recentActivity,
    globalFilters
  } = useSelector((state) => state.analytics);

  const officerActions = [
    { label: 'Manage Complaints', path: '/officer/complaints' },
    { label: 'Manage Wards', path: '#' },
    { label: 'Manage Areas', path: '#' },
    { label: 'Manage Departments', path: '#' },
    { label: 'Manage Employees', path: '#' },
    { label: 'Manage Worker Teams', path: '#' },
  ];

  useEffect(() => {
    dispatch(fetchOverview(globalFilters));
    dispatch(fetchStatusDistribution(globalFilters));
    dispatch(fetchTrends(globalFilters));
    dispatch(fetchCategoryAnalytics(globalFilters));
    dispatch(fetchDepartmentWorkload(globalFilters));
    dispatch(fetchWardWorkload(globalFilters));
    dispatch(fetchWorkerWorkload(globalFilters));
    dispatch(fetchSLAAnalytics(globalFilters));
    dispatch(fetchRecentActivity({ ...globalFilters, limit: 5 }));
    dispatch(fetchComplaints({ limit: 5, ...globalFilters }));
  }, [dispatch, globalFilters]);

  const handleRefresh = () => {
    dispatch(fetchOverview(globalFilters));
    dispatch(fetchStatusDistribution(globalFilters));
    dispatch(fetchTrends(globalFilters));
    dispatch(fetchCategoryAnalytics(globalFilters));
    dispatch(fetchDepartmentWorkload(globalFilters));
    dispatch(fetchWardWorkload(globalFilters));
    dispatch(fetchWorkerWorkload(globalFilters));
    dispatch(fetchSLAAnalytics(globalFilters));
    dispatch(fetchRecentActivity({ ...globalFilters, limit: 5 }));
    dispatch(fetchComplaints({ limit: 5, ...globalFilters }));
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>
            Municipal Admin Dashboard
          </h1>
          <p className="text-sm" style={{ color: 'var(--ink-light)' }}>
            Municipality-level overview and operations
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/officer/complaints'}
          className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors hover:opacity-90"
          style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
        >
          View All Complaints →
        </button>
      </div>

      <DashboardFilters />

      {overview.data && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5 mb-8">
          <MetricCard title="Total" count={overview.data.total} colorVar="--ink" />
          <MetricCard title="New" count={overview.data.submitted} colorVar="--status-submitted-dot" />
          <MetricCard title="Active" count={overview.data.active} colorVar="--status-inprogress-dot" />
          <MetricCard title="Resolved" count={overview.data.resolved} colorVar="--status-resolved-dot" />
          <MetricCard title="Overdue" count={overview.data.overdue} colorVar="--status-rejected-dot" />
        </div>
      )}

      {/* SLA, Activity, and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <SLAMonitoring data={slaAnalytics?.data} loading={slaAnalytics?.loading} />
        </div>
        <div className="lg:col-span-1">
          <RecentActivity activity={recentActivity?.data} loading={recentActivity?.loading} />
        </div>
        <div className="lg:col-span-1">
          <QuickActions actions={officerActions} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white/50 p-6 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ink)' }}>Status Distribution</h2>
          {statusDistribution.loading ? <p>Loading...</p> : <StatusPieChart data={statusDistribution.data} />}
        </div>
        <div className="bg-white/50 p-6 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ink)' }}>Recent Trends</h2>
          {trends.loading ? <p>Loading...</p> : <TrendsBarChart data={trends.data} />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white/50 p-6 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ink)' }}>Department Workload</h2>
          {departmentWorkload.loading ? <p>Loading...</p> : <DepartmentWorkloadChart data={departmentWorkload.data} />}
        </div>
        <div className="bg-white/50 p-6 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ink)' }}>Ward Workload</h2>
          {wardWorkload.loading ? <p>Loading...</p> : <WardWorkloadChart data={wardWorkload.data} />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white/50 p-6 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ink)' }}>Worker Workload</h2>
          {workerWorkload.loading ? <p>Loading...</p> : <WorkerWorkloadChart data={workerWorkload.data} />}
        </div>
        <div className="bg-white/50 p-6 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ink)' }}>Category Workload</h2>
          {categoryAnalytics.loading ? <p>Loading...</p> : <CategoryBarChart data={categoryAnalytics.data} />}
        </div>
      </div>

      <div className="bg-white/50 p-6 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>Recent Complaints</h2>
        </div>
        {isComplaintsLoading ? (
          <p>Loading complaints...</p>
        ) : (
          <ComplaintTable complaints={complaints.slice(0, 5)} onRefresh={handleRefresh} />
        )}
      </div>
    </div>
  );
}
