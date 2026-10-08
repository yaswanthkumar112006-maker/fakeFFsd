import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import staffApi from '../../../services/staffApi';

export const Allocations = () => {
  const { user, showToast } = useAuth();
  const [requests, setRequests] = useState([]);
  const [availableResourcesMap, setAvailableResourcesMap] = useState({});
  const [selectedMap, setSelectedMap] = useState({}); // reqId -> array of resource IDs
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allocatingMap, setAllocatingMap] = useState({});

  useEffect(() => {
    loadAllocationsData();
  }, [user?.department]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.multi-select-container')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const loadAllocationsData = async () => {
    setLoading(true);
    const userDept = user?.department || 'IT Services';
    try {
      const approved = await staffApi.getApprovedRequests(userDept);
      const reqList = approved || [];
      setRequests(reqList);

      // Fetch available resources for each request's resource type
      const resMap = {};
      await Promise.all(
        reqList.map(async (req) => {
          try {
            const available = await staffApi.getAvailableResources(userDept, req.resourceType);
            resMap[req.id] = available || [];
          } catch (e) {
            resMap[req.id] = [];
          }
        })
      );
      setAvailableResourcesMap(resMap);
    } catch (err) {
      showToast('Failed to load allocation requests: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = (reqId) => {
    setOpenDropdownId((prev) => (prev === reqId ? null : reqId));
  };

  const handleCheckboxChange = (reqId, resId, targetQty) => {
    setSelectedMap((prev) => {
      const currentSelected = prev[reqId] || [];
      let nextSelected;
      if (currentSelected.includes(resId)) {
        nextSelected = currentSelected.filter((id) => id !== resId);
      } else {
        if (currentSelected.length >= targetQty) {
          showToast(`This request requires exactly ${targetQty} item(s). Deselect an item first.`, 'warning');
          return prev;
        }
        nextSelected = [...currentSelected, resId];
      }
      return { ...prev, [reqId]: nextSelected };
    });
  };

  const handleAllocate = async (req) => {
    const selected = selectedMap[req.id] || [];

    if (selected.length !== req.quantity) {
      showToast(
        `Please select exactly ${req.quantity} resource(s) for this request (you selected ${selected.length}).`,
        'error'
      );
      return;
    }

    setAllocatingMap((prev) => ({ ...prev, [req.id]: true }));
    try {
      await staffApi.allocateRequest(req.id, selected);
      showToast(`Request ${req.id} Allocated. ${selected.length} resource(s) assigned successfully.`, 'success');
      // Reset selection for this req
      setSelectedMap((prev) => {
        const next = { ...prev };
        delete next[req.id];
        return next;
      });
      // Reload allocations
      await loadAllocationsData();
    } catch (err) {
      showToast(err.message || 'Failed to allocate request', 'error');
    } finally {
      setAllocatingMap((prev) => ({ ...prev, [req.id]: false }));
    }
  };

  return (
    <div id="allocations-view" className="view-section active">
      <h1 className="page-title">Allocation Requests</h1>
      <p className="page-subtitle">Assign physical inventory assets to approved department requests.</p>

      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Pending Assignments</div>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Req ID</th>
                <th>Asset Type</th>
                <th>Qty</th>
                <th>Select Resources</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody id="allocation-tbody">
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    Loading allocation requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    No pending approved requests to allocate
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const available = availableResourcesMap[req.id] || [];
                  const selected = selectedMap[req.id] || [];
                  const isComplete = selected.length === req.quantity;
                  const isOpen = openDropdownId === req.id;

                  return (
                    <tr key={req.id}>
                      <td className="td-id">{req.id}</td>
                      <td>{req.resourceType}</td>
                      <td>{String(req.quantity).padStart(2, '0')}</td>
                      <td>
                        <div className="multi-select-container">
                          <div
                            className={`multi-select-header ${isOpen ? 'active' : ''}`}
                            id={`multi-header-${req.id}`}
                            onClick={() => toggleDropdown(req.id)}
                          >
                            <span
                              className="multi-select-title"
                              id={`multi-title-${req.id}`}
                              style={{
                                color: isComplete ? '#16a34a' : 'var(--text-main)',
                                fontWeight: isComplete ? '700' : '500',
                              }}
                            >
                              {isComplete
                                ? `${selected.length}/${req.quantity} Selected ✅`
                                : `Select Resources (${selected.length}/${req.quantity})`}
                            </span>
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: '1.2rem', color: '#94a3b8' }}
                            >
                              expand_more
                            </span>
                          </div>

                          {isOpen && (
                            <div
                              className="multi-select-dropdown"
                              id={`multi-drop-${req.id}`}
                              style={{ display: 'flex' }}
                            >
                              {available.length === 0 ? (
                                <div
                                  style={{
                                    padding: '0.6rem',
                                    textAlign: 'center',
                                    color: '#94a3b8',
                                    fontSize: '0.8rem',
                                  }}
                                >
                                  No matching resources available in your department inventory
                                </div>
                              ) : (
                                available.map((res) => (
                                  <label key={res.id}>
                                    <input
                                      type="checkbox"
                                      value={res.id}
                                      className={`alloc-cb-${req.id}`}
                                      checked={selected.includes(res.id)}
                                      onChange={() => handleCheckboxChange(req.id, res.id, req.quantity)}
                                    />
                                    {res.id} - {res.name}
                                    <span className="multi-status-text">{res.condition}</span>
                                  </label>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-primary"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => handleAllocate(req)}
                          disabled={allocatingMap[req.id]}
                        >
                          {allocatingMap[req.id] ? 'Allocating...' : 'Allocate'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Allocations;
