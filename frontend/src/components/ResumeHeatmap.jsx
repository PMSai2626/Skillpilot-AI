import { useState, useEffect } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip as ReTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from 'recharts';

// ─── Section config ───────────────────────────────────────────────────────────
const SECTIONS = [
  {
    key: 'skills',
    label: 'Skills',
    icon: '⚡',
    desc: 'Technical & soft skill keywords matched against ATS requirements.',
    color: '#00dfd8',
    glow: 'rgba(0,223,216,0.35)',
    bg: 'rgba(0,223,216,0.08)',
    border: 'rgba(0,223,216,0.25)',
  },
  {
    key: 'projects',
    label: 'Projects',
    icon: '🚀',
    desc: 'Portfolio projects demonstrating hands-on experience.',
    color: '#7928ca',
    glow: 'rgba(121,40,202,0.35)',
    bg: 'rgba(121,40,202,0.08)',
    border: 'rgba(121,40,202,0.25)',
  },
  {
    key: 'experience',
    label: 'Experience',
    icon: '💼',
    desc: 'Work history depth, impact statements, and quantified achievements.',
    color: '#0072f5',
    glow: 'rgba(0,114,245,0.35)',
    bg: 'rgba(0,114,245,0.08)',
    border: 'rgba(0,114,245,0.25)',
  },
  {
    key: 'education',
    label: 'Education',
    icon: '🎓',
    desc: 'Academic background, certifications, and relevant coursework.',
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.35)',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
  },
  {
    key: 'contact',
    label: 'Contact',
    icon: '📋',
    desc: 'Header completeness: name, email, phone, LinkedIn, GitHub.',
    color: '#10b981',
    glow: 'rgba(16,185,129,0.35)',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.25)',
  },
  {
    key: 'formatting',
    label: 'Format',
    icon: '🗂️',
    desc: 'Clean structure, consistent spacing, readable layout for ATS parsers.',
    color: '#f43f5e',
    glow: 'rgba(244,63,94,0.35)',
    bg: 'rgba(244,63,94,0.08)',
    border: 'rgba(244,63,94,0.25)',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getGrade = (v) => {
  if (v >= 90) return { grade: 'A+', cls: 'hm-grade-s' };
  if (v >= 80) return { grade: 'A',  cls: 'hm-grade-a' };
  if (v >= 70) return { grade: 'B+', cls: 'hm-grade-b' };
  if (v >= 60) return { grade: 'B',  cls: 'hm-grade-b' };
  if (v >= 45) return { grade: 'C',  cls: 'hm-grade-c' };
  return          { grade: 'D',  cls: 'hm-grade-d' };
};

const getLabel = (v) => {
  if (v >= 80) return 'Excellent';
  if (v >= 65) return 'Good';
  if (v >= 45) return 'Needs Work';
  return 'Critical';
};

// ─── Custom Radar Tooltip ─────────────────────────────────────────────────────
function RadarTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { subject, value } = payload[0].payload;
  const sec = SECTIONS.find(s => s.label === subject);
  return (
    <div className="hm-tooltip">
      <div className="hm-tooltip-header" style={{ color: sec?.color }}>
        {sec?.icon} {subject}
      </div>
      <div className="hm-tooltip-score" style={{ color: sec?.color }}>{value}</div>
      <div className="hm-tooltip-grade">{getLabel(value)}</div>
    </div>
  );
}

// ─── Custom Bar Tooltip ───────────────────────────────────────────────────────
function BarTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { label, value, color } = payload[0].payload;
  return (
    <div className="hm-tooltip">
      <div className="hm-tooltip-header" style={{ color }}>{label}</div>
      <div className="hm-tooltip-score" style={{ color }}>{value}%</div>
      <div className="hm-tooltip-grade">{getLabel(value)}</div>
    </div>
  );
}

