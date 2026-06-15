import { useState } from 'react';
import ProfileEditModal from './ProfileEditModal';

// Helper: compute ATS Journey Level from best score
function getJourneyLevel(bestScore) {
  if (bestScore >= 90) return { label: 'ATS Expert',      emoji: '🏆', color: '#f59e0b', next: 100, from: 90 };
  if (bestScore >= 80) return { label: 'Resume Pro',      emoji: '🚀', color: '#10b981', next: 90,  from: 80 };
  if (bestScore >= 65) return { label: 'Job Ready',       emoji: '⚡', color: '#3b82f6', next: 80,  from: 65 };
  if (bestScore >= 50) return { label: 'Rising Talent',   emoji: '📈', color: '#8b5cf6', next: 65,  from: 50 };
  return                       { label: 'Getting Started', emoji: '🌱', color: '#06b6d4', next: 50,  from: 0  };
}

function getBadgeClass(role) {
  if (role === 'admin')  return 'badge-admin';
  if (role === 'mentor') return 'badge-mentor';
  return 'badge-student';
}

function getRoleDisplay(role) {
  if (role === 'admin')  return { icon: '🛡️', label: 'Admin'      };
  if (role === 'mentor') return { icon: '🎓', label: 'Mentor'     };
  return                        { icon: '🎯', label: 'Job Seeker'  };
}

