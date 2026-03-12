import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h1 style={{ fontSize: '48px', color: 'var(--color-accent-orange)' }}>404</h1>
            <h2>Página no encontrada</h2>
            <p style={{ color: 'var(--color-text-muted)', margin: '20px 0' }}>La sección de la aplicación a la que intentas acceder está en construcción o no existe.</p>
            <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>
                Volver al Dashboard
            </Link>
        </div>
    );
};

export default NotFound;
