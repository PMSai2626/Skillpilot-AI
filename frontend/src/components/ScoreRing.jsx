import { useState, useEffect } from 'react';

export default function ScoreRing({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let active = true;
    const duration = 1200;
    const startTime = performance.now();

    const animate = (now) => {
      if (!active) return;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress * (2 - progress); // easeOutQuad
      setAnimatedScore(Math.round(easeProgress * score));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    return () => { active = false; };
  }, [score]);

  const offset = circumference - (circumference * animatedScore) / 100;
  const color = animatedScore >= 80 ? '#00dfd8' : animatedScore >= 60 ? '#f59e0b' : '#ff3333';

  return (
    <div className="score-ring-wrapper">
      <svg className="score-svg" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke={color}
          strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.1s linear', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />
      </svg>
      <div className="score-center">
        <span className="score-num" style={{ color }}>{animatedScore}</span>
        <span className="score-label">/ 100</span>
      </div>
    </div>
  );
}
