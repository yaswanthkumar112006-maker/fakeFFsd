import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import staffApi from '../../services/staffApi';

export const EditResourceModal = ({ isOpen, onClose, resource, onResourceUpdated, existingResources = [] }) => {
  const { showToast } = useAuth();
  const [formData, setFormData] = useState({
    serialNumber: '',
    vendor: '',
    invoice: '',
    location: '',
    condition: 'Good',
    status: 'Available',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (resource) {
      let cond = resource.condition || 'Average';
      if (cond === 'Fair') cond = 'Average';
      if (cond === 'New') cond = 'Good';

      setFormData({
        serialNumber: resource.serialNumber || '',
        vendor: resource.vendor || '',
        invoice: resource.invoice || '',
        location: resource.location || '',
        condition: cond,
        status: resource.status || 'Available',
      });
    }
  }, [resource]);

  if (!isOpen || !resource) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { serialNumber, vendor, invoice, location, condition, status } = formData;

    const snRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!serialNumber || !snRegex.test(serialNumber)) {
      showToast('Serial Number can only contain letters, numbers, dots, hyphens, and underscores.', 'error');
      return;
    }

    const duplicateSerial = existingResources.some((r) => {
      return r.id !== resource.id && String(r.serialNumber || '').toLowerCase() === serialNumber.trim().toLowerCase();
    });
    if (duplicateSerial) {
      showToast('Serial number already exists', 'error');
      return;
    }

    const payload = {
      serialNumber: serialNumber.trim(),
      vendor: vendor.trim(),
      invoice: invoice.trim(),
      location: location.trim(),
      condition,
      status,
    };

    setSubmitting(true);
    try {
      await staffApi.updateResource(resource.id, payload);
      showToast(`Resource ${resource.id} updated!`, 'success');
      onResourceUpdated({ ...resource, ...payload });
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to update resource', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stock-modal-overlay active" style={{ display: 'flex' }}>
      <div className="stock-modal-content resource-modal-content">
        <div className="stock-modal-header">
          <h3 className="stock-modal-title">Edit Resource</h3>
          <button type="button" onClick={onClose} className="stock-modal-close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="resource-form-grid">
            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'left', display: 'block' }}>
                Resource Code
              </label>
              <input
                type="text"
                className="form-control"
                value={resource.code || resource.id}
                disabled
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'left', display: 'block' }}>
                Serial Number
              </label>
              <input
                type="text"
                name="serialNumber"
                className="form-control"
                value={formData.serialNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'left', display: 'block' }}>
                Vendor
              </label>
              <input
                type="text"
                name="vendor"
                className="form-control"
                value={formData.vendor}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'left', display: 'block' }}>
                Invoice Number
              </label>
              <input
                type="text"
                name="invoice"
                className="form-control"
                value={formData.invoice}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'left', display: 'block' }}>
                Location
              </label>
              <input
                type="text"
                name="location"
                className="form-control"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'left', display: 'block' }}>
                Condition
              </label>
              <select
                name="condition"
                className="form-control"
                value={formData.condition}
                onChange={handleChange}
                required
              >
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Bad">Bad</option>
              </select>
            </div>
            <div className="form-group span-2">
              <label className="form-label" style={{ textAlign: 'left', display: 'block' }}>
                Status
              </label>
              <select
                name="status"
                className="form-control"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="Available">Available</option>
                <option value="Allocated">Allocated</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Maintenance Requested">Maintenance Requested</option>
                <option value="Returned">Returned</option>
                <option value="Scrapped">Scrapped</option>
              </select>
            </div>
          </div>

          <div className="stock-modal-actions" style={{ marginTop: '1.25rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditResourceModal;
