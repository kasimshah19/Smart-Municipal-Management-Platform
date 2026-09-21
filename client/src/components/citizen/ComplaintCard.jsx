import StatusPill from '../StatusPill.jsx';
import ProgressBar from '../ProgressBar.jsx';

function ComplaintCard({ complaint }) {
  const { id, type, location, date, status } = complaint;

  return (
    <div
      className="p-4 transition-transform hover:-translate-y-[2px]"
      style={{
        backgroundColor: 'var(--surface)',
        borderRadius: '14px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        border: '1px solid var(--line)',
      }}
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold" style={{ color: 'var(--ink)' }}>
              {type}
            </span>
            <span className="text-[12px]" style={{ color: 'var(--muted)' }}>
              {id}
            </span>
          </div>
          <p className="mt-0.5 text-[13px]" style={{ color: 'var(--muted)' }}>
            {location}
          </p>
        </div>
        <StatusPill status={status} />
      </div>

      <div className="mb-4 text-[12px]" style={{ color: 'var(--muted)' }}>
        Reported on {new Date(date).toLocaleDateString()}
      </div>

      <div className="pt-3" style={{ borderTop: '1px solid var(--line)' }}>
        <ProgressBar status={status} />
      </div>
    </div>
  );
}

export default ComplaintCard;
