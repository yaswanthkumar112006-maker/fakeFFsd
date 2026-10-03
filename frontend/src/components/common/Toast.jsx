import React from 'react';
import { useAuth } from '../../context/AuthContext';

export const ToastContainer = () => {
  const { toasts } = useAuth();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div id="toast-container">
      {toasts.map((t) => {
        const icon = t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : '⚠️';
        return (
          <div key={t.id} className={`toast ${t.type || 'success'}`}>
            <span>{icon}</span> <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
