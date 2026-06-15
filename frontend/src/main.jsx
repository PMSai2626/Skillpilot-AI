import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ─── API Routing ─────────────────────────────────────────────────────────────
// In production (Vercel): VITE_API_URL is intentionally NOT set.
// All /api/* calls go to Vercel's own domain, and vercel.json rewrites them
// to the Render backend — avoiding CORS issues entirely.
//
// In development: Vite's proxy in vite.config.js handles /api/* → localhost:8001
//
// Legacy: If VITE_API_URL is somehow set, still intercept for backward compat.
const API_BASE = import.meta.env.VITE_API_URL || '';

if (API_BASE) {
  const _originalFetch = window.fetch.bind(window);
  window.fetch = (url, opts) => {
    if (typeof url === 'string' && url.startsWith('/api/')) {
      url = API_BASE.replace(/\/$/, '') + url;
    }
    return _originalFetch(url, opts);
  };
}

// ─── Render Cold-Start Wake-Up ────────────────────────────────────────────────
// Render free-tier services spin down after 15 min of inactivity.
// We ping a lightweight health endpoint on app load so the server is warm
// before the user clicks "Sign In". The ping is fire-and-forget.
function wakeUpServer() {
  fetch('/api/health', { method: 'GET', signal: AbortSignal.timeout(30000) })
    .catch(() => { /* silently ignore — backend may be waking up */ });
}

wakeUpServer();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
