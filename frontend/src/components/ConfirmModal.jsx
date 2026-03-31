import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ 
    isOpen, 
    title = '¿Confirmar acción?', 
    message = 'Esta acción no se puede deshacer.', 
    confirmText = 'Confirmar', 
    cancelText = 'Cancelar', 
    onConfirm, 
    onCancel,
    type = 'danger' // 'danger', 'warning', 'info'
}) => {
    if (!isOpen) return null;

    const accentColor = type === 'danger' ? 'var(--color-danger)' : type === 'warning' ? 'var(--color-accent)' : '#4da6ff';

    return (
        <div className="modal-overlay" style={{ zIndex: 999999 }}>
            <div className="glass-panel modal-content" style={{ maxWidth: '440px', padding: '0', overflow: 'hidden' }}>
                <div style={{ 
                    height: '6px', 
                    background: accentColor, 
                    width: '100%' 
                }}></div>
                
                <div style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div style={{ 
                            background: `${accentColor}22`, 
                            padding: '12px', 
                            borderRadius: '12px',
                            color: accentColor
                        }}>
                            <AlertTriangle size={24} />
                        </div>
                        <button onClick={onCancel} className="btn-ghost" style={{ padding: '5px', borderRadius: '50%' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <h2 style={{ fontSize: '22px', marginBottom: '12px', fontWeight: '700' }}>{title}</h2>
                    <p className="text-muted" style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
                        {message}
                    </p>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            className="btn-ghost" 
                            style={{ flex: 1 }} 
                            onClick={onCancel}
                        >
                            {cancelText}
                        </button>
                            <button 
                                className="btn-primary" 
                                style={{ flex: 1 }} 
                                onClick={onConfirm}
                            >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
