import { useState, useEffect } from 'react';

// ─── Score Progression Chart ──────────────────────────────────────────────────
function ScoreProgressionChart({ data }) {
  if (!data || data.length < 2) {
    return (
      <div className="hist-empty-chart">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <p>Upload at least 2 resumes to see your score progression.</p>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => a.versionNumber - b.versionNumber);
  const W = 700, H = 180, PADX = 40, PADY = 28;
  const scores = sorted.map(d => d.overallScore);
  const minS = Math.max(0, Math.min(...scores) - 12);
  const maxS = Math.min(100, Math.max(...scores) + 12);

  const xOf = (i) => PADX + (i / (sorted.length - 1)) * (W - PADX * 2);
  const yOf = (s) => PADY + (1 - (s - minS) / (maxS - minS)) * (H - PADY * 2);

  const pathD = sorted.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xOf(i).toFixed(1)} ${yOf(d.overallScore).toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${xOf(sorted.length - 1).toFixed(1)} ${H} L ${xOf(0).toFixed(1)} ${H} Z`;

  const latestScore  = scores[scores.length - 1];
  const firstScore   = scores[0];
  const improvement  = latestScore - firstScore;
  const bestScore    = Math.max(...scores);
  const bestIdx      = scores.indexOf(bestScore);

  const scoreColor = (s) => s >= 80 ? '#00dfd8' : s >= 60 ? '#f59e0b' : '#ff4444';

  // Show only every Nth label to avoid crowding
  const labelStep = sorted.length > 20 ? Math.ceil(sorted.length / 12) : 1;

  return (
    <div className="hist-chart-wrap">

      {/* Stats row */}
      <div className="hist-chart-stats">
        <div className="hist-stat">
          <div className="hist-stat-label">Latest Score</div>
          <div className="hist-stat-value" style={{ color: scoreColor(latestScore) }}>{latestScore}</div>
        </div>
        <div className="hist-stat-divider" />
        <div className="hist-stat">
          <div className="hist-stat-label">Total Growth</div>
          <div className="hist-stat-value" style={{ color: improvement >= 0 ? '#00dfd8' : '#ff4444' }}>
            {improvement >= 0 ? '+' : ''}{improvement} pts
          </div>
        </div>
        <div className="hist-stat-divider" />
        <div className="hist-stat">
          <div className="hist-stat-label">Best Score</div>
          <div className="hist-stat-value" style={{ color: '#f59e0b' }}>🏆 {bestScore}</div>
        </div>
        <div className="hist-stat-divider" />
        <div className="hist-stat">
          <div className="hist-stat-label">Versions</div>
          <div className="hist-stat-value" style={{ color: 'var(--primary)' }}>{sorted.length}</div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="hist-chart-svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
          <defs>
            <linearGradient id="histAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00dfd8" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#00dfd8" stopOpacity="0" />
            </linearGradient>
            <filter id="glowFilter">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Horizontal grid lines */}
          {[0, 25, 50, 75, 100].filter(s => s >= minS - 5 && s <= maxS + 5).map(s => {
            const y = yOf(s);
            return (
              <g key={s}>
                <line x1={PADX} y1={y} x2={W - PADX} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                <text x={PADX - 6} y={y + 4} fontSize="10" fill="rgba(148,163,184,0.6)" textAnchor="end">{s}</text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill="url(#histAreaGrad)" />

          {/* Line */}
          <path d={pathD} fill="none" stroke="#00dfd8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Best score highlight pulse */}
          <circle cx={xOf(bestIdx)} cy={yOf(bestScore)} r="10" fill="rgba(245,158,11,0.15)" />
          <circle cx={xOf(bestIdx)} cy={yOf(bestScore)} r="6" fill="rgba(245,158,11,0.25)" />

          {/* Data points */}
          {sorted.map((d, i) => {
            const isBest   = i === bestIdx;
            const isLatest = i === sorted.length - 1;
            const color    = isBest ? '#f59e0b' : isLatest ? '#00dfd8' : scoreColor(d.overallScore);
            const showLabel = i === 0 || i === sorted.length - 1 || i === bestIdx || i % labelStep === 0;
            return (
              <g key={i}>
                {showLabel && (
                  <text
                    x={xOf(i)} y={yOf(d.overallScore) - 12}
                    fontSize="11" fill={color} textAnchor="middle" fontWeight="700" fontFamily="Outfit,sans-serif"
                  >
                    {d.overallScore}
                  </text>
                )}
                <circle
                  cx={xOf(i)} cy={yOf(d.overallScore)}
                  r={isBest || isLatest ? 6 : 4}
                  fill="#070913"
                  stroke={color}
                  strokeWidth={isBest || isLatest ? 2.5 : 1.8}
                  filter={isBest || isLatest ? 'url(#glowFilter)' : undefined}
                />
                {/* Version label on X axis */}
                {showLabel && (
                  <text
                    x={xOf(i)} y={H - 4}
                    fontSize="9" fill="rgba(148,163,184,0.65)" textAnchor="middle"
                  >
                    V{d.versionNumber}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="hist-chart-legend">
        <span className="hist-legend-item"><span className="hist-legend-dot" style={{ background: '#00dfd8', boxShadow: '0 0 6px #00dfd888' }} />Score</span>
        <span className="hist-legend-item"><span className="hist-legend-dot" style={{ background: '#f59e0b', boxShadow: '0 0 6px #f59e0b88' }} />Best Score</span>
        <span className="hist-legend-item"><span className="hist-legend-dot" style={{ background: '#7928ca', boxShadow: '0 0 6px #7928ca88' }} />Current</span>
      </div>
    </div>
  );
}

// ─── Diff Viewer ──────────────────────────────────────────────────────────────
function DiffViewer({ textA, textB, labelA, labelB, scoreA, scoreB }) {
  const linesA = (textA || '').split('\n').filter(l => l.trim());
  const linesB = (textB || '').split('\n').filter(l => l.trim());
  const setA = new Set(linesA.map(l => l.trim().toLowerCase()));
  const setB = new Set(linesB.map(l => l.trim().toLowerCase()));

  const scoreCls = (s) => s >= 80 ? 'score-high' : s >= 60 ? 'score-mid' : 'score-low';

  const renderLines = (lines, otherSet, side) =>
    lines.slice(0, 60).map((line, i) => {
      const key = line.trim().toLowerCase();
      const isNew = !otherSet.has(key) && line.trim();
      return (
        <div key={i} style={{
          padding: '0.22rem 0.6rem',
          marginBottom: '0.1rem',
          borderRadius: '4px',
          fontSize: '0.8rem',
          lineHeight: 1.55,
          color: isNew ? (side === 'right' ? 'var(--success)' : 'var(--danger)') : 'var(--text-sub)',
          background: isNew ? (side === 'right' ? 'rgba(0,223,216,0.07)' : 'rgba(255,68,68,0.07)') : 'transparent',
          borderLeft: isNew ? `3px solid ${side === 'right' ? 'var(--accent-cyan)' : 'var(--danger)'}` : '3px solid transparent',
          wordBreak: 'break-word',
        }}>
          {line}
        </div>
      );
    });

  return (
    <div className="compare-container">
      <div className="glass-card hist-diff-panel">
        <div className="hist-diff-header">
          <div>
            <div className="hist-diff-label">{labelA}</div>
            <div className="hist-diff-hint" style={{ color: 'var(--danger)' }}>— Removed lines highlighted</div>
          </div>
          <div className={`score-pill ${scoreCls(scoreA)}`}>{scoreA}</div>
        </div>
        <div className="hist-diff-body">
          {textA ? renderLines(linesA, setB, 'left') : <div className="hist-diff-empty">No text available.</div>}
        </div>
      </div>

      <div className="glass-card hist-diff-panel">
        <div className="hist-diff-header">
          <div>
            <div className="hist-diff-label">{labelB}</div>
            <div className="hist-diff-hint" style={{ color: 'var(--accent-cyan)' }}>+ Added lines highlighted</div>
          </div>
          <div className={`score-pill ${scoreCls(scoreB)}`}>{scoreB}</div>
        </div>
        <div className="hist-diff-body">
          {textB ? renderLines(linesB, setA, 'right') : <div className="hist-diff-empty">No text available.</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Version Card (list view) ─────────────────────────────────────────────────
function VersionCard({ item, idx, prev, isLatest, onSelect, onDelete }) {
  const delta = prev ? item.overallScore - prev.overallScore : null;
  const color  = item.overallScore >= 80 ? 'var(--success)' : item.overallScore >= 60 ? 'var(--warning)' : 'var(--danger)';
  const scoreCls = item.overallScore >= 80 ? 'score-high' : item.overallScore >= 60 ? 'score-mid' : 'score-low';

  return (
    <div className={`hist-ver-card ${isLatest ? 'hist-ver-latest' : ''}`}>
      {/* Left: version badge */}
      <div className="hist-ver-badge-col">
        <div className="hist-ver-badge" style={{ background: `${color}18`, borderColor: `${color}33`, color }}>
          V{item.versionNumber}
        </div>
        {idx < 100 && <div className="hist-ver-connector" />}
      </div>

      {/* Middle: info */}
      <div className="hist-ver-info">
        <div className="hist-ver-name">{item.title}</div>
        <div className="hist-ver-meta">
          {isLatest && <span className="hist-latest-tag">✦ Latest</span>}
          {delta !== null && (
            <span className="hist-delta" style={{ color: delta >= 0 ? 'var(--success)' : 'var(--danger)', background: delta >= 0 ? 'rgba(0,223,216,0.08)' : 'rgba(255,68,68,0.08)', borderColor: delta >= 0 ? 'rgba(0,223,216,0.2)' : 'rgba(255,68,68,0.2)' }}>
              {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)} pts
            </span>
          )}
        </div>
      </div>

      {/* Right: score + actions */}
      <div className="hist-ver-right">
        <div className={`score-pill ${scoreCls}`}>{item.overallScore}</div>
        <button className="btn btn-secondary btn-small" onClick={() => onSelect(item)}>
          Compare
        </button>
        <button className="hist-del-btn" onClick={() => onDelete(item)} title="Delete">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Main History Tab ─────────────────────────────────────────────────────────
export default function HistoryTab({ user, history, onUploadClick, onDeleteResume }) {
  const [selectedA,    setSelectedA]    = useState(null);
  const [selectedB,    setSelectedB]    = useState(null);
  const [detailA,      setDetailA]      = useState(null);
  const [detailB,      setDetailB]      = useState(null);
  const [loadingA,     setLoadingA]     = useState(false);
  const [loadingB,     setLoadingB]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting,   setIsDeleting]   = useState(false);

  const sortedHistory = [...history].sort((a, b) => a.versionNumber - b.versionNumber);

  useEffect(() => {
    if (history.length >= 2) {
      const s = [...history].sort((a, b) => a.versionNumber - b.versionNumber);
      setSelectedA(s[0]);
      setSelectedB(s[s.length - 1]);
    } else if (history.length === 1) {
      setSelectedA(history[0]);
      setSelectedB(null);
    }
  }, [history]);

  const fetchDetail = async (item, setSide, setLoading) => {
    if (!item) { setSide(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/resumes/${item.resumeId}/analysis`);
      if (res.ok) setSide(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDetail(selectedA, setDetailA, setLoadingA); }, [selectedA]);
  useEffect(() => { fetchDetail(selectedB, setDetailB, setLoadingB); }, [selectedB]);

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/resumes/${deleteConfirm.resumeId}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedA?.resumeId === deleteConfirm.resumeId) setSelectedA(null);
        if (selectedB?.resumeId === deleteConfirm.resumeId) setSelectedB(null);
        if (typeof onDeleteResume === 'function') onDeleteResume(deleteConfirm.resumeId);
      }
    } catch (e) { console.error(e); }
    finally { setIsDeleting(false); setDeleteConfirm(null); }
  };

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (history.length === 0) {
    return (
      <div className="hist-empty-page">
        <div className="hist-empty-icon">📂</div>
        <h3 className="hist-empty-title">No Upload History Yet</h3>
        <p className="hist-empty-sub">Upload your first resume to start tracking score improvements over time.</p>
        <button className="btn" onClick={onUploadClick}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
          </svg>
          Upload Your First Resume
        </button>
      </div>
    );
  }

  return (
    <div className="hist-page">

      {/* ── Section 1: Score Progression ────────────────────────── */}
      <div className="glass-card hist-prog-card">
        <div className="hist-section-hdr">
          <div className="hist-section-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
          <div>
            <h2 className="hist-section-title">Score Progression</h2>
            <p className="hist-section-sub">Track how your ATS score evolved with every resume revision.</p>
          </div>
        </div>
        <ScoreProgressionChart data={sortedHistory} />
      </div>

      {/* ── Section 2: Side-by-Side Comparison ──────────────────── */}
      {history.length >= 2 && (
        <div className="glass-card hist-compare-card">
          <div className="hist-section-hdr">
            <div className="hist-section-icon" style={{ background: 'rgba(121,40,202,0.12)', borderColor: 'rgba(121,40,202,0.2)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="18"/>
              </svg>
            </div>
            <div>
              <h2 className="hist-section-title">Side-by-Side Comparison</h2>
              <p className="hist-section-sub">Select two versions to compare content changes and score differences.</p>
            </div>
          </div>

          {/* Version pickers */}
          <div className="hist-picker-row">
            <div className="hist-picker-group">
              <label className="hist-picker-label">
                <span className="hist-picker-dot" style={{ background: 'var(--danger)' }} />
                Base Version
              </label>
              <select
                className="hist-select"
                value={selectedA?.resumeId || ''}
                onChange={e => setSelectedA(history.find(h => h.resumeId === Number(e.target.value)) || null)}
              >
                <option value="">— Select version —</option>
                {sortedHistory.map(item => (
                  <option key={item.resumeId} value={item.resumeId}>
                    V{item.versionNumber} — {item.title} (Score: {item.overallScore})
                  </option>
                ))}
              </select>
            </div>

            <div className="hist-picker-swap">
              <button
                className="hist-swap-btn"
                onClick={() => { const tmp = selectedA; setSelectedA(selectedB); setSelectedB(tmp); }}
                title="Swap versions"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                  <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
              </button>
            </div>

            <div className="hist-picker-group">
              <label className="hist-picker-label">
                <span className="hist-picker-dot" style={{ background: 'var(--accent-cyan)' }} />
                Compare Version
              </label>
              <select
                className="hist-select"
                value={selectedB?.resumeId || ''}
                onChange={e => setSelectedB(history.find(h => h.resumeId === Number(e.target.value)) || null)}
              >
                <option value="">— Select version —</option>
                {sortedHistory.map(item => (
                  <option key={item.resumeId} value={item.resumeId}>
                    V{item.versionNumber} — {item.title} (Score: {item.overallScore})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Score delta indicator */}
          {selectedA && selectedB && (
            <div className="hist-delta-bar">
              <div className="hist-delta-side">
                <span className="hist-delta-ver">V{selectedA.versionNumber}</span>
                <span className={`score-pill ${selectedA.overallScore >= 80 ? 'score-high' : selectedA.overallScore >= 60 ? 'score-mid' : 'score-low'}`}>{selectedA.overallScore}</span>
              </div>
              <div className="hist-delta-arrow">
                {(() => {
                  const diff = selectedB.overallScore - selectedA.overallScore;
                  return (
                    <span className="hist-delta-chip" style={{ color: diff >= 0 ? 'var(--success)' : 'var(--danger)', background: diff >= 0 ? 'rgba(0,223,216,0.1)' : 'rgba(255,68,68,0.1)', borderColor: diff >= 0 ? 'rgba(0,223,216,0.25)' : 'rgba(255,68,68,0.25)' }}>
                      {diff >= 0 ? '▲' : '▼'} {Math.abs(diff)} pts
                    </span>
                  );
                })()}
              </div>
              <div className="hist-delta-side">
                <span className="hist-delta-ver">V{selectedB.versionNumber}</span>
                <span className={`score-pill ${selectedB.overallScore >= 80 ? 'score-high' : selectedB.overallScore >= 60 ? 'score-mid' : 'score-low'}`}>{selectedB.overallScore}</span>
              </div>
            </div>
          )}

          {/* Diff view */}
          {(loadingA || loadingB) ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem' }}>
              <div className="loader" />
            </div>
          ) : selectedA && selectedB && detailA && detailB ? (
            <DiffViewer
              textA={detailA.extractedText}
              textB={detailB.extractedText}
              labelA={`V${selectedA.versionNumber} — ${selectedA.title}`}
              labelB={`V${selectedB.versionNumber} — ${selectedB.title}`}
              scoreA={selectedA.overallScore}
              scoreB={selectedB.overallScore}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Select both versions above to start comparing.
            </div>
          )}
        </div>
      )}

      {/* ── Section 3: Version Timeline ─────────────────────────── */}
      <div className="glass-card hist-timeline-card">
        <div className="hist-section-hdr">
          <div className="hist-section-icon" style={{ background: 'rgba(0,114,245,0.12)', borderColor: 'rgba(0,114,245,0.2)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </div>
          <div>
            <h2 className="hist-section-title">Version Timeline</h2>
            <p className="hist-section-sub">All {history.length} resume versions, most recent first.</p>
          </div>
        </div>

        <div className="hist-ver-list">
          {sortedHistory.slice().reverse().map((item, idx) => {
            const realIdx = sortedHistory.length - 1 - idx;
            const prev = realIdx > 0 ? sortedHistory[realIdx - 1] : null;
            const isLatest = idx === 0;
            return (
              <VersionCard
                key={item.resumeId}
                item={item}
                idx={idx}
                prev={prev}
                isLatest={isLatest}
                onSelect={(item) => {
                  setSelectedB(item);
                  document.querySelector('.hist-compare-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                onDelete={(item) => setDeleteConfirm({ resumeId: item.resumeId, title: item.title })}
              />
            );
          })}
        </div>
      </div>

      {/* ── Delete Confirmation Modal ─────────────────────────────── */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', animation: 'fadeIn 0.18s ease',
        }}>
          <div className="glass-card" style={{
            maxWidth: '420px', width: '100%', padding: '2.25rem',
            border: '1px solid rgba(255,68,68,0.3)',
            boxShadow: '0 0 60px rgba(255,68,68,0.12)',
            animation: 'slideUp 0.22s ease', textAlign: 'center',
          }}>
            <div style={{ width: 56, height: 56, borderRadius: '16px', background: 'rgba(255,68,68,0.12)', border: '1px solid rgba(255,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.5rem' }}>🗑️</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.5rem' }}>Delete Resume Version?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>You are about to permanently delete:</p>
            <div style={{ background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.15)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontWeight: 600, wordBreak: 'break-word', fontSize: '0.9rem' }}>
              "{deleteConfirm.title}"
            </div>
            <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginBottom: '1.75rem' }}>⚠️ This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)} disabled={isDeleting} style={{ minWidth: '110px' }}>Cancel</button>
              <button onClick={handleDeleteConfirmed} disabled={isDeleting} style={{
                minWidth: '110px', background: 'linear-gradient(135deg,#ff4444,#cc0000)',
                color: '#fff', border: 'none', borderRadius: '10px',
                padding: '0.65rem 1.25rem', fontFamily: 'var(--font-display)',
                fontWeight: 600, fontSize: '0.9rem',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                opacity: isDeleting ? 0.6 : 1, transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center',
              }}>
                {isDeleting ? <><span className="loader-sm" /> Deleting…</> : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
