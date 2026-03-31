import React from 'react';
import { MessageCircle, Info } from 'lucide-react';
import BaseModal from './BaseModal';

const DemoModal = ({ isOpen, onClose }) => {
    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Suscripción Demo"
            maxWidth={440}
        >
            <div style={{ padding: '0 8px' }}>
                <div style={{ 
                    background: 'var(--color-accent)22', 
                    padding: '16px', 
                    borderRadius: '12px', 
                    display: 'flex', 
                    gap: '12px',
                    marginBottom: '24px',
                    color: 'var(--color-accent)'
                }}>
                    <Info size={24} style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                        Has iniciado sesión con una cuenta de prueba. Algunas funciones avanzadas están limitadas.
                    </p>
                </div>
                
                <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', fontWeight: '600' }}>Versión Completa</h3>
                <p style={{ marginBottom: '20px', lineHeight: '1.6', fontSize: '15px' }}>
                    Obtén el sistema completo para tu gimnasio con:
                </p>
                <ul style={{ marginBottom: '24px', fontSize: '14px', color: 'var(--color-text-muted)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li>Migración inteligente desde archivos de Excel.</li>
                    <li>Métricas de retención asistidas por IA.</li>
                    <li>Soporte técnico prioritario 24/7.</li>
                    <li>Personalización total de colores y logotipo.</li>
                </ul>

                <button
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
                    onClick={() => {
                        const msg = "Hola! Vi la demo de REP Control Panel y quiero información de la versión completa.";
                        window.open(`https://wa.me/5214491245952?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                >
                    <MessageCircle size={18} /> Solicitar Información
                </button>
            </div>
        </BaseModal>
    );
};

export default DemoModal;
