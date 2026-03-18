import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
    Home, Users, Dumbbell, CreditCard, Calendar, Menu, X, 
    Package, LogOut, ShieldAlert, Database, Award, 
    UserCheck, BarChart2, ArrowDownCircle, Info 
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils/formatters';
import './Sidebar.css';

const Sidebar = ({ onShowDemo }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout, isAdmin } = useAuth();

    const navItems = [
        { path: '/', name: 'Dashboard', icon: <Home size={20} /> },
        { path: '/analytics', name: 'Métricas', icon: <BarChart2 size={20} /> },
        { path: '/pos', name: 'Punto de Venta', icon: <CreditCard size={20} /> },
        { path: '/retencion', name: 'Retención (IA)', icon: <ShieldAlert size={20} /> },
        { path: '/visitas', name: 'Visitas', icon: <UserCheck size={20} /> },
        { path: '/agenda', name: 'Agenda', icon: <Calendar size={20} /> },
        { path: '/miembros', name: 'Miembros', icon: <Users size={20} /> },
        { path: '/pagos', name: 'Historial Pagos', icon: <CreditCard size={20} /> },
        { path: '/gastos', name: 'Gastos', icon: <ArrowDownCircle size={20} /> },
        { path: '/rutinas', name: 'Rutinas', icon: <Dumbbell size={20} /> },
        { path: '/inventario', name: 'Inventario', icon: <Package size={20} /> },
        { path: '/membresias', name: 'Membresías', icon: <Award size={20} /> },
        { path: '/migracion', name: 'Migración', icon: <Database size={20} /> }
    ];

    const getPermissions = () => {
        if (!user) return {};
        if (typeof user.permissions === 'string') {
            try { return JSON.parse(user.permissions); } catch (e) { return {}; }
        }
        return user.permissions || {};
    };

    const permissions = getPermissions();

    return (
        <>
            <button className="mobile-menu-btn" onClick={() => setIsOpen(!isOpen)} aria-label="Abrir menú">
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

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
                                if (isAdmin) return true;
                                switch(item.path) {
                                    case '/': return true;
                                    case '/agenda': return permissions.agenda;
                                    case '/pos': return permissions.pos;
                                    case '/miembros': return permissions.members;
                                    case '/inventario': return permissions.inventory;
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
                        
                        {isAdmin && (
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
                    {user?.role === 'developer' && (
                        <button 
                            className="nav-link btn-ghost" 
                            onClick={onShowDemo}
                            style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '10px', color: 'var(--color-accent-orange)' }}
                        >
                            <span className="nav-icon"><Info size={20} /></span>
                            <span className="nav-text">Ver Demo Info</span>
                        </button>
                    )}
                    <div className="user-profile">
                        <div className="avatar">{initials(user?.name)[0]}</div>
                        <div className="user-info">
                            <span className="name">{user?.name || 'Usuario'}</span>
                            <span className="role">
                                {user?.role === 'developer' ? 'Developer' : user?.role === 'admin' ? 'Administrador' : 'Coach'}
                            </span>
                        </div>
                        <div className="user-actions">
                            <ThemeToggle />
                            <button 
                                className="btn-ghost" 
                                onClick={logout} 
                                style={{ padding: '5px', color: 'var(--color-danger)' }} 
                                title="Cerrar Sesión"
                                aria-label="Cerrar sesión"
                            >
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
