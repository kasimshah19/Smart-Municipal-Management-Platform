const SWATCHES = [
  { name: 'Navy', hex: '#0B1F3A' },
  { name: 'Civic blue', hex: '#2563EB' },
  { name: 'Smart teal', hex: '#14B8A6' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Red', hex: '#EF4444' },
];

function Footer() {
  return (
    <footer
      className="py-4"
      style={{ borderTop: '1px solid var(--line)' }}
    >
      <div className="mx-auto flex max-w-[1040px] flex-wrap items-center justify-center gap-x-5 gap-y-2 px-5">
        {SWATCHES.map(({ name, hex }) => (
          <div key={name} className="flex items-center gap-1.5">
            <span
              className="inline-block h-4 w-4"
              style={{ backgroundColor: hex, borderRadius: '4px' }}
            />
            <span className="text-[12px]" style={{ color: 'var(--muted)' }}>
              {name} {hex}
            </span>
          </div>
        ))}
      </div>
    </footer>
  );
}

export default Footer;
