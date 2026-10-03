import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import staffApi from '../../services/staffApi';

export const Maintenance = () => {
  const { user, showToast } = useAuth();
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoadingMap, setActionLoadingMap] = useState({});

  useEffect(() => {
    loadMaintenanceData();
  }, [user?.department]);

  const loadMaintenanceData = async () => {
    setLoading(true);
    const userDept = user?.department || 'IT Services';
    try {
      const [queueData, historyData] = await Promise.all([
        staffApi.getMaintenanceQueue(userDept),
        staffApi.getMaintenanceHistory().catch(() => []),
      ]);
      setQueue(queueData || []);

      // Filter history for current department or related resources
      const deptHistory = (historyData || []).filter((log) => {
        return log.department === userDept || !log.department;
      });
      setHistory(deptHistory);
    } catch (err) {
      showToast('Failed to load maintenance data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (resId) => {
    setActionLoadingMap((prev) => ({ ...prev, [resId]: true }));
    try {
      await staffApi.acceptMaintenance(resId);
      showToast('Maintenance accepted. Resource is now under maintenance.', 'success');
      await loadMaintenanceData();
    } catch (err) {
      showToast(err.message || 'Failed to accept maintenance', 'error');
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [resId]: false }));
    }
  };

  const handleMarkRepaired = async (resId) => {
    setActionLoadingMap((prev) => ({ ...prev, [resId]: true }));
    try {
      await staffApi.repairMaintenance(resId);
      showToast('Resource marked as repaired. User notified.', 'success');
      await loadMaintenanceData();
    } catch (err) {
      showToast(err.message || 'Failed to mark repaired', 'error');
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [resId]: false }));
    }
  };

  const handleMarkScrap = async (resId) => {
    setActionLoadingMap((prev) => ({ ...prev, [resId]: true }));
    try {
      await staffApi.scrapMaintenance(resId);
      showToast('Resource marked as scrap. User notified.', 'error');
      await loadMaintenanceData();
    } catch (err) {
      showToast(err.message || 'Failed to mark scrap', 'error');
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [resId]: false }));
    }
  };

  return (
    <div id="maintenance-view" className="view-section active">
      <h1 className="page-title">Maintenance Management</h1>
      <p className="page-subtitle">Track and resolve active repair tickets.</p>

      {/* Active Repair Queue */}
      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Active Repair Queue</div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Allocated To</th>
              <th>Issue/Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody id="maint-tbody">
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  Loading active repair queue...
                </td>
              </tr>
            ) : queue.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  No active maintenance tickets in queue
                </td>
              </tr>
            ) : (
              queue.map((res) => {
                const isUnderMaint = res.status === 'Maintenance';
                const statusText = isUnderMaint ? 'Under Maintenance' : res.status;
                const isBusy = actionLoadingMap[res.id];

                return (
                  <tr key={res.id}>
                    <td>
                      <div className="td-id">{res.id}</div>
                    </td>
                    <td>{res.type}</td>
                    <td>{res.assignedTo || 'None'}</td>
                    <td>
                      <span className="badge pending">{statusText}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {res.status === 'Maintenance Requested' ? (
                        <>
                          <button
                            className="btn-primary"
                            style={{ fontSize: '0.75rem', marginRight: '4px' }}
                            onClick={() => handleAccept(res.id)}
                            disabled={isBusy}
                          >
                            Accept
                          </button>
                          <button
                            className="btn-danger"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => handleMarkScrap(res.id)}
                            disabled={isBusy}
                          >
                            Reject &rarr; Scrap
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="btn-primary"
                            style={{ fontSize: '0.75rem', background: '#16a34a', marginRight: '4px' }}
                            onClick={() => handleMarkRepaired(res.id)}
                            disabled={isBusy}
                          >
                            Mark Repaired
                          </button>
                          <button
                            className="btn-danger"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => handleMarkScrap(res.id)}
                            disabled={isBusy}
                          >
                            Mark Scrap
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Maintenance History Collapsible */}
      <div
        className="collapsible-header"
        onClick={() => setIsHistoryExpanded((prev) => !prev)}
        style={{ cursor: 'pointer' }}
      >
        <div>
          <span
            className="material-symbols-outlined"
            style={{ marginRight: '8px', verticalAlign: 'middle', fontSize: '18px' }}
          >
            history
          </span>
          Maintenance History{' '}
          <span className="badge pending" id="maint-history-count" style={{ marginLeft: '8px' }}>
            {history.length}
          </span>
        </div>
        <span id="maint-history-icon" className="material-symbols-outlined" style={{ fontSize: '18px' }}>
          {isHistoryExpanded ? 'expand_less' : 'expand_more'}
        </span>
      </div>

      {isHistoryExpanded && (
        <div className="collapsible-content expanded" id="maint-history" style={{ display: 'block' }}>
          <div className="data-section">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Allocated To</th>
                  <th>Issue</th>
                  <th>Action Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="maint-history-tbody">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                      No maintenance history logs found.
                    </td>
                  </tr>
                ) : (
                  history.map((log, index) => {
                    const sbadge =
                      log.status === 'Repaired' ? (
                        <span className="badge allocated">{log.status}</span>
                      ) : (
                        <span className="badge rejected">{log.status}</span>
                      );

                    return (
                      <tr key={log.id || `${log.code}-${index}`}>
                        <td>
                          <div className="td-id">{log.code}</div>
                        </td>
                        <td>{log.type}</td>
                        <td>{log.allocatedTo}</td>
                        <td>{log.issue || 'Routine'}</td>
                        <td>{log.actionDate}</td>
                        <td>{sbadge}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance;
