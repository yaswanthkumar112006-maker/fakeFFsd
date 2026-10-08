import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import staffApi from '../../../services/staffApi';

export const ProcurementTasks = () => {
  const { user, showToast } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [vendorMap, setVendorMap] = useState({});
  const [invoiceMap, setInvoiceMap] = useState({});
  const [fileMap, setFileMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [submittingMap, setSubmittingMap] = useState({});

  useEffect(() => {
    loadProcurementTasks();
  }, [user?.department]);

  const loadProcurementTasks = async () => {
    setLoading(true);
    const userDept = user?.department || 'IT Services';
    try {
      const data = await staffApi.getProcurementTasks(userDept);
      setTasks(data || []);
    } catch (err) {
      showToast('Failed to load procurement tasks: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, procId) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setFileMap((prev) => ({
          ...prev,
          [procId]: {
            name: file.name,
            type: file.type,
            dataUrl: uploadEvent.target.result,
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogPurchase = async (procId) => {
    const vendor = vendorMap[procId]?.trim();
    const invoice = invoiceMap[procId]?.trim();
    const file = fileMap[procId];

    if (!vendor || !invoice) {
      showToast('Please enter both Vendor Name and Invoice Number.', 'error');
      return;
    }

    setSubmittingMap((prev) => ({ ...prev, [procId]: true }));
    try {
      await staffApi.logPurchase(procId, {
        vendor,
        invoice,
        invoiceFileName: file?.name || null,
        invoiceFileType: file?.type || null,
        invoiceFileDataUrl: file?.dataUrl || null,
      });

      showToast(`Purchase logged successfully for Task ${procId}! Forwarded for Serial Registration.`, 'success');

      // Clear local state for this task
      setVendorMap((prev) => {
        const next = { ...prev };
        delete next[procId];
        return next;
      });
      setInvoiceMap((prev) => {
        const next = { ...prev };
        delete next[procId];
        return next;
      });
      setFileMap((prev) => {
        const next = { ...prev };
        delete next[procId];
        return next;
      });

      await loadProcurementTasks();
    } catch (err) {
      showToast(err.message || 'Failed to log purchase', 'error');
    } finally {
      setSubmittingMap((prev) => ({ ...prev, [procId]: false }));
    }
  };

  return (
    <div id="procurement-view" className="view-section active">
      <h1 className="page-title">Procurement Fulfillment Tasks</h1>
      <p className="page-subtitle">
        Execute approved purchasing orders, attach invoices, and submit for serial registration.
      </p>

      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Pending Orders to Fulfill</div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Task ID & Type</th>
              <th>Qty</th>
              <th>Vendor Details & Invoice Attachment</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody id="procurement-tbody">
            {loading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  Loading procurement tasks...
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  No pending procurement fulfillment tasks for your department
                </td>
              </tr>
            ) : (
              tasks.map((p) => {
                const taskId = p.id.includes('-') ? `PT-${p.id.split('-')[1]}` : `PT-${p.id}`;
                const file = fileMap[p.id];
                const isSubmitting = submittingMap[p.id];

                return (
                  <tr key={p.id}>
                    <td>
                      <div className="td-id">{taskId}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.resourceType}</div>
                    </td>
                    <td>{p.quantity}</td>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        style={{ marginBottom: '0.25rem', fontSize: '0.75rem' }}
                        placeholder="Vendor Name"
                        value={vendorMap[p.id] || ''}
                        onChange={(e) => setVendorMap((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      />
                      <input
                        type="text"
                        className="form-control"
                        style={{ marginBottom: '0.25rem', fontSize: '0.75rem' }}
                        placeholder="Invoice Number"
                        value={invoiceMap[p.id] || ''}
                        onChange={(e) => setInvoiceMap((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      />
                      <input
                        type="file"
                        style={{ fontSize: '0.72rem', width: '100%' }}
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileChange(e, p.id)}
                      />
                      {file && (
                        <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.15rem' }}>
                          {file.name}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                      <button
                        className="btn-primary"
                        onClick={() => handleLogPurchase(p.id)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Logging...' : 'Log Purchase'}
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
  );
};

export default ProcurementTasks;
