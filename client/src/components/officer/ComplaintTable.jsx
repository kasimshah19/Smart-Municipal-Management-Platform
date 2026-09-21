import { useDispatch } from 'react-redux';
import { updateStatus } from '../../store/complaintsSlice.js';
import { showToast } from '../../store/uiSlice.js';
import StatusPill from '../StatusPill.jsx';
import { useNavigate } from 'react-router-dom';

function ComplaintTable({ complaints }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleStatusChange = (id, newStatus) => {
    dispatch(updateStatus({ id, status: newStatus }));
    dispatch(showToast(`Complaint ${id} marked as ${newStatus.replace('-', ' ')}`));
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
              key={c.id || c._id} 
              className="group transition-colors hover:bg-gray-50 cursor-pointer"
              style={{ borderBottom: '1px solid var(--line)' }}
              onClick={() => navigate(`/officer/complaints/${c.id || c._id}`)}
            >
              <td className="py-3 pr-4 font-medium">{c.id || c._id}</td>
              <td className="py-3 pr-4">{c.type}</td>
              <td className="py-3 pr-4 max-w-[200px] truncate">{c.location}</td>
              <td className="py-3 pr-4">
                <StatusPill status={c.status} />
              </td>
              <td className="py-3 pr-4" onClick={(e) => e.stopPropagation()}>
                <select
                  value={c.status}
                  onChange={(e) => handleStatusChange(c.id || c._id, e.target.value)}
                  className="px-2 py-1 text-[12px] font-medium outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--line)',
                    borderRadius: '6px',
                    color: 'var(--ink)',
                  }}
                >
                  <option value="SUBMITTED">Submitted</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In progress</option>
                  <option value="COMPLETION_SUBMITTED">Review</option>
                  <option value="RESOLVED">Resolved</option>
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
