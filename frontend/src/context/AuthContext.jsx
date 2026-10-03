import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const rxData = localStorage.getItem('rx_data');
      if (rxData) {
        const parsed = JSON.parse(rxData);
        if (parsed?.currentUser) return parsed.currentUser;
      }
      const rawUser = localStorage.getItem('currentUser');
      if (rawUser) return JSON.parse(rawUser);
    } catch (e) {
      console.error('Error loading user from localStorage:', e);
    }
    // Default fallback for staff testing if not logged in
    return {
      id: 'U4',
      name: 'prem kumar',
      email: 'prem@resourcex.com',
      role: 'Staff',
      department: 'IT Services',
      organizationId: 'ORG-001',
    };
  });

  const [toasts, setToasts] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    // If no token exists, log in as staff to obtain a valid JWT token
    if (!user?.token) {
      fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'prem@resourcex.com', password: '12345678' }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.access_token) {
            const updatedUser = {
              ...data.user,
              token: data.access_token,
            };
            setUser(updatedUser);
            try {
              const rxData = JSON.parse(localStorage.getItem('rx_data') || '{}');
              rxData.currentUser = updatedUser;
              localStorage.setItem('rx_data', JSON.stringify(rxData));
            } catch (_) {}
          }
        })
        .catch((e) => console.warn('Auto-login error:', e));
    }
  }, []);

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const openFilePreview = (dataUrl, fileName, fileType) => {
    if (!dataUrl) return;
    setPreviewFile({ dataUrl, fileName, fileType });
  };

  const closeFilePreview = () => {
    setPreviewFile(null);
  };

  const logout = () => {
    try {
      const rxData = localStorage.getItem('rx_data');
      if (rxData) {
        const parsed = JSON.parse(rxData);
        parsed.currentUser = null;
        localStorage.setItem('rx_data', JSON.stringify(parsed));
      }
      localStorage.removeItem('currentUser');
    } catch (e) {}
    setUser(null);
    window.location.href = '/pages/login.html';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        logout,
        showToast,
        toasts,
        previewFile,
        openFilePreview,
        closeFilePreview,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
