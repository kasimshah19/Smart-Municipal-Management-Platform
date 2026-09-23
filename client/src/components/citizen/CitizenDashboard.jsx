import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchComplaints } from '../../store/complaintsSlice.js';
import ComplaintCard from './ComplaintCard.jsx';
import QuickActions from '../dashboard/QuickActions';
import RecentActivity from '../dashboard/RecentActivity';

const STATUS_FILTERS = [
  { key: '', label: 'All' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'CLOSED', label: 'Closed' },
];

function CitizenDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, isLoading, pagination } = useSelector((state) => state.complaints);
  const [activeFilter, setActiveFilter] = useState('');

  useEffect(() => {
    const params = {};
    if (activeFilter) params.status = activeFilter;
    dispatch(fetchComplaints(params));
  }, [dispatch, activeFilter]);

  const citizenActions = [
    { label: 'Report Issue', path: '/citizen/report' },
    { label: 'My Complaints', path: '/citizen/complaints' },
    { label: 'My Profile', path: '/profile' }
  ];

  const recentActivity = useMemo(() => {
    if (!items || items.length === 0) return [];
    return items.slice(0, 3).map(item => ({
      title: `Complaint ${item.status.replace('_', ' ')}`,
      description: item.title,
      time: new Date(item.updatedAt || item.createdAt).toLocaleDateString(),
      icon: item.status === 'RESOLVED' ? '✅' : (item.status === 'IN_PROGRESS' ? '🚧' : '📝'),
      iconBg: item.status === 'RESOLVED' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
    }));
  }, [items]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-[20px] font-bold" style={{ color: 'var(--ink)' }}>
          Your Complaints
        </h2>
        <button
          onClick={() => navigate('/citizen/report')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0"
          style={{
            backgroundColor: 'var(--primary)',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
          }}
        >
          <span className="text-[16px]">+</span>
          Report Problem
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-gray-500 text-sm font-medium">Total Reported</span>
          <span className="text-3xl font-bold text-gray-900 mt-1">{pagination?.total || 0}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-gray-500 text-sm font-medium">Active</span>
          <span className="text-3xl font-bold text-blue-600 mt-1">{items.filter(i => ['SUBMITTED', 'ACKNOWLEDGED', 'ASSIGNED', 'IN_PROGRESS'].includes(i.status)).length}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-gray-500 text-sm font-medium">Resolved</span>
          <span className="text-3xl font-bold text-green-600 mt-1">{items.filter(i => ['RESOLVED', 'CLOSED'].includes(i.status)).length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
        <RecentActivity activity={recentActivity} loading={isLoading} />
        <QuickActions actions={citizenActions} />
      </div>

      {/* Status Filter Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl overflow-x-auto"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)' }}
      >
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.key}
            onClick={() => setActiveFilter(filter.key)}
            className="px-3 sm:px-4 py-2 rounded-lg text-[13px] font-medium transition-colors"
            style={{
              backgroundColor: activeFilter === filter.key ? 'var(--primary)' : 'transparent',
              color: activeFilter === filter.key ? '#fff' : 'var(--muted)',
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[120px] rounded-2xl animate-pulse"
              style={{ backgroundColor: 'var(--surface)' }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-center gap-3"
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '14px',
            border: '1px dashed var(--line)',
          }}
        >
          <span className="text-[40px]">📭</span>
          <p className="text-[15px] font-medium" style={{ color: 'var(--ink)' }}>
            No complaints found
          </p>
          <p className="text-[13px]" style={{ color: 'var(--muted)' }}>
            {activeFilter
              ? 'Try changing the filter or report a new problem.'
              : "You haven't submitted any complaints yet."}
          </p>
          <button
            onClick={() => navigate('/citizen/report')}
            className="mt-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Report a Problem
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((complaint) => (
            <ComplaintCard
              key={complaint._id || complaint.id}
              complaint={complaint}
              onClick={() => navigate(`/citizen/complaints/${complaint._id}`)}
            />
          ))}
        </div>
      )}

      {/* Pagination info */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
          </span>
        </div>
      )}
    </div>
  );
}

export default CitizenDashboard;
