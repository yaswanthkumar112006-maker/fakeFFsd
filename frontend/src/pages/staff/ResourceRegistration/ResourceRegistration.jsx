import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import staffApi from '../../../services/staffApi';

export const ResourceRegistration = () => {
  const { user, showToast, openFilePreview } = useAuth();
  const navigate = useNavigate();
  const [procurements, setProcurements] = useState([]);
  const [rowsMap, setRowsMap] = useState({}); // procId -> array of row objects
  const [existingResources, setExistingResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingMap, setSubmittingMap] = useState({});

  useEffect(() => {
    loadRegistrationData();
  }, [user?.department]);

  const loadRegistrationData = async () => {
    setLoading(true);
    const userDept = user?.department || 'IT Services';
    try {
      const [allProc, allRes] = await Promise.all([
        staffApi.getFulfilledProcurements(userDept),
        staffApi.getResources({ department: userDept }).catch(() => []),
      ]);

      const fulfilled = allProc || [];
      setProcurements(fulfilled);
      setExistingResources(allRes || []);

      // Initialize rows for each procurement based on quantity
      const newRowsMap = {};
      fulfilled.forEach((p) => {
        const rows = [];
        const qty = parseInt(p.quantity, 10) || 1;
        for (let i = 0; i < qty; i++) {
          rows.push({
            id: generateUniqueCode(p.resourceType, (allRes || []).concat(getAllLocalGenerated(newRowsMap))),
            model: p.resourceType || '',
            serialNumber: '',
            location: 'Main Store',
            condition: 'Good',
            status: 'Available',
          });
        }
        newRowsMap[p.id] = rows;
      });
      setRowsMap(newRowsMap);
    } catch (err) {
      showToast('Failed to load pending registrations: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getAllLocalGenerated = (map) => {
    const list = [];
    Object.values(map).forEach((arr) => {
      arr.forEach((r) => list.push({ id: r.id }));
    });
    return list;
  };

  const generateUniqueCode = (typeStr, currentList) => {
    const prefix = (typeStr || 'RES').substring(0, 3).toUpperCase();
    const existingIds = (currentList || []).map((r) => r.id);
    let counter = 1;
    let code = `${prefix}-${String(counter).padStart(3, '0')}`;
    while (existingIds.includes(code)) {
      counter++;
      code = `${prefix}-${String(counter).padStart(3, '0')}`;
    }
    return code;
  };

  const handleRowChange = (procId, rowIndex, field, value) => {
    setRowsMap((prev) => {
      const currentRows = [...(prev[procId] || [])];
      currentRows[rowIndex] = {
        ...currentRows[rowIndex],
        [field]: value,
      };
      return { ...prev, [procId]: currentRows };
    });
  };

  const handlePreviewInvoice = (proc) => {
    if (proc.invoiceFileDataUrl) {
      openFilePreview(proc.invoiceFileDataUrl, proc.invoiceFileName, proc.invoiceFileType);
    } else {
      showToast('Invoice file is not available for preview.', 'warning');
    }
  };

  const handleRegisterBatch = async (p) => {
    const rows = rowsMap[p.id] || [];
    const userDept = user?.department || 'IT Services';

    // Validate fields
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r.id?.trim() || !r.model?.trim() || !r.serialNumber?.trim()) {
        showToast(`Row #${i + 1}: Please fill in Resource Code, Model Name, and Serial Number.`, 'error');
        return;
      }
    }

    setSubmittingMap((prev) => ({ ...prev, [p.id]: true }));
    try {
      const newResources = [];

      for (const row of rows) {
        const payload = {
          id: row.id.trim(),
          name: row.model.trim(),
          type: p.resourceType || row.model.trim(),
          department: userDept,
          location: row.location || 'Main Store',
          status: 'Available',
          condition: row.condition || 'Good',
          serialNumber: row.serialNumber.trim(),
          vendor: p.vendor || 'Direct Purchase',
          invoice: p.invoice || 'N/A',
          procurementId: p.id,
        };

        const created = await staffApi.addResource(payload);
        newResources.push(created);
      }

      // Mark procurement as Registered
      await staffApi.markProcurementRegistered(p.id);

      // Auto-allocation request creation if linked to a request
      if (p.requestId || p.requestedById) {
        try {
          const dateStr = new Date().toISOString().split('T')[0];
          const allocationReqId = `REQ-${Date.now().toString().slice(-4)}`;
          await staffApi.createAllocationRequest({
            id: allocationReqId,
            department: userDept,
            resourceType: p.resourceType || p.item,
            quantity: newResources.length,
            requestor: p.requester || 'Unknown',
            requestorId: p.requestedById,
            status: 'Approved',
            priority: 'Normal',
            date: dateStr,
            justification: `Auto-generated from Procurement ${p.id} — ${newResources.length} assets registered and pending allocation.`,
            procurementId: p.id,
          });
          showToast(`✅ ${newResources.length} asset(s) registered! Now allocating them to ${p.requester}.`, 'success');
          navigate('/staff/allocations');
          return;
        } catch (allocErr) {
          console.error('Auto-allocation request failed:', allocErr);
        }
      }

      showToast(`Successfully registered ${newResources.length} assets to ${userDept} inventory.`, 'success');
      await loadRegistrationData();
    } catch (err) {
      showToast(err.message || 'Failed to register assets', 'error');
    } finally {
      setSubmittingMap((prev) => ({ ...prev, [p.id]: false }));
    }
  };

  return (
    <div id="registration-view" className="view-section active">
      <h1 className="page-title">Bulk Resource Registration</h1>
      <p className="page-subtitle">Process delivered purchases by logging serial records per invoice.</p>

      <div id="procurement-registration-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            Loading pending registrations...
          </div>
        ) : procurements.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px dashed #cbd5e1',
              color: '#64748b',
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '3rem', opacity: 0.5, marginBottom: '1rem', display: 'block' }}
            >
              inventory
            </span>
            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No Pending Registrations</p>
            <p style={{ fontSize: '0.875rem' }}>
              Purchases logged from Procurement Tasks will appear here for serial registration.
            </p>
          </div>
        ) : (
          procurements.map((p) => {
            const rows = rowsMap[p.id] || [];
            const isSubmitting = submittingMap[p.id];

            return (
              <div key={p.id} className="form-card" style={{ maxWidth: '100%' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  <div>
                    <h3 className="data-section-title" style={{ marginBottom: '0.25rem' }}>
                      Register Purchase: {p.resourceType}
                    </h3>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      Procurement ID: <strong>{p.id}</strong> | Quantity Expected: <strong>{p.quantity}</strong>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                    <div>
                      Vendor: <strong>{p.vendor || 'N/A'}</strong>
                    </div>
                    <div>
                      Invoice: <strong>{p.invoice || 'N/A'}</strong>
                    </div>
                    {p.invoiceFileName && (
                      <div style={{ marginTop: '0.25rem' }}>
                        <a
                          href="javascript:void(0)"
                          className="spec-file-link"
                          onClick={() => handlePreviewInvoice(p)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '0.78rem',
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontWeight: 500,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                            visibility
                          </span>
                          {p.invoiceFileName}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Resource Code</th>
                        <th>Model / Name</th>
                        <th>Serial Number</th>
                        <th>Initial Location</th>
                        <th>Condition</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, index) => (
                        <tr key={index}>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}
                              value={row.id}
                              onChange={(e) => handleRowChange(p.id, index, 'id', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}
                              value={row.model}
                              onChange={(e) => handleRowChange(p.id, index, 'model', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}
                              placeholder="e.g. SN-982347"
                              value={row.serialNumber}
                              onChange={(e) => handleRowChange(p.id, index, 'serialNumber', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control"
                              style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}
                              value={row.location}
                              onChange={(e) => handleRowChange(p.id, index, 'location', e.target.value)}
                            />
                          </td>
                          <td>
                            <select
                              className="form-control"
                              style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}
                              value={row.condition}
                              onChange={(e) => handleRowChange(p.id, index, 'condition', e.target.value)}
                            >
                              <option value="Good">Good</option>
                              <option value="Fair">Fair</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn-primary"
                    style={{ padding: '0.5rem 1.5rem', fontSize: '0.875rem' }}
                    onClick={() => handleRegisterBatch(p)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? 'Registering...'
                      : `Complete Registration (${rows.length} Items)`}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ResourceRegistration;
