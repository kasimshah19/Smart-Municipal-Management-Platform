import { showToast } from '../../store/uiSlice.js';
import { useDispatch } from 'react-redux';
import StatusPill from '../StatusPill.jsx';
import { useNavigate } from 'react-router-dom';
import complaintService from '../../services/complaintService.js';

function ComplaintTable({ complaints, onRefresh }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleStatusChange = async (id, newStatus) => {
    try {
      await complaintService.updateStatus(id, { status: newStatus });
      dispatch(showToast(`Status updated to ${newStatus.replace('_', ' ')}`));
      if (onRefresh) onRefresh();
    } catch (err) {
      dispatch(showToast(err.response?.data?.message || 'Failed to update status'));
    }
  };

  if (complaints.length === 0) {
    return (
      <div 
        className="flex py-8 items-center justify-center text-[14px]" 
        style={{ color: 'var(--muted)' }}
      >
        No complaints found.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left text-[13px]" style={{ color: 'var(--ink)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--line)' }}>
            <th className="py-3 pr-4 font-medium" style={{ color: 'var(--muted)' }}>ID</th>
            <th className="py-3 pr-4 font-medium" style={{ color: 'var(--muted)' }}>Category</th>
            <th className="py-3 pr-4 font-medium" style={{ color: 'var(--muted)' }}>Location</th>
            <th className="py-3 pr-4 font-medium" style={{ color: 'var(--muted)' }}>Status</th>
            <th className="py-3 pr-4 font-medium" style={{ color: 'var(--muted)' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {complaints.map((c) => (
            <tr 
              key={c._id || c.id} 
              className="group transition-colors cursor-pointer"
              style={{ borderBottom: '1px solid var(--line)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-raised)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => navigate(`/officer/complaints/${c._id || c.id}`)}
            >
              <td className="py-3 pr-4 font-medium font-mono" style={{ color: 'var(--primary)' }}>
                {c.complaintId || c.id}
              </td>
              <td className="py-3 pr-4">{c.categoryId?.name || c.category || c.type}</td>
              <td className="py-3 pr-4 max-w-[200px] truncate">
                {c.location?.address || c.wardId?.name || c.ward || '—'}
              </td>
              <td className="py-3 pr-4">
                <StatusPill status={c.status} />
              </td>
              <td className="py-3 pr-4" onClick={(e) => e.stopPropagation()}>
                <select
                  value={c.status}
                  onChange={(e) => handleStatusChange(c._id || c.id, e.target.value)}
                  className="px-2 py-1 text-[12px] font-medium outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    color: 'var(--ink)',
                  }}
                >
                  <option value="SUBMITTED">Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ComplaintTable;
