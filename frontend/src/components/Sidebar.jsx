import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Dumbbell, CreditCard, Calendar, Menu, X, Package, LogOut, ShieldAlert, Database, Award, UserCheck, BarChart2 } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';
import './Sidebar.css';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        { path: '/', name: 'Dashboard', icon: <Home size={20} /> },
        { path: '/analytics', name: 'Centro de Métricas', icon: <BarChart2 size={20} /> },
        { path: '/pos', name: 'Punto de Venta', icon: <CreditCard size={20} /> },
        { path: '/retencion', name: 'Retención (IA)', icon: <ShieldAlert size={20} /> },
        { path: '/visitas', name: 'Visitas', icon: <UserCheck size={20} /> },
        { path: '/agenda', name: 'Agenda / Citas', icon: <Calendar size={20} /> },
        { path: '/miembros', name: 'Miembros', icon: <Users size={20} /> },
        { path: '/pagos', name: 'Historial Pagos', icon: <CreditCard size={20} /> },
        { path: '/rutinas', name: 'Rutinas', icon: <Dumbbell size={20} /> },
        { path: '/inventario', name: 'Inventario', icon: <Package size={20} /> },
        { path: '/membresias', name: 'Membresías', icon: <Award size={20} /> },
        { path: '/migracion', name: 'Migración', icon: <Database size={20} /> }
    ];

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <>
            <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay for mobile to close sidebar when clicking outside */}
            {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)}></div>}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="logo-container" style={{ width: '100%', padding: '0 10px' }}>
                        <Logo animated={false} />
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    <span className="nav-text">{item.name}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="avatar">A</div>
                        <div className="user-info">
                            <span className="name">Admin</span>
                            <span className="role">Gerente</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <ThemeToggle />
                            <button className="btn-ghost" onClick={handleLogout} style={{ padding: '5px', color: 'var(--color-danger)' }} title="Cerrar Sesión">
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
