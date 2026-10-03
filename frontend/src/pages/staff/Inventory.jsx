import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import staffApi from '../../services/staffApi';
import AddResourceModal from '../../components/staff/AddResourceModal';
import EditResourceModal from '../../components/staff/EditResourceModal';

export const Inventory = () => {
  const { user, showToast, openFilePreview } = useAuth();
  const [resources, setResources] = useState([]);
  const [procurements, setProcurements] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);

  useEffect(() => {
    loadInventoryData();
  }, [user?.department]);

  const loadInventoryData = async () => {
    setLoading(true);
    const userDept = user?.department || 'IT Services';
    try {
      const [resList, procList] = await Promise.all([
        staffApi.getResources({ department: userDept }),
        staffApi.getProcurements({ department: userDept }).catch(() => []),
      ]);
      setResources(resList || []);
      setProcurements(procList || []);
    } catch (err) {
      showToast('Failed to load inventory: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleScrap = async (resId) => {
    if (window.confirm('Permanently mark this resource as scrapped?')) {
      try {
        await staffApi.scrapResource(resId);
        showToast(`Resource ${resId} marked as scrapped!`, 'error');
        await loadInventoryData();
      } catch (err) {
        showToast(err.message || 'Failed to scrap resource', 'error');
      }
    }
  };

  const handlePreviewInvoice = (procId) => {
    const proc = procurements.find((p) => p.id === procId);
    if (proc && proc.invoiceFileDataUrl) {
      openFilePreview(proc.invoiceFileDataUrl, proc.invoiceFileName, proc.invoiceFileType);
    } else {
      showToast('Invoice preview not available for this record', 'warning');
    }
  };

  // Erase allocated resources from inventory view matching staff.js line 572
  const unallocatedResources = resources.filter((r) => r.status !== 'Allocated');

  // Filter based on search query
  const filteredResources = unallocatedResources.filter((r) => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return (
      (r.id && r.id.toLowerCase().includes(term)) ||
      (r.name && r.name.toLowerCase().includes(term)) ||
      (r.type && r.type.toLowerCase().includes(term)) ||
      (r.serialNumber && r.serialNumber.toLowerCase().includes(term)) ||
      (r.location && r.location.toLowerCase().includes(term)) ||
      (r.vendor && r.vendor.toLowerCase().includes(term)) ||
      (r.invoice && r.invoice.toLowerCase().includes(term))
    );
  });

  return (
    <div id="manage-view" className="view-section active">
      <h1 className="page-title">Department Inventory</h1>
      <p className="page-subtitle">Browse department resources, modify entries, and audit statuses.</p>

      <div className="data-section">
        <div className="data-section-header">
          <div className="data-section-title">Asset List</div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              className="btn-primary"
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '8px',
              }}
              onClick={() => setIsAddModalOpen(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.25rem', marginRight: '0.5rem' }}>
                add
              </span>
              Add Resource
            </button>
            <div className="search-bar" style={{ width: '250px' }}>
              <span className="material-symbols-outlined" style={{ color: '#94a3b8' }}>
                search
              </span>
              <input
                type="text"
                placeholder="Search by Code or Type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Model</th>
                <th>Type</th>
                <th>S/N</th>
                <th>Location</th>
                <th>Condition</th>
                <th>Status</th>
                <th>Vendor</th>
                <th>Invoice</th>
                <th>Invoice File</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody id="inventory-tbody">
              {loading ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    Loading inventory assets...
                  </td>
                </tr>
              ) : filteredResources.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                    {searchQuery ? 'No matching assets found.' : 'No assets in inventory.'}
                  </td>
                </tr>
              ) : (
                filteredResources.map((res) => {
                  let statusBadge = <span className={`badge ${res.status.toLowerCase()}`}>{res.status}</span>;
                  if (res.status === 'Available') {
                    statusBadge = <span className="badge allocated">{res.status}</span>;
                  }

                  const srcProc = res.procurementId
                    ? procurements.find((p) => p.id === res.procurementId)
                    : null;

                  return (
                    <tr key={res.id}>
                      <td className="td-id">{res.id}</td>
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
                      <td>{res.location || res.department || 'N/A'}</td>
                      <td>{res.condition || 'N/A'}</td>
                      <td>{statusBadge}</td>
                      <td>{res.vendor || 'N/A'}</td>
                      <td>{res.invoice || 'N/A'}</td>
                      <td>
                        {srcProc && srcProc.invoiceFileName ? (
                          <a
                            href="javascript:void(0)"
                            className="spec-file-link"
                            onClick={() => handlePreviewInvoice(srcProc.id)}
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
                            {srcProc.invoiceFileName}
                          </a>
                        ) : (
                          <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          className="btn-secondary"
                          style={{ fontSize: '0.75rem', marginRight: '4px' }}
                          onClick={() => setEditingResource(res)}
                        >
                          Edit
                        </button>
                        {res.status !== 'Scrapped' && (
                          <button
                            className="btn-danger"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => handleScrap(res.id)}
                          >
                            Scrap
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Resource Modal */}
      <AddResourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onResourceAdded={() => loadInventoryData()}
        existingResources={resources}
      />

      {/* Edit Resource Modal */}
      <EditResourceModal
        isOpen={Boolean(editingResource)}
        resource={editingResource}
        onClose={() => setEditingResource(null)}
        onResourceUpdated={() => loadInventoryData()}
        existingResources={resources}
      />
    </div>
  );
};

export default Inventory;
