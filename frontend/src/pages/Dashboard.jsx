import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Users, Clock, CreditCard, Activity, BarChart2 } from 'lucide-react';
import { api } from '../services/api';
import './Dashboard.css';
import HelpTooltip from '../components/HelpTooltip';
import { MetricSkeleton, TableRowSkeleton } from '../components/Skeleton';

const Dashboard = () => {
    const [stats, setStats] = useState({
        activeMembers: 0,
        monthlyRevenue: 0,
        altas: 0,
        bajas: 0,
        totalExpenses: 0,
        netUtility: 0,
        projectedRevenue: 0,
        moneyAtRisk: 0,
        growthRate: '0'
    });

    const [range, setRange] = useState('month'); // 'today', 'week', 'month'

    const [recentPayments, setRecentPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Determine dates based on range
                const end = new Date();
                let start = new Date();
                if (range === 'today') {
                   start.setHours(0,0,0,0);
                } else if (range === 'week') {
                   start.setDate(end.getDate() - 7);
                } else {
                   start.setDate(1); // Start of month
                }

                const startDateStr = start.toISOString();
                const endDateStr = end.toISOString();

                // Fetch Members (Total for Stats)
                const membersData = await api.getMembers();
                const activeMembersCount = membersData.filter(m => m.status === 'active' || m.status === 'Activo').length;

                // Projection logic (Global, not range dependent)
                let projected = 0;
                let riskCount = 0;
                let riskMoney = 0;
                
                membersData.forEach(m => {
                    // Estimate price if not in membership table
                    const price = m.plan === 'Elite' ? 1000 : 600; 
                    if (m.status === 'active' || m.status === 'Activo') {
                        projected += price;
                        // CHURN PREDICTION: 15 days of inactivity
                        if (m.last_visit) {
                            const lastVisit = new Date(m.last_visit);
                            const diffDays = (new Date() - lastVisit) / (1000 * 60 * 60 * 24);
                            if (diffDays > 15) {
                                riskCount++;
                                riskMoney += price;
                            }
                        } else {
                            riskCount++;
                            riskMoney += price;
                        }
                    }
                });

                // Fetch filtered transactions
                let revenue = 0;
                const recents = [];
                try {
                    const transactions = await api.getTransactions({ startDate: startDateStr, endDate: endDateStr });
                    transactions.forEach((tx, idx) => {
                        revenue += parseFloat(tx.total_amount) || 0;
                        if (idx < 5) recents.push(tx);
                    });
                } catch(e) { console.error("Transactions error", e); }

                // Fetch filtered Expenses
                let totalExpenses = 0;
                try {
                    const expenses = await api.getExpenses({ startDate: startDateStr, endDate: endDateStr });
                    expenses.forEach(ex => {
                        totalExpenses += parseFloat(ex.amount) || 0;
                    });
                } catch(e) { console.error("Expenses error", e); }

                setStats({
                    activeMembers: activeMembersCount,
                    altas: membersData.filter(m => new Date(m.created_at) >= start).length,
                    bajas: membersData.filter(m => m.status === 'Inactivo' && new Date(m.updated_at) >= start).length,
                    monthlyRevenue: revenue,
                    totalExpenses: totalExpenses,
                    netUtility: revenue - totalExpenses,
                    projectedRevenue: projected,
                    moneyAtRisk: riskMoney,
                    riskCount: riskCount,
                    growthRate: membersData.filter(m => new Date(m.created_at) >= start).length - membersData.filter(m => m.status === 'Inactivo' && new Date(m.updated_at) >= start).length,
                });

                setRecentPayments(recents);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setLoading(false);
            }
        };
        fetchData();
    }, [range]);

    return (
        <div className="dashboard-container">
            <header className="page-header stagger-1">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <h1 className="page-title">Inteligencia Financiera</h1>
                        <HelpTooltip 
                            title="¿Cómo leer mi Dashboard?" 
                            content="Aquí verás una radiografía de tu negocio. Diferenciamos Retención (qué tanto capital está en riesgo) vs Crecimiento (Altas vs Bajas). Toca cualquier tarjeta para una analítica más profunda."
                        />
                    </div>
                    {/* Range Filter */}
                    <div style={{ display: 'flex', background: 'var(--color-glass)', borderRadius: '12px', padding: '4px', border: '1px solid var(--color-glass-border)' }}>
                        {['today', 'week', 'month'].map(r => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={range === r ? 'btn-primary' : 'btn-ghost'}
                                style={{ 
                                    padding: '6px 16px', 
                                    fontSize: '12px', 
                                    textTransform: 'capitalize',
                                    minHeight: '34px',
                                    borderRadius: '8px',
                                    background: range === r ? 'var(--color-accent-orange)' : 'transparent',
                                    border: 'none'
                                }}
                            >
                                {r === 'today' ? 'Hoy' : r === 'week' ? '7 Días' : 'Mes'}
                            </button>
                        ))}
                    </div>
                </div>
                <p className="page-subtitle text-muted">Panel centralizado de métricas y crecimiento ({range === 'today' ? 'Hoy' : range === 'week' ? 'Últimos 7 días' : 'Mes Actual'}).</p>
            </header>

            {/* Metrics Section */}
            <section className="metrics-grid">
                {loading ? (
                    <>
                        <MetricSkeleton />
                        <MetricSkeleton />
                        <MetricSkeleton />
                        <MetricSkeleton />
                    </>
                ) : (
                    <>
                        <div className="glass-panel metric-card pulse-hover stagger-2">
                            <div className="metric-header">
                                <h3>Crecimiento Neto ({range === 'today' ? 'Hoy' : range === 'week' ? '7d' : 'Mes'})</h3>
                                <div className="icon-wrapper orange"><Activity size={20} /></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="metric-value">{stats.growthRate >= 0 ? `+${stats.growthRate}` : stats.growthRate}</div>
                                <div style={{ fontSize: '12px', textAlign: 'right' }}>
                                    <div className="text-success"><ArrowUpRight size={12}/> {stats.altas} Altas</div>
                                    <div className="text-danger"><ArrowDownRight size={12}/> {stats.bajas} Bajas</div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel metric-card pulse-hover stagger-3" style={{ borderTop: '2px solid var(--color-success)' }}>
                            <div className="metric-header">
                                <h3>Ventas / Utilidad</h3>
                                <div className="icon-wrapper green"><BarChart2 size={20} /></div>
                            </div>
                            <div className="metric-value">${(stats.monthlyRevenue || 0).toFixed(0)}</div>
                            <p className="text-muted" style={{ fontSize: '11px', marginTop: '5px' }}>Neto: ${(stats.netUtility || 0).toFixed(0)} (Ingresos - Gastos)</p>
                        </div>

                        <div className="glass-panel metric-card pulse-hover stagger-4" style={{ borderTop: '2px solid var(--color-danger)' }}>
                            <div className="metric-header">
                                <h3>Bajas Proyectadas</h3>
                                <div className="icon-wrapper red"><ArrowDownRight size={20} /></div>
                            </div>
                            <div className="metric-value text-danger">${stats.moneyAtRisk}</div>
                            <p className="text-muted" style={{ fontSize: '11px', marginTop: '5px' }}>{stats.riskCount} socios inactivos (&gt;15 días)</p>
                        </div>

                        <div className="glass-panel metric-card pulse-hover stagger-5" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <div className="metric-header">
                                <h3>Capital Proyectado</h3>
                                <div className="icon-wrapper blue"><Users size={20} /></div>
                            </div>
                            <div className="metric-value" style={{ color: 'var(--color-accent-blue)' }}>${stats.projectedRevenue}</div>
                            <p className="text-muted" style={{ fontSize: '11px' }}>Próximas renovaciones auto</p>
                        </div>
                    </>
                )}
            </section>

            {/* Main Content Split */}
            <div className="dashboard-content">

                {/* Agenda Section */}
                <section className="agenda-section glass-panel glass-hover stagger-3">
                    <div className="section-header">
                        <h2>Agenda de Hoy</h2>
                    </div>

                    <div className="agenda-list">
                        <div className="event-card active-event">
                            <div className="event-time">
                                <Clock size={16} />
                                <span>10:30 AM</span>
                            </div>
                            <div className="event-details">
                                <h4>Front Lever Masterclass</h4>
                                <p>Nivel: Avanzado</p>
                            </div>
                        </div>

                        <div className="event-card">
                            <div className="event-time">
                                <Clock size={16} />
                                <span>05:00 PM</span>
                            </div>
                            <div className="event-details">
                                <h4>Push Day (Empuje)</h4>
                                <p>Nivel: Intermedio</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Transactions Section */}
                <section className="transactions-section glass-panel glass-hover stagger-4">
                    <div className="section-header" style={{ display: 'flex', alignItems: 'center' }}>
                        <h2>Motor de Transacciones</h2>
                        <HelpTooltip 
                            title="Auditoría Rápida" 
                            content="Haz clic en cualquier transacción para ir a la vista contextual de Caja. Puedes ver el detalle de los carritos de compra integrados (Suscripciones + Retail)." 
                        />
                    </div>

                    <div className="table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Cajero</th>
                                    <th>Conceptos</th>
                                    <th>Estado / Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <>
                                        <TableRowSkeleton columns={3} />
                                        <TableRowSkeleton columns={3} />
                                        <TableRowSkeleton columns={3} />
                                    </>
                                ) : (
                                    recentPayments.length > 0 ? recentPayments.map(payment => (
                                        <tr key={payment.id} style={{ cursor: 'pointer' }} onClick={() => window.location.href='/pos'}>
                                            <td>
                                                <div className="user-cell">
                                                    <div className="avatar-small">{(payment.cashier_name || payment.cashier || 'A').charAt(0)}</div>
                                                    <span>{payment.cashier_name || 'Admin'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {payment.items && payment.items.length > 0 ? payment.items.map(i=>i.name).join(', ') : 'Venta Unificada'}
                                            </td>
                                            <td>
                                                <div><span className={`status-badge success`}>Completado</span></div>
                                                <div style={{ marginTop: '5px', fontWeight: 'bold' }}>${payment.total_amount}</div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>
                                                No hay transacciones unificadas registradas.
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

            </div>
        </div>
    );
};

export default Dashboard;
