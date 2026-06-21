import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const logoutRef = useRef(logout);
  useEffect(() => {
    logoutRef.current = logout;
  });

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url) || '';
        if (!url.includes('/api/auth/login')) {
          const hasToken = localStorage.getItem('token');
          if (hasToken) {
            logoutRef.current();
            toast.error('Session expired. Please log in again.');
          }
        }
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  useEffect(() => {
    // If we have a token, we could parse it or verify with backend.
    // Given our blueprint, we trust the stored user info and token.
    const storedUser = localStorage.getItem('user');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
      setToken(null);
    }
    setLoading(false);
  }, [token]);

  const login = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const updateUser = (userData) => {
    const merged = { ...user, ...userData };
    localStorage.setItem('user', JSON.stringify(merged));
    setUser(merged);
  };

  const value = {
    user,
    token,
    login,
    logout,
    updateUser,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

