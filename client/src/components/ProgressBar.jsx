const STEPS = [
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'VERIFIED', label: 'Verified' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'CLOSED', label: 'Closed' },
];

function ProgressBar({ status }) {
  const isRejected = status === 'REJECTED';

  // For rejected, show how far it got then a red bar
  const currentIndex = isRejected
    ? STEPS.findIndex((s) => s.key === 'UNDER_REVIEW')
    : STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-1">
        {STEPS.map((step, i) => (
          <div key={step.key} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="h-[6px] w-full rounded-full transition-colors duration-300"
              style={{
                backgroundColor:
                  isRejected && i <= currentIndex
                    ? 'var(--danger)'
                    : i <= currentIndex
                    ? 'var(--accent)'
                    : 'var(--line)',
              }}
            />
            <span
              className="text-[10px] leading-tight text-center"
              style={{
                color:
                  i <= currentIndex ? 'var(--ink)' : 'var(--muted)',
                fontWeight: i === currentIndex ? '600' : '400',
              }}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {isRejected && (
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
          style={{
            backgroundColor: 'var(--status-rejected-bg)',
            color: 'var(--status-rejected-text)',
          }}
        >
          <span>✕</span>
          <span>Complaint Rejected</span>
        </div>
      )}
    </div>
  );
}

export default ProgressBar;
