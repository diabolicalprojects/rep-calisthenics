import React, { useState, useEffect } from 'react';
import { Plus, X, ArrowDownCircle, Wallet, Calendar, PieChart } from 'lucide-react';
import { api } from '../services/api';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [stats, setStats] = useState({ totalMonthly: 0, byCategory: {} });
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'Mantenimiento',
        date: new Date().toISOString().split('T')[0]
    });

    const userObj = JSON.parse(localStorage.getItem('user') || '{}');

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await api.getExpenses();
            setExpenses(data);
            
            // Calculate stats
            let total = 0;
            const cats = {};
            data.forEach(ex => {
                const amt = parseFloat(ex.amount) || 0;
                total += amt;
                cats[ex.category] = (cats[ex.category] || 0) + amt;
            });
            setStats({ totalMonthly: total, byCategory: cats });
        } catch (err) {
            console.error('Error fetching expenses:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.createExpense({
                ...formData,
                recorded_by: userObj.id
            });
            setShowModal(false);
            setFormData({
                description: '',
                amount: '',
                category: 'Mantenimiento',
                date: new Date().toISOString().split('T')[0]
            });
            fetchData();
        } catch (err) {
            alert('Error al guardar gasto: ' + err.message);
        }
    };

    return (
        <div className="animate-fade-in dashboard-container">
            <header className="page-header" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 className="page-title">Gastos y Egresos</h1>
                    <p className="page-subtitle text-muted">Control de salidas de capital y costos operativos</p>
                </div>
                <button className="btn-primary" style={{ background: 'var(--color-danger)', border: 'none' }} onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Registrar Gasto
                </button>
            </header>

            {/* Metrics Row */}
            <div className="metrics-grid" style={{ marginBottom: '32px' }}>
                <div className="glass-panel metric-card pulse-hover">
                    <div className="metric-header">
                        <h3>Egresos Totales</h3>
                        <div className="icon-wrapper red"><ArrowDownCircle size={20} /></div>
                    </div>
                    <div className="metric-value">${stats.totalMonthly.toFixed(2)}</div>
                    <p className="text-muted" style={{ fontSize: '12px' }}>Reporte acumulado</p>
                </div>
                
                <div className="glass-panel metric-card pulse-hover" style={{ gridColumn: 'span 2' }}>
                    <div className="metric-header" style={{ marginBottom: '15px' }}>
                        <h3>Distribución por Categoría</h3>
                        <div className="icon-wrapper blue"><PieChart size={20} /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        {Object.entries(stats.byCategory).length === 0 ? (
                            <p className="text-muted">No hay gastos registrados aún</p>
                        ) : Object.entries(stats.byCategory).map(([cat, amt]) => (
                            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '5px' }}>
                                <span style={{ fontSize: '14px' }}>{cat}</span>
                                <span style={{ fontWeight: 'bold' }}>${amt.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Expenses Table */}
            <div className="glass-panel mobile-full" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="table-container">
                    <table className="modern-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Descripción</th>
                                <th>Categoría</th>
                                <th>Fecha</th>
                                <th>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No hay gastos registrados.</td></tr>
                            ) : expenses.map(ex => (
                                <tr key={ex.id}>
                                    <td><span style={{ fontWeight: '500' }}>{ex.description}</span></td>
                                    <td><span className="status-badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>{ex.category}</span></td>
                                    <td>{new Date(ex.date).toLocaleDateString()}</td>
                                    <td><strong style={{ color: 'var(--color-danger)' }}>-${parseFloat(ex.amount).toFixed(2)}</strong></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Insert Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="glass-panel modal-content" style={{ maxWidth: '450px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px' }}>Nuevo Egreso</h2>
                            <button onClick={() => setShowModal(false)} className="btn-ghost" style={{ padding: '5px' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label>Descripción del Gasto</label>
                                <input required type="text" className="form-input" placeholder="Ej. Pago de Renta Mayo" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div className="form-group">
                                    <label>Monto ($)</label>
                                    <input required type="number" step="0.01" className="form-input" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label>Categoría</label>
                                    <select className="form-input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                        <option value="Mantenimiento">Mantenimiento</option>
                                        <option value="Servicios">Servicios (Luz/Agua)</option>
                                        <option value="Sueldos">Sueldos</option>
                                        <option value="Renta">Renta</option>
                                        <option value="Limpieza">Limpieza</option>
                                        <option value="Otros">Otros</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Fecha</label>
                                <input type="date" className="form-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                            </div>
                            <button type="submit" className="btn-primary" style={{ background: 'var(--color-danger)', border: 'none', marginTop: '10px' }}>
                                Guardar Egreso
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
