import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import staffApi from '../../services/staffApi';

export const AddResourceModal = ({ isOpen, onClose, onResourceAdded, existingResources = [] }) => {
  const { user, showToast } = useAuth();
  const [catalogTypes, setCatalogTypes] = useState([]);
  const [formData, setFormData] = useState({
    type: '',
    serialNumber: '',
    manufacturer: '',
    model: '',
    vendor: '',
    invoice: '',
    location: '',
    condition: 'Good',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user?.department) {
      staffApi.getCatalog(user.department)
        .then((catalog) => {
          if (Array.isArray(catalog)) {
            const entry = catalog.find((c) => c.department === user.department);
            if (entry && Array.isArray(entry.resourceTypes)) {
              setCatalogTypes(entry.resourceTypes);
            } else {
              setCatalogTypes(['Laptop', 'Projector', 'Tablet', 'Monitor', 'Router', 'Accessories', 'Furniture', 'Electronics']);
            }
          } else {
            setCatalogTypes(['Laptop', 'Projector', 'Tablet', 'Monitor', 'Router', 'Accessories', 'Furniture', 'Electronics']);
          }
        })
        .catch(() => {
          setCatalogTypes(['Laptop', 'Projector', 'Tablet', 'Monitor', 'Router', 'Accessories', 'Furniture', 'Electronics']);
        });
    }
  }, [isOpen, user?.department]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { type, serialNumber, manufacturer, model, vendor, invoice, location, condition } = formData;

    if (!type || !manufacturer || !model || !serialNumber || !location || !condition) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const snRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!snRegex.test(serialNumber)) {
      showToast('Serial Number can only contain letters, numbers, dots, hyphens, and underscores.', 'error');
      return;
    }

    const isDuplicate = existingResources.some(
      (r) => String(r.serialNumber || '').toLowerCase() === serialNumber.trim().toLowerCase()
    );
    if (isDuplicate) {
      showToast('Serial number already exists', 'error');
      return;
    }

    const userDept = user?.department || 'IT Services';
    const deptPrefix = userDept.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
    const typePrefix = type.substring(0, 3).toUpperCase();
    const sameTypeRes = existingResources.filter((r) => r.type === type && r.department === userDept);
    const nextNumber = String(sameTypeRes.length + 1).padStart(3, '0');
    const generatedCode = `${deptPrefix}-${typePrefix}-${nextNumber}`;

    const newResource = {
      code: generatedCode,
      id: generatedCode,
      name: `${manufacturer.trim()} ${model.trim()}`,
      type,
      department: userDept,
      serialNumber: serialNumber.trim(),
      location: location.trim(),
      condition,
      status: 'Available',
      vendor: vendor.trim(),
      invoice: invoice.trim(),
      assignedTo: 'None',
      date: new Date().toLocaleDateString('en-US'),
    };

    setSubmitting(true);
    try {
      await staffApi.createResource(newResource);
      showToast(`Resource ${generatedCode} added successfully!`, 'success');
      onResourceAdded(newResource);
      onClose();
      setFormData({
        type: '',
        serialNumber: '',
        manufacturer: '',
        model: '',
        vendor: '',
        invoice: '',
        location: '',
        condition: 'Good',
      });
    } catch (err) {
      showToast(err.message || 'Failed to add resource', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stock-modal-overlay active" style={{ display: 'flex' }}>
      <div className="stock-modal-content resource-modal-content">
        <div className="stock-modal-header">
          <h3 className="stock-modal-title">Add New Resource</h3>
          <button type="button" onClick={onClose} className="stock-modal-close">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="resource-form-grid">
            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'left', display: 'block' }}>
                Resource Type
              </label>
              <select
                name="type"
                id="ar-type"
                className="form-control"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="">Select Resource Type...</option>
                {catalogTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'left', display: 'block' }}>
                Serial Number
              </label>
              <input
                type="text"
                name="serialNumber"
                id="ar-sn"
                className="form-control"
                placeholder="e.g., SN-XXXXXX"
                value={formData.serialNumber}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'left', display: 'block' }}>
                Manufacturer
              </label>
              <input
                type="text"
                name="manufacturer"
                id="ar-mfg"
                className="form-control"
                placeholder="e.g., Dell"
                value={formData.manufacturer}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'left', display: 'block' }}>
                Model
              </label>
              <input
                type="text"
                name="model"
                id="ar-model"
                className="form-control"
                placeholder="e.g., Latitude 5540"
                value={formData.model}
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
                id="ar-vendor"
                className="form-control"
                placeholder="e.g., Dell Partner"
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
                id="ar-invoice"
                className="form-control"
                placeholder="e.g., INV-1024"
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
                id="ar-location"
                className="form-control"
                placeholder="e.g., Building A, Room 101"
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
                id="ar-condition"
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
          </div>

          <div className="stock-modal-actions" style={{ marginTop: '1.25rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddResourceModal;
