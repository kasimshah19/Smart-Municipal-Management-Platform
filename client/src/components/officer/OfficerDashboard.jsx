import { useSelector } from 'react-redux';
import MetricCard from './MetricCard.jsx';
import ComplaintTable from './ComplaintTable.jsx';

function OfficerDashboard() {
  const complaints = useSelector((state) => state.complaints.items);

  const stats = {
    total: complaints.length,
    submitted: complaints.filter(c => c.status === 'submitted').length,
    inProgress: complaints.filter(c => c.status === 'in-progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="mb-4 text-[18px] font-bold" style={{ color: 'var(--ink)' }}>
          Overview
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard title="Total Complaints" count={stats.total} colorVar="--ink" />
          <MetricCard title="New / Submitted" count={stats.submitted} colorVar="--status-submitted-dot" />
          <MetricCard title="In Progress" count={stats.inProgress} colorVar="--status-inprogress-dot" />
          <MetricCard title="Resolved" count={stats.resolved} colorVar="--status-resolved-dot" />
        </div>
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
            All Complaints
          </h2>
        </div>
        
        <ComplaintTable complaints={complaints} />
      </div>
    </div>
  );
}

export default OfficerDashboard;
