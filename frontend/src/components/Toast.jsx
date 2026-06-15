import { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [message, type, onClose]);

  const icons = { success: '🎉', info: '✨', error: '⚠️' };

  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`}>
        <span className="toast-icon">{icons[type] || '🔔'}</span>
        <span className="toast-message">{message}</span>
        <button className="toast-close" onClick={onClose} aria-label="Close alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  );
}
