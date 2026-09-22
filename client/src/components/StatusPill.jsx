const STATUS_CONFIG = {
  SUBMITTED: {
    label: 'Submitted',
    dotVar: '--status-submitted-dot',
    bgVar: '--status-submitted-bg',
    textVar: '--status-submitted-text',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    dotVar: '--status-under-review-dot',
    bgVar: '--status-under-review-bg',
    textVar: '--status-under-review-text',
  },
  VERIFIED: {
    label: 'Verified',
    dotVar: '--status-verified-dot',
    bgVar: '--status-verified-bg',
    textVar: '--status-verified-text',
  },
  ASSIGNED: {
    label: 'Assigned',
    dotVar: '--status-assigned-dot',
    bgVar: '--status-assigned-bg',
    textVar: '--status-assigned-text',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    dotVar: '--status-inprogress-dot',
    bgVar: '--status-inprogress-bg',
    textVar: '--status-inprogress-text',
  },
  COMPLETION_SUBMITTED: {
    label: 'Review Pending',
    dotVar: '--status-inprogress-dot',
    bgVar: '--status-inprogress-bg',
    textVar: '--status-inprogress-text',
  },
  RESOLVED: {
    label: 'Resolved',
    dotVar: '--status-resolved-dot',
    bgVar: '--status-resolved-bg',
    textVar: '--status-resolved-text',
  },
  REJECTED: {
    label: 'Rejected',
    dotVar: '--status-rejected-dot',
    bgVar: '--status-rejected-bg',
    textVar: '--status-rejected-text',
  },
  CLOSED: {
    label: 'Closed',
    dotVar: '--status-closed-dot',
    bgVar: '--status-closed-bg',
    textVar: '--status-closed-text',
  },
  // Legacy lowercase keys for backward compat
  submitted: {
    label: 'Submitted',
    dotVar: '--status-submitted-dot',
    bgVar: '--status-submitted-bg',
    textVar: '--status-submitted-text',
  },
  'in-progress': {
    label: 'In Progress',
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
