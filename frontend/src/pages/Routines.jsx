import React, { useState, useEffect } from 'react';
import { Plus, Play, Edit2, Trash2, Dumbbell, Target, Layers } from 'lucide-react';
import { api } from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import BaseModal from '../components/BaseModal';
import SearchInput from '../components/SearchInput';
import HelpTooltip from '../components/HelpTooltip';

const Routines = () => {
    const [routines, setRoutines] = useState([]);
    const [members, setMembers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedRoutine, setSelectedRoutine] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    
    const [formData, setFormData] = useState({ 
        name: '', level: 'Principiante', focus: '', icon: '🔰', description: '' 
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [routinesData, membersData] = await Promise.all([
                api.getRoutines(),
                api.getMembers()
            ]);
            setRoutines(routinesData);
            setMembers(membersData);
        } catch (err) { 
            console.error('Error:', err); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

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
            fetchData();
        } catch (err) { 
            alert('Error: ' + err.message);
        }
    };

    const handleEdit = (routine) => {
        setFormData({ ...routine });
        setEditingId(routine.id);
        setShowModal(true);
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await api.deleteRoutine(confirmDeleteId);
            setConfirmDeleteId(null);
            setShowModal(false);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleAssign = (routine) => {
        setSelectedRoutine(routine);
        setShowAssignModal(true);
    };

    const confirmAssign = (memberId) => {
        alert(`Rutina "${selectedRoutine.name}" asignada con éxito.`);
        setShowAssignModal(false);
    };

    const filteredMembers = members.filter(m => 
        m.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in">
            <header className="page-header stagger-1 flex-responsive">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h1 className="page-title">Rutinas</h1>
                        <HelpTooltip title="Entrenamientos" content="Crea bibliotecas de rutinas para asignar a tus atletas según su nivel y objetivos." />
                    </div>
                    <p className="page-subtitle text-muted">Gestión de planes de entrenamiento</p>
                </div>
                <button className="btn-primary" onClick={() => { 
                    setEditingId(null); 
                    setFormData({ name: '', level: 'Principiante', focus: '', icon: '🔰', description: '' }); 
                    setShowModal(true); 
                }}>
                    <Plus size={18} /> Nueva Rutina
                </button>
            </header>

            <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(280px, 45%, 400px), 1fr))', gap: '24px', marginTop: 32 }}>
                {loading ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 100 }}>Cargando rutinas...</div>
                ) : routines.length === 0 ? (
                    <div className="glass-panel" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60 }}>
                        <p className="text-muted">No has creado rutinas aún.</p>
                    </div>
                ) : routines.map(routine => (
                    <div key={routine.id} className="glass-panel pulse-hover" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: 24, flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--color-accent)15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                                    {routine.icon}
                                </div>
                                <span className="status-badge warning" style={{ fontSize: 10 }}>{routine.level.toUpperCase()}</span>
                            </div>

                            <h3 style={{ fontSize: 20, marginBottom: 4 }}>{routine.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-accent)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', marginBottom: 16 }}>
                                <Target size={12} /> {routine.focus}
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.15)', padding: 12, borderRadius: 12, fontSize: 13, color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                                {routine.description || 'Sin descripción detallada.'}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, padding: 20, background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--color-glass-border)' }}>
                            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => handleEdit(routine)}>
                                <Edit2 size={16} /> Editar
                            </button>
                            <button className="btn-primary" style={{ flex: 1 }} onClick={() => handleAssign(routine)}>
                                <Play size={16} /> Asignar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL CREAR/EDITAR */}
            {showModal && (
                <BaseModal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Editar Rutina' : 'Nueva Rutina'}>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="form-group">
                            <label>Nombre de la Rutina</label>
                            <input required className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="form-group">
                                <label>Nivel</label>
                                <select className="form-input" value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}>
                                    <option value="Principiante">Principiante</option>
                                    <option value="Intermedio">Intermedio</option>
                                    <option value="Avanzado">Avanzado</option>
                                    <option value="Pro">Pro</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Enfoque / Músculos</label>
                                <input required className="form-input" value={formData.focus} onChange={e => setFormData({...formData, focus: e.target.value})} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Instrucciones / Descripción</label>
                            <textarea className="form-input" style={{ minHeight: 120 }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>

                        <div className="form-group">
                            <label>Icono (Emoji)</label>
                            <input className="form-input" value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <button type="submit" className="btn-primary">Guardar Rutina</button>
                            {editingId && (
                                <button type="button" className="btn-ghost" style={{ color: 'var(--color-danger)' }} onClick={() => setConfirmDeleteId(editingId)}>
                                    <Trash2 size={16} /> Eliminar Rutina
                                </button>
                            )}
                        </div>
                    </form>
                </BaseModal>
            )}

            {/* MODAL ASIGNAR */}
            {showAssignModal && (
                <BaseModal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title={`Asignar: ${selectedRoutine?.name}`}>
                    <div style={{ marginBottom: 20 }}>
                        <SearchInput placeholder="Buscar miembro..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                        {filteredMembers.map(m => (
                            <button key={m.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', padding: 16, background: 'var(--color-glass)' }} onClick={() => confirmAssign(m.id)}>
                                <span>{m.name}</span>
                                <Plus size={16} />
                            </button>
                        ))}
                    </div>
                </BaseModal>
            )}

            <ConfirmModal 
                isOpen={!!confirmDeleteId}
                title="¿Eliminar Rutina?"
                message="Esta rutina desaparecerá de la biblioteca. Los miembros que la tengan asignada no se verán afectados."
                onConfirm={handleDelete}
                onCancel={() => setConfirmDeleteId(null)}
                type="danger"
            />
        </div>
    );
};

export default Routines;
