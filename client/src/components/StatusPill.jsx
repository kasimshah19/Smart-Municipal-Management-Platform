const STATUS_CONFIG = {
  submitted: {
    label: 'Submitted',
    dotVar: '--status-submitted-dot',
    bgVar: '--status-submitted-bg',
    textVar: '--status-submitted-text',
  },
  'in-progress': {
    label: 'In progress',
    dotVar: '--status-inprogress-dot',
    bgVar: '--status-inprogress-bg',
    textVar: '--status-inprogress-text',
  },
  resolved: {
    label: 'Resolved',
    dotVar: '--status-resolved-dot',
    bgVar: '--status-resolved-bg',
    textVar: '--status-resolved-text',
  },
  urgent: {
    label: 'Urgent',
    dotVar: '--status-urgent-dot',
    bgVar: '--status-urgent-bg',
    textVar: '--status-urgent-text',
  },
};

function StatusPill({ status }) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[12px] font-medium"
      style={{
        borderRadius: '999px',
        backgroundColor: `var(${config.bgVar})`,
        color: `var(${config.textVar})`,
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: `var(${config.dotVar})` }}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}

export default StatusPill;
