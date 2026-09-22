import StatusPill from '../StatusPill.jsx';
import ProgressBar from '../ProgressBar.jsx';

function ComplaintCard({ complaint, onClick }) {
  // Support both API shape and legacy shape
  const id = complaint.complaintId || complaint.id;
  const categoryName = complaint.categoryId?.name || complaint.category || complaint.type;
  const categoryIcon = complaint.categoryId?.icon;
  const location = complaint.location?.address || complaint.ward || '';
  const status = complaint.status;
  const priority = complaint.priority;
  const title = complaint.title || categoryName;
  const date = complaint.createdAt || complaint.date;

  return (
    <div
      onClick={onClick}
      className="p-5 transition-all duration-200 hover:-translate-y-[2px] cursor-pointer"
      style={{
        backgroundColor: 'var(--surface)',
        borderRadius: '14px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        border: '1px solid var(--line)',
      }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {categoryIcon && <span className="text-[16px]">{categoryIcon}</span>}
            <span className="text-[15px] font-bold truncate" style={{ color: 'var(--ink)' }}>
              {title}
            </span>
            <span className="text-[12px] font-mono" style={{ color: 'var(--muted)' }}>
              {id}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {categoryName && title !== categoryName && (
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
            )}
            {location && (
              <span className="text-[13px]" style={{ color: 'var(--muted)' }}>
                📍 {location}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StatusPill status={status} />
          {priority === 'HIGH' || priority === 'CRITICAL' ? (
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: 'var(--status-urgent-bg)',
                color: 'var(--status-urgent-text)',
              }}
            >
              {priority === 'CRITICAL' ? '🔴 Critical' : '🟠 High'}
            </span>
          ) : null}
        </div>
      </div>

      {date && (
        <div className="mb-3 text-[12px]" style={{ color: 'var(--muted)' }}>
          Reported on {new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      )}

      <div className="pt-3" style={{ borderTop: '1px solid var(--line)' }}>
        <ProgressBar status={status} />
      </div>
    </div>
  );
}

export default ComplaintCard;
