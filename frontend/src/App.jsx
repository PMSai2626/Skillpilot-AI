import { useState, useRef, useEffect } from 'react';
import './index.css';

import { useAuth } from './hooks/useAuth';
import AuthScreen from './components/AuthScreen';
import Toast from './components/Toast';
import DashboardTab from './components/DashboardTab';
import AnalysisTab from './components/AnalysisTab';
import HistoryTab from './components/HistoryTab';
import AdminTab from './components/AdminTab';
import JDMatchTab from './components/JDMatchTab';


// ─── App Root ────────────────────────────────────────────────────────────────
export default function App() {
  const { user, login, logout, updateUser } = useAuth();
  const [toast, setToast] = useState(null);

  // ── Theme ──────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => localStorage.getItem('ai_resume_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ai_resume_theme', theme);
  }, [theme]);

  // ── Upload / Scan state ────────────────────────────────────────────────────
  const [scanStep, setScanStep] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentResumeId, setCurrentResumeId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // ── Suggestion state ───────────────────────────────────────────────────────
  const [activeSuggestionId, setActiveSuggestionId] = useState(null);
  const [suggestionText, setSuggestionText] = useState('');
  const [isApplyingSuggestion, setIsApplyingSuggestion] = useState(false);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('analysis');
  const [history, setHistory] = useState([]);

  // ── JD Match persisted state (lifted here so it survives tab switches) ──────
  const [jdResult, setJdResult] = useState(null);
  const [jdResumeMode, setJdResumeMode] = useState('file');
  const [jdResumeFile, setJdResumeFile] = useState(null);
  const [jdResumeText, setJdResumeText] = useState('');
  const [jdText, setJdText] = useState('');

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => setToast({ message, type });

  const handleLogin = (userData, isRegister = false) => {
    login(userData);
    sessionStorage.setItem('ai_resume_welcome_shown', 'true');
    showToast(
      isRegister
        ? `Welcome! Account created for ${userData.name}.`
        : `Welcome back, ${userData.name}! Login successful.`,
      'success',
    );
  };

  const handleLogout = () => {
    sessionStorage.removeItem('ai_resume_welcome_shown');
    logout();
    showToast('Logged out successfully. See you again!', 'info');
  };

  // Welcome-back toast on first load after refresh
  useEffect(() => {
    if (user) {
      const shown = sessionStorage.getItem('ai_resume_welcome_shown');
      if (!shown) {
        sessionStorage.setItem('ai_resume_welcome_shown', 'true');
        const t = setTimeout(() => showToast(`Welcome back, ${user.name}! 👋`, 'info'), 600);
        return () => clearTimeout(t);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.id}/history`);
      if (res.status === 401 || res.status === 404) {
        handleLogout();
        return;
      }
      if (res.ok) setHistory(await res.json());
    } catch (err) {
      console.error('History fetch failed:', err);
    }
  };

  // Optimistically remove a deleted resume from local state and re-fetch
  const handleDeleteResume = (deletedResumeId) => {
    setHistory(prev => prev.filter(item => item.resumeId !== deletedResumeId));
    // Re-fetch to ensure version numbers stay consistent
    setTimeout(fetchHistory, 300);
  };

  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'history') fetchHistory();
  }, [activeTab, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── File processing pipeline ───────────────────────────────────────────────
  const processFile = async (file) => {
    if (!file) return;
    setIsUploading(true);
    setError('');
    setScanStep(1);
    setScanProgress(10);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user?.id || 1);

    try {
      const response = await fetch('/api/resumes/upload', { method: 'POST', body: formData });
      if (response.status === 401 || response.status === 404) {
        handleLogout();
        showToast('Your session has expired. Please log in again.', 'error');
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Upload failed');

      setCurrentResumeId(data.resumeId);
      setScanProgress(25);

      // Multi-stage scan animation
      const delay = (ms) => new Promise(r => setTimeout(r, ms));
      await delay(1200); setScanStep(2); setScanProgress(50);
      await delay(1200); setScanStep(3); setScanProgress(75);
      await delay(1200); setScanStep(4); setScanProgress(95);
      await delay(1200); setScanStep(5); setScanProgress(100);
      await delay(400);

      setAnalysisResult(data.analysis);
      setActiveTab('analysis');
      showToast('Resume analysis complete!', 'success');
    } catch (err) {
      setError(err.message || 'Failed to connect to server. Make sure the backend is running.');
    } finally {
      setIsUploading(false);
      setScanStep(0);
      setScanProgress(0);
    }
  };

  const handleFileUpload = (e) => processFile(e.target.files[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  // ── Suggestion applicator ──────────────────────────────────────────────────
  const handleApplySuggestion = async (suggestionId) => {
    if (!currentResumeId) {
      showToast('No active resume session found. Please re-upload.', 'error');
      return;
    }
    setIsApplyingSuggestion(true);
    try {
      const res = await fetch(`/api/resumes/${currentResumeId}/apply-suggestion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId, customText: suggestionText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to apply suggestion');

      showToast('Suggestion applied! Recalculating score...', 'success');

      const analysisRes = await fetch(`/api/resumes/${data.newResumeId}/analysis`);
      if (analysisRes.ok) {
        const analysisData = await analysisRes.json();
        setCurrentResumeId(data.newResumeId);
        setAnalysisResult(analysisData);
        showToast(`Score updated! New ATS score: ${analysisData.overallScore}`, 'success');
        fetchHistory();
      }
    } catch (err) {
      showToast(err.message || 'Failed to apply suggestion', 'error');
    } finally {
      setIsApplyingSuggestion(false);
      setActiveSuggestionId(null);
      setSuggestionText('');
    }
  };

  // ── Auth gate ──────────────────────────────────────────────────────────────
  if (!user) return (
    <>
      <AuthScreen onLogin={handleLogin} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );

  // ── Main layout ────────────────────────────────────────────────────────────
  return (
    <>
      <div className="app-container">
        {/* Header */}
        <header className="header">
          <div className="brand">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 6px rgba(6,182,212,0.7))' }}>
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <span>SkillPilot<span style={{ fontWeight: 400, opacity: 0.75 }}>AI</span></span>
          </div>

          <nav className="nav-links">
            <button id="nav-dashboard" className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              Dashboard
            </button>
            <button id="nav-analysis" className={`nav-btn ${activeTab === 'analysis' ? 'active' : ''}`} onClick={() => setActiveTab('analysis')}>
              Upload &amp; Analysis
            </button>
            <button id="nav-history" className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              History
            </button>
            <button id="nav-jd-match" className={`nav-btn ${activeTab === 'jd-match' ? 'active' : ''}`} onClick={() => setActiveTab('jd-match')}>
              🎯 JD Match
            </button>

            {user?.role === 'admin' || user?.role === 'mentor' ? (
              <button id="nav-admin" className={`nav-btn ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
                📊 Admin
              </button>
            ) : null}
          </nav>

          <div className="user-chip">
            <button
              className="theme-toggle-btn"
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div className="user-avatar">{user.name[0].toUpperCase()}</div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-sub)' }}>{user.name}</span>
            <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main>
          {activeTab === 'dashboard' && (
            <DashboardTab
              user={user}
              history={history}
              onUploadClick={() => { setActiveTab('analysis'); setTimeout(() => fileInputRef.current?.click(), 100); }}
              onLogout={handleLogout}
              onDeleteResume={handleDeleteResume}
              onUserUpdate={updateUser}
            />
          )}
          {activeTab === 'analysis' && (
            <AnalysisTab
              isUploading={isUploading}
              scanStep={scanStep}
              scanProgress={scanProgress}
              isDragging={isDragging}
              setIsDragging={setIsDragging}
              fileInputRef={fileInputRef}
              handleFileUpload={handleFileUpload}
              handleDrop={handleDrop}
              error={error}
              analysisResult={analysisResult}
              activeSuggestionId={activeSuggestionId}
              setActiveSuggestionId={setActiveSuggestionId}
              suggestionText={suggestionText}
              setSuggestionText={setSuggestionText}
              isApplyingSuggestion={isApplyingSuggestion}
              handleApplySuggestion={handleApplySuggestion}
            />
          )}
          {activeTab === 'history' && (
            <HistoryTab
              user={user}
              history={history}
              onUploadClick={() => { setActiveTab('analysis'); setTimeout(() => fileInputRef.current?.click(), 100); }}
              onDeleteResume={handleDeleteResume}
            />
          )}
          {/* JDMatchTab is always mounted — hidden with CSS when inactive to preserve state */}
          <div style={{ display: activeTab === 'jd-match' ? 'block' : 'none' }}>
            <JDMatchTab
              result={jdResult}
              setResult={setJdResult}
              resumeMode={jdResumeMode}
              setResumeMode={setJdResumeMode}
              resumeFile={jdResumeFile}
              setResumeFile={setJdResumeFile}
              resumeText={jdResumeText}
              setResumeText={setJdResumeText}
              jdText={jdText}
              setJdText={setJdText}
            />
          </div>

          {activeTab === 'admin' && <AdminTab />}
        </main>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
