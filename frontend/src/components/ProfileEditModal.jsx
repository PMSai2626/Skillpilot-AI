import { useState, useEffect, useRef } from 'react';

/* ─── GSAP CDN loaded once ───────────────────────────────────────────────── */
let gsapLoaded = false;
function loadGSAP() {
  if (gsapLoaded || document.getElementById('gsap-cdn')) return Promise.resolve();
  return new Promise((resolve) => {
    const s = document.createElement('script');
    s.id = 'gsap-cdn';
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
    s.onload = () => { gsapLoaded = true; resolve(); };
    document.head.appendChild(s);
  });
}

/* ─── Particle canvas ─────────────────────────────────────────────────────── */
function ParticleField({ canvasRef }) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;

    const particles = Array.from({ length: 38 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.8 + 0.4,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.6 + 0.2,
      hue: Math.random() > 0.5 ? 190 : 270, // cyan or purple
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},90%,75%,${p.alpha})`;
        ctx.fill();
      });
      // lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `hsla(200,90%,70%,${0.12 * (1 - dist / 80)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [canvasRef]);
  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', borderRadius: '28px' }}
    />
  );
}

/* ─── Holographic Avatar ──────────────────────────────────────────────────── */
function HoloAvatar({ letter, size = 58 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    loadGSAP().then(() => {
      const gsap = window.gsap;
      if (!gsap) return;
      gsap.to(el, {
        rotation: 360,
        duration: 0,
      });
      gsap.fromTo(el,
        { scale: 0.5, opacity: 0, rotation: -15 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.7, ease: 'back.out(1.8)', delay: 0.1 }
      );
      // Continuous subtle float
      gsap.to(el, {
        y: -5,
        duration: 2.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 0.8,
      });
    });
  }, []);
  return (
    <div ref={ref} style={{
      width: size, height: size,
      borderRadius: '24px',
      background: 'linear-gradient(135deg, #0072f5 0%, #7928ca 50%, #06b6d4 100%)',
      backgroundSize: '200% 200%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 900, color: '#fff',
      fontFamily: 'var(--font-display)',
      position: 'relative',
      boxShadow: '0 0 0 3px rgba(0,114,245,0.3), 0 0 30px rgba(121,40,202,0.5), 0 16px 48px rgba(0,0,0,0.4)',
      animation: 'holoShift 4s ease infinite',
      flexShrink: 0,
    }}>
      {/* Shine overlay */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 55%)',
        pointerEvents: 'none',
      }} />
      {/* Online dot */}
      <div style={{
        position: 'absolute', bottom: -3, right: -3,
        width: 16, height: 16, borderRadius: '50%',
        background: 'radial-gradient(circle, #10b981, #059669)',
        border: '2.5px solid #060b18',
        boxShadow: '0 0 10px rgba(16,185,129,0.8)',
        animation: 'pulseGlow 2s ease-in-out infinite',
      }} />
      {letter}
    </div>
  );
}

/* ─── Tab Switcher ───────────────────────────────────────────────────────── */
function AnimatedTabs({ tab, setTab, clearMessages }) {
  const tabs = [
    {
      key: 'info',
      label: 'Profile Info',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
    {
      key: 'password',
      label: 'Security',
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      ),
    },
  ];

  const isInfo = tab === 'info';

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      position: 'relative',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '14px',
      padding: '4px',
    }}>
      {/* Sliding pill — uses CSS left transition, not GSAP */}
      <div style={{
        position: 'absolute',
        top: 4,
        bottom: 4,
        left: isInfo ? '4px' : 'calc(50% + 0px)',
        width: 'calc(50% - 4px)',
        background: isInfo
          ? 'linear-gradient(135deg, rgba(0,114,245,0.35), rgba(0,114,245,0.15))'
          : 'linear-gradient(135deg, rgba(121,40,202,0.35), rgba(121,40,202,0.15))',
        borderRadius: '10px',
        border: isInfo
          ? '1px solid rgba(0,114,245,0.45)'
          : '1px solid rgba(121,40,202,0.45)',
        boxShadow: isInfo
          ? '0 4px 16px rgba(0,114,245,0.25)'
          : '0 4px 16px rgba(121,40,202,0.25)',
        pointerEvents: 'none',
        transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1), background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
      }} />

      {tabs.map((t) => {
        const isActive = tab === t.key;
        return (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); clearMessages(); }}
            style={{
              position: 'relative',
              zIndex: 1,
              padding: '0.6rem 0.5rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-display)',
              fontWeight: isActive ? 700 : 500,
              fontSize: '0.83rem',
              color: isActive ? '#fff' : 'rgba(148,163,184,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              borderRadius: '10px',
              transition: 'color 0.3s ease, font-weight 0.2s ease',
              textShadow: isActive ? '0 0 12px rgba(255,255,255,0.3)' : 'none',
            }}
          >
            <span style={{
              opacity: isActive ? 1 : 0.6,
              transition: 'opacity 0.3s ease',
              display: 'flex',
              alignItems: 'center',
            }}>
              {t.icon}
            </span>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}


