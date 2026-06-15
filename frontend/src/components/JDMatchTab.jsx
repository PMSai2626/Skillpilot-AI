import { useState, useRef, useCallback } from 'react';

// ─── Score Ring SVG ──────────────────────────────────────────────────────────
function ScoreRing({ score, color }) {
  const radius = 52;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;

  return (
    <svg viewBox="0 0 120 120">
      {/* track */}
      <circle
        cx="60" cy="60" r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="10"
      />
      {/* fill */}
      <circle
        cx="60" cy="60" r={radius}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 60 60)"
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  );
}

// ─── Stat Bar ────────────────────────────────────────────────────────────────
function StatBar({ label, value, colorClass }) {
  return (
    <div className="jd-stat-item">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="jd-stat-label">{label}</span>
        <span className="jd-stat-val">{value}%</span>
      </div>
      <div className="jd-stat-bar-bg">
        <div
          className={`jd-stat-bar-fill ${colorClass}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function JDMatchTab({
  result, setResult,
  resumeMode, setResumeMode,
  resumeFile, setResumeFile,
  resumeText, setResumeText,
  jdText,    setJdText,
}) {
  // Local-only UI state (fine to reset on hide/show)
  const [isDragging, setIsDragging] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const fileInputRef = useRef(null);

  // ── Drag & drop ────────────────────────────────────────────────────────────
  const onDragOver = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback(() => setIsDragging(false), []);
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setResumeFile(f);
  }, []);

  const onFileChange = (e) => {
    if (e.target.files[0]) setResumeFile(e.target.files[0]);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    setError('');
    setResult(null);

    // Validation
    if (resumeMode === 'file' && !resumeFile) {
      setError('Please upload a resume file (PDF, DOCX, or TXT).');
      return;
    }
    if (resumeMode === 'paste' && !resumeText.trim()) {
      setError('Please paste your resume text.');
      return;
    }
    if (!jdText.trim()) {
      setError('Please paste the job description.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('job_description', jdText.trim());

      if (resumeMode === 'file') {
        formData.append('file', resumeFile);
      } else {
        formData.append('resume_text', resumeText.trim());
      }

      const res  = await fetch('/api/resumes/match-jd', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Match analysis failed.');
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Verdict helpers ────────────────────────────────────────────────────────
  const getVerdict = (score) => {
    if (score >= 70) return { cls: 'jd-verdict-strong', label: '🎯 Strong Match', color: '#00dfd8' };
    if (score >= 40) return { cls: 'jd-verdict-partial', label: '⚡ Partial Match', color: '#f59e0b' };
    return { cls: 'jd-verdict-weak', label: '⚠ Weak Match', color: '#ff4444' };
  };

  const getTips = (result) => {
    const { missingSkills, matchScore } = result;
    if (matchScore >= 70) {
      return 'Great job! Your resume aligns well with this role. Review any missing skills and consider adding them to strengthen your application further.';
    }
    if (missingSkills.length > 0) {
      return `Add these missing keywords to your resume to significantly improve your ATS pass rate: ${missingSkills.slice(0, 5).join(', ')}${missingSkills.length > 5 ? ` and ${missingSkills.length - 5} more` : ''}.`;
    }
    return 'Tailor your resume by incorporating specific keywords and phrases from the job description to improve your match score.';
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const verdict = result ? getVerdict(result.matchScore) : null;

  return (
    <div className="jd-page">
      {/* Page Header */}
      <div className="jd-page-header">
        <div className="jd-page-icon">🎯</div>
        <div>
          <h1 className="jd-page-title">JD Match Analyzer</h1>
          <p className="jd-page-sub">
            Compare your resume against a job description to measure your ATS compatibility.
          </p>
        </div>
      </div>

      {/* Input Card */}
      <div className="glass-card" style={{ padding: '1.75rem' }}>
        <div className="jd-split">
          {/* ── Left: Resume ── */}
          <div className="jd-panel">
            <div className="jd-panel-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              Your Resume
            </div>

            {resumeMode === 'file' ? (
              <>
                <div
                  className={`jd-resume-zone ${isDragging ? 'dragging' : ''} ${resumeFile ? 'has-file' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                >
                  {resumeFile ? (
                    <>
                      <div className="jd-resume-zone-icon">✅</div>
                      <div className="jd-resume-zone-filename">{resumeFile.name}</div>
                      <div className="jd-resume-zone-text">
                        {(resumeFile.size / 1024).toFixed(1)} KB — click to replace
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="jd-resume-zone-icon">📄</div>
                      <div className="jd-resume-zone-text">
                        <strong>Drop your resume here</strong>
                        <br />or click to browse
                        <br /><span style={{ opacity: 0.7 }}>PDF, DOCX, or TXT</span>
                      </div>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    style={{ display: 'none' }}
                    onChange={onFileChange}
                  />
                </div>
                <div className="jd-toggle-row">
                  <span>Or</span>
                  <button className="jd-toggle-btn" onClick={() => { setResumeMode('paste'); setResumeFile(null); }}>
                    paste resume text instead
                  </button>
                </div>
              </>
            ) : (
              <>
                <textarea
                  id="jd-resume-paste"
                  className="jd-textarea"
                  placeholder={`Paste your resume text here…\n\nInclude your skills, experience, education, and projects for the best match.`}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  style={{ minHeight: '220px' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="jd-toggle-row" style={{ justifyContent: 'flex-start' }}>
                    <button className="jd-toggle-btn" onClick={() => { setResumeMode('file'); setResumeText(''); }}>
                      ← upload a file instead
                    </button>
                  </div>
                  <span className="jd-char-count">{resumeText.length} chars</span>
                </div>
              </>
            )}
          </div>

          {/* ── Right: Job Description ── */}
          <div className="jd-panel">
            <div className="jd-panel-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              Job Description
            </div>
            <textarea
              id="jd-description-input"
              className="jd-textarea"
              placeholder={`Paste the full job description here…\n\nExample:\nWe are looking for a React Developer with experience in Node.js, Docker, and AWS. Must know CI/CD pipelines and MongoDB.`}
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              style={{ flex: 1, minHeight: '240px' }}
            />
            <div className="jd-char-count">{jdText.length} chars</div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="auth-error" style={{ marginTop: '1rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display:'inline', marginRight:'0.4rem', verticalAlign:'middle' }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Analyze Button */}
        <div className="jd-action-row" style={{ marginTop: '1.5rem' }}>
          <button
            id="jd-analyze-btn"
            className="btn btn-analyze"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loader-sm" />
                Analyzing…
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Analyze Match
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Results ── */}
      {result && verdict && (
        <div className="jd-results">

          {/* Score card */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--text-muted)' }}>
              Match Results
            </h2>

            <div className="jd-score-row">
              {/* Ring */}
              <div className="jd-score-block">
                <div className="jd-score-ring-wrap">
                  <ScoreRing score={result.matchScore} color={verdict.color} />
                  <div className="jd-score-center">
                    <span className="jd-score-num" style={{ color: verdict.color }}>
                      {result.matchScore}
                    </span>
                    <span className="jd-score-pct">/ 100</span>
                  </div>
                </div>
                <div className={`jd-verdict ${verdict.cls}`}>
                  {verdict.label}
                </div>
              </div>

              {/* Stat bars */}
              <div className="jd-stats-grid">
                <StatBar
                  label="Skill Match"
                  value={result.skillMatchScore}
                  colorClass="cyan"
                />
                <StatBar
                  label="Keyword Coverage"
                  value={result.keywordCoverage}
                  colorClass="purple"
                />
                <div className="jd-stat-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="jd-stat-label">JD Skills Detected</span>
                    <span className="jd-stat-val" style={{ color: 'var(--accent-cyan)' }}>
                      {result.totalJdSkills}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                    <span className="jd-stat-label">Resume Skills Detected</span>
                    <span className="jd-stat-val" style={{ color: 'var(--accent-cyan)' }}>
                      {result.totalResumeSkills}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Skill Chips */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <div className="jd-skills-section">
              {/* Found */}
              <div className="jd-skills-panel">
                <div className="jd-skills-heading" style={{ color: 'var(--success)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Found Skills
                  <span className="count-badge">{result.foundSkills.length}</span>
                </div>
                <div className="chip-grid">
                  {result.foundSkills.length > 0 ? (
                    result.foundSkills.map((skill) => (
                      <span key={skill} className="skill-chip chip-found">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="chip-empty">No matching skills found in JD ontology</span>
                  )}
                </div>
              </div>

              {/* Missing */}
              <div className="jd-skills-panel">
                <div className="jd-skills-heading" style={{ color: 'var(--danger)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Missing Skills
                  <span className="count-badge">{result.missingSkills.length}</span>
                </div>
                <div className="chip-grid">
                  {result.missingSkills.length > 0 ? (
                    result.missingSkills.map((skill) => (
                      <span key={skill} className="skill-chip chip-missing">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="chip-empty">🎉 Your resume covers all detected skills!</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="jd-tips">
            <span className="jd-tips-icon">💡</span>
            <div>
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                How to improve your score:&nbsp;
              </strong>
              {getTips(result)}
            </div>
          </div>

          {/* Re-analyze nudge */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              className="btn btn-secondary"
              style={{ gap: '0.5rem' }}
              onClick={() => { setResult(null); setError(''); }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.85"/>
              </svg>
              Analyze Another JD
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
