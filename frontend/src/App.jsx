import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import Splash from './components/Splash';
import Login from './pages/Login';

import Members from './pages/Members';
import Routines from './pages/Routines';
import Payments from './pages/Payments';
import POS from './pages/POS';
import Agenda from './pages/Agenda';
import Inventory from './pages/Inventory';
import Retention from './pages/Retention';
import Migration from './pages/Migration';
import Memberships from './pages/Memberships';
import Visits from './pages/Visits';
import PublicBooking from './pages/PublicBooking';
import Analytics from './pages/Analytics';
import Users from './pages/Users';
import Expenses from './pages/Expenses';
import { MessageCircle, X as CloseIcon, Info } from 'lucide-react';

function App() {
    const isPublicRoute = window.location.pathname === '/reservar';
    const [showSplash, setShowSplash] = useState(!isPublicRoute);
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [showDemoModal, setShowDemoModal] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setAuthLoading(false);
    }, []);

    if (showSplash) {
        return <Splash onComplete={() => setShowSplash(false)} />;
    }

    if (authLoading && !isPublicRoute) {
        return <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-main)', color: 'var(--color-text-main)' }}>
            <p style={{ color: 'var(--color-text-muted)' }}>Cargando sistema...</p>
        </div>;
    }

    if (!user && !isPublicRoute) {
        return <Login />;
    }

    if (isPublicRoute) {
        return (
            <Router>
                <Routes>
                    <Route path="/reservar" element={<PublicBooking />} />
                    <Route path="*" element={<Navigate to="/reservar" />} />
                </Routes>
            </Router>
        );
    }

    return (
        <Router>
            <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/miembros" element={<Members />} />
                        <Route path="/pos" element={<POS />} />
                        <Route path="/rutinas" element={<Routines />} />
                        <Route path="/pagos" element={<Payments />} />
                        <Route path="/gastos" element={<Expenses />} />
                        <Route path="/agenda" element={<Agenda />} />
                        <Route path="/inventario" element={<Inventory />} />
                        <Route path="/retencion" element={<Retention />} />
                        <Route path="/migracion" element={<Migration />} />
                        <Route path="/membresias" element={<Memberships />} />
                        <Route path="/visitas" element={<Visits />} />
                        <Route path="/usuarios" element={<Users />} />
                        <Route path="/members" element={<Members />} />
                        <Route path="/inventory" element={<Inventory />} />
                        <Route path="/agenda" element={<Agenda />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </main>

                {/* Botón Flotante WhatsApp / Soporte */}
                <button
                    onClick={() => {
                        const msg = "Hola! Necesito soporte técnico para el Control Panel de REP Calisthenics.";
                        window.open(`https://wa.me/5214491245952?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="whatsapp-floating-btn pulse-animation"
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        right: '20px',
                        zIndex: 9999,
                        background: '#25D366',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '12px 24px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
                        cursor: 'pointer'
                    }}
                >
                    <MessageCircle size={20} /> Soporte WhatsApp
                </button>

                {showDemoModal && (
                    <div className="modal-overlay" style={{ zIndex: 10000 }}>
                        <div className="glass-panel modal-content" style={{ maxWidth: '400px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '20px', color: 'var(--color-accent-orange)' }}>Modo DEMO</h3>
                                <button onClick={() => setShowDemoModal(false)} className="btn-ghost" style={{ padding: '5px' }}>
                                    <CloseIcon size={20} />
                                </button>
                            </div>
                            <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
                                Esta es una versión de prueba limitada diseñada para demostración técnica.
                            </p>
                            <p style={{ marginBottom: '25px', fontSize: '14px', color: 'var(--color-text-muted)' }}>
                                El sistema completo incluye funciones de migración de Excel, análisis avanzado de datos, personalización de marca y soporte técnico.
                            </p>
                            <button
                                className="btn-primary"
                                style={{ width: '100%', justifyContent: 'center' }}
                                onClick={() => {
                                    const msg = "Hola! Vi la demo de REP Control Panel y quiero información de la versión completa.";
                                    window.open(`https://wa.me/5214491245952?text=${encodeURIComponent(msg)}`, '_blank');
                                }}
                            >
                                <MessageCircle size={18} /> Contactar para Versión Completa
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Router>
    );
}

export default App;
