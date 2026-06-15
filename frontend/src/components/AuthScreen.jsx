import { useState } from 'react';

/* ─── Brand constants ──────────────────────────────────────────────────────── */
const BRAND = 'SkillPilot';
const BRAND_SUB = 'AI';

/* ─── Hero Left Panel ─────────────────────────────────────────────────────── */
function HeroPanel() {
  const features = [
    {
      icon: '⚡',
      bg: 'linear-gradient(135deg, rgba(0,114,245,0.2), rgba(0,114,245,0.08))',
      border: 'rgba(0,114,245,0.3)',
      text: 'Instant ATS score — know exactly where you stand',
    },
    {
      icon: '🎯',
      bg: 'linear-gradient(135deg, rgba(121,40,202,0.2), rgba(121,40,202,0.08))',
      border: 'rgba(121,40,202,0.3)',
      text: 'Job description matching with AI gap analysis',
    },
    {
      icon: '📈',
      bg: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.08))',
      border: 'rgba(6,182,212,0.3)',
      text: 'Track improvement across every resume version',
    },
    {
      icon: '🧠',
      bg: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))',
      border: 'rgba(16,185,129,0.3)',
      text: 'AI-powered suggestions to beat any recruiter filter',
    },
  ];

  const stats = [
    { num: '10K+', label: 'Resumes Scored' },
    { num: '94%', label: 'ATS Pass Rate' },
    { num: '3×', label: 'More Interviews' },
  ];

  return (
    <div className="auth-hero">
      {/* Decorative orbs */}
      <div className="auth-hero-orb-1" />
      <div className="auth-hero-orb-2" />

      {/* Top section */}
      <div className="auth-hero-top">
        {/* Logo */}
        <div className="auth-hero-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.7))' }}>
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span>
            {BRAND}<span style={{ fontWeight: 400, opacity: 0.75 }}>{BRAND_SUB}</span>
          </span>
        </div>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
          padding: '0.3rem 0.85rem',
          background: 'rgba(0,114,245,0.1)',
          border: '1px solid rgba(0,114,245,0.25)',
          borderRadius: '99px',
          fontSize: '0.72rem', fontWeight: 700,
          color: '#93c5fd',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          marginBottom: '1.5rem',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block', boxShadow: '0 0 6px #3b82f6' }} />
          AI-Powered · ATS Optimized
        </div>

        {/* Headline */}
        <h1 className="auth-hero-headline">
          Land your dream<br />job faster with AI
        </h1>

        <p className="auth-hero-sub">
          {BRAND}{BRAND_SUB} instantly scores your resume against ATS systems,
          identifies gaps, and gives you an exact action plan to get more callbacks.
        </p>

        {/* Features */}
        <div className="auth-hero-features">
          {features.map((f, i) => (
            <div key={i} className="auth-hero-feat">
              <div className="auth-hero-feat-icon" style={{
                background: f.bg,
                border: `1px solid ${f.border}`,
              }}>
                {f.icon}
              </div>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats bottom */}
      <div>
        {/* Divider */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
          marginBottom: '1.5rem',
        }} />
        <div className="auth-hero-stats">
          {stats.map((s, i) => (
            <div key={i} className="auth-hero-stat">
              <span className="auth-hero-stat-num">{s.num}</span>
              <span className="auth-hero-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
        <p style={{
          marginTop: '1.25rem', fontSize: '0.75rem',
          color: 'rgba(148,163,184,0.5)',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Trusted by job seekers worldwide · No credit card required
        </p>
      </div>
    </div>
  );
}

/* ─── Main AuthScreen ─────────────────────────────────────────────────────── */
export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'
  const [form, setForm] = useState({ name: '', email: '', password: '', code: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [devCode, setDevCode] = useState(null);
  const [serverWaking, setServerWaking] = useState(false);

  // Retry a fetch up to `maxRetries` times when server is cold-starting
  const fetchWithRetry = async (url, opts, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(url, opts);
        setServerWaking(false);
        return res;
      } catch (err) {
        const isColdStart = err.message === 'Failed to fetch' || err.name === 'TypeError';
        if (isColdStart && attempt < maxRetries) {
          setServerWaking(true);
          await new Promise(r => setTimeout(r, 5000)); // wait 5s before retry
        } else {
          setServerWaking(false);
          throw err;
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFieldError({ email: '', password: '' });
    setMessage('');
    setDevCode(null);

    if (mode === 'forgot') {
      try {
        const res = await fetchWithRetry('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Failed to request password reset');
        if (data.emailSent) {
          setMessage(`A verification code has been sent to ${form.email}.`);
          setTimeout(() => switchMode('reset'), 3000);
        } else {
          setDevCode(data.devCode);
          setForm(prev => ({ ...prev, code: data.devCode }));
          setMessage('Email not configured. Use the code below to reset your password.');
          setTimeout(() => switchMode('reset'), 2000);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'reset') {
      try {
        const res = await fetchWithRetry('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, code: form.code, newPassword: form.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Invalid code or password reset failed');
        setMessage('Password reset successfully! Redirecting…');
        setTimeout(() => switchMode('login'), 1500);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = mode === 'login'
      ? { email: form.email, password: form.password }
      : { name: form.name, email: form.email, password: form.password };

    try {
      const res = await fetchWithRetry(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data.detail || 'Authentication failed';
        if (mode === 'login') {
          const lower = msg.toLowerCase();
          const isEmailError = lower.includes('email') || lower.includes('account') || lower.includes('not found');
          const isPassError = lower.includes('password') || lower.includes('incorrect') || lower.includes('wrong');
          if (isEmailError) setFieldError({ email: msg, password: '' });
          else if (isPassError) setFieldError({ email: '', password: msg });
          else setError(msg);
        } else {
          const lower = msg.toLowerCase();
          if (lower.includes('email') || lower.includes('already') || lower.includes('registered'))
            setFieldError({ email: msg, password: '' });
          else setError(msg);
        }
        return;
      }

      if (mode === 'login') {
        localStorage.setItem('ai_resume_token', data.token);
        onLogin(data.user, false);
      } else {
        setMessage(`✅ Account created for ${data.user.name}! Please sign in.`);
        setForm(prev => ({ ...prev, name: '', password: '' }));
        setTimeout(() => switchMode('login'), 2000);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setFieldError({ email: '', password: '' });
    setMessage('');
    setDevCode(null);
  };

  const modeTitle = {
    login: `Welcome back`,
    register: `Create your account`,
    forgot: `Reset your password`,
    reset: `Set new password`,
  };
  const modeSub = {
    login: 'Sign in to continue to your dashboard.',
    register: `Join ${BRAND}${BRAND_SUB} and start optimizing your resume.`,
    forgot: 'Enter your email to receive a reset code.',
    reset: 'Enter the code we sent and choose a new password.',
  };

  return (
    <div className="auth-overlay">
      {/* Left hero */}
      <HeroPanel />

      {/* Right form panel */}
      <div className="auth-form-panel">
        <div className="auth-card">

          {/* Brand */}
          <div className="auth-brand">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>{BRAND}<span style={{ fontWeight: 400, opacity: 0.75 }}>{BRAND_SUB}</span></span>
          </div>

          {/* Heading */}
          <h2 style={{
            fontFamily: 'var(--font-display)', fontWeight: 800,
            fontSize: '1.35rem', letterSpacing: '-0.03em',
            marginBottom: '0.3rem',
            background: 'linear-gradient(135deg, #f1f5f9 30%, #a5b4fc)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            {modeTitle[mode]}
          </h2>
          <p className="auth-subtitle">{modeSub[mode]}</p>

          {/* Sign In / Register tabs */}
          {(mode === 'login' || mode === 'register') && (
            <div className="auth-tabs">
              <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => switchMode('login')}>Sign In</button>
              <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => switchMode('register')}>Register</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">

            {/* Name field (register only) */}
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input id="auth-name" className="input-field" type="text" placeholder="Jane Smith" required
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
            )}

            {/* Email (readonly on reset) */}
            {mode === 'reset' && (
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input id="auth-email-readonly" className="input-field" type="email" readOnly value={form.email}
                  style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
            )}

            {mode !== 'reset' && (
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  id="auth-email"
                  className={`input-field${fieldError.email ? ' input-field--error' : ''}`}
                  type="email" placeholder="jane@company.com" required
                  value={form.email}
                  onChange={e => { setForm({ ...form, email: e.target.value }); setFieldError(p => ({ ...p, email: '' })); }}
                />
                {fieldError.email && (
                  <p className="field-error-msg" role="alert">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {fieldError.email}
                  </p>
                )}
              </div>
            )}

            {/* Verification code */}
            {mode === 'reset' && (
              <div className="form-group">
                <label className="form-label">Verification Code</label>
                <input id="auth-code" className="input-field" type="text" placeholder="123456" maxLength={6} required
                  value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
              </div>
            )}

            {/* Password */}
            {(mode === 'login' || mode === 'register' || mode === 'reset') && (
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">{mode === 'reset' ? 'New Password' : 'Password'}</label>
                  {mode === 'login' && (
                    <button type="button" className="auth-link" style={{ fontSize: '0.78rem' }} onClick={() => switchMode('forgot')}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="auth-password"
                  className={`input-field${fieldError.password ? ' input-field--error' : ''}`}
                  type="password" placeholder="••••••••" required
                  value={form.password}
                  onChange={e => { setForm({ ...form, password: e.target.value }); setFieldError(p => ({ ...p, password: '' })); }}
                />
                {fieldError.password && (
                  <p className="field-error-msg" role="alert">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {fieldError.password}
                  </p>
                )}
              </div>
            )}

            {/* Dev code box */}
            {devCode && (
              <div style={{
                padding: '1rem', background: 'rgba(245,158,11,0.08)',
                border: '1.5px dashed rgba(245,158,11,0.4)', borderRadius: '12px', textAlign: 'center',
              }}>
                <p style={{ fontSize: '0.7rem', color: '#f59e0b', marginBottom: '0.3rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  ⚠️ Dev Mode — Email not configured
                </p>
                <span style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '0.35em', color: '#f59e0b', fontFamily: 'monospace', display: 'block' }}>
                  {devCode}
                </span>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-sub)', marginTop: '0.4rem', opacity: 0.7 }}>(Auto-filled)</p>
              </div>
            )}

            {serverWaking && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.65rem',
                padding: '0.7rem 0.9rem',
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: '10px',
                color: '#fbbf24',
                fontSize: '0.83rem',
                animation: 'auth-fade-up 0.3s ease',
              }}>
                <span className="loader-sm" style={{ borderColor: 'rgba(245,158,11,0.3)', borderTopColor: '#f59e0b' }} />
                Server is starting up… please wait (Render free tier cold start)
              </div>
            )}
            {error && !serverWaking && <div className="auth-error">{error}</div>}
            {message && (
              <div style={{
                padding: '0.65rem 0.9rem',
                background: 'rgba(6,182,212,0.08)',
                border: '1px solid rgba(6,182,212,0.2)',
                borderRadius: '10px', color: 'var(--accent-cyan)', fontSize: '0.875rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
              }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                {message}
              </div>
            )}

            <button id="auth-submit" className="btn btn-full" type="submit" disabled={loading} style={{ marginTop: '0.25rem' }}>
              {loading ? <><span className="loader-sm" /> Processing…</> : (
                mode === 'login' ? 'Sign In to Dashboard' :
                  mode === 'register' ? 'Create Free Account' :
                    mode === 'forgot' ? 'Send Reset Code' :
                      'Reset Password'
              )}
            </button>
          </form>

          <p className="auth-switch">
            {(mode === 'login' || mode === 'register') && (
              <>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button className="auth-link" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
                  {mode === 'login' ? 'Register free' : 'Sign In'}
                </button>
              </>
            )}
            {(mode === 'forgot' || mode === 'reset') && (
              <button className="auth-link" onClick={() => switchMode('login')}>← Back to Sign In</button>
            )}
          </p>

          {/* Trust footer */}
          {(mode === 'login' || mode === 'register') && (
            <div style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', justifyContent: 'center', gap: '1.25rem',
              flexWrap: 'wrap',
            }}>
              {[
                { icon: '🔒', label: 'Secure & Private' },
                { icon: '⚡', label: 'Instant Results' },
                { icon: '🆓', label: 'Free to Start' },
              ].map(item => (
                <span key={item.label} style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  fontSize: '0.72rem', color: 'rgba(148,163,184,0.6)',
                }}>
                  {item.icon} {item.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
