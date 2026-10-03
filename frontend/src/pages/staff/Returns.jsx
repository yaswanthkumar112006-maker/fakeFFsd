import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import staffApi from '../../services/staffApi';

export const Returns = () => {
  const { user, showToast } = useAuth();
  const [pendingReturns, setPendingReturns] = useState([]);
  const [returnHistory, setReturnHistory] = useState([]);
  const [conditionMap, setConditionMap] = useState({}); // resId -> condition string
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingMap, setProcessingMap] = useState({});

  useEffect(() => {
    loadReturnsData();
  }, [user?.department]);

  const loadReturnsData = async () => {
    setLoading(true);
    const userDept = user?.department || 'IT Services';
    try {
      const [pendingList, historyList] = await Promise.all([
        staffApi.getPendingReturns(userDept),
        staffApi.getReturnHistory().catch(() => []),
      ]);
      setPendingReturns(pendingList || []);

      // Filter return history for department
      const deptHistory = (historyList || []).filter((log) => {
        return log.department === userDept || !log.department;
      });
      setReturnHistory(deptHistory);
    } catch (err) {
      showToast('Failed to load returns data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConditionChange = (resId, condition) => {
    setConditionMap((prev) => ({ ...prev, [resId]: condition }));
  };

  const handleProcessReturn = async (resId) => {
    const condition = conditionMap[resId];
    if (!condition) {
      showToast('Please inspect and select a condition before processing.', 'warning');
      return;
    }

    setProcessingMap((prev) => ({ ...prev, [resId]: true }));
    try {
      await staffApi.processReturn(resId, condition);
      const newStatus = condition === 'Bad' ? 'Scrapped' : 'Available';

      if (newStatus === 'Available') {
        showToast('Return processed. Resource marked as Available.', 'success');
      } else {
        showToast('Return processed. Resource marked as Scrap.', 'error');
      }

      // Reset condition selection for this item
      setConditionMap((prev) => {
        const next = { ...prev };
        delete next[resId];
        return next;
      });

      await loadReturnsData();
    } catch (err) {
      showToast(err.message || 'Failed to process return', 'error');
    } finally {
      setProcessingMap((prev) => ({ ...prev, [resId]: false }));
    }
  };

  return (
    <div id="returns-view" className="view-section active">
      <h1 className="page-title">Return Management</h1>
      <p className="page-subtitle">Inspect returned assets and update inventory availability.</p>

      {/* Pending Returns */}
      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Pending Returns</div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Type</th>
              <th>Returned By</th>
              <th>Return Date</th>
              <th>Condition Inspection</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody id="return-tbody">
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  Loading pending returns...
                </td>
              </tr>
            ) : pendingReturns.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  No pending returns in queue
                </td>
              </tr>
            ) : (
              pendingReturns.map((res) => {
                const selectedCond = conditionMap[res.id] || '';
                const isProcessing = processingMap[res.id];

                return (
                  <tr key={res.id}>
                    <td>
                      <div className="td-id">{res.id}</div>
                    </td>
                    <td>{res.type}</td>
                    <td>{res.assignedTo || 'Unknown'}</td>
                    <td>{res.date || new Date().toLocaleDateString()}</td>
                    <td>
                      <select
                        className="form-control"
                        style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                        value={selectedCond}
                        onChange={(e) => handleConditionChange(res.id, e.target.value)}
                      >
                        <option value="">-- Inspect Condition --</option>
                        <option value="Good">Good &rarr; Available</option>
                        <option value="Average">Average &rarr; Available</option>
                        <option value="Bad">Bad &rarr; Scrap</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-primary"
                        style={{ fontSize: '0.75rem' }}
                        disabled={!selectedCond || isProcessing}
                        onClick={() => handleProcessReturn(res.id)}
                      >
                        {isProcessing ? 'Processing...' : 'Process Return'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Return History Collapsible */}
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
          Return History{' '}
          <span className="badge pending" id="return-history-count" style={{ marginLeft: '8px' }}>
            {returnHistory.length}
          </span>
        </div>
        <span id="return-history-icon" className="material-symbols-outlined" style={{ fontSize: '18px' }}>
          {isHistoryExpanded ? 'expand_less' : 'expand_more'}
        </span>
      </div>

      {isHistoryExpanded && (
        <div className="collapsible-content expanded" id="return-history" style={{ display: 'block' }}>
          <div className="data-section">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Returned By</th>
                  <th>Return Date</th>
                  <th>Processed Date</th>
                  <th>Condition</th>
                  <th>Final Status</th>
                </tr>
              </thead>
              <tbody id="return-history-tbody">
                {returnHistory.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                      No return history logs found.
                    </td>
                  </tr>
                ) : (
                  returnHistory.map((log, index) => {
                    const sbadge =
                      log.finalStatus === 'Available' ? (
                        <span className="badge allocated">{log.finalStatus}</span>
                      ) : (
                        <span className="badge rejected">{log.finalStatus}</span>
                      );

                    return (
                      <tr key={log.id || `${log.code}-${index}`}>
                        <td>
                          <div className="td-id">{log.code}</div>
                        </td>
                        <td>{log.type}</td>
                        <td>{log.returnedBy}</td>
                        <td>{log.returnDate}</td>
                        <td>{log.processDate}</td>
                        <td>{log.condition}</td>
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

export default Returns;
