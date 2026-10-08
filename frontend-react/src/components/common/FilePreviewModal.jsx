import React from 'react';
import { useAuth } from '../../context/AuthContext';

export const FilePreviewModal = () => {
  const { previewFile, closeFilePreview } = useAuth();

  if (!previewFile) return null;

  const { dataUrl, fileName, fileType } = previewFile;
  const type = (fileType || '').toLowerCase();

  return (
    <div
      className="rx-fp-overlay open"
      style={{
        display: 'flex',
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        zIndex: 10000,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeFilePreview();
      }}
    >
      <div
        className="rx-fp-dialog"
        style={{
          background: '#fff',
          borderRadius: '12px',
          width: 'min(900px, 100%)',
          height: 'min(85vh, 900px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div
          className="rx-fp-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.1rem',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <span
            className="rx-fp-title"
            style={{
              fontWeight: 600,
              fontSize: '0.95rem',
              color: '#0f172a',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {fileName || 'Attached File'}
          </span>
          <div className="rx-fp-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <a
              className="rx-fp-download"
              href={dataUrl}
              download={fileName || 'download'}
              title="Download file"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#fff',
                background: '#2563eb',
                borderRadius: '6px',
                padding: '0.4rem 0.75rem',
                textDecoration: 'none',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                download
              </span>{' '}
              Download
            </a>
            <button
              type="button"
              className="rx-fp-close"
              title="Close"
              onClick={closeFilePreview}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                padding: '0.3rem',
                borderRadius: '6px',
              }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div
          className="rx-fp-body"
          style={{
            flex: 1,
            overflow: 'auto',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {type.startsWith('image/') ? (
            <img
              src={dataUrl}
              alt={fileName || 'Preview'}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
            />
          ) : type === 'application/pdf' ? (
            <iframe
              src={dataUrl}
              title={fileName || 'Preview'}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '3rem', color: '#94a3b8' }}>
                description
              </span>
              <p style={{ marginTop: '0.5rem' }}>Preview isn't available for this file type.</p>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Use the Download button to save and open it.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;
