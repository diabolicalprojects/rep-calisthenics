import React, { useState, useEffect } from 'react';
import { Download, Plus, AlertCircle, Check, X } from 'lucide-react';
import { api } from '../services/api';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [metrics, setMetrics] = useState({ monthlyRevenue: 0, pendingDebts: 0, plansDistribution: {} });
    const [showModal, setShowModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [formData, setFormData] = useState({ memberName: '', concept: 'Mensualidad', amount: '', status: 'Pagado' });

    const fetchPayments = async () => {
        try {
            const data = await api.getPayments();
            setPayments(data);

            // Calculate payment metrics
            let revenue = 0;
            let debts = 0;
            data.forEach(p => {
                const amount = Number(p.amount) || 0;
                if (p.status === 'Pagado') revenue += amount;
                else if (p.status === 'Pendiente') debts += amount;
            });

            // Calculate Plan Distribution
            const members = await api.getMembers();
            const planCounts = {};
            members.forEach(m => {
                if (m.plan) {
                    planCounts[m.plan] = (planCounts[m.plan] || 0) + 1;
                }
            });

            setMetrics({ monthlyRevenue: revenue, pendingDebts: debts, plansDistribution: planCounts });
        } catch (err) { console.error('Error fetching payments:', err); }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const handleRowClick = (payment) => {
        if (window.innerWidth <= 768) {
            setSelectedPayment(payment);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.addPayment({
                ...formData
            });
            setShowModal(false);
            setFormData({ memberName: '', concept: 'Mensualidad', amount: '', status: 'Pagado' });
            fetchPayments();
        } catch (err) { console.error('Error saving payment:', err); }
    };

    return (
        <div className="animate-fade-in">
            <header className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 className="page-title">Pagos y Deudas</h1>
                    <p className="page-subtitle text-muted">Contabilidad conectada con Cloud Firestore</p>
                </div>
                <div>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> Registrar Pago
                    </button>
                </div>
            </header>

            {/* Modal Agregar Pago */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="glass-panel modal-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px' }}>Registrar Pago / Deuda</h2>
                            <button onClick={() => setShowModal(false)} className="btn-ghost" style={{ padding: '5px' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="form-group">
                                <label>Atleta</label>
                                <input required type="text" placeholder="Nombre del atleta" className="form-input" value={formData.memberName} onChange={e => setFormData({ ...formData, memberName: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Concepto</label>
                                <input required type="text" placeholder="Ej. Mes de Mayo" className="form-input" value={formData.concept} onChange={e => setFormData({ ...formData, concept: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Monto ($)</label>
                                <input required type="number" placeholder="00.00" className="form-input" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                            </div>

                            <div className="form-group">
                                <label>Estado del pago</label>
                                <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="Pagado">Pagado Exitosamente</option>
                                    <option value="Pendiente">Deuda Pendiente</option>
                                </select>
                            </div>

                            <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Guardar Transacción</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Detalle Pago (Móvil) */}
            {selectedPayment && (
                <div className="modal-overlay">
                    <div className="glass-panel modal-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', alignItems: 'center' }}>
                            <h2 style={{ fontSize: '20px' }}>Detalles del Pago</h2>
                            <button onClick={() => setSelectedPayment(null)} className="btn-ghost" style={{ padding: '5px' }}><X size={20} /></button>
                        </div>

                        <div className="detail-card">
                            <div className="detail-item">
                                <span className="detail-label">Atleta</span>
                                <span className="detail-value">{selectedPayment.memberName}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Concepto</span>
                                <span className="detail-value">{selectedPayment.concept}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Monto Transacción</span>
                                <span className="detail-value" style={{ fontSize: '24px', fontWeight: 'bold' }}>${selectedPayment.amount}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Fecha del registro</span>
                                <span className="detail-value">{new Date(selectedPayment.date).toLocaleDateString()}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Estado</span>
                                <span className={`status-badge ${selectedPayment.status === 'Pagado' ? 'success' : 'danger'}`} style={{ width: 'fit-content', padding: '6px 16px' }}>
                                    {selectedPayment.status}
                                </span>
                            </div>
                        </div>

                        <button className="btn-primary" style={{ width: '100%', marginTop: '32px' }} onClick={() => setSelectedPayment(null)}>
                            Regresar
                        </button>
                    </div>
                </div>
            )}

            <section className="metrics-grid" style={{ marginBottom: '32px' }}>
                <div className="glass-panel metric-card pulse-hover stagger-2">
                    <div className="metric-header">
                        <h3>Ingresos Mensuales</h3>
                        <div className="icon-wrapper green"><Check size={20} /></div>
                    </div>
                    <div className="metric-value">${metrics.monthlyRevenue}</div>
                    <p className="text-muted" style={{ fontSize: '12px', marginTop: '10px' }}>Total recaudado este mes</p>
                </div>

                <div className="glass-panel metric-card pulse-hover stagger-3">
                    <div className="metric-header">
                        <h3>Deudas Pendientes</h3>
                        <div className="icon-wrapper red"><AlertCircle size={20} /></div>
                    </div>
                    <div className="metric-value text-danger">${metrics.pendingDebts}</div>
                    <p className="text-muted" style={{ fontSize: '12px', marginTop: '10px' }}>Por cobrar a miembros</p>
                </div>

                <div className="glass-panel metric-card pulse-hover stagger-4" style={{ gridColumn: 'span 1' }}>
                    <div className="metric-header">
                        <h3>Distribución de Planes</h3>
                        <div className="icon-wrapper blue"><Download size={20} /></div>
                    </div>
                    <div style={{ marginTop: '15px' }}>
                        {Object.keys(metrics.plansDistribution).length === 0 ? (
                            <p className="text-muted" style={{ fontSize: '13px' }}>No hay datos de planes</p>
                        ) : Object.entries(metrics.plansDistribution).map(([plan, count]) => (
                            <div key={plan} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                <span className="text-muted">{plan}</span>
                                <span style={{ color: 'var(--color-accent-orange)', fontWeight: 'bold' }}>{count} miembros</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="glass-panel mobile-full" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--color-glass-border)' }}>
                    <h2 style={{ fontSize: '18px' }}>Transacciones Recientes</h2>
                </div>
                <div className="table-container">
                    <table className="modern-table clickable-rows" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Atleta</th>
                                <th>Concepto</th>
                                <th>Monto</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>No hay transacciones aún</td></tr>
                            ) : payments.map(p => (
                                <tr key={p.id} onClick={() => handleRowClick(p)}>
                                    <td><span style={{ fontWeight: '500' }}>{p.memberName}</span></td>
                                    <td style={{ color: 'var(--color-text-muted)' }}>{p.concept}</td>
                                    <td><strong style={{ color: 'var(--color-text-main)' }}>${p.amount}</strong></td>
                                    <td><span className={`status-badge ${p.status === 'Pagado' ? 'success' : 'danger'}`}>{p.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Payments;