/* ─── Styled Input Field ─────────────────────────────────────────────────── */
function StyledInput({ label, icon, type = 'text', value, onChange, placeholder, hint, status }) {
  const [focused, setFocused] = useState(false);
  const borderColor = status === 'success' ? '#10b981'
    : status === 'error' ? '#f43f5e'
    : focused ? '#0072f5'
    : 'rgba(255,255,255,0.08)';
  const glowColor = status === 'success' ? 'rgba(16,185,129,0.15)'
    : status === 'error' ? 'rgba(244,63,94,0.15)'
    : focused ? 'rgba(0,114,245,0.15)'
    : 'transparent';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      <label style={{
        fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: focused ? '#93c5fd' : 'var(--text-muted)',
        transition: 'color 0.2s',
        display: 'flex', alignItems: 'center', gap: '0.35rem',
      }}>
        {icon}
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '0.82rem 1rem 0.82rem 1rem',
            background: focused
              ? 'rgba(0,114,245,0.06)'
              : 'rgba(255,255,255,0.03)',
            border: `1.5px solid ${borderColor}`,
            borderRadius: '12px',
            color: 'var(--text-primary)',
            fontSize: '0.92rem',
            fontFamily: 'var(--font-display)',
            outline: 'none',
            transition: 'border-color 0.25s, background 0.25s, box-shadow 0.25s',
            boxShadow: focused || status
              ? `0 0 0 3px ${glowColor}, 0 4px 12px rgba(0,0,0,0.2)`
              : '0 2px 8px rgba(0,0,0,0.15)',
          }}
        />
        {status && (
          <div style={{
            position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)',
            fontSize: '1rem', transition: 'all 0.2s',
          }}>
            {status === 'success' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            )}
          </div>
        )}
      </div>
      {hint && (
        <span style={{
          fontSize: '0.72rem', color: status === 'error' ? '#f87171' : status === 'success' ? '#6ee7b7' : 'var(--text-dim)',
          paddingLeft: '0.25rem', transition: 'color 0.2s',
        }}>{hint}</span>
      )}
    </div>
  );
}

/* ─── Password Field with show/hide ─────────────────────────────────────── */
function PasswordInput({ label, value, onChange, placeholder, matchTarget, showEye }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isMatch    = matchTarget !== undefined && value.length > 0 && value === matchTarget;
  const isMismatch = matchTarget !== undefined && value.length > 0 && value !== matchTarget;
  const status     = isMatch ? 'success' : isMismatch ? 'error' : null;
  const borderColor = status === 'success' ? '#10b981'
    : status === 'error' ? '#f43f5e'
    : focused ? '#7928ca'
    : 'rgba(255,255,255,0.08)';
  const glowColor = status === 'success' ? 'rgba(16,185,129,0.15)'
    : status === 'error' ? 'rgba(244,63,94,0.15)'
    : focused ? 'rgba(121,40,202,0.15)'
    : 'transparent';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label style={{
        fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: focused ? '#c4b5fd' : 'var(--text-muted)',
        transition: 'color 0.2s',
        display: 'flex', alignItems: 'center', gap: '0.35rem',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '0.7rem 2.6rem 0.7rem 1rem',
            background: focused ? 'rgba(121,40,202,0.06)' : 'rgba(255,255,255,0.03)',
            border: `1.5px solid ${borderColor}`,
            borderRadius: '12px',
            color: 'var(--text-primary)', fontSize: '0.92rem',
            fontFamily: 'var(--font-display)', outline: 'none',
            transition: 'border-color 0.25s, background 0.25s, box-shadow 0.25s',
            boxShadow: focused || status
              ? `0 0 0 3px ${glowColor}, 0 4px 12px rgba(0,0,0,0.2)`
              : '0 2px 8px rgba(0,0,0,0.15)',
            letterSpacing: show ? 'normal' : value ? '0.2em' : 'normal',
          }}
        />
        {showEye && (
          <button
            type="button"
            onClick={() => setShow(p => !p)}
            style={{
              position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: focused ? '#a78bfa' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', padding: 0,
              transition: 'color 0.2s',
            }}
          >
            {show ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
            )}
          </button>
        )}
      </div>
      {matchTarget !== undefined && value.length > 0 && (
        <span style={{
          fontSize: '0.72rem',
          color: isMatch ? '#6ee7b7' : '#f87171',
          paddingLeft: '0.25rem',
          display: 'flex', alignItems: 'center', gap: '0.3rem',
          transition: 'color 0.2s',
        }}>
          {isMatch ? (
            <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Passwords match</>
          ) : (
            <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Passwords do not match</>
          )}
        </span>
      )}
    </div>
  );
}

