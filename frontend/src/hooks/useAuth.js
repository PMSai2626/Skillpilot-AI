import { useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ai_resume_user')) || null; }
    catch { return null; }
  });

  const login = (userData) => {
    localStorage.setItem('ai_resume_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('ai_resume_user');
    localStorage.removeItem('ai_resume_token');
    setUser(null);
  };

  const updateUser = (userData) => {
    localStorage.setItem('ai_resume_user', JSON.stringify(userData));
    setUser(userData);
  };

  return { user, login, logout, updateUser };
}
