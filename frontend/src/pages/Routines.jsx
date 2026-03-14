import React, { useState, useEffect } from 'react';
import { Plus, X, Play, Edit2 } from 'lucide-react';
import { api } from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

const Routines = () => {
    const [routines, setRoutines] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedRoutine, setSelectedRoutine] = useState(null);
    const [members, setMembers] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
    const [formData, setFormData] = useState({ name: '', level: 'Principiante', focus: '', icon: '🔰', description: '' });

    const fetchRoutines = async () => {
        try {
            const data = await api.getRoutines();
            setRoutines(data);
        } catch (err) { console.error('Error fetching routines:', err); }
    };

    const fetchMembers = async () => {
        try {
            const data = await api.getMembers();
            setMembers(data);
        } catch (err) { console.error('Error fetching members:', err); }
    };

    useEffect(() => {
        fetchRoutines();
        fetchMembers();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.updateRoutine(editingId, formData);
            } else {
                await api.addRoutine(formData);
            }
            setShowModal(false);
            setEditingId(null);
            setFormData({ name: '', level: 'Principiante', focus: '', icon: '🔥', description: '' });
            await fetchRoutines();
        } catch (err) { console.error('Error saving routine:', err); }
    };

    const handleEdit = (routine) => {
        setFormData({
            name: routine.name,
            level: routine.level,
            focus: routine.focus,
            icon: routine.icon,
            description: routine.description || ''
        });
        setEditingId(routine.id);
        setShowModal(true);
    };

    const handleDelete = async () => {
        if (!confirmDelete.id) return;
        try {
            await api.deleteRoutine(confirmDelete.id);
            setConfirmDelete({ open: false, id: null });
            setShowModal(false);
            await fetchRoutines();
        } catch (err) { console.error('Error deleting routine:', err); }
    };

    const handleAssign = (routine) => {
        setSelectedRoutine(routine);
        setShowAssignModal(true);
    };

    const confirmAssign = (memberId) => {
        alert(`Rutina "${selectedRoutine.name}" asignada con éxito al miembro.`);
        setShowAssignModal(false);
    };

    return (
        <div className="animate-fade-in dashboard-container">
            <header className="page-header" style={{ marginBottom: '24px', flexWrap: 'wrap' }}>
                <div>
                    <h1 className="page-title">Rutinas de Entrenamiento</h1>
                    <p className="page-subtitle text-muted">Diseña y asigna planes personalizados</p>
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} />
                        <span>Nueva Rutina</span>
                    </button>
                </div>
            </header>

            {/* Modal Crear Rutina */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="glass-panel modal-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px' }}>{editingId ? 'Editar Rutina' : 'Configurar Rutina'}</h2>
                            <button onClick={() => { setShowModal(false); setEditingId(null); setFormData({ name: '', level: 'Principiante', focus: '', icon: '🔰', description: '' }); }} className="btn-ghost" style={{ padding: '5px' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label>Nombre de la Rutina</label>
                                <input required type="text" placeholder="ej. Empuje - Fuerza" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>

                            <div className="form-group">
                                <label>Nivel de Dificultad</label>
                                <select className="form-input" value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })}>
                                    <option value="Principiante">Principiante</option>
                                    <option value="Intermedio">Intermedio</option>
                                    <option value="Avanzado">Avanzado</option>
                                    <option value="Pro">Nivel Atleta Pro</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Músculos / Foco</label>
                                <input required type="text" placeholder="ej. Dorsales y Bíceps" className="form-input" value={formData.focus} onChange={e => setFormData({ ...formData, focus: e.target.value })} />
                            </div>

                            <div className="form-group">
                                <label>Descripción / Detalles</label>
                                <textarea
                                    className="form-input"
                                    style={{ minHeight: '100px', resize: 'vertical' }}
                                    placeholder="Describe los ejercicios y repeticiones..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label>Icono</label>
                                <input required type="text" placeholder="🔥" className="form-input" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} />
                            </div>

                            <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
                                {editingId ? 'Guardar Cambios' : 'Publicar Rutina'}
                            </button>
                            {editingId && (
                                <button type="button" className="btn-ghost" style={{ color: 'var(--color-danger)', marginTop: '5px' }} onClick={() => setConfirmDelete({ open: true, id: editingId })}>
                                     Eliminar Rutina
                                 </button>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Asignar a Miembro */}
            {showAssignModal && (
                <div className="modal-overlay">
                    <div className="glass-panel modal-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '18px' }}>Asignar {selectedRoutine?.name}</h2>
                            <button onClick={() => setShowAssignModal(false)} className="btn-ghost" style={{ padding: '5px' }}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                            {members.map(m => (
                                <div key={m.id} className="glass-panel" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                    <span style={{ fontSize: '14px' }}>{m.name}</span>
                                    <button className="btn-primary" style={{ padding: '5px 12px', fontSize: '12px' }} onClick={() => confirmAssign(m.id)}>Asignar</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {routines.length === 0 ? (
                <p className="text-muted">No hay rutinas en el catálogo.</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {routines.map(routine => (
                        <div key={routine.id} className="glass-panel pulse-hover" style={{ display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ background: 'rgba(244, 140, 37, 0.1)', padding: '12px', borderRadius: '12px', fontSize: '24px' }}>
                                    {routine.icon}
                                </div>
                                <span className={`status-badge success`} style={{ fontSize: '10px', textTransform: 'uppercase' }}>
                                    {routine.level}
                                </span>
                            </div>

                            <div>
                                <h3 style={{ fontSize: '20px', marginBottom: '4px' }}>{routine.name}</h3>
                                <p className="text-orange" style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '12px' }}>{routine.focus}</p>
                                {routine.description && (
                                    <p className="text-muted" style={{ fontSize: '13px', lineHeight: '1.6', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                                        {routine.description}
                                    </p>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px' }}>
                                <button className="btn-ghost" style={{ flex: 1, padding: '10px', fontSize: '13px' }} onClick={() => handleEdit(routine)}>
                                    <Edit2 size={16} /> Editar
                                </button>
                                <button className="btn-primary" style={{ flex: 1.5, padding: '10px', fontSize: '13px' }} onClick={() => handleAssign(routine)}>
                                    <Play size={16} /> Asignar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmModal 
                isOpen={confirmDelete.open}
                title="¿Eliminar Rutina?"
                message="Esta acción eliminará la rutina del catálogo. No afectará a los miembros que ya la tengan asignada."
                confirmText="Eliminar Rutina"
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete({ open: false, id: null })}
                type="danger"
            />
        </div>
    );
};

export default Routines;
