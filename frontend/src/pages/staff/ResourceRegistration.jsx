import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import staffApi from '../../services/staffApi';

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

      // Initialize row state for each procurement
      const initRows = {};
      fulfilled.forEach((p) => {
        const qty = parseInt(p.quantity) || 1;
        const rows = [];
        for (let i = 0; i < qty; i++) {
          const cleanId = p.id.replace(/[^a-zA-Z0-9]/g, '');
          const newCode = `RES-${cleanId}-${String(i + 1).padStart(2, '0')}`;
          rows.push({
            code: newCode,
            model: '',
            serialNumber: '',
            location: '',
            condition: 'New',
            status: 'Available',
          });
        }
        initRows[p.id] = rows;
      });
      setRowsMap(initRows);
    } catch (err) {
      showToast('Failed to load registration data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRowChange = (procId, index, field, value) => {
    setRowsMap((prev) => {
      const rows = [...(prev[procId] || [])];
      rows[index] = { ...rows[index], [field]: value };
      return { ...prev, [procId]: rows };
    });
  };

  const handlePreviewInvoice = (p) => {
    if (p.invoiceFileDataUrl) {
      openFilePreview(p.invoiceFileDataUrl, p.invoiceFileName, p.invoiceFileType);
    } else {
      showToast('Invoice file preview not available', 'warning');
    }
  };

  const handleSubmitBatch = async (p) => {
    const rows = rowsMap[p.id] || [];
    const userDept = user?.department || 'IT Services';

    const modelRegex = /^[a-zA-Z0-9\s.-]+$/;
    const snRegex = /^[a-zA-Z0-9_.-]+$/;

    const existingSerials = new Set((existingResources || []).map((r) => String(r.serialNumber || '').toLowerCase()));
    const batchSerials = new Set();
    const newResources = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const model = (row.model || '').trim();
      const sn = (row.serialNumber || '').trim();
      const loc = (row.location || '').trim();

      if (!model || !sn || !loc) {
        showToast('Please fully complete all fields for every row in this batch.', 'error');
        return;
      }
      if (!modelRegex.test(model)) {
        showToast('Model can only contain letters, numbers, spaces, dots, and hyphens.', 'error');
        return;
      }
      if (!snRegex.test(sn)) {
        showToast('Serial Number can only contain letters, numbers, dots, hyphens, and underscores.', 'error');
        return;
      }

      const normalizedSn = sn.toLowerCase();
      if (existingSerials.has(normalizedSn) || batchSerials.has(normalizedSn)) {
        showToast('Serial numbers must be unique across inventory and this batch.', 'error');
        return;
      }
      batchSerials.add(normalizedSn);

      newResources.push({
        id: row.code,
        code: row.code,
        name: model,
        type: p.resourceType,
        department: userDept,
        serialNumber: sn,
        location: loc,
        status: row.status || 'Available',
        condition: row.condition || 'New',
        assignedTo: 'None',
        vendor: p.vendor || '',
        invoice: p.invoice || '',
        procurementId: p.id,
        date: new Date().toLocaleDateString('en-US'),
      });
    }

    setSubmittingMap((prev) => ({ ...prev, [p.id]: true }));
    try {
      await staffApi.registerProcurement(p.id, newResources);

      // Auto-create allocation request if requested by a Requestor
      const isRequestor = p.requesterRole === 'Requestor' || (p.requestedById && !p.requestedById.startsWith('HEAD'));
      if (p.requestedById && isRequestor) {
        const allocationReqId = `REQ-PRC-${p.id.replace(/[^a-zA-Z0-9]/g, '')}`;
        const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        try {
          await staffApi.createRequest({
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

                <table className="table" style={{ background: '#f8fafc', borderRadius: '8px', marginBottom: '1.5rem' }}>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Model</th>
                      <th>
                        S/N <span style={{ color: '#ef4444' }}>*</span>
                      </th>
                      <th>Location</th>
                      <th>Condition</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={`${p.id}-row-${idx}`}>
                        <td>
                          <input type="text" className="form-control" value={row.code} readOnly />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Model"
                            value={row.model}
                            onChange={(e) => handleRowChange(p.id, idx, 'model', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Serial Number"
                            value={row.serialNumber}
                            onChange={(e) => handleRowChange(p.id, idx, 'serialNumber', e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Location"
                            value={row.location}
                            onChange={(e) => handleRowChange(p.id, idx, 'location', e.target.value)}
                          />
                        </td>
                        <td>
                          <select
                            className="form-control"
                            value={row.condition}
                            onChange={(e) => handleRowChange(p.id, idx, 'condition', e.target.value)}
                          >
                            <option value="New">New</option>
                            <option value="Good">Good</option>
                            <option value="Average">Average</option>
                            <option value="Bad">Bad</option>
                          </select>
                        </td>
                        <td>
                          <select
                            className="form-control"
                            value={row.status}
                            onChange={(e) => handleRowChange(p.id, idx, 'status', e.target.value)}
                          >
                            <option value="Available">Available</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Scrapped">Scrapped</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ textAlign: 'right' }}>
                  <button
                    className="btn-primary"
                    onClick={() => handleSubmitBatch(p)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Registering...' : 'Submit & Register Assets'}
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
