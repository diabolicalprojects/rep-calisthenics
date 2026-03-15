import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users, Dumbbell, CreditCard, Calendar, Menu, X, Package, LogOut, ShieldAlert, Database, Award, UserCheck, BarChart2, ArrowDownCircle } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';
import './Sidebar.css';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const userObj = JSON.parse(localStorage.getItem('user') || '{}');

    const navItems = [
        { path: '/', name: 'Dashboard', icon: <Home size={20} /> },
        { path: '/analytics', name: 'Centro de Métricas', icon: <BarChart2 size={20} /> },
        { path: '/pos', name: 'Punto de Venta', icon: <CreditCard size={20} /> },
        { path: '/retencion', name: 'Retención (IA)', icon: <ShieldAlert size={20} /> },
        { path: '/visitas', name: 'Visitas', icon: <UserCheck size={20} /> },
        { path: '/agenda', name: 'Agenda / Citas', icon: <Calendar size={20} /> },
        { path: '/miembros', name: 'Miembros', icon: <Users size={20} /> },
        { path: '/pagos', name: 'Historial Pagos', icon: <CreditCard size={20} /> },
        { path: '/gastos', name: 'Gastos / Egresos', icon: <ArrowDownCircle size={20} /> },
        { path: '/rutinas', name: 'Rutinas', icon: <Dumbbell size={20} /> },
        { path: '/inventario', name: 'Inventario', icon: <Package size={20} /> },
        { path: '/membresias', name: 'Membresías', icon: <Award size={20} /> },
        { path: '/migracion', name: 'Migración', icon: <Database size={20} /> }
    ];

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.reload();
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
                        {navItems
                            .filter(item => {
                                // Admin and Dev see everything
                                if (userObj?.role === 'admin' || userObj?.role === 'developer') return true;
                                // Coach sees specific items based on permissions
                                // If they don't have permissions object, default to Dashboard only
                                const perms = typeof userObj?.permissions === 'string' ? JSON.parse(userObj.permissions || '{}') : (userObj?.permissions || {});
                                
                                switch(item.path) {
                                    case '/': return true; // Everyone sees Dashboard
                                    case '/agenda': return perms.agenda;
                                    case '/pos': return perms.pos;
                                    case '/miembros': return perms.members;
                                    case '/inventario': return perms.inventory;
                                    // other routes hidden for staff by default, unless specified
                                    default: return false;
                                }
                            })
                            .map((item) => (
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
                        
                        {(userObj?.role === 'admin' || userObj?.role === 'developer') && (
                            <li>
                                <NavLink
                                    to="/usuarios"
                                    className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="nav-icon"><ShieldAlert size={20} /></span>
                                    <span className="nav-text">Usuarios (Staff)</span>
                                </NavLink>
                            </li>
                        )}
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <div className="user-profile">
                        <div className="avatar">A</div>
                        <div className="user-info">
                            <span className="name">{userObj.name || 'Usuario'}</span>
                            <span className="role">{userObj.role === 'developer' ? 'Developer' : userObj.role === 'admin' ? 'Administrador' : 'Coach'}</span>
                        </div>
                        <div className="user-actions">
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