// ─── Rich Score Chart (Dashboard) ────────────────────────────────────────────
function ScoreTrendChart({ data }) {
  if (!data || data.length < 2) {
    return (
      <div className="dash-empty-mini">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <p>Upload 2+ resumes to see your score trend.</p>
      </div>
    );
  }

  const sorted    = [...data].sort((a, b) => a.versionNumber - b.versionNumber);
  const chartData  = sorted.slice(-5);  // ← last 5 versions for the chart
  const W = 620, H = 180, PADX = 36, PADY = 28;

  // Chart uses only last 5
  const chartScores = chartData.map(d => d.overallScore);
  const minS = Math.max(0,   Math.min(...chartScores) - 12);
  const maxS = Math.min(100, Math.max(...chartScores) + 12);

  // All-time stats
  const allScores   = sorted.map(d => d.overallScore);
  const bestScore   = Math.max(...allScores);
  const bestIdx     = chartScores.indexOf(Math.max(...chartScores)); // best within visible window
  const latestScore = allScores[allScores.length - 1];
  const improvement = latestScore - allScores[0];  // first ever → latest

  const xOf = (i) => PADX + (i / Math.max(chartData.length - 1, 1)) * (W - PADX * 2);
  const yOf = (s) => PADY + (1 - (s - minS) / (maxS - minS)) * (H - PADY * 2);

  const pathD = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xOf(i).toFixed(1)} ${yOf(d.overallScore).toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${xOf(chartData.length - 1).toFixed(1)} ${H} L ${xOf(0).toFixed(1)} ${H} Z`;

  const scoreColor = (s) => s >= 80 ? '#06b6d4' : s >= 60 ? '#f59e0b' : '#f43f5e';

  // Stat strip — all-time numbers
  const stats = [
    { label: 'Latest',   value: latestScore,                                         color: scoreColor(latestScore) },
    { label: 'Growth',   value: `${improvement >= 0 ? '+' : ''}${improvement} pts`,  color: improvement >= 0 ? '#06b6d4' : '#f43f5e' },
    { label: 'Best',     value: `🏆 ${bestScore}`,                                    color: '#f59e0b' },
    { label: 'Versions', value: sorted.length,                                        color: '#8b5cf6' },
  ];


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Stat strip */}
      <div className="dash-chart-stats">
        {stats.map((s, i) => (
          <div key={i} className="dash-chart-stat">
            <div className="dash-chart-stat-label">{s.label}</div>
            <div className="dash-chart-stat-val" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* SVG Chart */}
      <div className="dash-chart-svg-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }}>
          <defs>
            <linearGradient id="dashRichGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0"    />
            </linearGradient>
            <filter id="dashGlow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {[25, 50, 75, 100].filter(s => s >= minS - 5 && s <= maxS + 5).map(s => {
            const y = yOf(s);
            return (
              <g key={s}>
                <line x1={PADX} y1={y} x2={W - PADX} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="4 4" />
                <text x={PADX - 6} y={y + 4} fontSize="9" fill="rgba(148,163,184,0.55)" textAnchor="end">{s}</text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill="url(#dashRichGrad)" />

          {/* Line */}
          <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Best-score pulse rings — highlight best in the visible 5 */}
          {(() => {
            const visibleBestScore = Math.max(...chartScores);
            const visibleBestIdx   = chartScores.lastIndexOf(visibleBestScore);
            return (
              <>
                <circle cx={xOf(visibleBestIdx)} cy={yOf(visibleBestScore)} r="14" fill="rgba(245,158,11,0.08)" />
                <circle cx={xOf(visibleBestIdx)} cy={yOf(visibleBestScore)} r="8"  fill="rgba(245,158,11,0.18)" />
              </>
            );
          })()}

          {/* Data points + labels — all 5 points always labeled */}
          {chartData.map((d, i) => {
            const isBest   = i === chartData.length - 1 - [...chartScores].reverse().indexOf(Math.max(...chartScores)); // best in window
            const isLatest = i === chartData.length - 1;
            const isFirst  = i === 0;
            const color    = (Math.max(...chartScores) === d.overallScore && isBest) ? '#f59e0b'
              : isLatest ? '#06b6d4'
              : scoreColor(d.overallScore);
            return (
              <g key={i}>
                {/* Score label above dot — always shown for all 5 */}
                <text
                  x={xOf(i)} y={yOf(d.overallScore) - 11}
                  fontSize="12" fill={color} textAnchor="middle"
                  fontWeight="700" fontFamily="Outfit,sans-serif"
                >
                  {d.overallScore}
                </text>
                {/* Dot */}
                <circle
                  cx={xOf(i)} cy={yOf(d.overallScore)}
                  r={isLatest ? 7 : (Math.max(...chartScores) === d.overallScore ? 6 : 5)}
                  fill="#060b18"
                  stroke={color}
                  strokeWidth={isLatest || Math.max(...chartScores) === d.overallScore ? 2.5 : 2}
                  filter={isLatest || Math.max(...chartScores) === d.overallScore ? 'url(#dashGlow)' : undefined}
                />
                {/* Version label below — always shown */}
                <text x={xOf(i)} y={H - 4} fontSize="10" fill={isLatest ? '#06b6d4' : 'rgba(148,163,184,0.7)'} textAnchor="middle" fontWeight={isLatest ? '700' : '400'}>
                  V{d.versionNumber}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="dash-chart-legend">
        <span className="dash-chart-legend-item"><span style={{ background: '#06b6d4', boxShadow: '0 0 6px #06b6d488' }} className="dash-chart-legend-dot"/>Score</span>
        <span className="dash-chart-legend-item"><span style={{ background: '#f59e0b', boxShadow: '0 0 6px #f59e0b88' }} className="dash-chart-legend-dot"/>Best</span>
        <span className="dash-chart-legend-item"><span style={{ background: '#f43f5e', boxShadow: '0 0 6px #f43f5e88' }} className="dash-chart-legend-dot"/>Below 60</span>
      </div>
    </div>
  );
}

// ─── Score Ring (mini) ─────────────────────────────────────────────────────────
function ScoreRingMini({ score }) {
  const r = 28, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#00dfd8' : score >= 60 ? '#f59e0b' : '#ff4444';
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="7"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        transform="rotate(-90 36 36)"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${color}88)` }}
      />
      <text x="36" y="41" textAnchor="middle" fontSize="14" fontWeight="700" fill={color} fontFamily="Outfit,sans-serif">{score}</text>
    </svg>
  );
}

// ─── Delete Modal ──────────────────────────────────────────────────────────────
function DeleteModal({ confirm, isDeleting, onCancel, onConfirm }) {
  return (
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
        animation: 'slideUp 0.22s ease',
        textAlign: 'center',
      }}>
        <div style={{ width: 56, height: 56, borderRadius: '16px', background: 'rgba(255,68,68,0.12)', border: '1px solid rgba(255,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: '1.5rem' }}>🗑️</div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.5rem' }}>Delete Resume Version?</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>You are about to permanently delete:</p>
        <div style={{ background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.15)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontWeight: 600, wordBreak: 'break-word', fontSize: '0.9rem' }}>
          "{confirm.title}"
        </div>
        <p style={{ color: 'var(--danger)', fontSize: '0.82rem', marginBottom: '1.75rem' }}>⚠️ This action cannot be undone.</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={onCancel} disabled={isDeleting} style={{ minWidth: '110px' }}>Cancel</button>
          <button onClick={onConfirm} disabled={isDeleting} style={{
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
  );
}

