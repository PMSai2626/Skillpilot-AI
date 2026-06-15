import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// ─── Production API routing ────────────────────────────────────────────────────
// In production (Vercel), VITE_API_URL = your Render backend URL
// e.g. https://skillpilot-ai-backend.onrender.com
// In development, this is empty string — Vite proxy handles /api/* → localhost:8001
const API_BASE = import.meta.env.VITE_API_URL || '';

if (API_BASE) {
  // Transparently prefix all /api/ fetch calls with the backend base URL
  const _originalFetch = window.fetch.bind(window);
  window.fetch = (url, opts) => {
    if (typeof url === 'string' && url.startsWith('/api/')) {
      url = API_BASE.replace(/\/$/, '') + url;
    }
    return _originalFetch(url, opts);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
