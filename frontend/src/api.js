// API base URL — in production (Vercel) this is set via VITE_API_URL environment variable
// In development, Vite's proxy handles /api/* → http://127.0.0.1:8001
const API_BASE = import.meta.env.VITE_API_URL || '';

export function apiUrl(path) {
  // path should start with /api/...
  return `${API_BASE}${path}`;
}

export default API_BASE;
