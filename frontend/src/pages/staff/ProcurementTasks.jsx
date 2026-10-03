import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import staffApi from '../../services/staffApi';

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
    e.target.value = '';
    if (!file) return;

    const ALLOWED = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
    ];
    const MAX_MB = 5;

    if (!ALLOWED.includes(file.type)) {
      showToast('❌ Unsupported file type. Please upload PDF, DOC, DOCX, PNG or JPG.', 'error');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      showToast(`❌ File too large. Maximum size is ${MAX_MB} MB.`, 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileMap((prev) => ({
        ...prev,
        [procId]: {
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: event.target.result,
          rawFile: file,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleLogPurchase = async (procId) => {
    const vendor = (vendorMap[procId] || '').trim();
    const invoice = (invoiceMap[procId] || '').trim();
    const invoiceFile = fileMap[procId];

    if (!vendor || !invoice) {
      showToast('Please provide both Vendor Name and Invoice Number before logging purchase.', 'error');
      return;
    }

    const vendorRegex = /^[a-zA-Z0-9\s.-]+$/;
    const invoiceRegex = /^[0-9]+$/;

    if (!vendorRegex.test(vendor)) {
      showToast('Vendor Name can only contain characters and numbers.', 'error');
      return;
    }

    if (!invoiceRegex.test(invoice)) {
      showToast('Invoice Number can only contain numbers.', 'error');
      return;
    }

    if (!invoiceFile) {
      showToast('⚠️ Please attach the invoice file before logging the purchase.', 'error');
      return;
    }

    setSubmittingMap((prev) => ({ ...prev, [procId]: true }));
    try {
      await staffApi.logPurchase(procId, vendor, invoice, invoiceFile);
      showToast(`Purchase logged for Invoice ${invoice}. Assets are now pending Serial Registration.`, 'success');
      await loadProcurementTasks();
    } catch (err) {
      showToast(err.message || 'Failed to log purchase', 'error');
    } finally {
      setSubmittingMap((prev) => ({ ...prev, [procId]: false }));
    }
  };

  return (
    <div id="proc-tasks-view" className="view-section active">
      <h1 className="page-title">Procurement Fulfillment</h1>
      <p className="page-subtitle">Process Registrar-approved purchases by logging vendor and invoice data.</p>

      <div className="data-section">
        <table className="table" id="proctask-tbody">
          <thead>
            <tr>
              <th>Task ID / Type</th>
              <th>Qty Found</th>
              <th>Vendor & Invoice</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  Loading procurement fulfillment tasks...
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  No approved procurement tasks pending fulfillment
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
