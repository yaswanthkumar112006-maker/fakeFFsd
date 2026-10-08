import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import staffApi from '../../services/staffApi';

export const Header = ({ onSearch }) => {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 'Dem1', title: 'New Feature available', description: 'Try out the new analytics dashboard.', time: '10 mins ago', read: false },
    { id: 'Dem2', title: 'System Update', description: 'System maintenance window scheduled for tonight.', time: '2 hours ago', read: false },
    { id: 'Dem3', title: 'Welcome!', description: 'Welcome to ResourceX.', time: '1 day ago', read: true },
  ]);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    // Fetch notifications if available from backend
    staffApi.getNotifications()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const userNotifs = data.filter(
            (n) => n.recipientRole === 'All' || n.recipientRole === (user?.role || 'Staff')
          );
          if (userNotifs.length > 0) {
            setNotifications(userNotifs);
          }
        }
      })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearch) onSearch(val);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    if (onSearch) onSearch('');
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const userName = user?.name || 'Staff User';
  const userRole = user?.role || 'Staff';

  return (
    <header className="top-header">
      <div className="search-bar">
        <span className="search-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {searchTerm && (
          <span
            className="clear-btn"
            style={{ display: 'flex' }}
            onClick={handleClearSearch}
          >
            ✕
          </span>
        )}
      </div>

      <div className="header-actions">
        {/* Notifications Dropdown */}
        <div className="dropdown-container" ref={notifRef}>
          <button
            className="icon-btn notification-btn"
            title="Notifications"
            onClick={(e) => {
              e.stopPropagation();
              setShowNotifications((prev) => !prev);
              setShowProfileMenu(false);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem',
              borderRadius: '50%',
              transition: 'background 0.2s',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--text-main)' }}>
              notifications
            </span>
            {unreadCount > 0 && (
              <span className="notification-badge" id="notifBadge">
                {unreadCount}
              </span>
            )}
          </button>

          <div
            className={`dropdown-menu notifications-dropdown ${showNotifications ? 'show' : ''}`}
            style={{ position: 'absolute', right: 0 }}
          >
            <div className="dropdown-header">Notifications</div>
            <div className="notification-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-item ${n.read ? '' : 'notif-unread'}`}
                  onClick={() => alert(`Viewing notification: ${n.title}`)}
                >
                  <div className="notif-title">{n.title}</div>
                  <div className="notif-desc">{n.description}</div>
                  <div className="notif-time">{n.time}</div>
                </div>
              ))}
            </div>
            <div className="dropdown-footer" onClick={markAllRead}>
              Mark all as read
            </div>
          </div>
        </div>

        {/* Profile Dropdown */}
        <div className="dropdown-container" ref={profileRef}>
          <button
            className="profile-btn"
            title="Profile"
            onClick={(e) => {
              e.stopPropagation();
              setShowProfileMenu((prev) => !prev);
              setShowNotifications(false);
            }}
          >
            <div className="user-avatar-small">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0f38ae&color=fff`}
                alt={userName}
              />
            </div>
          </button>

          <div
            className={`dropdown-menu profile-dropdown ${showProfileMenu ? 'show' : ''}`}
            style={{ position: 'absolute', right: 0 }}
          >
            <div
              className="dropdown-header"
              style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '0.5rem', textAlign: 'left' }}
            >
              <strong>{userName}</strong>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user?.department} Staff</div>
            </div>
            <a href="/pages/profile.html" className="dropdown-item">
              <span className="material-symbols-outlined dropdown-icon">person</span> My Profile
            </a>
            <a href="/pages/profile.html" className="dropdown-item">
              <span className="material-symbols-outlined dropdown-icon">settings</span> Settings
            </a>
            <div className="dropdown-divider"></div>
            <div
              className="dropdown-item text-danger"
              style={{ cursor: 'pointer' }}
              onClick={logout}
            >
              <span className="material-symbols-outlined dropdown-icon">logout</span> Logout
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
