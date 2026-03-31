import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';

const NotFound = () => {
    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '70vh', 
            textAlign: 'center',
            padding: 20
        }}>
            <div className="glass-panel" style={{ padding: 60, maxWidth: 500, borderRadius: 32 }}>
                <div style={{ background: 'var(--color-danger)15', width: 80, height: 80, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', color: 'var(--color-danger)' }}>
                    <ShieldAlert size={48} />
                </div>
                <h1 style={{ fontSize: 64, fontWeight: 900, marginBottom: 8, color: 'var(--color-accent)' }}>404</h1>
                <h2 style={{ fontSize: 24, marginBottom: 16 }}>ZONA RESTRINGIDA</h2>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6', marginBottom: 40 }}>
                    La sección a la que intentas acceder no existe en este servidor o está bajo mantenimiento en el CORE.
                </p>
                <Link to="/" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 32px' }}>
                    <Home size={18} /> REGRESAR AL DASHBOARD
                </Link>
            </div>
        </div>
    );
};

export default NotFound;
