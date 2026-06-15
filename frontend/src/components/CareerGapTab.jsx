import { useState, useEffect } from 'react';

// ─── Readiness Ring ───────────────────────────────────────────────────────────
function ReadinessRing({ score }) {
  const radius = 54;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;

  const color =
    score >= 80 ? '#00dfd8' :
    score >= 50 ? '#f59e0b' :
                  '#ff4444';

  return (
    <div className="cg-ring-wrap">
      <svg viewBox="0 0 128 128" className="cg-ring-svg">
        {/* Track */}
        <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="11" />
        {/* Fill */}
        <circle
          cx="64" cy="64" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 64 64)"
          style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 8px ${color}88)` }}
        />
      </svg>
      <div className="cg-ring-center">
        <span className="cg-ring-num" style={{ color }}>{score}</span>
        <span className="cg-ring-label">/ 100</span>
      </div>
    </div>
  );
}

// ─── Skill Chip ───────────────────────────────────────────────────────────────
function SkillChip({ skill, variant }) {
  return (
    <span className={`cg-chip cg-chip-${variant}`}>
      {variant === 'matched' && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {variant === 'missing-req' && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
      {variant === 'missing-pref' && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      )}
      {variant === 'extra' && '✦ '}
      {skill}
    </span>
  );
}

// ─── Missing Skill Row ────────────────────────────────────────────────────────
function MissingSkillRow({ item, index }) {
  const isRequired = item.category === 'required';
  return (
    <div className={`cg-missing-row ${isRequired ? 'cg-missing-req' : 'cg-missing-pref'}`}
         style={{ animationDelay: `${index * 60}ms` }}>
      <div className="cg-missing-left">
        <span className={`cg-missing-badge ${isRequired ? 'badge-must' : 'badge-optional'}`}>
          {isRequired ? 'Required' : 'Preferred'}
        </span>
        <span className="cg-missing-name">{item.name}</span>
      </div>
      <a
        href={item.resourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="cg-learn-btn"
        title={item.resourceName}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        Learn
      </a>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CareerGapTab({ user }) {
  const [roles,         setRoles]         = useState([]);
  const [selectedRole,  setSelectedRole]  = useState('');
  const [skillInput,    setSkillInput]    = useState('');
  const [skillTags,     setSkillTags]     = useState([]);
  const [useResume,     setUseResume]     = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [loadingRoles,  setLoadingRoles]  = useState(true);
  const [error,         setError]         = useState('');
  const [result,        setResult]        = useState(null);
  const [activeSection, setActiveSection] = useState('missing');

  // ── Load Roles ─────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/roles')
      .then(r => r.json())
      .then(data => { setRoles(data); setLoadingRoles(false); })
      .catch(() => setLoadingRoles(false));
  }, []);

  // ── Add Skill Tag ──────────────────────────────────────────────────────────
  const addSkillTag = (raw) => {
    const cleaned = raw.trim().replace(/,+$/, '').trim();
    if (!cleaned) return;
    // Split by comma if pasted as multiple
    const parts = cleaned.split(',').map(s => s.trim()).filter(Boolean);
    setSkillTags(prev => {
      const existing = new Set(prev.map(s => s.toLowerCase()));
      const newOnes  = parts.filter(p => !existing.has(p.toLowerCase()));
      return [...prev, ...newOnes];
    });
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkillTag(skillInput);
      setSkillInput('');
    }
    if (e.key === 'Backspace' && skillInput === '' && skillTags.length > 0) {
      setSkillTags(prev => prev.slice(0, -1));
    }
  };

  const removeTag = (idx) => setSkillTags(prev => prev.filter((_, i) => i !== idx));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    setError('');
    setResult(null);

    if (!selectedRole) { setError('Please select a target role.'); return; }
    if (!useResume && skillTags.length === 0) {
      setError('Please add at least one current skill, or enable "Use my resume skills".');
      return;
    }

    setLoading(true);
    try {
      const payload = { roleId: selectedRole };
      if (useResume && user?.id) {
        payload.userId = user.id;
      } else {
        payload.currentSkills = skillTags;
      }

      const res  = await fetch('/api/career-gap', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Analysis failed.');
      setResult(data);
      setActiveSection('missing');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => { setResult(null); setError(''); };

  // ── Severity helpers ───────────────────────────────────────────────────────
  const getSeverityLabel = (s) => ({
    ready:    { label: '🚀 Job Ready',        cls: 'cg-sev-ready' },
    partial:  { label: '⚡ Partial Readiness', cls: 'cg-sev-partial' },
    beginner: { label: '📚 Needs Growth',      cls: 'cg-sev-beginner' },
  }[s] || { label: s, cls: '' });

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="cg-page">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="cg-page-header">
        <div className="cg-page-icon">🎓</div>
        <div>
          <h1 className="cg-page-title">Career Gap Analysis</h1>
          <p className="cg-page-sub">
            Discover what skills you're missing for your target role and get personalised learning resources.
          </p>
        </div>
      </div>

      {/* ── Input Card ─────────────────────────────────────────────────────── */}
      {!result && (
        <div className="glass-card cg-input-card">

          {/* Role selector */}
          <div className="cg-section">
            <label className="cg-label" htmlFor="cg-role-select">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              Target Role
            </label>
            {loadingRoles ? (
              <div className="cg-select-placeholder">Loading roles…</div>
            ) : (
              <select
                id="cg-role-select"
                className="input-field cg-select"
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
              >
                <option value="">— Select a role —</option>
                {roles.map(r => (
                  <option key={r.roleId} value={r.roleId}>{r.name}</option>
                ))}
              </select>
            )}
            {selectedRole && roles.find(r => r.roleId === selectedRole) && (
              <p className="cg-role-desc">
                {roles.find(r => r.roleId === selectedRole).description}
              </p>
            )}
          </div>

          <div className="cg-divider" />

          {/* Skill input */}
          <div className="cg-section">
            <label className="cg-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
              </svg>
              Your Current Skills
            </label>

            {/* Resume toggle */}
            <label className="cg-toggle-row" htmlFor="cg-use-resume">
              <div className={`cg-toggle ${useResume ? 'on' : ''}`} onClick={() => setUseResume(p => !p)}>
                <div className="cg-toggle-knob" />
              </div>
              <input type="checkbox" id="cg-use-resume" style={{ display: 'none' }} checked={useResume} readOnly />
              <span className="cg-toggle-label">
                Use skills from my latest uploaded resume
              </span>
            </label>

            {!useResume && (
              <>
                {/* Tag input */}
                <div className="cg-tag-input-wrap">
                  {skillTags.map((tag, i) => (
                    <span key={i} className="cg-tag">
                      {tag}
                      <button className="cg-tag-remove" onClick={() => removeTag(i)} aria-label={`Remove ${tag}`}>×</button>
                    </span>
                  ))}
                  <input
                    id="cg-skill-input"
                    className="cg-tag-field"
                    placeholder={skillTags.length === 0 ? 'Type a skill and press Enter or comma… e.g. React, Node, MongoDB' : 'Add more…'}
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={handleSkillKeyDown}
                    onBlur={() => { if (skillInput.trim()) { addSkillTag(skillInput); setSkillInput(''); } }}
                  />
                </div>
                <p className="cg-tag-hint">
                  Press <kbd>Enter</kbd> or <kbd>,</kbd> after each skill. Backspace removes the last tag.
                </p>
              </>
            )}

            {useResume && (
              <div className="cg-resume-info">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                Skills will be extracted from your most recently uploaded resume.
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error" style={{ marginTop: '0.5rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '0.4rem', verticalAlign: 'middle' }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Analyze button */}
          <div className="jd-action-row" style={{ marginTop: '1.5rem' }}>
            <button
              id="cg-analyze-btn"
              className="btn btn-analyze"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? (
                <><span className="loader-sm" /> Analyzing…</>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Analyse My Gap
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Results ────────────────────────────────────────────────────────── */}
      {result && (
        <div className="cg-results">

          {/* ── Overview Card ── */}
          <div className="glass-card cg-overview-card">
            <div className="cg-overview-left">
              <ReadinessRing score={result.readinessScore} />
              <div className="cg-overview-meta">
                <h2 className="cg-overview-role">{result.role}</h2>
                <p className="cg-overview-desc">{result.description}</p>
                <span className={`cg-severity ${getSeverityLabel(result.severity).cls}`}>
                  {getSeverityLabel(result.severity).label}
                </span>
              </div>
            </div>

            <div className="cg-overview-right">
              {/* Sub-scores */}
              <div className="cg-sub-scores">
                <div className="cg-sub-row">
                  <span className="cg-sub-label">Required Skills</span>
                  <div className="cg-sub-bar-bg">
                    <div className="cg-sub-bar-fill cg-sub-req" style={{ width: `${result.requiredScore}%` }} />
                  </div>
                  <span className="cg-sub-pct">{result.requiredScore}%</span>
                </div>
                <div className="cg-sub-row">
                  <span className="cg-sub-label">Preferred Skills</span>
                  <div className="cg-sub-bar-bg">
                    <div className="cg-sub-bar-fill cg-sub-pref" style={{ width: `${result.preferredScore}%` }} />
                  </div>
                  <span className="cg-sub-pct">{result.preferredScore}%</span>
                </div>
              </div>

              {/* Quick stats */}
              <div className="cg-stat-grid">
                <div className="cg-stat-box cg-stat-matched">
                  <span className="cg-stat-n">{result.matchedRequired.length + result.matchedPreferred.length}</span>
                  <span className="cg-stat-l">Skills Matched</span>
                </div>
                <div className="cg-stat-box cg-stat-missing">
                  <span className="cg-stat-n">{result.allMissingSkills.length}</span>
                  <span className="cg-stat-l">Skills to Learn</span>
                </div>
                <div className="cg-stat-box cg-stat-total">
                  <span className="cg-stat-n">{result.totalRequired + result.totalPreferred}</span>
                  <span className="cg-stat-l">Role Requirements</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section Tabs ── */}
          <div className="cg-tabs">
            {[
              { key: 'missing',  label: `❌ Missing (${result.allMissingSkills.length})` },
              { key: 'matched',  label: `✅ Matched (${result.matchedRequired.length + result.matchedPreferred.length})` },
              { key: 'extra',    label: `✦ Extra (${result.extraSkills.length})` },
            ].map(tab => (
              <button
                key={tab.key}
                className={`cg-tab-btn ${activeSection === tab.key ? 'active' : ''}`}
                onClick={() => setActiveSection(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Missing Skills ── */}
          {activeSection === 'missing' && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              {result.allMissingSkills.length === 0 ? (
                <div className="cg-empty">
                  <span style={{ fontSize: '2.5rem' }}>🎉</span>
                  <p>You already have all the skills for this role!</p>
                </div>
              ) : (
                <>
                  <h3 className="cg-section-title">
                    Skills to Learn
                    <span className="cg-section-note">
                      Required skills carry more weight. Start with those first.
                    </span>
                  </h3>

                  {result.missingRequired.length > 0 && (
                    <div className="cg-missing-group">
                      <div className="cg-missing-group-header">
                        <span className="badge badge-must">Required</span>
                        <span className="cg-missing-group-count">{result.missingRequired.length} skills</span>
                      </div>
                      {result.missingRequired.map((item, i) => (
                        <MissingSkillRow key={item.name} item={item} index={i} />
                      ))}
                    </div>
                  )}

                  {result.missingPreferred.length > 0 && (
                    <div className="cg-missing-group" style={{ marginTop: result.missingRequired.length ? '1.25rem' : 0 }}>
                      <div className="cg-missing-group-header">
                        <span className="badge badge-optional">Preferred</span>
                        <span className="cg-missing-group-count">{result.missingPreferred.length} skills</span>
                      </div>
                      {result.missingPreferred.map((item, i) => (
                        <MissingSkillRow key={item.name} item={item} index={result.missingRequired.length + i} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Matched Skills ── */}
          {activeSection === 'matched' && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 className="cg-section-title">Your Matching Skills</h3>
              {(result.matchedRequired.length + result.matchedPreferred.length) === 0 ? (
                <div className="cg-empty">
                  <span style={{ fontSize: '2.5rem' }}>📭</span>
                  <p>None of your current skills matched the role requirements yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {result.matchedRequired.length > 0 && (
                    <div>
                      <p className="cg-chip-group-label">Required Skills You Have ✅</p>
                      <div className="cg-chip-grid">
                        {result.matchedRequired.map(s => <SkillChip key={s} skill={s} variant="matched" />)}
                      </div>
                    </div>
                  )}
                  {result.matchedPreferred.length > 0 && (
                    <div>
                      <p className="cg-chip-group-label">Preferred Skills You Have ✅</p>
                      <div className="cg-chip-grid">
                        {result.matchedPreferred.map(s => <SkillChip key={s} skill={s} variant="matched" />)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Extra Skills ── */}
          {activeSection === 'extra' && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 className="cg-section-title">
                Additional Skills
                <span className="cg-section-note">
                  These are on your profile but not in this role's requirements. Great for versatility!
                </span>
              </h3>
              {result.extraSkills.length === 0 ? (
                <div className="cg-empty">
                  <span style={{ fontSize: '2.5rem' }}>—</span>
                  <p>All your skills are directly relevant to this role.</p>
                </div>
              ) : (
                <div className="cg-chip-grid">
                  {result.extraSkills.map(s => <SkillChip key={s} skill={s} variant="extra" />)}
                </div>
              )}
            </div>
          )}

          {/* ── Re-analyze nudge ── */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              className="btn btn-secondary"
              style={{ gap: '0.5rem' }}
              onClick={handleReset}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.85"/>
              </svg>
              Analyse Another Role
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
