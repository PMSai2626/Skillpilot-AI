// ─── Resume Extracted-Text Previewer ─────────────────────────────────────────
export default function ResumePreviewer({ text }) {
  if (!text) return null;

  const lines = text.split('\n').filter(l => l.trim());

  return (
    <div className="glass-card">
      <h3 className="premium-h3" style={{ marginBottom: '0.35rem' }}>📄 Extracted Resume Text</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
        Raw text extracted by the parsing engine. Verify that all important sections were correctly captured.
      </p>
      <div style={{
        maxHeight: '420px',
        overflowY: 'auto',
        background: 'rgba(0,0,0,0.2)',
        border: '1px solid var(--border-glass)',
        borderRadius: '12px',
        padding: '1.25rem',
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '0.82rem',
        lineHeight: 1.7,
        color: 'var(--text-sub)',
      }}>
        {lines.map((line, i) => {
          // Heuristic header detection (all-caps or short title-like line)
          const isBold = /^[A-Z][A-Z\s&/|–-]{4,}$/.test(line.trim()) || /^(EDUCATION|EXPERIENCE|SKILLS|PROJECTS|SUMMARY|OBJECTIVE|CONTACT|ACHIEVEMENTS|CERTIFICATIONS|AWARDS|PUBLICATIONS|REFERENCES|WORK HISTORY)$/i.test(line.trim());
          return (
            <div key={i} style={{
              marginBottom: '0.2rem',
              padding: '0.1rem 0',
              fontWeight: isBold ? 700 : 400,
              color: isBold ? 'var(--accent-cyan)' : 'var(--text-sub)',
              letterSpacing: isBold ? '0.03em' : 'normal',
              borderBottom: isBold ? '1px solid rgba(0,223,216,0.1)' : 'none',
              paddingBottom: isBold ? '0.35rem' : '0.1rem',
              marginTop: isBold ? '0.85rem' : '0',
            }}>
              {line}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'right' }}>
        {lines.length} lines · {text.length} characters extracted
      </div>
    </div>
  );
}
