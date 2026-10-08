import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import staffApi from '../../../services/staffApi';

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
    const userDept = user?.department || 'IT Services';
    try {
      const data = await staffApi.getDashboardStats(userDept);
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="dashboard-view" className="view-section active">
      <h1 className="page-title">Operations Dashboard</h1>
      <p className="page-subtitle">Welcome back! Real-time operational overview for {user?.department || 'IT Services'}.</p>

      {/* Metrics Row */}
      <div className="stats-grid">
        <div
          className="stat-card"
          onClick={() => navigate('/staff/allocations')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-header">
            <span className="stat-title">Pending Allocations</span>
            <div className="stat-icon-wrapper blue">
              <span className="material-symbols-outlined">assignment</span>
            </div>
          </div>
          <div className="stat-value" id="dash-stat-alloc">
            {loading ? '...' : stats.pendingAllocationsCount}
          </div>
          <div className="stat-trend neutral">Requests waiting for fulfillment</div>
        </div>

        <div
          className="stat-card"
          onClick={() => navigate('/staff/inventory')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-header">
            <span className="stat-title">Active Assets</span>
            <div className="stat-icon-wrapper green">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
          </div>
          <div className="stat-value" id="dash-stat-stock">
            {loading ? '...' : stats.totalResourcesCount}
          </div>
          <div className="stat-trend neutral">In department inventory</div>
        </div>

        <div
          className="stat-card"
          onClick={() => navigate('/staff/maintenance')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-header">
            <span className="stat-title">In Maintenance</span>
            <div className="stat-icon-wrapper orange">
              <span className="material-symbols-outlined">build</span>
            </div>
          </div>
          <div className="stat-value" id="dash-stat-maint">
            {loading ? '...' : stats.maintenanceCount}
          </div>
          <div className="stat-trend neutral">Under repair or diagnosis</div>
        </div>

        <div
          className="stat-card"
          onClick={() => navigate('/staff/procurement')}
          style={{ cursor: 'pointer' }}
        >
          <div className="stat-header">
            <span className="stat-title">Procurement Orders</span>
            <div className="stat-icon-wrapper purple">
              <span className="material-symbols-outlined">shopping_cart</span>
            </div>
          </div>
          <div className="stat-value" id="dash-stat-proc">
            {loading ? '...' : stats.procurementTasksCount}
          </div>
          <div className="stat-trend neutral">Pending purchase execution</div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div
        className="data-section"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#fff',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>
            New Asset Deliveries Pending Registration?
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            Record serial numbers and register incoming purchases into active stock.
          </p>
        </div>
        <button
          className="btn-primary"
          style={{
            background: '#3b82f6',
            padding: '0.65rem 1.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
          onClick={() => navigate('/staff/registration')}
        >
          Open Bulk Registration
        </button>
      </div>

      {/* Tables Row */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* Left Column: Recent Allocation Requests */}
        <div className="data-section" style={{ flex: 1, marginBottom: 0 }}>
          <div className="data-section-header">
            <div className="data-section-title">Pending Allocation Requests</div>
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
                <th>Req ID</th>
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
