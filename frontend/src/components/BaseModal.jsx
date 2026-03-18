import React from 'react';
import { X } from 'lucide-react';

const BaseModal = ({ isOpen, onClose, title, maxWidth = 500, children }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
            <div
                className="glass-panel modal-content animate-modal-appear"
                style={{ maxWidth, width: '100%', position: 'relative', margin: '20px' }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid var(--color-glass-border)'
                }}>
                    {title && <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{title}</h2>}
                    <button
                        className="btn-ghost"
                        onClick={onClose}
                        aria-label="Cerrar modal"
                        style={{ padding: '8px', borderRadius: '50%', marginLeft: 'auto' }}
                    >
                        <X size={20} aria-hidden="true" />
                    </button>
                </div>
                <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default BaseModal;
