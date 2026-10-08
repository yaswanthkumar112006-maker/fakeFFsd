import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import staffApi from '../../../services/staffApi';

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
      setHistory(historyData || []);
    } catch (err) {
      showToast('Failed to load maintenance records: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToMaintenance = async (resId) => {
    setActionLoadingMap((prev) => ({ ...prev, [resId]: true }));
    try {
      await staffApi.sendToMaintenance(resId);
      showToast(`Resource ${resId} placed into Under Maintenance`, 'success');
      await loadMaintenanceData();
    } catch (err) {
      showToast(err.message || 'Failed to update resource status', 'error');
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [resId]: false }));
    }
  };

  const handleMarkRepaired = async (resId) => {
    setActionLoadingMap((prev) => ({ ...prev, [resId]: true }));
    try {
      await staffApi.markRepaired(resId);
      showToast(`Resource ${resId} repaired and returned to Available inventory!`, 'success');
      await loadMaintenanceData();
    } catch (err) {
      showToast(err.message || 'Failed to mark repaired', 'error');
    } finally {
      setActionLoadingMap((prev) => ({ ...prev, [resId]: false }));
    }
  };

  const handleMarkScrap = async (resId) => {
    if (window.confirm(`Permanently scrap resource ${resId}?`)) {
      setActionLoadingMap((prev) => ({ ...prev, [resId]: true }));
      try {
        await staffApi.markScrap(resId);
        showToast(`Resource ${resId} decommissioned and marked as Scrapped.`, 'error');
        await loadMaintenanceData();
      } catch (err) {
        showToast(err.message || 'Failed to scrap resource', 'error');
      } finally {
        setActionLoadingMap((prev) => ({ ...prev, [resId]: false }));
      }
    }
  };

  return (
    <div id="maintenance-view" className="view-section active">
      <h1 className="page-title">Maintenance & Repairs</h1>
      <p className="page-subtitle">Track damaged or returned equipment needing service or repairs.</p>

      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Maintenance Work Queue</div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Asset</th>
              <th>Type</th>
              <th>S/N</th>
              <th>Reported Issue / Condition</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody id="maintenance-tbody">
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  Loading maintenance items...
                </td>
              </tr>
            ) : queue.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  No resources currently in maintenance queue
                </td>
              </tr>
            ) : (
              queue.map((res) => {
                const isUnderMaintenance = res.status === 'Under Maintenance';
                const isBusy = actionLoadingMap[res.id];

                return (
                  <tr key={res.id}>
                    <td>
                      <div className="td-id">{res.id}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{res.name || res.type}</td>
                    <td>{res.type}</td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          background: '#f1f5f9',
                          padding: '2px 4px',
                          borderRadius: '4px',
                        }}
                      >
                        {res.serialNumber || 'N/A'}
                      </span>
                    </td>
                    <td>{res.condition || 'Needs Maintenance'}</td>
                    <td>
                      <span
                        className={`badge ${isUnderMaintenance ? 'under-maintenance' : 'in-maintenance'}`}
                      >
                        {res.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {!isUnderMaintenance ? (
                        <button
                          className="btn-primary"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => handleSendToMaintenance(res.id)}
                          disabled={isBusy}
                        >
                          Send to Maintenance
                        </button>
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
