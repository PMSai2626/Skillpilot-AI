// ─── Static enrichment data keyed to EXACT role names from role_profiles.json ─
// role_profiles.json role names: "Frontend Developer", "Backend Developer",
// "Full-Stack Developer", "QA / Test Automation Engineer",
// "Data Analyst", "DevOps Engineer", "Machine Learning Engineer"
const ROLE_META = {
  'Frontend Developer': {
    icon: '🖥️',
    salary: '$85K–$130K',
    demand: 'High',
    companies: ['Google', 'Meta', 'Airbnb'],
  },
  'Backend Developer': {
    icon: '⚙️',
    salary: '$90K–$140K',
    demand: 'Very High',
    companies: ['AWS', 'Netflix', 'Stripe'],
  },
  'Full-Stack Developer': {
    icon: '🔧',
    salary: '$95K–$150K',
    demand: 'Very High',
    companies: ['Shopify', 'Twilio', 'HubSpot'],
  },
  'QA / Test Automation Engineer': {
    icon: '🧪',
    salary: '$75K–$120K',
    demand: 'High',
    companies: ['Microsoft', 'Atlassian', 'Sauce Labs'],
  },
  'Data Analyst': {
    icon: '📊',
    salary: '$80K–$130K',
    demand: 'High',
    companies: ['Tableau', 'Snowflake', 'IBM'],
  },
  'DevOps Engineer': {
    icon: '☁️',
    salary: '$100K–$155K',
    demand: 'Very High',
    companies: ['HashiCorp', 'Cloudflare', 'RedHat'],
  },
  'Machine Learning Engineer': {
    icon: '🤖',
    salary: '$120K–$190K',
    demand: 'Very High',
    companies: ['DeepMind', 'NVIDIA', 'Anthropic'],
  },
};

const DEFAULT_META = { icon: '💼', salary: 'N/A', demand: 'Medium', companies: [] };

export default function RecommendedJobs({ roleMatches }) {
  if (!roleMatches || roleMatches.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
        <p>No role matches found for this resume. Try adding more relevant skills.</p>
      </div>
    );
  }

  return (
    <div className="jobs-grid">
      {roleMatches.map((role, idx) => {
        const meta = ROLE_META[role.role] || DEFAULT_META;
        const pct = Math.round(role.confidence * 100);

        // Green badge if ≥70%, amber otherwise
        const isGoodMatch = pct >= 70;
        const badgeStyle = {
          background: isGoodMatch ? 'rgba(0,223,216,0.15)' : 'rgba(245,158,11,0.15)',
          color: isGoodMatch ? 'var(--accent-cyan)' : 'var(--warning)',
          border: `1px solid ${isGoodMatch ? 'rgba(0,223,216,0.3)' : 'rgba(245,158,11,0.3)'}`,
        };

        const demandColor =
          meta.demand === 'Very High' ? 'var(--success)' :
          meta.demand === 'High' ? 'var(--warning)' : 'var(--text-muted)';

        // Skills actually found in the resume for this role
        const matched = role.matchedSkills || [];
        // Skills required by this role that are NOT in the resume
        const missing = role.missingSkills || [];

        return (
          <div key={idx} className="job-card glass-card">
            {/* Header row: icon + title + match badge */}
            <div className="job-card-header">
              <div className="job-icon">{meta.icon}</div>
              <div className="job-meta">
                <h4 className="job-title">{role.role}</h4>
                <span className="job-salary">{meta.salary}</span>
              </div>
              <div className="job-match-badge" style={badgeStyle}>
                {pct}% Match
              </div>
            </div>

            {/* Matched skills from resume */}
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ✅ Your Matching Skills
              </div>
              <div className="job-skills">
                {matched.length > 0
                  ? matched.slice(0, 6).map((skill, i) => (
                    <span key={i} className="skill-tag">{skill}</span>
                  ))
                  : <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>None detected in resume</span>
                }
              </div>
            </div>

            {/* Missing skills */}
            {missing.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🎯 Skills to Add
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {missing.slice(0, 4).map((s, i) => (
                    <a
                      key={i}
                      href={s.resourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Learn: ${s.resourceName}`}
                      style={{
                        background: 'rgba(255,68,68,0.08)',
                        border: '1px solid rgba(255,68,68,0.2)',
                        color: 'var(--danger)',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                        padding: '0.2rem 0.55rem',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,68,68,0.18)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,68,68,0.08)'}
                    >
                      {s.name} ↗
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Footer: demand + companies */}
            <div className="job-footer">
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Demand: <span style={{ color: demandColor, fontWeight: 600 }}>{meta.demand}</span>
              </span>
              {meta.companies.length > 0 && (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  {meta.companies.slice(0, 2).join(', ')}
                </span>
              )}
            </div>

            {/* Match progress bar */}
            <div className="job-match-bar">
              <div className="job-match-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
