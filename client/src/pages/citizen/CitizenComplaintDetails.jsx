import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchComplaintById, clearCurrentComplaint } from '../../store/complaintsSlice.js';
import MainLayout from '../../layouts/MainLayout.jsx';
import StatusPill from '../../components/StatusPill.jsx';
import ProgressBar from '../../components/ProgressBar.jsx';
import complaintService from '../../services/complaintService.js';
import { showToast } from '../../store/uiSlice.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function CitizenComplaintDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { current: complaint, isDetailLoading } = useSelector((state) => state.complaints);

  const [comment, setComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    dispatch(fetchComplaintById(id));
    return () => { dispatch(clearCurrentComplaint()); };
  }, [id, dispatch]);

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    try {
      setSendingComment(true);
      await complaintService.addComment(id, comment);
      setComment('');
      dispatch(fetchComplaintById(id)); // Refresh
      dispatch(showToast('Comment added'));
    } catch (err) {
      dispatch(showToast('Failed to add comment'));
    } finally {
      setSendingComment(false);
    }
  };

  if (isDetailLoading) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto py-12 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-transparent" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      </MainLayout>
    );
  }

  if (!complaint) {
    return (
      <MainLayout>
        <div className="max-w-3xl mx-auto py-12 text-center">
          <p style={{ color: 'var(--muted)' }}>Complaint not found</p>
        </div>
      </MainLayout>
    );
  }

  const categoryName = complaint.categoryId?.name || 'Unknown';
  const categoryIcon = complaint.categoryId?.icon || '📋';

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-[14px] font-medium transition-colors hover:opacity-80"
          style={{ color: 'var(--primary)' }}
        >
          ← Back to Complaints
        </button>

        {/* Header Card */}
        <div
          className="p-6 rounded-2xl mb-6"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--line)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[22px]">{categoryIcon}</span>
                <h1 className="text-[20px] font-bold" style={{ color: 'var(--ink)' }}>
                  {complaint.title}
                </h1>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[13px] font-mono" style={{ color: 'var(--muted)' }}>
                  {complaint.complaintId}
                </span>
                <span
                  className="text-[12px] px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: 'var(--surface-raised)',
                    color: 'var(--muted)',
                    border: '1px solid var(--line)',
                  }}
                >
                  {categoryName}
                </span>
                {complaint.priority && (
                  <span className="text-[12px] font-medium" style={{ color: 'var(--muted)' }}>
                    Priority: {complaint.priority}
                  </span>
                )}
              </div>
            </div>
            <StatusPill status={complaint.status} />
          </div>

          {/* Description */}
          <p className="text-[14px] mb-5" style={{ color: 'var(--ink)' }}>
            {complaint.description}
          </p>

          {/* Location */}
          {complaint.location?.address && (
            <div className="flex items-center gap-2 mb-4 text-[13px]" style={{ color: 'var(--muted)' }}>
              <span>📍</span>
              <span>{complaint.location.address}</span>
            </div>
          )}

          {/* Ward / Area / Dates */}
          <div
            className="grid grid-cols-2 gap-4 p-4 rounded-xl text-[13px] md:grid-cols-4"
            style={{ backgroundColor: 'var(--bg)' }}
          >
            {complaint.wardId?.name && (
              <div>
                <p style={{ color: 'var(--muted)' }}>Ward</p>
                <p className="font-medium" style={{ color: 'var(--ink)' }}>{complaint.wardId.name}</p>
              </div>
            )}
            {complaint.areaId?.name && (
              <div>
                <p style={{ color: 'var(--muted)' }}>Area</p>
                <p className="font-medium" style={{ color: 'var(--ink)' }}>{complaint.areaId.name}</p>
              </div>
            )}
            {complaint.departmentId?.name && (
              <div>
                <p style={{ color: 'var(--muted)' }}>Department</p>
                <p className="font-medium" style={{ color: 'var(--ink)' }}>{complaint.departmentId.name}</p>
              </div>
            )}
            <div>
              <p style={{ color: 'var(--muted)' }}>Reported</p>
              <p className="font-medium" style={{ color: 'var(--ink)' }}>
                {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-5">
            <ProgressBar status={complaint.status} />
          </div>
        </div>

        {/* Evidence / Photos */}
        {complaint.evidence && complaint.evidence.length > 0 && (
          <div
            className="p-5 rounded-2xl mb-6"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
            }}
          >
            <h3 className="text-[16px] font-bold mb-3" style={{ color: 'var(--ink)' }}>
              📸 Photos & Evidence
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {complaint.evidence.map((ev, i) => (
                <a
                  key={ev._id || i}
                  href={`${API_BASE}${ev.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl overflow-hidden transition-transform hover:scale-[1.02]"
                  style={{ aspectRatio: '1', border: '1px solid var(--line)' }}
                >
                  <img
                    src={`${API_BASE}${ev.url}`}
                    alt={`Evidence ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Timeline / History */}
        {complaint.history && complaint.history.length > 0 && (
          <div
            className="p-5 rounded-2xl mb-6"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--line)',
            }}
          >
            <h3 className="text-[16px] font-bold mb-4" style={{ color: 'var(--ink)' }}>
              📋 Status Timeline
            </h3>
            <div className="flex flex-col gap-0">
              {complaint.history.map((entry, i) => (
                <div key={entry._id || i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className="h-3 w-3 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: 'var(--accent)' }}
                    />
                    {i < complaint.history.length - 1 && (
                      <div className="w-[2px] flex-1 min-h-[24px]" style={{ backgroundColor: 'var(--line)' }} />
                    )}
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-2">
                      <StatusPill status={entry.newStatus} />
                      <span className="text-[12px]" style={{ color: 'var(--muted)' }}>
                        {new Date(entry.createdAt).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {entry.note && (
                      <p className="text-[13px] mt-1" style={{ color: 'var(--ink)' }}>{entry.note}</p>
                    )}
                    {entry.updatedByUserId && (
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>
                        by {entry.updatedByUserId.firstName} {entry.updatedByUserId.lastName}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div
          className="p-5 rounded-2xl mb-6"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--line)',
          }}
        >
          <h3 className="text-[16px] font-bold mb-4" style={{ color: 'var(--ink)' }}>
            💬 Comments
          </h3>

          {/* Existing comments */}
          {complaint.comments && complaint.comments.length > 0 ? (
            <div className="flex flex-col gap-3 mb-4">
              {complaint.comments.map((c, i) => (
                <div
                  key={c._id || i}
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: 'var(--bg)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-medium" style={{ color: 'var(--ink)' }}>
                      {c.userId?.firstName} {c.userId?.lastName}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                      {new Date(c.createdAt).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-[13px]" style={{ color: 'var(--ink)' }}>{c.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] mb-4" style={{ color: 'var(--muted)' }}>No comments yet</p>
          )}

          {/* Add comment */}
          <div className="flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2.5 rounded-xl text-[14px] outline-none transition-colors focus:border-[var(--primary)]"
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <button
              onClick={handleAddComment}
              disabled={!comment.trim() || sendingComment}
              className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white transition-opacity disabled:opacity-40 hover:opacity-90"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              {sendingComment ? '...' : 'Send'}
            </button>
          </div>
        </div>

        {/* Rejection reason */}
        {complaint.status === 'REJECTED' && complaint.rejectionReason && (
          <div
            className="p-5 rounded-2xl mb-6"
            style={{
              backgroundColor: 'var(--danger-light)',
              border: '1px solid var(--danger)',
            }}
          >
            <h3 className="text-[16px] font-bold mb-2" style={{ color: 'var(--danger)' }}>
              Rejection Reason
            </h3>
            <p className="text-[14px]" style={{ color: 'var(--ink)' }}>
              {complaint.rejectionReason}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default CitizenComplaintDetails;
