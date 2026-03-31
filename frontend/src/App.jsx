import React, { useState } from 'react';
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
import BrandingSettings from './pages/BrandingSettings';
import SupportButton from './components/SupportButton';
import DemoModal from './components/DemoModal';
import { useAuth } from './context/AuthContext';

function App() {
    const { user, loading: authLoading } = useAuth();
    const isPublicRoute = window.location.pathname === '/reservar';
    const [showSplash, setShowSplash] = useState(!isPublicRoute);
    const [showDemoModal, setShowDemoModal] = useState(false);

    if (showSplash) {
        return <Splash onComplete={() => setShowSplash(false)} />;
    }

    if (authLoading && !isPublicRoute) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-main)', color: 'var(--color-text-main)' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>Cargando sistema...</p>
            </div>
        );
    }

    if (!user && !isPublicRoute) {
        return <Login />;
    }

    if (isPublicRoute) {
        return (
            <Router>
                <Routes>
                    <Route path="/reservar" element={<PublicBooking />} />
                    <Route path="*" element={<Navigate to="/reservar" replace />} />
                </Routes>
            </Router>
        );
    }

    return (
        <Router>
            <div className="app-layout">
                <Sidebar onShowDemo={() => setShowDemoModal(true)} />
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
                        <Route path="/configuracion" element={<BrandingSettings />} />
                        
                        {/* Aliases for compatibility */}
                        <Route path="/members" element={<Navigate to="/miembros" replace />} />
                        <Route path="/inventory" element={<Navigate to="/inventario" replace />} />
                        
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </main>

                <SupportButton />
                <DemoModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />
            </div>
        </Router>
    );
}

export default App;
