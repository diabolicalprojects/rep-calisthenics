import React, { useState, useEffect } from 'react';
import { Shield, Plus, X, Edit, Trash2, KeyRound, Mail, User as UserIcon } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import HelpTooltip from '../components/HelpTooltip';
import ConfirmModal from '../components/ConfirmModal';
import BaseModal from '../components/BaseModal';

const Users = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '', username: '', email: '', password: '', role: 'coach',
        permissions: { members: false, pos: false, agenda: false, inventory: false }
    });

    const isDev = currentUser?.role === 'developer';
    const isAdmin = isDev || currentUser?.role === 'admin';

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            ...user,
            password: '',
            permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions || '{}') : (user.permissions || {})
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                const payload = { ...formData };
                if (!payload.password) delete payload.password;
                await api.updateUser(editingUser.id, payload);
            } else {
                await api.addUser(formData);
            }
            setShowModal(false);
            setEditingUser(null);
            fetchUsers();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await api.deleteUser(confirmDeleteId);
            setConfirmDeleteId(null);
            fetchUsers();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const togglePermission = (key) => {
        setFormData(prev => ({
            ...prev,
            permissions: { ...prev.permissions, [key]: !prev.permissions[key] }
        }));
    };

    if (!isAdmin) {
        return <div style={{ padding: '80px 40px', textAlign: 'center', opacity: 0.5 }}>No tienes permisos para ver esta sección.</div>;
    }

    return (
        <div className="animate-fade-in">
            <header className="page-header stagger-1 flex-responsive">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h1 className="page-title">Gestión de Staff</h1>
                        <HelpTooltip title="Accesos" content="Administra las cuentas de tu staff y define sus permisos específicos." />
                    </div>
                    <p className="page-subtitle text-muted">Control de acceso y roles del sistema</p>
                </div>
                <button className="btn-primary" onClick={() => { 
                    setEditingUser(null); 
                    setFormData({ name: '', username: '', email: '', password: '', role: 'coach', permissions: {} }); 
                    setShowModal(true); 
                }}>
                    <Plus size={18} /> Nuevo Usuario
                </button>
            </header>

            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', marginTop: 32 }}>
                <div className="table-container">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Nombre / Info</th>
                                <th>Usuario @</th>
                                <th>Rol del Sistema</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: 50 }}>Cargando usuarios...</td></tr>
                            ) : users.map(u => (
                                <tr key={u.id}>
                                    <td data-label="Nombre">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <UserIcon size={18} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{u.name}</div>
                                                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <Mail size={12} /> <span className="hide-mobile">{u.email || 'Sin email'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td data-label="Usuario" style={{ color: 'var(--color-accent-orange)', fontWeight: 600 }}>@{u.username}</td>
                                    <td data-label="Rol">
                                        <span className={`status-badge ${u.role === 'developer' ? 'success' : u.role === 'admin' ? 'warning' : ''}`} 
                                              style={u.role === 'coach' ? { background: '#222', color: '#999' } : {}}>
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td data-label="Acciones">
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                            <button className="btn-ghost" 
                                                    onClick={() => handleEdit(u)}
                                                    disabled={!isDev && u.role === 'developer'}>
                                                <Edit size={16} />
                                            </button>
                                            <button className="btn-ghost" style={{ color: 'var(--color-danger)' }}
                                                    onClick={() => setConfirmDeleteId(u.id)}
                                                    disabled={(!isDev && u.role === 'developer') || u.id === currentUser?.id}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <BaseModal isOpen={showModal} onClose={() => setShowModal(false)} title={editingUser ? 'Editar Staff' : 'Registrar Nuevo Staff'}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="form-group">
                            <label>Nombre Completo</label>
                            <input required className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="form-group">
                                <label>Usuario (ID)</label>
                                <input required className="form-input" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <KeyRound size={14} /> Contraseña {editingUser && '(Dejar vacío para mantener)'}
                            </label>
                            <input type="password" required={!editingUser} className="form-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                        </div>

                        <div className="form-group">
                            <label>Rol asignado</label>
                            <select className="form-input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                <option value="coach">Coach / Instructor</option>
                                <option value="admin">Administrador / Gerente</option>
                                {isDev && <option value="developer">Developer</option>}
                            </select>
                        </div>

                        {formData.role === 'coach' && (
                            <div style={{ background: 'rgba(255,115,0,0.05)', padding: 20, borderRadius: 16, border: '1px solid rgba(255,115,0,0.1)' }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-accent-orange)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Permisos específicos</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    {['agenda', 'pos', 'members', 'inventory'].map(perm => (
                                        <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                                            <input type="checkbox" checked={!!formData.permissions[perm]} onChange={() => togglePermission(perm)} style={{ width: 18, height: 18, accentColor: 'var(--color-accent-orange)' }} />
                                            {perm === 'pos' ? 'Cobros (Punto de Venta)' : perm === 'members' ? 'Miembros' : perm.charAt(0).toUpperCase() + perm.slice(1)}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button type="submit" className="btn-primary" style={{ marginTop: 10 }}>Guardar Cambios</button>
                    </form>
                </BaseModal>
            )}

            <ConfirmModal 
                isOpen={!!confirmDeleteId}
                title="¿Eliminar Acceso Staff?"
                message="Este usuario ya no podrá ingresar al sistema. Las transacciones registradas por este usuario se mantendrán para auditoría."
                onConfirm={handleDelete}
                onCancel={() => setConfirmDeleteId(null)}
                type="danger"
            />
        </div>
    );
};

export default Users;