// ─── Main Dashboard Tab ────────────────────────────────────────────────────────
export default function DashboardTab({ user, history, onUploadClick, onLogout, onDeleteResume, onUserUpdate }) {
  const sorted = [...history].sort((a, b) => a.versionNumber - b.versionNumber);
  const latest = sorted[sorted.length - 1];
  const first  = sorted[0];
  const prev   = sorted[sorted.length - 2];
  const delta  = latest && prev ? latest.overallScore - prev.overallScore : null;
  const totalGrowth = latest && first ? latest.overallScore - first.overallScore : null;

  const [deleteConfirm,  setDeleteConfirm]  = useState(null);
  const [isDeleting,     setIsDeleting]     = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/resumes/${deleteConfirm.resumeId}`, { method: 'DELETE' });
      if (res.ok && typeof onDeleteResume === 'function') onDeleteResume(deleteConfirm.resumeId);
    } catch (err) { console.error(err); }
    finally { setIsDeleting(false); setDeleteConfirm(null); }
  };

  const scoreColor = (s) => s >= 80 ? 'var(--success)' : s >= 60 ? 'var(--warning)' : 'var(--danger)';
  const scoreCls   = (s) => s >= 80 ? 'score-high'     : s >= 60 ? 'score-mid'      : 'score-low';

  return (
    <div className="dash-page">

      {/* ── Hero Banner ────────────────────────────────── */}
      <div className="dash-hero">
        <div className="dash-hero-bg" />
        <div className="dash-hero-orb-1" />
        <div className="dash-hero-orb-2" />
        <div className="dash-hero-content">
          <div className="dash-hero-left">
            <div className="dash-hero-avatar">{user.name[0].toUpperCase()}</div>
            <div>
              <h1 className="dash-hero-title">Welcome back, {user.name.split(' ')[0]}! 👋</h1>
              <p className="dash-hero-sub">
                {history.length === 0
                  ? 'Upload your first resume to start your ATS journey.'
                  : `${history.length} resume version${history.length > 1 ? 's' : ''} tracked — keep pushing!`}
              </p>
            </div>
          </div>
          <button className="dash-upload-btn" onClick={onUploadClick}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
            </svg>
            Upload Resume
          </button>
        </div>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────────── */}
      {history.length > 0 && (
        <div className="dash-kpi-row">

          {/* Latest Score */}
          <div className="dash-kpi-card dash-kpi-score">
            <div className="dash-kpi-icon-wrap" style={{ background: 'rgba(0,223,216,0.12)', borderColor: 'rgba(0,223,216,0.2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div>
              <div className="dash-kpi-label">Latest ATS Score</div>
              <div className="dash-kpi-value" style={{ color: scoreColor(latest?.overallScore ?? 0) }}>
                {latest?.overallScore ?? '—'}
                <span className="dash-kpi-unit">/ 100</span>
              </div>
            </div>
          </div>

          {/* Score Change */}
          <div className="dash-kpi-card">
            <div className="dash-kpi-icon-wrap" style={{ background: delta >= 0 ? 'rgba(0,223,216,0.1)' : 'rgba(255,68,68,0.1)', borderColor: delta >= 0 ? 'rgba(0,223,216,0.2)' : 'rgba(255,68,68,0.2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={delta >= 0 ? 'var(--success)' : 'var(--danger)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {delta >= 0
                  ? <><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></>
                  : <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>
                }
              </svg>
            </div>
            <div>
              <div className="dash-kpi-label">vs Previous</div>
              <div className="dash-kpi-value" style={{ color: delta === null ? 'var(--text-muted)' : delta >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                {delta === null ? '—' : `${delta >= 0 ? '+' : ''}${delta}`}
                {delta !== null && <span className="dash-kpi-unit">pts</span>}
              </div>
            </div>
          </div>

          {/* Total Growth */}
          <div className="dash-kpi-card">
            <div className="dash-kpi-icon-wrap" style={{ background: 'rgba(121,40,202,0.12)', borderColor: 'rgba(121,40,202,0.2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
            <div>
              <div className="dash-kpi-label">Total Growth</div>
              <div className="dash-kpi-value" style={{ color: totalGrowth >= 0 ? 'var(--accent-purple)' : 'var(--danger)' }}>
                {totalGrowth === null ? '—' : `${totalGrowth >= 0 ? '+' : ''}${totalGrowth}`}
                {totalGrowth !== null && <span className="dash-kpi-unit">pts</span>}
              </div>
            </div>
          </div>

          {/* Versions */}
          <div className="dash-kpi-card">
            <div className="dash-kpi-icon-wrap" style={{ background: 'rgba(0,114,245,0.12)', borderColor: 'rgba(0,114,245,0.2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div>
              <div className="dash-kpi-label">Total Versions</div>
              <div className="dash-kpi-value" style={{ color: 'var(--primary)' }}>
                {history.length}
                <span className="dash-kpi-unit">files</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── Main Grid ────────────────────────────────── */}
      <div className="dash-main-grid">

        {/* Left column: Score Trend (full width) + Recent Uploads */}
        <div className="dash-left-col">

          {/* Score Trend */}
          <div className="glass-card dash-trend-card">
          <div className="dash-section-header">
            <div className="dash-section-icon" style={{ background: 'rgba(0,223,216,0.1)', borderColor: 'rgba(0,223,216,0.2)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div>
              <h3 className="dash-section-title">Score Trend</h3>
              <p className="dash-section-sub">Last 5 versions · All-time stats above</p>
            </div>
          </div>

            <ScoreTrendChart data={sorted} />

            <button className="dash-new-version-btn" onClick={onUploadClick}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              + Upload New Version
            </button>
          </div>

          {/* Recent Uploads */}
          <div className="glass-card dash-recent-card">
          <div className="dash-section-header">
            <div className="dash-section-icon" style={{ background: 'rgba(121,40,202,0.1)', borderColor: 'rgba(121,40,202,0.2)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div>
              <h3 className="dash-section-title">Recent Uploads</h3>
              <p className="dash-section-sub">Latest 5 resume versions</p>
            </div>
          </div>

          {history.length === 0 ? (
            <div className="dash-empty-mini">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              </svg>
              <p>No resumes uploaded yet.</p>
            </div>
          ) : (
            <div className="dash-resume-list">
              {sorted.slice().reverse().slice(0, 5).map((item, idx) => {
                const isLatest = idx === 0;
                return (
                  <div key={item.resumeId} className={`dash-resume-item ${isLatest ? 'dash-resume-latest' : ''}`}>
                    <div className="dash-resume-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    </div>
                    <div className="dash-resume-meta">
                      <div className="dash-resume-name">{item.title}</div>
                      <div className="dash-resume-ver">
                        Version {item.versionNumber}
                        {isLatest && <span className="dash-latest-badge">Latest</span>}
                      </div>
                    </div>
                    <div className="dash-resume-actions">
                      <div className={`score-pill ${scoreCls(item.overallScore)}`}>{item.overallScore}</div>
                      <button
                        title="Delete this version"
                        className="dash-delete-btn"
                        onClick={() => setDeleteConfirm({ resumeId: item.resumeId, title: item.title })}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>{/* end dash-recent-card */}

        </div>{/* end dash-left-col */}


        {/* Profile / Account Card */}
        <div className="glass-card dash-account-card">
          {/* Header section */}
          <div className="dash-account-header">
            <div className="dash-account-avatar">{user.name[0].toUpperCase()}</div>
            <div className="dash-account-name">{user.name}</div>
            <div className="dash-account-email">{user.email}</div>
            {/* Role badge */}
            <span className={`dash-account-badge ${getBadgeClass(user.role)}`}>
              {getRoleDisplay(user.role).icon} {getRoleDisplay(user.role).label}
            </span>
            {/* Edit Profile button */}
            <button
              onClick={() => setShowEditProfile(true)}
              style={{
                marginTop: '0.9rem',
                display: 'flex', alignItems: 'center', gap: '0.45rem',
                padding: '0.6rem 1.25rem',
                background: 'linear-gradient(135deg, rgba(0,114,245,0.18) 0%, rgba(121,40,202,0.15) 100%)',
                border: '1px solid rgba(0,114,245,0.3)',
                borderRadius: '12px',
                color: '#a5b4fc',
                fontFamily: 'var(--font-display)',
                fontWeight: 700, fontSize: '0.8rem',
                cursor: 'pointer', transition: 'all 0.25s',
                letterSpacing: '0.01em',
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(0,114,245,0.15)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,114,245,0.28) 0%, rgba(121,40,202,0.25) 100%)';
                e.currentTarget.style.boxShadow  = '0 6px 24px rgba(0,114,245,0.3)';
                e.currentTarget.style.transform  = 'translateY(-1px)';
                e.currentTarget.style.borderColor= 'rgba(0,114,245,0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0,114,245,0.18) 0%, rgba(121,40,202,0.15) 100%)';
                e.currentTarget.style.boxShadow  = '0 4px 16px rgba(0,114,245,0.15)';
                e.currentTarget.style.transform  = '';
                e.currentTarget.style.borderColor= 'rgba(0,114,245,0.3)';
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit Profile
            </button>
          </div>

          {/* ATS Journey Level */}
          {history.length > 0 && (() => {
            const best  = Math.max(...history.map(h => h.overallScore));
            const level = getJourneyLevel(best);
            const pct   = Math.round(((best - level.from) / (level.next - level.from)) * 100);
            return (
              <div className="dash-level-bar-wrap">
                <div className="dash-level-label">
                  <span style={{ color: level.color, fontWeight: 700 }}>{level.emoji} {level.label}</span>
                  <span>{best} / {level.next} pts</span>
                </div>
                <div className="dash-level-bar">
                  <div className="dash-level-fill" style={{ width: `${Math.min(pct, 100)}%`, background: `linear-gradient(90deg, ${level.color}99, ${level.color})` }} />
                </div>
              </div>
            );
          })()}

          {/* Stats body */}
          <div className="dash-account-body">
            <div className="dash-account-stat">
              <div className="dash-account-stat-left">
                <div className="dash-account-stat-icon" style={{ background: 'rgba(59,130,246,0.1)' }}>📄</div>
                <span className="dash-account-stat-label">Versions Tracked</span>
              </div>
              <span className="dash-account-stat-val" style={{ color: '#93c5fd' }}>{history.length}</span>
            </div>
            <div className="dash-account-stat">
              <div className="dash-account-stat-left">
                <div className="dash-account-stat-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>🏅</div>
                <span className="dash-account-stat-label">Best ATS Score</span>
              </div>
              <span className="dash-account-stat-val" style={{ color: history.length ? '#10b981' : 'var(--text-muted)' }}>
                {history.length ? `${Math.max(...history.map(h => h.overallScore))} / 100` : '—'}
              </span>
            </div>
            <div className="dash-account-stat">
              <div className="dash-account-stat-left">
                <div className="dash-account-stat-icon" style={{ background: 'rgba(139,92,246,0.1)' }}>📊</div>
                <span className="dash-account-stat-label">Avg Score</span>
              </div>
              <span className="dash-account-stat-val" style={{ color: '#a78bfa' }}>
                {history.length
                  ? Math.round(history.reduce((s, h) => s + h.overallScore, 0) / history.length)
                  : '—'}
              </span>
            </div>
            <div className="dash-account-stat">
              <div className="dash-account-stat-left">
                <div className="dash-account-stat-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>📈</div>
                <span className="dash-account-stat-label">Total Growth</span>
              </div>
              <span className="dash-account-stat-val" style={{ color: totalGrowth !== null && totalGrowth >= 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                {totalGrowth === null ? '—' : `${totalGrowth >= 0 ? '+' : ''}${totalGrowth} pts`}
              </span>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="dash-account-footer">
            <button className="dash-signout-btn" onClick={onLogout}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </button>
          </div>
        </div>

      </div>

      {/* Delete Modal */}
      {deleteConfirm && (
        <DeleteModal
          confirm={deleteConfirm}
          isDeleting={isDeleting}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={handleDeleteConfirmed}
        />
      )}

      {/* Profile Edit Modal */}
      {showEditProfile && (
        <ProfileEditModal
          user={user}
          onClose={() => setShowEditProfile(false)}
          onSave={(updatedUser) => {
            if (typeof onUserUpdate === 'function') onUserUpdate(updatedUser);
            setShowEditProfile(false);
          }}
        />
      )}
    </div>
  );
}
