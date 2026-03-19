import React, { useState } from 'react';
import { Database, FileUp, ShieldAlert, MessageCircle, ArrowRight } from 'lucide-react';

const Migration = () => {
    const [showContactModal, setShowContactModal] = useState(false);

    const handleContact = () => {
        const message = "Hola! Estoy interesado en contratar la versión completa del sistema REP Control Panel con la función de Migración masiva Excel.";
        const whatsappUrl = `https://wa.me/5214491245952?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="animate-fade-in dashboard-container">
            <header className="page-header" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 className="page-title">Migración y Carga Masiva</h1>
                    <p className="page-subtitle text-muted">Importa tus datos desde Excel sin perder tiempo</p>
                </div>
            </header>

            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', position: 'relative', overflow: 'hidden' }}>
                {/* Background Decoration */}
                <div style={{ position: 'absolute', top: '-10%', right: '-10%', opacity: 0.05 }}>
                    <Database size={300} color="var(--color-accent-orange)" />
                </div>

                <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <div className="icon-wrapper orange" style={{ width: '80px', height: '80px', margin: '0 auto 24px' }}>
                        <Database size={40} />
                    </div>

                    <h2 style={{ fontSize: '28px', color: 'inherit', marginBottom: '16px' }}>Función de Versión Completa</h2>
                    <p style={{ fontSize: '18px', color: 'var(--color-text-muted)', marginBottom: '32px', lineHeight: '1.6' }}>
                        ¡Deja de capturar datos uno por uno! Con la función de migración podrás subir un archivo **Excel o CSV** y cargar cientos de miembros, inventario y registros en segundos.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                        <div className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.03)' }}>
                            <FileUp style={{ color: 'var(--color-success)', marginBottom: '10px' }} />
                            <h4 style={{ marginBottom: '8px' }}>Auto-importación</h4>
                            <p className="text-muted" style={{ fontSize: '12px' }}>Procesamiento inteligente de columnas y formatos.</p>
                        </div>
                        <div className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.03)' }}>
                            <ShieldAlert style={{ color: 'var(--color-accent-orange)', marginBottom: '10px' }} />
                            <h4 style={{ marginBottom: '8px' }}>Validación de Datos</h4>
                            <p className="text-muted" style={{ fontSize: '12px' }}>Evita duplicados y errores de captura automáticamente.</p>
                        </div>
                    </div>

                    <button
                        className="btn-primary"
                        style={{ padding: '15px 40px', fontSize: '18px', borderRadius: '12px' }}
                        onClick={handleContact}
                    >
                        Contactar para Obtener Sistema Completo <ArrowRight size={20} />
                    </button>

                    <p style={{ marginTop: '20px', color: 'var(--color-text-muted)', fontSize: '14px' }}>
                        O llama al <strong style={{ color: 'inherit' }}>+52 449 124 5952</strong>
                    </p>
                </div>
            </div>

            <div className="metrics-grid" style={{ marginTop: '40px' }}>
                <div className="glass-panel" style={{ padding: '24px' }}>
                    <h3 style={{ marginBottom: '15px' }}>¿Qué puedes migrar?</h3>
                    <ul style={{ listStyle: 'none', padding: 0, color: 'var(--color-text-muted)', fontSize: '15px' }}>
                        <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '6px', height: '6px', background: 'var(--color-accent-orange)', borderRadius: '50%' }}></div> Base de datos de Miembros</li>
                        <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '6px', height: '6px', background: 'var(--color-accent-orange)', borderRadius: '50%' }}></div> Catálogo de Inventario</li>
                        <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '6px', height: '6px', background: 'var(--color-accent-orange)', borderRadius: '50%' }}></div> Historial de Pagos</li>
                        <li style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ width: '6px', height: '6px', background: 'var(--color-accent-orange)', borderRadius: '50%' }}></div> Rutinas y Planificaciones</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Migration;