/* ─── Segmented Strength Bar ────────────────────────────────────────────── */
function StrengthBar({ password }) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const config = [
    { label: 'Weak',   colors: ['#f43f5e', '#555', '#555', '#555'] },
    { label: 'Fair',   colors: ['#f59e0b', '#f59e0b', '#555', '#555'] },
    { label: 'Good',   colors: ['#06b6d4', '#06b6d4', '#06b6d4', '#555'] },
    { label: 'Strong', colors: ['#10b981', '#10b981', '#10b981', '#10b981'] },
  ][Math.min(score - 1, 3)] || { label: '', colors: ['#555', '#555', '#555', '#555'] };

  const textColor = score <= 1 ? '#f87171' : score === 2 ? '#fbbf24' : score === 3 ? '#67e8f9' : '#6ee7b7';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ display: 'flex', gap: '5px' }}>
        {config.colors.map((c, i) => (
          <div key={i} style={{
            flex: 1, height: '5px', borderRadius: '99px',
            background: c,
            transition: 'background 0.3s ease',
            boxShadow: c !== '#555' ? `0 0 6px ${c}88` : 'none',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Password strength</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: textColor, transition: 'color 0.3s' }}>
          {config.label}
        </span>
      </div>
    </div>
  );
}

/* ─── Requirement item ───────────────────────────────────────────────────── */
function Req({ met, label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.45rem',
      fontSize: '0.78rem',
      color: met ? '#6ee7b7' : 'var(--text-dim)',
      transition: 'color 0.25s',
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: '50%',
        border: met ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
        background: met ? 'rgba(16,185,129,0.2)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.25s',
        boxShadow: met ? '0 0 8px rgba(16,185,129,0.4)' : 'none',
      }}>
        {met && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </div>
      {label}
    </div>
  );
}

/* ─── Gradient Submit Button ─────────────────────────────────────────────── */
function GradientButton({ type = 'submit', loading, gradient, shadow, children, onClick }) {
  const ref = useRef(null);
  const handleClick = () => {
    if (!ref.current) return;
    loadGSAP().then(() => {
      const gsap = window.gsap;
      if (!gsap) return;
      gsap.fromTo(ref.current,
        { scale: 0.95 },
        { scale: 1, duration: 0.4, ease: 'elastic.out(1.2,0.5)' }
      );
    });
    onClick?.();
  };
  return (
    <button
      ref={ref}
      type={type}
      disabled={loading}
      onClick={handleClick}
      style={{
        padding: '0.78rem 1.5rem',
        background: loading ? 'rgba(100,100,120,0.3)' : gradient,
        color: '#fff', border: 'none', borderRadius: '14px',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.92rem',
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.55rem',
        transition: 'opacity 0.25s, transform 0.15s, box-shadow 0.25s',
        width: '100%',
        boxShadow: loading ? 'none' : shadow,
        position: 'relative', overflow: 'hidden',
        letterSpacing: '-0.01em',
      }}
      onMouseEnter={e => {
        if (!loading) {
          e.currentTarget.style.filter = 'brightness(1.12)';
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = shadow.replace('0.35)', '0.55)');
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.filter = '';
        e.currentTarget.style.transform = '';
        e.currentTarget.style.boxShadow = loading ? 'none' : shadow;
      }}
    >
      {/* Shine sweep */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)',
        animation: loading ? 'none' : 'shineSweep 2.5s ease infinite',
      }} />
      {loading ? (
        <><LoaderRing /> Processing…</>
      ) : children}
    </button>
  );
}

