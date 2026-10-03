import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { user } = useAuth();
  const userName = user?.name || 'prem kumar';
  const userRole = (user?.department ? `${user.department} Staff` : 'Operations Staff');
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div className="logo-icon">R</div>
        <div className="logo-text">ResourceX</div>
      </div>

      <ul className="nav-menu">
        <li>
          <NavLink
            to="/staff"
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined">dashboard</span> Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/staff/allocations"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined">sync_alt</span> Allocation Requests
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/staff/registration"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined">label</span> Resource Registration
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/staff/inventory"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined">inventory_2</span> Manage Resources
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/staff/maintenance"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined">build</span> Maintenance
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/staff/returns"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined">assignment_return</span> Returns
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/staff/procurement"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined">assignment</span> Procurement Tasks
          </NavLink>
        </li>
      </ul>

      <div className="user-profile-widget">
        <div className="user-avatar" style={{ overflow: 'hidden' }}>
          <div
            style={{
              background: '#1e293b',
              color: 'white',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1rem',
            }}
          >
            {userInitial}
          </div>
        </div>
        <div className="user-info">
          <span className="user-name">{userName}</span>
          <span className="user-role">{userRole}</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
