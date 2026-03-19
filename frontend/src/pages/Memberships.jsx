import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Info, Clock } from 'lucide-react';
import { api } from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import BaseModal from '../components/BaseModal';
import { fmtCurrency } from '../utils/formatters';

const Memberships = () => {
    const [plans, setPlans] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '', duration: '30', description: '' });
    const [loading, setLoading] = useState(true);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const data = await api.getMemberships();
            setPlans(data);
        } catch (err) { 
            console.error('Error fetching memberships:', err); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { fetchPlans(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const planData = {
                ...formData,
                price: Number(formData.price),
                duration: Number(formData.duration)
            };

            if (editingPlan) {
                await api.updateMembership(editingPlan.id, planData);
            } else {
                await api.addMembership(planData);
            }

            setShowModal(false);
            setEditingPlan(null);
            setFormData({ name: '', price: '', duration: '30', description: '' });
            await fetchPlans();
        } catch (err) { 
            console.error('Error saving membership plan:', err); 
        }
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name,
            price: (plan.price || 0).toString(),
            duration: (plan.duration || 30).toString(),
            description: plan.description || ''
        });
        setShowModal(true);
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await api.deleteMembership(confirmDeleteId);
            setConfirmDeleteId(null);
            await fetchPlans();
        } catch (err) { 
            console.error('Error deleting plan:', err); 
        }
    };

    return (
        <div className="animate-fade-in">
            <header className="page-header stagger-1 flex-responsive">
                <div>
                    <h1 className="page-title">Gestión de Membresías</h1>
                    <p className="page-subtitle text-muted">Configura los planes, precios y vigencias de tu academia</p>
                </div>
                <button className="btn-primary" onClick={() => { 
                    setEditingPlan(null); 
                    setFormData({ name: '', price: '', duration: '30', description: '' }); 
                    setShowModal(true); 
                }}>
                    <Plus size={18} /> Crear Nuevo Plan
                </button>
            </header>

            <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(280px, 45%, 400px), 1fr))', gap: '24px', marginTop: '32px' }}>
                {loading ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px' }}>Cargando planes...</div>
                ) : (plans || []).length === 0 ? (
                    <div className="glass-panel" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px' }}>
                        <Info size={40} style={{ opacity: 0.2, marginBottom: '16px', margin: '0 auto' }} />
                        <p className="text-muted">No has creado planes de membresía aún.</p>
                    </div>
                ) : (plans || []).map(plan => (
                    <div key={plan.id} className="glass-panel pulse-hover" style={{ padding: 0, overflow: 'hidden', borderTop: '4px solid var(--color-accent-orange)' }}>
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div style={{ maxWidth: '70%' }}>
                                    <h3 style={{ fontSize: '20px', margin: 0 }}>{plan.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: 'var(--color-text-muted)', marginTop: 4 }}>
                                        <Clock size={12} /> {plan.duration} días
                                    </div>
                                </div>
                                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-success)' }}>
                                    {fmtCurrency(plan.price)}
                                </div>
                            </div>

                            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: '1.6', minHeight: 60, marginBottom: 24 }}>
                                {plan.description || 'Sin descripción adicional.'}
                            </p>

                            <div style={{ display: 'flex', gap: '12px', paddingTop: '20px', borderTop: '1px solid var(--color-glass-border)' }}>
                                <button className="btn-ghost" style={{ flex: 1 }} onClick={() => handleEdit(plan)}>
                                    <Edit2 size={16} /> Editar
                                </button>
                                <button className="btn-ghost" style={{ flex: 1, color: 'var(--color-text-muted)' }} onClick={() => setConfirmDeleteId(plan.id)}>
                                    <Trash2 size={16} /> Borrar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <BaseModal 
                    isOpen={showModal} 
                    onClose={() => setShowModal(false)} 
                    title={editingPlan ? 'Editar Plan' : 'Nuevo Plan'}
                >
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="form-group">
                            <label>Nombre del Plan</label>
                            <input required type="text" placeholder="Ej. Acceso Elite Mensual" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="form-group">
                                <label>Precio ($)</label>
                                <input required type="number" step="0.01" className="form-input" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Duración (Días)</label>
                                <input required type="number" className="form-input" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Descripción / Beneficios</label>
                            <textarea
                                className="form-input"
                                style={{ minHeight: '120px' }}
                                placeholder="Haz una lista de lo que incluye este plan..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>
                            {editingPlan ? 'Actualizar Plan' : 'Crear Plan'}
                        </button>
                    </form>
                </BaseModal>
            )}

            <ConfirmModal 
                isOpen={!!confirmDeleteId}
                title="¿Eliminar Plan?"
                message="Esta acción no se puede deshacer. El plan dejará de estar disponible para nuevas inscripciones."
                onConfirm={handleDelete}
                onCancel={() => setConfirmDeleteId(null)}
                type="danger"
            />
        </div>
    );
};

export default Memberships;