// ─── Score Card ───────────────────────────────────────────────────────────────
function ScoreCard({ sec, value, isActive, onClick }) {
  const { grade, cls } = getGrade(value);
  const pct = value;

  return (
    <button
      className={`hm-score-card ${isActive ? 'hm-score-card--active' : ''}`}
      style={{
        '--card-color': sec.color,
        '--card-glow': sec.glow,
        '--card-bg': sec.bg,
        '--card-border': sec.border,
        borderColor: isActive ? sec.color : undefined,
        boxShadow: isActive ? `0 0 24px ${sec.glow}` : undefined,
      }}
      onClick={onClick}
    >
      {/* Top row */}
      <div className="hm-card-top">
        <span className="hm-card-icon">{sec.icon}</span>
        <span className={`hm-grade ${cls}`}>{grade}</span>
      </div>

      {/* Label & score */}
      <div className="hm-card-label">{sec.label}</div>
      <div className="hm-card-score" style={{ color: sec.color }}>{value}</div>

      {/* Mini progress arc */}
      <div className="hm-card-bar-bg">
        <div
          className="hm-card-bar-fill"
          style={{ width: `${pct}%`, background: sec.color }}
        />
      </div>

      {/* Status */}
      <div className="hm-card-status" style={{ color: sec.color }}>
        {getLabel(value)}
      </div>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ResumeHeatmap({ sectionScores, overallScore }) {
  const [activeKey, setActiveKey] = useState(null);
  const [chartType, setChartType] = useState('radar'); // 'radar' | 'bar'
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  // Build data arrays
  const radarData = SECTIONS.map(s => ({
    subject: s.label,
    value: sectionScores[s.key] ?? 0,
    fullMark: 100,
  }));

  const barData = SECTIONS.map(s => ({
    label: s.label,
    value: sectionScores[s.key] ?? 0,
    color: s.color,
    icon: s.icon,
  }));

  const activeSec = activeKey ? SECTIONS.find(s => s.key === activeKey) : null;
  const activeVal = activeKey ? (sectionScores[activeKey] ?? 0) : null;

  // Weakest section for smart tip
  const weakest = SECTIONS.reduce((min, s) =>
    (sectionScores[s.key] ?? 0) < (sectionScores[min.key] ?? 0) ? s : min
  );

  return (
    <div className={`hm-root ${animated ? 'hm-root--in' : ''}`}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="hm-header">
        <div className="hm-header-left">
          <div className="hm-header-icon">🔥</div>
          <div>
            <h2 className="hm-title">Resume Heatmap</h2>
            <p className="hm-subtitle">
              Section-by-section ATS compatibility breakdown
            </p>
          </div>
        </div>

        {/* Chart type toggle */}
        <div className="hm-toggle-group" role="group" aria-label="Chart type">
          <button
            className={`hm-toggle-btn ${chartType === 'radar' ? 'hm-toggle-btn--active' : ''}`}
            onClick={() => setChartType('radar')}
          >
            🕸️ Radar
          </button>
          <button
            className={`hm-toggle-btn ${chartType === 'bar' ? 'hm-toggle-btn--active' : ''}`}
            onClick={() => setChartType('bar')}
          >
            📊 Bar
          </button>
        </div>
      </div>

      {/* ── Score Cards Grid ────────────────────────────────────── */}
      <div className="hm-cards-grid">
        {SECTIONS.map(sec => (
          <ScoreCard
            key={sec.key}
            sec={sec}
            value={sectionScores[sec.key] ?? 0}
            isActive={activeKey === sec.key}
            onClick={() => setActiveKey(prev => prev === sec.key ? null : sec.key)}
          />
        ))}
      </div>

      {/* ── Detail Panel (when card clicked) ───────────────────── */}
      {activeSec && activeVal !== null && (
        <div
          className="hm-detail-panel"
          style={{
            borderColor: activeSec.border,
            background: activeSec.bg,
          }}
        >
          <div className="hm-detail-left">
            <span className="hm-detail-icon">{activeSec.icon}</span>
            <div>
              <div className="hm-detail-name" style={{ color: activeSec.color }}>
                {activeSec.label}
              </div>
              <div className="hm-detail-desc">{activeSec.desc}</div>
            </div>
          </div>
          <div className="hm-detail-right">
            <span className="hm-detail-score" style={{ color: activeSec.color }}>
              {activeVal}
            </span>
            <span className="hm-detail-label">/ 100</span>
          </div>
        </div>
      )}

      {/* ── Chart ──────────────────────────────────────────────── */}
      <div className="hm-chart-wrap glass-card">
        <div className="hm-chart-header">
          <span className="hm-chart-title">
            {chartType === 'radar' ? 'Skill Coverage Radar' : 'Section Score Breakdown'}
          </span>
          <span className="hm-chart-overall">
            Overall ATS: <strong style={{ color: overallScore >= 80 ? '#00dfd8' : overallScore >= 60 ? '#f59e0b' : '#ff4444' }}>
              {overallScore}
            </strong>
            <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/100</span>
          </span>
        </div>

        {chartType === 'radar' ? (
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <defs>
                <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00dfd8" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#7928ca" stopOpacity={0.1} />
                </radialGradient>
              </defs>
              <PolarGrid
                stroke="rgba(255,255,255,0.07)"
                gridType="polygon"
              />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: 'rgba(148,163,184,0.5)', fontSize: 10 }}
                tickCount={5}
                stroke="rgba(255,255,255,0.04)"
              />
              <Radar
                name="Score"
                dataKey="value"
                stroke="url(#radarStroke)"
                fill="url(#radarFill)"
                strokeWidth={2.5}
                dot={{ r: 5, fill: '#00dfd8', strokeWidth: 0 }}
                activeDot={{ r: 7, fill: '#00dfd8', stroke: 'rgba(0,223,216,0.3)', strokeWidth: 3 }}
              />
              <ReTooltip content={<RadarTip />} />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={barData}
              margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
              barSize={36}
            >
              <defs>
                {SECTIONS.map(s => (
                  <linearGradient key={s.key} id={`barGrad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.95} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0.5} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: 'rgba(148,163,184,0.5)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickCount={5}
              />
              <ReTooltip content={<BarTip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {barData.map((entry, index) => {
                  const sec = SECTIONS[index];
                  return (
                    <Cell
                      key={entry.label}
                      fill={`url(#barGrad-${sec.key})`}
                      stroke={sec.color}
                      strokeWidth={1}
                      style={{ filter: `drop-shadow(0 2px 8px ${sec.glow})` }}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Smart Tip ───────────────────────────────────────────── */}
      <div className="hm-tip" style={{ borderColor: weakest.border, background: weakest.bg }}>
        <span className="hm-tip-icon">💡</span>
        <div>
          <strong style={{ color: weakest.color }}>
            Biggest opportunity: {weakest.label}
          </strong>
          <span className="hm-tip-text"> — {weakest.desc}</span>
        </div>
        <span className="hm-tip-score" style={{ color: weakest.color }}>
          {sectionScores[weakest.key] ?? 0}%
        </span>
      </div>
    </div>
  );
}
