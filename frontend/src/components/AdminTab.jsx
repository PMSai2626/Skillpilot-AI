// ─── Admin Cohort Stats Dashboard ────────────────────────────────────────────
import { useState, useEffect } from 'react';

function StatCard({ label, value, color, icon, sub }) {
  return (
    <div className="glass-card" style={{
      display: 'flex', flexDirection: 'column', gap: '0.5rem', position: 'relative', overflow: 'hidden',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '2rem', opacity: 0.15 }}>{icon}</div>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '2.2rem', fontFamily: 'var(--font-display)', fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

function DistributionBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.35rem' }}>
        <span style={{ fontWeight: 500, color: 'var(--text-sub)' }}>{label}</span>
        <span style={{ fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>{count} ({pct}%)</span>
      </div>
      <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: color, borderRadius: '4px',
          transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  );
}

export default function AdminTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/cohort-stats');
        if (res.ok) setStats(await res.json());
        else setError('Failed to load cohort stats.');
      } catch {
        setError('Could not connect to server.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
      <div className="loader" />
    </div>
  );

  if (error) return (
    <div className="glass-card">
      <div className="error-banner"><span>⚠️</span> {error}</div>
    </div>
  );

  if (!stats) return null;

  const total = stats.totalStudents || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Banner */}
      <div className="glass-card welcome-banner">
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700 }}>
            🎓 Cohort Analytics
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem' }}>
            Aggregate performance metrics across all student resumes.
          </p>
        </div>
        <div style={{
          background: 'rgba(0,223,216,0.08)', border: '1px solid rgba(0,223,216,0.2)',
          borderRadius: '12px', padding: '0.75rem 1.5rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg ATS Score</div>
          <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent-cyan)', lineHeight: 1.1 }}>
            {stats.averageScore}
          </div>
        </div>
      </div>

      {/* Top KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <StatCard label="Total Resumes" value={stats.totalStudents} color="var(--primary)" icon="📄" sub="All uploaded versions" />
        <StatCard label="Above 80 Score" value={stats.scoreDistribution.aboveEighty} color="var(--success)" icon="🏆" sub="Exceptional match tier" />
        <StatCard label="60–80 Score" value={stats.scoreDistribution.sixtyToEighty} color="var(--warning)" icon="⚡" sub="Good progress tier" />
        <StatCard label="Below 60 Score" value={stats.scoreDistribution.under60} color="var(--danger)" icon="⚠️" sub="Needs improvement" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Score Distribution */}
        <div className="glass-card">
          <h3 className="premium-h3" style={{ marginBottom: '1.25rem' }}>📈 Score Distribution</h3>
          <DistributionBar label="🏆 Exceptional (≥ 80)" count={stats.scoreDistribution.aboveEighty} total={total} color="var(--success)" />
          <DistributionBar label="⚡ Good Progress (60–79)" count={stats.scoreDistribution.sixtyToEighty} total={total} color="var(--warning)" />
          <DistributionBar label="⚠️ Needs Improvement (< 60)" count={stats.scoreDistribution.under60} total={total} color="var(--danger)" />

          <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Cohort Average</div>
            <div style={{
              fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-display)',
              color: stats.averageScore >= 80 ? 'var(--success)' : stats.averageScore >= 60 ? 'var(--warning)' : 'var(--danger)',
            }}>{stats.averageScore}</div>
          </div>
        </div>

        {/* Top Skill Gaps */}
        <div className="glass-card">
          <h3 className="premium-h3" style={{ marginBottom: '0.4rem' }}>🎯 Top Skill Gaps</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            Most frequently missing skills across all student resumes.
          </p>
          {stats.topDeficiencies.map((d, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.75rem', marginBottom: '0.5rem',
              background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.12)',
              borderRadius: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{
                  width: '22px', height: '22px', background: 'rgba(255,68,68,0.15)',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 700, color: 'var(--danger)',
                }}>#{i + 1}</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.skillName}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ color: 'var(--danger)', fontWeight: 700, fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
                  {d.countMissing}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>missing</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info note */}
      <div className="glass-card" style={{ borderLeft: '4px solid var(--primary)', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>
            <strong>Admin View:</strong> This dashboard aggregates metrics from all resume uploads in the database. 
            Skill gap data helps mentors identify common training opportunities across the student cohort.
          </p>
        </div>
      </div>
    </div>
  );
}
