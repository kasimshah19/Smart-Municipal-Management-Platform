const STEPS = [
  { key: 'submitted', label: 'Submitted' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'resolved', label: 'Resolved' },
];

function ProgressBar({ status }) {
  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-start gap-1">
      {STEPS.map((step, i) => (
        <div key={step.key} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="h-[6px] w-full rounded-full"
            style={{
              backgroundColor:
                i <= currentIndex ? 'var(--accent)' : 'var(--line)',
            }}
          />
          <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default ProgressBar;
