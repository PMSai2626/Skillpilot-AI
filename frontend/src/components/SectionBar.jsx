export default function SectionBar({ label, value }) {
  const color = value >= 80 ? 'var(--success)' : value >= 60 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div className="section-bar-row">
      <div className="section-bar-header">
        <span>{label}</span>
        <span style={{ color, fontWeight: 600 }}>{value}/100</span>
      </div>
      <div className="section-bar-bg">
        <div className="section-bar-fill" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}