/* ─── Mini spinner ───────────────────────────────────────────────────────── */
function LoaderRing() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
        style={{ animation: 'spin 1s linear infinite' }}
      />
    </svg>
  );
}

/* ─── Alert Banner ───────────────────────────────────────────────────────── */
function AlertBanner({ type, message }) {
  const ref = useRef(null);
  useEffect(() => {
    loadGSAP().then(() => {
      const gsap = window.gsap;
      if (!gsap || !ref.current) return;
      gsap.fromTo(ref.current,
        { opacity: 0, y: -10, scaleY: 0.85 },
        { opacity: 1, y: 0, scaleY: 1, duration: 0.35, ease: 'back.out(1.5)' }
      );
    });
  }, [message]);

  const cfg = type === 'success'
    ? { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', color: '#6ee7b7', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      )}
    : { bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.3)', color: '#fda4af', icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      )};

  return (
    <div ref={ref} style={{
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: '12px',
      padding: '0.85rem 1rem',
      color: cfg.color,
      fontSize: '0.85rem',
      display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
      boxShadow: `0 4px 16px ${cfg.border.replace('0.3', '0.1')}`,
    }}>
      <div style={{ flexShrink: 0, marginTop: '1px' }}>{cfg.icon}</div>
      <span>{message}</span>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════════════════════
   MAIN MODAL COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function ProfileEditModal({ user, onClose, onSave }) {
  const [tab, setTab] = useState('info');

  // Info
  const [name,  setName]  = useState(user.name  || '');
  const [email, setEmail] = useState(user.email || '');

  // Password
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd,     setNewPwd]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  // State
  const [isSaving, setIsSaving] = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const modalRef   = useRef(null);
  const backdropRef= useRef(null);
  const formRef    = useRef(null);
  const canvasRef  = useRef(null);

  /* ── Entrance animation ── */
  useEffect(() => {
    loadGSAP().then(() => {
      const gsap = window.gsap;
      if (!gsap) return;
      gsap.fromTo(backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
      gsap.fromTo(modalRef.current,
        { opacity: 0, y: 60, scale: 0.92, rotationX: 8 },
        { opacity: 1, y: 0, scale: 1, rotationX: 0, duration: 0.55, ease: 'back.out(1.4)', delay: 0.05 }
      );
    });
  }, []);

  /* ── Tab switch animation ── */
  useEffect(() => {
    loadGSAP().then(() => {
      const gsap = window.gsap;
      if (!gsap || !formRef.current) return;
      gsap.fromTo(formRef.current,
        { opacity: 0, x: tab === 'info' ? -20 : 20 },
        { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
      );
    });
  }, [tab]);

  /* ── Exit animation ── */
  const handleClose = () => {
    loadGSAP().then(() => {
      const gsap = window.gsap;
      if (!gsap) { onClose(); return; }
      gsap.to(modalRef.current, {
        opacity: 0, y: 40, scale: 0.94, duration: 0.28, ease: 'power2.in',
        onComplete: onClose,
      });
      gsap.to(backdropRef.current, { opacity: 0, duration: 0.28 });
    });
  };

  const clearMessages = () => { setError(''); setSuccess(''); };

  /* ── Save profile info ── */
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    clearMessages();
    const trimName  = name.trim();
    const trimEmail = email.trim().toLowerCase();
    if (!trimName)  { setError('Display name cannot be empty.'); return; }
    if (!trimEmail) { setError('Email address cannot be empty.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimEmail)) {
      setError('Please enter a valid email address.'); return;
    }
    setIsSaving(true);
    try {
      const res  = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimName, email: trimEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to update profile.');
      setSuccess('Profile updated successfully! ✨');
      onSave({ ...user, name: data.user.name, email: data.user.email });
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsSaving(false);
    }
  };

  /* ── Change password ── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!currentPwd)          { setError('Enter your current password.'); return; }
    if (!newPwd)              { setError('Enter a new password.'); return; }
    if (newPwd.length < 6)    { setError('New password must be at least 6 characters.'); return; }
    if (newPwd !== confirmPwd){ setError('New passwords do not match.'); return; }
    setIsSaving(true);
    try {
      const res  = await fetch(`/api/users/${user.id}/password`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to change password.');
      setSuccess('Password changed successfully! 🔐');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setIsSaving(false);
    }
  };

  const roleLabel = user.role === 'student' ? 'Job Seeker' : user.role === 'admin' ? 'Admin' : 'Mentor';
  const roleColor = user.role === 'admin' ? '#fda4af' : user.role === 'mentor' ? '#c4b5fd' : '#93c5fd';
  const roleGrad  = user.role === 'admin'
    ? 'linear-gradient(135deg, rgba(244,63,94,0.15), rgba(244,63,94,0.05))'
    : user.role === 'mentor'
    ? 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))'
    : 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))';

  return (
    <>
      {/* ── Keyframes (injected once) ── */}
      <style>{`
        @keyframes holoShift {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 6px rgba(16,185,129,0.6); }
          50%      { box-shadow: 0 0 14px rgba(16,185,129,1); }
        }
        @keyframes shineSweep {
          0%   { transform: translateX(-100%); }
          60%,100% { transform: translateX(200%); }
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
        @keyframes borderPulse {
          0%,100% { border-color: rgba(0,114,245,0.3); }
          50%      { border-color: rgba(121,40,202,0.5); }
        }
      `}</style>

      {/* ── Backdrop ── */}
      <div
        ref={backdropRef}
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
        style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(2,5,15,0.82)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '2vh 1rem',
          overflowY: 'auto',
        }}
      >
        {/* ── Modal ── */}
        <div
          ref={modalRef}
          style={{
            width: '100%', maxWidth: '500px',
            background: 'linear-gradient(160deg, rgba(10,16,40,0.97) 0%, rgba(8,12,30,0.99) 100%)',
            border: '1px solid rgba(0,114,245,0.25)',
            borderRadius: '28px',
            boxShadow: `
              0 0 0 1px rgba(255,255,255,0.04),
              0 32px 80px rgba(0,0,0,0.7),
              0 0 60px rgba(121,40,202,0.1),
              0 0 120px rgba(0,114,245,0.06)
            `,
            overflow: 'hidden',
            position: 'relative',
            animation: 'borderPulse 4s ease infinite',
            flexShrink: 0,
          }}
        >
          {/* Particle canvas */}
          <ParticleField canvasRef={canvasRef} />

          {/* Gradient mesh top */}
          <div style={{
            position: 'absolute', top: -60, left: -40, right: -40,
            height: 220, pointerEvents: 'none',
            background: 'radial-gradient(ellipse at 30% 50%, rgba(0,114,245,0.18) 0%, transparent 55%), radial-gradient(ellipse at 70% 40%, rgba(121,40,202,0.15) 0%, transparent 50%)',
            filter: 'blur(20px)',
          }} />

          {/* ── HEADER ── */}
          <div style={{
            position: 'relative', zIndex: 2,
            padding: '1.4rem 1.75rem 1.1rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'linear-gradient(180deg, rgba(0,114,245,0.06) 0%, transparent 100%)',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
                <HoloAvatar letter={user.name[0].toUpperCase()} />
                <div>
                  <div style={{
                    fontFamily: 'var(--font-display)', fontWeight: 800,
                    fontSize: '1.25rem', letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #a5b4fc 60%, #67e8f9 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '0.2rem',
                  }}>
                    Edit Profile
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'pulseGlow 2s ease infinite' }} />
                    {user.name}
                  </div>
                  {/* Role pill */}
                  <div style={{
                    marginTop: '0.55rem',
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.22rem 0.75rem',
                    background: roleGrad,
                    border: `1px solid ${roleColor}30`,
                    borderRadius: '99px',
                    fontSize: '0.68rem', fontWeight: 700,
                    color: roleColor,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                  }}>
                    {user.role === 'admin' ? '🛡️' : user.role === 'mentor' ? '🎓' : '🎯'}
                    {roleLabel}
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={handleClose}
                style={{
                  width: 36, height: 36, borderRadius: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s', flexShrink: 0,
                  marginTop: '2px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(244,63,94,0.15)';
                  e.currentTarget.style.borderColor = 'rgba(244,63,94,0.35)';
                  e.currentTarget.style.color = '#fda4af';
                  e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.transform = '';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* ── TABS ── */}
          <div style={{ position: 'relative', zIndex: 2, padding: '0.85rem 1.75rem 0' }}>
            <AnimatedTabs tab={tab} setTab={setTab} clearMessages={clearMessages} />
          </div>

          {/* ── FORM BODY ── */}
          <div ref={formRef} style={{ position: 'relative', zIndex: 2, padding: '1.25rem 1.75rem 1.5rem' }}>

            {/* Feedback */}
            {(error || success) && (
              <div style={{ marginBottom: '1.2rem' }}>
                {error   && <AlertBanner type="error"   message={error} />}
                {success && <AlertBanner type="success" message={success} />}
              </div>
            )}

            {/* ══ PROFILE INFO TAB ══ */}
            {tab === 'info' && (
              <form onSubmit={handleSaveInfo} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>

                <StyledInput
                  label="Display Name"
                  icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                  value={name}
                  onChange={setName}
                  placeholder="Your full name"
                  status={name.trim().length > 0 ? 'success' : null}
                />

                <StyledInput
                  label="Email Address"
                  icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  status={/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'success' : null}
                />

                {/* Member since */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.85rem 1rem',
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '10px',
                    background: roleGrad,
                    border: `1px solid ${roleColor}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.1rem', flexShrink: 0,
                  }}>
                    {user.role === 'admin' ? '🛡️' : user.role === 'mentor' ? '🎓' : '🎯'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>
                      Account Type
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: roleColor, marginTop: '0.1rem' }}>
                      {roleLabel}
                    </div>
                  </div>
                  <div style={{
                    fontSize: '0.65rem', fontWeight: 700,
                    color: 'var(--text-dim)',
                    background: 'rgba(255,255,255,0.04)',
                    padding: '0.2rem 0.55rem', borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    letterSpacing: '0.04em',
                  }}>READ-ONLY</div>
                </div>

                <GradientButton
                  loading={isSaving}
                  gradient="linear-gradient(135deg, #0072f5 0%, #7928ca 50%, #06b6d4 100%)"
                  shadow="0 8px 28px rgba(0,114,245,0.4), 0 2px 0 rgba(255,255,255,0.08) inset"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Save Profile Changes
                </GradientButton>
              </form>
            )}

            {/* ══ PASSWORD TAB ══ */}
            {tab === 'password' && (
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

                <PasswordInput
                  label="Current Password"
                  value={currentPwd}
                  onChange={setCurrentPwd}
                  placeholder="Enter your current password"
                  showEye
                />

                {/* Divider */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  color: 'var(--text-dim)', fontSize: '0.72rem',
                  textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600,
                }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                  New Password
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                </div>

                <PasswordInput
                  label="New Password"
                  value={newPwd}
                  onChange={setNewPwd}
                  placeholder="Min. 8 characters recommended"
                  showEye
                />

                {/* Strength bar */}
                {newPwd && <StrengthBar password={newPwd} />}

                <PasswordInput
                  label="Confirm New Password"
                  value={confirmPwd}
                  onChange={setConfirmPwd}
                  placeholder="Repeat new password"
                  showEye
                  matchTarget={newPwd}
                />

                {/* Requirements box */}
                <div style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(121,40,202,0.06)',
                  border: '1px solid rgba(121,40,202,0.18)',
                  borderRadius: '12px',
                }}>
                  <div style={{
                    fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: '#a78bfa',
                    marginBottom: '0.5rem',
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Requirements
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                    <Req met={newPwd.length >= 6}        label="6+ characters"     />
                    <Req met={/[A-Z]/.test(newPwd)}      label="Uppercase letter"  />
                    <Req met={/[0-9]/.test(newPwd)}      label="Number (0–9)"      />
                    <Req met={/[^A-Za-z0-9]/.test(newPwd)} label="Special char"   />
                  </div>
                </div>

                <GradientButton
                  loading={isSaving}
                  gradient="linear-gradient(135deg, #7928ca 0%, #0072f5 60%, #06b6d4 100%)"
                  shadow="0 8px 28px rgba(121,40,202,0.4), 0 2px 0 rgba(255,255,255,0.08) inset"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  Update Password
                </GradientButton>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
