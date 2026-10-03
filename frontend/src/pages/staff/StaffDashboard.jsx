import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import staffApi from '../../services/staffApi';

export const StaffDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingAllocationsCount: 0,
    totalResourcesCount: 0,
    maintenanceCount: 0,
    procurementTasksCount: 0,
    returnsPendingCount: 0,
    recentAllocations: [],
    recentMaintenance: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user?.department]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await staffApi.getDashboardStats(user?.department || 'IT Services');
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="dashboard-view" className="view-section active">
      <h1 className="page-title">Staff Dashboard</h1>
      <p className="page-subtitle">Overview of operations and pending tasks.</p>

      {/* Stats Row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-title">Pending Allocations</div>
          <div className="stat-value-row">
            <div className="stat-value" id="dash-staff-alloc">
              {stats.pendingAllocationsCount}
            </div>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '1.5rem', color: '#0f38ae' }}
            >
              assignment
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Total Resources</div>
          <div className="stat-value-row">
            <div className="stat-value" id="dash-staff-res">
              {stats.totalResourcesCount}
            </div>
            <span className="material-symbols-outlined" style={{ fontSize: '1.5rem' }}>
              inventory_2
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title" style={{ color: '#d97706' }}>
            Maintenance
          </div>
          <div className="stat-value-row">
            <div className="stat-value" style={{ color: '#d97706' }} id="dash-staff-maint">
              {stats.maintenanceCount}
            </div>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '1.5rem', color: '#d97706' }}
            >
              build
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title" style={{ color: '#0284c7' }}>
            Procurement Tasks
          </div>
          <div className="stat-value-row">
            <div className="stat-value" style={{ color: '#0284c7' }} id="dash-staff-proc">
              {stats.procurementTasksCount}
            </div>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '1.5rem', color: '#0284c7' }}
            >
              shopping_cart
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title" style={{ color: '#8b5cf6' }}>
            Returns Pending
          </div>
          <div className="stat-value-row">
            <div className="stat-value" style={{ color: '#8b5cf6' }} id="dash-staff-returns">
              {stats.returnsPendingCount}
            </div>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '1.5rem', color: '#8b5cf6' }}
            >
              assignment_return
            </span>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Left Column: Allocation Requests */}
        <div className="data-section" style={{ flex: 1, marginBottom: 0 }}>
          <div className="data-section-header">
            <div className="data-section-title">Allocation Requests</div>
            <button
              className="btn-secondary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => navigate('/staff/allocations')}
            >
              View All
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Resource</th>
                <th>Qty</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody id="dash-alloc-tbody">
              {stats.recentAllocations.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>
                    No pending allocation requests
                  </td>
                </tr>
              ) : (
                stats.recentAllocations.map((req) => (
                  <tr key={req.id}>
                    <td className="td-id">{req.id}</td>
                    <td>{req.resourceType}</td>
                    <td>{req.quantity}</td>
                    <td>{req.requestor}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Right Column: Maintenance Queue */}
        <div className="data-section" style={{ flex: 1, marginBottom: 0 }}>
          <div className="data-section-header">
            <div className="data-section-title">Maintenance Queue</div>
            <button
              className="btn-secondary"
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              onClick={() => navigate('/staff/maintenance')}
            >
              View All
            </button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="dash-maint-tbody">
              {stats.recentMaintenance.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>
                    No resources in maintenance queue
                  </td>
                </tr>
              ) : (
                stats.recentMaintenance.map((res) => (
                  <tr key={res.id}>
                    <td className="td-id">{res.id}</td>
                    <td>{res.type}</td>
                    <td>
                      <span className="badge pending">{res.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
