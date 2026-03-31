import React, { useState, useEffect } from 'react';
import { 
    ArrowUpRight, ArrowDownRight, Users, Clock, 
    CreditCard, Activity, BarChart2, TrendingUp,
    TrendingDown, Calendar, Receipt, ChevronRight,
    Target, Zap
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import HelpTooltip from '../components/HelpTooltip';
import { MetricSkeleton, TableRowSkeleton } from '../components/Skeleton';
import { fmtCurrency, fmtDate } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [range, setRange] = useState('month'); 
    const [stats, setStats] = useState({
        activeMembers: 0,
        monthlyRevenue: 0,
        altas: 0,
        bajas: 0,
        totalExpenses: 0,
        netUtility: 0,
        projectedRevenue: 0,
        moneyAtRisk: 0,
        riskCount: 0,
        growthRate: 0,
    });
    const [recentPayments, setRecentPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const end = new Date();
            let start = new Date();
            if (range === 'today') {
               start.setHours(0,0,0,0);
            } else if (range === 'week') {
               start.setDate(end.getDate() - 7);
            } else {
               start.setDate(1); 
            }

            const startDateStr = start.toISOString();
            const endDateStr = end.toISOString();

            const [membersData, transactions, expenses] = await Promise.all([
                api.getMembers(),
                api.getTransactions({ startDate: startDateStr, endDate: endDateStr }),
                api.getExpenses({ startDate: startDateStr, endDate: endDateStr })
            ]);

            const activeMembersCount = membersData.filter(m => m.status?.toLowerCase() === 'active' || m.status === 'Activo').length;

            let projected = 0;
            let riskCount = 0;
            let riskMoney = 0;
            
            membersData.forEach(m => {
                const price = m.plan?.toLowerCase().includes('elite') ? 100 : 50; 
                if (m.status?.toLowerCase() === 'active' || m.status === 'Activo') {
                    projected += price;
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

            let revenue = 0;
            transactions.forEach(tx => {
                revenue += parseFloat(tx.total_amount) || 0;
            });

            let totalExpenses = 0;
            expenses.forEach(ex => {
                totalExpenses += parseFloat(ex.amount) || 0;
            });

            const rangeAltas = membersData.filter(m => new Date(m.created_at) >= start).length;
            const rangeBajas = membersData.filter(m => m.status === 'Inactivo' && new Date(m.updated_at) >= start).length;

            setStats({
                activeMembers: activeMembersCount,
                altas: rangeAltas,
                bajas: rangeBajas,
                monthlyRevenue: revenue,
                totalExpenses: totalExpenses,
                netUtility: revenue - totalExpenses,
                projectedRevenue: projected,
                moneyAtRisk: riskMoney,
                riskCount: riskCount,
                growthRate: rangeAltas - rangeBajas,
            });

            setRecentPayments(transactions.slice(0, 5));
        } catch (error) {
            console.error("Dashboard error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [range]);

    return (
        <div className="animate-fade-in">
            <header className="page-header stagger-1 flex-responsive">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h1 className="page-title">Executive Overview</h1>
                        <HelpTooltip 
                            title="Centro de Control" 
                            content="Resumen operativo y financiero en tiempo real. Los datos se actualizan según el rango seleccionado."
                        />
                    </div>
                    <p className="page-subtitle text-muted">Operaciones • <span className="text-orange" style={{fontWeight: 700}}>{user?.name || 'Administrador'}</span></p>
                </div>
                
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 4, border: '1px solid var(--color-glass-border)' }}>
                    {['today', 'week', 'month'].map(r => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={range === r ? 'btn-primary' : 'btn-ghost'}
                            style={{ 
                                padding: '6px 20px', 
                                fontSize: '11px', 
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                minHeight: '34px',
                                borderRadius: 8,
                                background: range === r ? 'var(--color-accent)' : 'transparent',
                                color: range === r ? '#000' : 'inherit',
                                border: 'none'
                            }}
                        >
                            {r === 'today' ? 'Hoy' : r === 'week' ? 'Semana' : 'Mes'}
                        </button>
                    ))}
                </div>
            </header>

            <section className="metrics-grid responsive-grid" style={{ marginTop: 32 }}>
                {loading ? (
                    Array(4).fill(0).map((_, i) => <MetricSkeleton key={i} />)
                ) : (
                    <>
                        <div className="glass-panel metric-card pulse-hover stagger-2">
                            <div className="metric-header">
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Tracción Neta</span>
                                <div className="icon-wrapper orange" style={{ width: 32, height: 32 }}><Activity size={16} /></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div className="metric-value" style={{ fontSize: 32, margin: '8px 0' }}>{stats.growthRate >= 0 ? `+${stats.growthRate}` : stats.growthRate}</div>
                                <div style={{ fontSize: 10, textAlign: 'right', paddingBottom: 8 }}>
                                    <div className="text-success" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>+{stats.altas} ALTAS</div>
                                    <div className="text-danger" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>-{stats.bajas} BAJAS</div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel metric-card pulse-hover stagger-3" style={{ borderBottom: '2px solid var(--color-success)' }}>
                            <div className="metric-header">
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Ventas Brutas</span>
                                <div className="icon-wrapper green" style={{ width: 32, height: 32 }}><BarChart2 size={16} /></div>
                            </div>
                            <div className="metric-value" style={{ fontSize: 32, margin: '8px 0', color: 'var(--color-success)' }}>{fmtCurrency(stats.monthlyRevenue)}</div>
                            <p className="text-muted" style={{ fontSize: 10, fontWeight: 700 }}>NETO: {fmtCurrency(stats.netUtility)}</p>
                        </div>

                        <div className="glass-panel metric-card pulse-hover stagger-4" style={{ borderBottom: '2px solid var(--color-danger)' }}>
                            <div className="metric-header">
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Exposición Churn</span>
                                <div className="icon-wrapper red" style={{ width: 32, height: 32 }}><Users size={16} /></div>
                            </div>
                            <div className="metric-value text-danger" style={{ fontSize: 32, margin: '8px 0' }}>{fmtCurrency(stats.moneyAtRisk)}</div>
                            <p className="text-muted" style={{ fontSize: 10, fontWeight: 700 }}>{stats.riskCount} PERFILES EN RIESGO</p>
                        </div>

                        <div className="glass-panel metric-card pulse-hover stagger-5" style={{ borderBottom: '2px solid var(--color-blue)' }}>
                            <div className="metric-header">
                                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>MRR Proyectado</span>
                                <div className="icon-wrapper blue" style={{ width: 32, height: 32 }}><CreditCard size={16} /></div>
                            </div>
                            <div className="metric-value text-blue" style={{ fontSize: 32, margin: '8px 0' }}>{fmtCurrency(stats.projectedRevenue)}</div>
                            <p className="text-muted" style={{ fontSize: 10, fontWeight: 700 }}>RECURRENCIA ESTIMADA</p>
                        </div>
                    </>
                )}
            </section>

            <div className="dashboard-grid-main">
                <div className="glass-panel stagger-6" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="flex-responsive" style={{ padding: 24, borderBottom: '1px solid var(--color-glass-border)', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Ventas en Tiempo Real</h2>
                        <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => navigate('/pos')}>SISTEMA POS <ChevronRight size={14}/></button>
                    </div>
                    <div className="table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Conceptos</th>
                                    <th>Cajero</th>
                                    <th>Fecha</th>
                                    <th style={{ textAlign: 'right' }}>Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => <TableRowSkeleton key={i} columns={4} />)
                                ) : recentPayments.length > 0 ? (
                                    recentPayments.map(tx => (
                                        <tr key={tx.id}>
                                            <td data-label="Conceptos" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                                                {tx.items?.map(i => i.name).join(', ') || 'Venta General'}
                                            </td>
                                            <td data-label="Cajero">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div className="avatar-small" style={{ width: 24, height: 24, fontSize: 10 }}>{(tx.cashier_name || 'A').charAt(0)}</div>
                                                    <span style={{ fontSize: 12, fontWeight: 500 }}>{tx.cashier_name || 'Admin'}</span>
                                                </div>
                                            </td>
                                            <td data-label="Fecha" className="text-muted" style={{ fontSize: 12 }}>{fmtDate(tx.timestamp || tx.created_at)}</td>
                                            <td data-label="Monto" style={{ textAlign: 'right' }}>
                                                <strong className="text-success" style={{ fontSize: 16 }}>{fmtCurrency(tx.total_amount)}</strong>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)' }}>No se registran transacciones en este periodo.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="glass-panel stagger-7" style={{ background: 'linear-gradient(135deg, rgba(255,115,0,0.05) 0%, rgba(0,0,0,0) 100%)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                            <div className="icon-wrapper orange" style={{ width: 36, height: 36 }}><Clock size={18} /></div>
                            <h2 style={{ fontSize: 18, fontWeight: 800 }}>Próximas Sesiones</h2>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {[
                                { time: '10:30 AM', title: 'Front Lever Masterclass', coach: 'Coach Alex', color: 'var(--color-accent)' },
                                { time: '05:00 PM', title: 'Push Day (Empuje)', coach: 'Coach Elena', color: 'var(--color-success)' },
                                { time: '07:00 PM', title: 'Basic Calisthenics', coach: 'Coach Alex', color: 'var(--color-blue)' }
                            ].map((item, idx) => (
                                <div key={idx} className="glass-panel pulse-hover" style={{ 
                                    display: 'flex', 
                                    gap: 16, 
                                    padding: 16, 
                                    background: 'rgba(255,255,255,0.02)', 
                                    borderRadius: 12,
                                    borderLeft: `3px solid ${item.color}`
                                }}>
                                    <div style={{ fontSize: 12, fontWeight: 900, width: 65 }}>{item.time}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{item.title}</div>
                                        <div className="text-muted" style={{ fontSize: 11 }}>{item.coach}</div>
                                    </div>
                                    <Zap size={14} style={{ opacity: 0.3 }} />
                                </div>
                            ))}
                        </div>
                        <button className="btn-ghost" style={{ width: '100%', marginTop: 24, fontSize: 12, fontWeight: 700 }} onClick={() => navigate('/agenda')}>GESTIONAR AGENDA COMPLETA</button>
                    </div>

                    <div className="glass-panel stagger-8" style={{ background: 'var(--color-success)05', textAlign: 'center', padding: 32 }}>
                        <div className="icon-wrapper green" style={{ width: 48, height: 48, margin: '0 auto 16px' }}><Target size={24} /></div>
                        <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800 }}>Meta de Retención</h4>
                        <p className="text-muted" style={{ fontSize: 12, marginBottom: 20 }}>Mantener a los atletas comprometidos reduce el churn un 15%.</p>
                        <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                            <div style={{ width: '85%', height: '100%', background: 'var(--color-success)', boxShadow: '0 0 10px var(--color-success)' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 900, color: 'var(--color-success)' }}>85% COMPLETADO</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
