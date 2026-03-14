import React, { useState, useEffect } from 'react';
import { Shield, Plus, X, Edit, Trash2, Key, KeyRound } from 'lucide-react';
import { api } from '../services/api';
import HelpTooltip from '../components/HelpTooltip';
import ConfirmModal from '../components/ConfirmModal';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
    const [formData, setFormData] = useState({
        name: '', username: '', email: '', password: '', role: 'coach',
        permissions: { members: false, pos: false, agenda: false }
    });

    const userObj = JSON.parse(localStorage.getItem('user') || '{}');
    const isAdmin = userObj?.role === 'admin' || userObj?.role === 'developer';
    const isDev = userObj?.role === 'developer';

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            ...user,
            password: '', // blank so we don't accidentally update it if left empty
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
            await fetchUsers();
        } catch (err) {
            console.error('Error saving user:', err);
            alert('Error al guardar el usuario: ' + err.message);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete.id) return;
        try {
            await api.deleteUser(confirmDelete.id);
            setConfirmDelete({ open: false, id: null });
            await fetchUsers();
        } catch (err) {
            alert('Error eliminando usuario: ' + err.message);
        }
    };

    const togglePermission = (key) => {
        setFormData(prev => ({
            ...prev,
            permissions: { ...prev.permissions, [key]: !prev.permissions[key] }
        }));
    };

    if (!isAdmin) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Acceso Denegado</div>;
    }

    return (
        <div className="animate-fade-in" style={{ padding: '0px', maxWidth: '1000px', margin: '0 auto' }}>
            <header className="page-header" style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h1 className="page-title">Gestión de Usuarios</h1>
                    <HelpTooltip 
                        title="Control de Accesos"
                        content="Administra las cuentas de tu staff. Dale acceso total, o restringe funciones como cobros y agenda utilizando los switches de permisos."
                    />
                </div>
                <button className="btn-primary pulse-animation" onClick={() => { setEditingUser(null); setFormData({ name: '', username: '', email: '', password: '', role: 'coach', permissions: {} }); setShowModal(true); }}>
                    <Plus size={18} /> Nuevo Usuario
                </button>
            </header>

            {showModal && (
                <div className="modal-overlay">
                    <div className="glass-panel modal-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '20px' }}>{editingUser ? 'Editar Usuario' : 'Crear Usuario'}</h2>
                            <button onClick={() => setShowModal(false)} className="btn-ghost" style={{ padding: '5px' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Nombre Completo</label>
                                <input required type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Usuario (ID)</label>
                                    <input required type="text" className="form-input" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Email</label>
                                    <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                </div>
                            </div>
                            
                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                                    <KeyRound size={14} /> Contraseña {editingUser ? '(Solo llenar para cambiarla)' : ''}
                                </label>
                                <input type="password" required={!editingUser} className="form-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', color: 'var(--color-text-muted)' }}>Rol <Shield size={12} /></label>
                                <select className="form-input" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                    <option value="coach">Staff / Coach</option>
                                    <option value="admin">Administrador (Gerente)</option>
                                    {isDev && <option value="developer">Developer</option>}
                                </select>
                            </div>

                            {formData.role === 'coach' && (
                                <div style={{ background: 'var(--color-bg-secondary)', padding: '15px', borderRadius: '12px', border: '1px solid var(--color-glass-border)' }}>
                                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: 'bold' }}>Permisos del Staff</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={!!formData.permissions.agenda} onChange={() => togglePermission('agenda')} style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent-orange)' }} />
                                            Gestionar Agenda
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={!!formData.permissions.pos} onChange={() => togglePermission('pos')} style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent-orange)' }} />
                                            Cobrar (POS)
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={!!formData.permissions.members} onChange={() => togglePermission('members')} style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent-orange)' }} />
                                            Gestionar Miembros
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={!!formData.permissions.inventory} onChange={() => togglePermission('inventory')} style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent-orange)' }} />
                                            Gestionar Inventario
                                        </label>
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="btn-primary" style={{ marginTop: '20px', padding: '15px', justifyContent: 'center' }}>
                                Guardar Usuario
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="table-container">
                    <table className="modern-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Usuario / Email</th>
                                <th>Rol</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td><span style={{ fontWeight: 'bold' }}>{u.name}</span></td>
                                    <td>
                                        <span style={{ color: 'var(--color-accent-orange)', display: 'block' }}>@{u.username}</span>
                                        <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{u.email}</span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${u.role === 'developer' ? 'success' : u.role === 'admin' ? 'warning' : ''}`} style={u.role === 'coach' ? { background: '#333', color: '#fff' } : {}}>
                                            {u.role.toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                className="btn-ghost" 
                                                style={{ color: '#4da6ff', padding: '5px' }} 
                                                onClick={() => handleEdit(u)}
                                                disabled={(!isDev && u.role === 'developer')}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                className="btn-ghost" 
                                                style={{ color: 'var(--color-danger)', padding: '5px' }} 
                                                onClick={() => setConfirmDelete({ open: true, id: u.id })}
                                                disabled={(!isDev && u.role === 'developer') || u.id === userObj.id}
                                            >
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

            <ConfirmModal 
                isOpen={confirmDelete.open}
                title="¿Eliminar Usuario?"
                message="Esta acción revocará permanentemente el acceso de este usuario al sistema. Esta acción no se puede deshacer."
                confirmText="Eliminar acceso"
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete({ open: false, id: null })}
                type="danger"
            />
        </div>
    );
};

export default Users;
