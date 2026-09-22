import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchComplaints } from '../../store/complaintsSlice.js';
import MainLayout from '../../layouts/MainLayout.jsx';
import StatusPill from '../../components/StatusPill.jsx';

const STATUS_OPTIONS = [
  { key: '', label: 'All Statuses' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'VERIFIED', label: 'Verified' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETION_SUBMITTED', label: 'Review Pending' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'CLOSED', label: 'Closed' },
];

const PRIORITY_OPTIONS = [
  { key: '', label: 'All Priorities' },
  { key: 'LOW', label: 'Low' },
  { key: 'MEDIUM', label: 'Medium' },
  { key: 'HIGH', label: 'High' },
  { key: 'CRITICAL', label: 'Critical' },
];

function OfficerComplaintsList() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items, isLoading, pagination } = useSelector((state) => state.complaints);

  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    page: 1,
  });
  const [searchId, setSearchId] = useState('');

  useEffect(() => {
    const params = { page: filters.page, limit: 20 };
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    dispatch(fetchComplaints(params));
  }, [dispatch, filters]);

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handleSearch = () => {
    if (searchId.trim()) {
      navigate(`/officer/complaints/${searchId.trim()}`);
    }
  };

  const inputStyles = {
    backgroundColor: 'var(--bg)',
    border: '1px solid var(--line)',
    borderRadius: '10px',
    color: 'var(--ink)',
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'CRITICAL': return 'var(--danger)';
      case 'HIGH': return '#F97316';
      case 'MEDIUM': return 'var(--warning)';
      default: return 'var(--muted)';
    }
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--ink)' }}>
            Complaints Management
          </h1>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by ID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="px-3 py-2 text-[13px] outline-none w-[180px]"
              style={inputStyles}
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 rounded-lg text-[13px] font-medium text-white"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              Search
            </button>
          </div>
        </div>

        {/* Filters */}
        <div
          className="flex flex-wrap gap-3 mb-6 p-4 rounded-xl"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--line)',
          }}
        >
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 text-[13px] outline-none"
            style={inputStyles}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="px-3 py-2 text-[13px] outline-none"
            style={inputStyles}
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--line)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
          }}
        >
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div
                className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
                style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }}
              />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
              <span className="text-[32px]">📭</span>
              <p className="text-[14px]" style={{ color: 'var(--muted)' }}>
                No complaints found with selected filters
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line)' }}>
                    {['ID', 'Title', 'Category', 'Ward', 'Priority', 'Status', 'Date'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left font-semibold"
                        style={{ color: 'var(--muted)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((complaint) => (
                    <tr
                      key={complaint._id}
                      onClick={() => navigate(`/officer/complaints/${complaint._id}`)}
                      className="cursor-pointer transition-colors"
                      style={{ borderBottom: '1px solid var(--line)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-raised)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td className="px-4 py-3 font-mono" style={{ color: 'var(--primary)' }}>
                        {complaint.complaintId}
                      </td>
                      <td className="px-4 py-3 font-medium max-w-[200px] truncate" style={{ color: 'var(--ink)' }}>
                        {complaint.title}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>
                        {complaint.categoryId?.name || '—'}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>
                        {complaint.wardId?.name || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 text-[12px] font-semibold"
                          style={{ color: getPriorityColor(complaint.priority) }}
                        >
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: getPriorityColor(complaint.priority) }}
                          />
                          {complaint.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={complaint.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--muted)' }}>
                        {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderTop: '1px solid var(--line)' }}
            >
              <span className="text-[12px]" style={{ color: 'var(--muted)' }}>
                {pagination.total} total complaints
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={filters.page <= 1}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium disabled:opacity-30"
                  style={{
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    border: '1px solid var(--line)',
                  }}
                >
                  ← Prev
                </button>
                <span className="text-[12px] font-medium" style={{ color: 'var(--ink)' }}>
                  {filters.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page >= pagination.totalPages}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium disabled:opacity-30"
                  style={{
                    backgroundColor: 'var(--bg)',
                    color: 'var(--ink)',
                    border: '1px solid var(--line)',
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default OfficerComplaintsList;
