import React, { useState, useEffect } from 'react';
import { Plus, Check, AlertCircle, RefreshCw, Filter, Receipt } from 'lucide-react';
import { api } from '../services/api';
import BaseModal from '../components/BaseModal';
import SearchInput from '../components/SearchInput';
import HelpTooltip from '../components/HelpTooltip';
import { fmtCurrency, fmtDate } from '../utils/formatters';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [metrics, setMetrics] = useState({ monthlyRevenue: 0, pendingDebts: 0, plansDistribution: {} });
    const [showModal, setShowModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    
    const [formData, setFormData] = useState({ 
        memberName: '', concept: 'Mensualidad', amount: '', status: 'Pagado' 
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [data, members] = await Promise.all([
                api.getPayments(),
                api.getMembers()
            ]);

            setPayments(data);

            let revenue = 0;
            let debts = 0;
            data.forEach(p => {
                const amount = Number(p.amount) || 0;
                if (p.status === 'Pagado') revenue += amount;
                else if (p.status === 'Pendiente') debts += amount;
            });

            const planCounts = {};
            members.forEach(m => {
                if (m.plan) {
                    planCounts[m.plan] = (planCounts[m.plan] || 0) + 1;
                }
            });

            setMetrics({ monthlyRevenue: revenue, pendingDebts: debts, plansDistribution: planCounts });
        } catch (err) { 
            console.error('Error fetching payments:', err); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.addPayment(formData);
            setShowModal(false);
            setFormData({ memberName: '', concept: 'Mensualidad', amount: '', status: 'Pagado' });
            fetchData();
        } catch (err) { 
            alert('Error: ' + err.message);
        }
    };

    const filteredPayments = payments.filter(p => 
        p.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.concept.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in">
            <header className="page-header stagger-1">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h1 className="page-title">Finanzas</h1>
                        <HelpTooltip title="Contabilidad" content="Módulo de ingresos y cuentas por cobrar. Todos los pagos realizados en el POS se reflejan aquí automáticamente." />
                    </div>
                    <p className="page-subtitle text-muted">Gestión de flujo de caja y deudas</p>
                </div>
                <div className="flex-responsive" style={{ gap: 12 }}>
                    <button className="btn-ghost" onClick={fetchData} disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> Nuevo Registro
                    </button>
                </div>
            </header>

            <section className="metrics-grid responsive-grid" style={{ marginTop: 32 }}>
                <div className="glass-panel pulse-hover stagger-2">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span className="text-muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Ingresos Pagados</span>
                        <div className="icon-wrapper green" style={{ width: 32, height: 32 }}><Check size={16} /></div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-success)' }}>{fmtCurrency(metrics.monthlyRevenue)}</div>
                    <p className="text-muted" style={{ fontSize: 11, marginTop: 8 }}>Recaudación histórica acumulada</p>
                </div>

                <div className="glass-panel pulse-hover stagger-3">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span className="text-muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Deuda en Riesgo</span>
                        <div className="icon-wrapper red" style={{ width: 32, height: 32 }}><AlertCircle size={16} /></div>
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-danger)' }}>{fmtCurrency(metrics.pendingDebts)}</div>
                    <p className="text-muted" style={{ fontSize: 11, marginTop: 8 }}>Monto total por cobrar</p>
                </div>

                <div className="glass-panel pulse-hover stagger-4">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <span className="text-muted" style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Miembros por Plan</span>
                        <div className="icon-wrapper accent" style={{ width: 32, height: 32 }}><Filter size={16} /></div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {Object.entries(metrics.plansDistribution).map(([plan, count]) => (
                            <div key={plan} style={{ fontSize: 12, padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
                                <span className="text-accent" style={{ fontWeight: 700 }}>{count}</span> {plan}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="glass-panel mobile-full stagger-5" style={{ padding: 0, marginTop: 24, overflow: 'hidden' }}>
                <div className="flex-responsive" style={{ padding: 20, justifyContent: 'space-between', alignItems: 'center', gap: 16, borderBottom: '1px solid var(--color-glass-border)' }}>
                    <h2 style={{ fontSize: 18, fontWeight: 700 }}>Libro de Transacciones</h2>
                    <div style={{ flex: 1, minWidth: 'min(300px, 100%)', maxWidth: 400 }}>
                        <SearchInput value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Filtrar por nombre o concepto..." />
                    </div>
                </div>

                <div className="table-container">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Miembro</th>
                                <th>Concepto</th>
                                <th>Monto</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'center' }}>Detalle</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40 }}>Cargando datos...</td></tr>
                            ) : filteredPayments.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>No se encontraron registros financieros.</td></tr>
                            ) : filteredPayments.map(p => (
                                <tr key={p.id}>
                                    <td data-label="Fecha" style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{fmtDate(p.date)}</td>
                                    <td data-label="Miembro"><span style={{ fontWeight: 600 }}>{p.memberName}</span></td>
                                    <td data-label="Concepto" style={{ fontSize: 13 }}>{p.concept}</td>
                                    <td data-label="Monto"><strong style={{ fontSize: 16 }}>{fmtCurrency(p.amount)}</strong></td>
                                    <td data-label="Estado">
                                        <span className={`status-badge ${p.status === 'Pagado' ? 'success' : 'danger'}`}>
                                            {p.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td data-label="Detalle" style={{ textAlign: 'center' }}>
                                        <button className="btn-ghost" style={{ padding: 8 }} onClick={() => setSelectedPayment(p)}>
                                            <Receipt size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL REGISTRO */}
            <BaseModal isOpen={showModal} onClose={() => setShowModal(false)} title="Registrar Transacción">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="form-group">
                        <label>Miembro / Cliente</label>
                        <input required className="form-input" placeholder="Nombre completo" value={formData.memberName} onChange={e => setFormData({...formData, memberName: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label>Concepto</label>
                        <input required className="form-input" placeholder="Ej. Inscripción o Mes Mayo" value={formData.concept} onChange={e => setFormData({...formData, concept: e.target.value})} />
                    </div>
                    <div className="form-group">
                        <label>Monto</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-accent)', fontWeight: 700 }}>$</span>
                            <input required type="number" className="form-input" style={{ paddingLeft: 32 }} placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Estado Inicial</label>
                        <select className="form-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                            <option value="Pagado">PAGADO (Efectivo/Tarjeta)</option>
                            <option value="Pendiente">PENDIENTE (Deuda)</option>
                        </select>
                    </div>
                    <button type="submit" className="btn-primary" style={{ marginTop: 10 }}>Confirmar Registro</button>
                </form>
            </BaseModal>

            {/* MODAL DETALLE */}
            <BaseModal isOpen={!!selectedPayment} onClose={() => setSelectedPayment(null)} title="Comprobante Digital">
                {selectedPayment && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ textAlign: 'center', padding: 20, background: 'rgba(0,0,0,0.2)', borderRadius: 16 }}>
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Monto de la Operación</div>
                            <div style={{ fontSize: 42, fontWeight: 900, color: selectedPayment.status === 'Pagado' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                                {fmtCurrency(selectedPayment.amount)}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>ID: {selectedPayment.id}</div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Atleta</div>
                                <div style={{ fontWeight: 700 }}>{selectedPayment.memberName}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Fecha</div>
                                <div>{fmtDate(selectedPayment.date)}</div>
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Concepto</div>
                                <div>{selectedPayment.concept}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Estado</div>
                                <span className={`status-badge ${selectedPayment.status === 'Pagado' ? 'success' : 'danger'}`}>
                                    {selectedPayment.status.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                            <button className="btn-ghost" style={{ flex: 1 }}>Imprimir Ticket</button>
                            <button className="btn-primary" style={{ flex: 1 }} onClick={() => setSelectedPayment(null)}>Entendido</button>
                        </div>
                    </div>
                )}
            </BaseModal>
        </div>
    );
};

export default Payments;
