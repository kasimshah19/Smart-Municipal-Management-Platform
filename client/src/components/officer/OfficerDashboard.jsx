import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchComplaints } from '../../store/complaintsSlice.js';
import MetricCard from './MetricCard.jsx';
import ComplaintTable from './ComplaintTable.jsx';

function OfficerDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: complaints, isLoading } = useSelector((state) => state.complaints);

  useEffect(() => {
    dispatch(fetchComplaints({}));
  }, [dispatch]);

  const stats = {
    total: complaints.length,
    submitted: complaints.filter(c => c.status === 'SUBMITTED').length,
    inProgress: complaints.filter(c => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED').length,
    resolved: complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length,
  };

  const handleRefresh = () => {
    dispatch(fetchComplaints({}));
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-bold" style={{ color: 'var(--ink)' }}>
          Overview
        </h2>
        <button
          onClick={() => navigate('/officer/complaints')}
          className="px-4 py-2 rounded-lg text-[13px] font-medium transition-colors hover:opacity-90"
          style={{
            backgroundColor: 'var(--primary)',
            color: '#fff',
          }}
        >
          View All Complaints →
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard title="Total Complaints" count={stats.total} colorVar="--ink" />
        <MetricCard title="New / Submitted" count={stats.submitted} colorVar="--status-submitted-dot" />
        <MetricCard title="In Progress" count={stats.inProgress} colorVar="--status-inprogress-dot" />
        <MetricCard title="Resolved" count={stats.resolved} colorVar="--status-resolved-dot" />
      </div>

      <div
        className="p-5"
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '14px',
          border: '1px solid var(--line)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-bold" style={{ color: 'var(--ink)' }}>
            Recent Complaints
          </h2>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div
              className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
              style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
            />
          </div>
        ) : (
          <ComplaintTable complaints={complaints} onRefresh={handleRefresh} />
        )}
      </div>
    </div>
  );
}

export default OfficerDashboard;
