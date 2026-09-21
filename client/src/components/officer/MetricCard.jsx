function MetricCard({ title, count, colorVar }) {
  return (
    <div
      className="flex flex-col p-4"
      style={{
        backgroundColor: 'var(--surface)',
        borderRadius: '14px',
        border: '1px solid var(--line)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
      }}
    >
      <span className="mb-1 text-[13px] font-medium" style={{ color: 'var(--muted)' }}>
        {title}
      </span>
      <span className="text-[28px] font-bold" style={{ color: `var(${colorVar})` }}>
        {count}
      </span>
    </div>
  );
}

export default MetricCard;
