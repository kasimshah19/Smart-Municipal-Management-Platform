import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchOverview, 
  fetchStatusDistribution, 
  fetchTrends,
  fetchCategoryAnalytics,
  fetchMunicipalityAnalytics,
  fetchDistrictAnalytics,
  fetchSLAAnalytics,
  fetchSystemStructure,
  fetchRecentActivity
} from '../../store/analyticsSlice';
import { 
  StatusPieChart, 
  TrendsBarChart,
  CategoryBarChart,
  MunicipalityWorkloadChart,
  DistrictWorkloadChart
} from '../../components/analytics/AnalyticsCharts';
import MetricCard from '../../components/officer/MetricCard';
import DashboardFilters from '../../components/analytics/DashboardFilters';
import SLAMonitoring from '../../components/dashboard/SLAMonitoring';
import QuickActions from '../../components/dashboard/QuickActions';
import RecentActivity from '../../components/dashboard/RecentActivity';

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { 
    overview, 
    statusDistribution, 
    trends,
    categoryAnalytics,
    municipalityAnalytics,
    districtAnalytics,
    slaAnalytics,
    systemStructure,
    recentActivity,
    globalFilters
  } = useSelector((state) => state.analytics);

  const adminActions = [
    { label: 'View Complaints', path: '/officer/complaints' },
    { label: 'Structure Management', path: '/admin/structure' },
    { label: 'Manage Users', path: '#' },
    { label: 'System Settings', path: '#' }
  ];

  useEffect(() => {
    dispatch(fetchOverview(globalFilters));
    dispatch(fetchStatusDistribution(globalFilters));
    dispatch(fetchTrends(globalFilters));
    dispatch(fetchCategoryAnalytics(globalFilters));
    dispatch(fetchMunicipalityAnalytics(globalFilters));
    dispatch(fetchDistrictAnalytics(globalFilters));
    dispatch(fetchSLAAnalytics(globalFilters));
    dispatch(fetchSystemStructure());
    dispatch(fetchRecentActivity({ ...globalFilters, limit: 5 }));
  }, [dispatch, globalFilters]);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>
          Super Admin Dashboard
        </h1>
        <p className="text-sm" style={{ color: 'var(--ink-light)' }}>
          System-wide overview and comprehensive reporting
        </p>
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

      {/* SLA and Activity Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1">
          <SLAMonitoring data={slaAnalytics?.data} loading={slaAnalytics?.loading} />
        </div>
        <div className="md:col-span-1">
          <RecentActivity activity={recentActivity?.data} loading={recentActivity?.loading} />
        </div>
        <div className="md:col-span-1">
          <QuickActions actions={adminActions} />
        </div>
      </div>

      {/* System Structure Row */}
      <div className="bg-white/50 p-6 rounded-xl border mb-8" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ink)' }}>System Structure Overview</h2>
        {systemStructure.loading || !systemStructure.data ? (
          <p>Loading...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            <div className="text-center p-3 bg-white rounded-lg border border-gray-100"><p className="text-2xl font-bold text-primary-600">{systemStructure.data.municipalities}</p><p className="text-xs text-gray-500 uppercase">Municipalities</p></div>
            <div className="text-center p-3 bg-white rounded-lg border border-gray-100"><p className="text-2xl font-bold text-primary-600">{systemStructure.data.wards}</p><p className="text-xs text-gray-500 uppercase">Wards</p></div>
            <div className="text-center p-3 bg-white rounded-lg border border-gray-100"><p className="text-2xl font-bold text-primary-600">{systemStructure.data.areas}</p><p className="text-xs text-gray-500 uppercase">Areas</p></div>
            <div className="text-center p-3 bg-white rounded-lg border border-gray-100"><p className="text-2xl font-bold text-primary-600">{systemStructure.data.departments}</p><p className="text-xs text-gray-500 uppercase">Departments</p></div>
            <div className="text-center p-3 bg-white rounded-lg border border-gray-100"><p className="text-2xl font-bold text-primary-600">{systemStructure.data.employees}</p><p className="text-xs text-gray-500 uppercase">Employees</p></div>
            <div className="text-center p-3 bg-white rounded-lg border border-gray-100"><p className="text-2xl font-bold text-primary-600">{systemStructure.data.users}</p><p className="text-xs text-gray-500 uppercase">Total Users</p></div>
          </div>
        )}
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
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ink)' }}>District Workload</h2>
          {districtAnalytics.loading ? <p>Loading...</p> : <DistrictWorkloadChart data={districtAnalytics.data} />}
        </div>
        <div className="bg-white/50 p-6 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ink)' }}>Municipality Workload</h2>
          {municipalityAnalytics.loading ? <p>Loading...</p> : <MunicipalityWorkloadChart data={municipalityAnalytics.data} />}
        </div>
      </div>

      <div className="bg-white/50 p-6 rounded-xl border mb-6" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ink)' }}>Category Workload</h2>
        {categoryAnalytics.loading ? <p>Loading...</p> : <CategoryBarChart data={categoryAnalytics.data} />}
      </div>
    </div>
  );
}
