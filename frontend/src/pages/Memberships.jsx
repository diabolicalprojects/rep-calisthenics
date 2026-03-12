import React, { useState, useEffect } from 'react';
import { Plus, X, CreditCard, Edit2, Trash2, CheckCircle, Info } from 'lucide-react';
import { api } from '../services/api';

const Memberships = () => {
    const [plans, setPlans] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [formData, setFormData] = useState({ name: '', price: '', duration: '30', description: '' });
    const [loading, setLoading] = useState(true);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const data = await api.getMemberships();
            setPlans(data);
        } catch (err) { console.error('Error fetching memberships:', err); }
        finally { setLoading(false); }
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
            fetchPlans();
            alert(editingPlan ? 'Plan actualizado correctamente' : 'Nuevo plan creado con éxito');
        } catch (err) { console.error('Error saving membership plan:', err); }
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
        setFormData({
            name: plan.name,
            price: plan.price.toString(),
            duration: plan.duration.toString(),
            description: plan.description || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este plan? Esto no afectará a los miembros que ya lo tienen asignado, pero no podrá ser seleccionado nuevamente.')) return;
        try {
            await api.deleteMembership(id);
            fetchPlans();
        } catch (err) { console.error('Error deleting plan:', err); }
    };

    return (
        <div className="animate-fade-in dashboard-container">
            <header className="page-header" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 className="page-title">Gestión de Membresías</h1>
                    <p className="page-subtitle text-muted">Configura los planes, precios y beneficios de tu academia</p>
                </div>
                <button className="btn-primary" onClick={() => { setEditingPlan(null); setFormData({ name: '', price: '', duration: '30', description: '' }); setShowModal(true); }}>
                    <Plus size={18} /> Crear Plan
                </button>
            </header>

            {showModal && (
                <div className="modal-overlay">
                    <div className="glass-panel modal-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px' }}>{editingPlan ? 'Editar Plan' : 'Nuevo Plan de Membresía'}</h2>
                            <button onClick={() => setShowModal(false)} className="btn-ghost" style={{ padding: '5px' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label>Nombre del Plan</label>
                                <input required type="text" placeholder="Ej. Plan Élite Mensual" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group">
                                    <label>Precio ($)</label>
                                    <input required type="number" placeholder="0.00" className="form-input" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Duración (Días)</label>
                                    <input required type="number" placeholder="30" className="form-input" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Descripción / Beneficios</label>
                                <textarea
                                    className="form-input"
                                    style={{ minHeight: '100px', resize: 'vertical' }}
                                    placeholder="Ej. Acceso total, Toalla incluida, 1 sesión de coaching..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="btn-primary" style={{ marginTop: '10px', justifyContent: 'center' }}>
                                {editingPlan ? 'Guardar Cambios' : 'Crear Plan Ahora'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {plans.length === 0 && !loading ? (
                    <div className="glass-panel" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px' }}>
                        <Info size={40} style={{ opacity: 0.2, marginBottom: '15px' }} />
                        <p className="text-muted">No has creado planes de membresía aún. Empieza creando tu primer plan.</p>
                    </div>
                ) : plans.map(plan => (
                    <div key={plan.id} className="glass-panel pulse-hover" style={{ position: 'relative', overflow: 'hidden', padding: '0' }}>
                        <div style={{ height: '6px', background: 'var(--color-accent-orange)', width: '100%' }}></div>
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div>
                                    <h3 style={{ fontSize: '22px', color: 'white' }}>{plan.name}</h3>
                                    <span className="text-muted" style={{ fontSize: '13px' }}>Duración: {plan.duration} días</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--color-accent-orange)' }}>${plan.price}</div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px', minHeight: '60px' }}>
                                <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                                    {plan.description || 'Sin descripción detallada.'}
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid var(--color-glass-border)', paddingTop: '20px' }}>
                                <button className="btn-ghost" style={{ flex: 1, gap: '8px' }} onClick={() => handleEdit(plan)}>
                                    <Edit2 size={16} /> Editar
                                </button>
                                <button className="btn-ghost" style={{ flex: 1, gap: '8px', color: 'var(--color-danger)' }} onClick={() => handleDelete(plan.id)}>
                                    <Trash2 size={16} /> Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Memberships;
