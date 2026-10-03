import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import staffApi from '../../../services/staffApi';

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
      setReturnHistory(historyList || []);
    } catch (err) {
      showToast('Failed to load returns: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessReturn = async (resId) => {
    const condition = conditionMap[resId] || 'Good';
    setProcessingMap((prev) => ({ ...prev, [resId]: true }));
    try {
      await staffApi.processReturn(resId, condition);
      showToast(`Resource ${resId} verified and processed as "${condition}".`, 'success');
      await loadReturnsData();
    } catch (err) {
      showToast(err.message || 'Failed to process return', 'error');
    } finally {
      setProcessingMap((prev) => ({ ...prev, [resId]: false }));
    }
  };

  return (
    <div id="returns-view" className="view-section active">
      <h1 className="page-title">Resource Returns</h1>
      <p className="page-subtitle">Inspect returned resources, record condition, and update stock status.</p>

      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Pending Return Verification</div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Asset</th>
              <th>Type</th>
              <th>S/N</th>
              <th>Returned By</th>
              <th>Return Date</th>
              <th>Verify Condition</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody id="returns-tbody">
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  Loading pending returns...
                </td>
              </tr>
            ) : pendingReturns.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  No pending returns in queue
                </td>
              </tr>
            ) : (
              pendingReturns.map((res) => {
                const isProcessing = processingMap[res.id];
                const selectedCondition = conditionMap[res.id] || 'Good';

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
                    <td>{res.allocatedTo || 'Unknown'}</td>
                    <td>{res.returnDate || new Date().toISOString().split('T')[0]}</td>
                    <td>
                      <select
                        className="form-control"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', width: 'auto' }}
                        value={selectedCondition}
                        onChange={(e) =>
                          setConditionMap((prev) => ({ ...prev, [res.id]: e.target.value }))
                        }
                      >
                        <option value="Good">Good (Ready for Use)</option>
                        <option value="Fair">Fair (Usable)</option>
                        <option value="Damaged">Damaged (Needs Maintenance)</option>
                        <option value="Scrap">Scrap (Unusable / Write-off)</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-primary"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => handleProcessReturn(res.id)}
                        disabled={isProcessing}
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
