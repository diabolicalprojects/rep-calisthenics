import React, { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, Legend, Tooltip as RTooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import { Users, CreditCard, Activity, Package, TrendingUp, RefreshCw, Target, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import HelpTooltip from '../components/HelpTooltip';
import { fmtCurrency } from '../utils/formatters';

const COLORS = ['#f48c25', '#1fe074', '#ff4d4f', '#4da6ff', '#a78bfa'];
const DONUT_COLORS = { Activo: '#1fe074', Inactivo: '#ff4d4f' };

const ChartTip = ({ active, payload, label, prefix = '', suffix = '' }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#111', border: '1px solid #333', borderRadius: 12, padding: '12px 16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}>
            {label && <div style={{ color: '#888', marginBottom: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>}
            {payload.map((p, i) => (
                <div key={i} style={{ color: p.color || '#fff', fontSize: 14, fontWeight: 700 }}>
                    {p.name}: {prefix}{p.value}{suffix}
                </div>
            ))}
        </div>
    );
};

const StatCard = ({ label, value, color, icon: Icon, trend }) => (
    <div className="glass-panel" style={{ padding: 20, borderTop: `4px solid ${color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{label}</span>
            <div style={{ background: `${color}15`, padding: 8, borderRadius: 10, color }}>
                <Icon size={18} />
            </div>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#fff' }}>{value}</div>
        {trend && <div style={{ fontSize: 11, color: trend > 0 ? 'var(--color-success)' : 'var(--color-danger)', marginTop: 4 }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs mes anterior
        </div>}
    </div>
);

const Analytics = () => {
    const [loading, setLoading] = useState(true);
    const [statusData, setStatusData] = useState([]);
    const [planData, setPlanData] = useState([]);
    const [growthData, setGrowthData] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [kpi, setKpi] = useState({
        active: 0, total: 0, churn: 0, revenue: 0, txCount: 0, inventory: 0, critical: 0
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [members, payments, inventory] = await Promise.all([
                api.getMembers(),
                api.getPayments(),
                api.getInventory()
            ]);

            // Member KPI
            const activeCount = members.filter(m => m.status === 'Activo').length;
            const totalCount = members.length;
            const churnCount = members.filter(m => m.status === 'Activo' && (!m.last_visit || (new Date() - new Date(m.last_visit)) / 86400000 > 15)).length;

            setStatusData([
                { name: 'Activos', value: activeCount },
                { name: 'Inactivos', value: totalCount - activeCount }
            ]);

            const planMap = {};
            members.forEach(m => { if (m.plan) planMap[m.plan] = (planMap[m.plan] || 0) + 1; });
            setPlanData(Object.entries(planMap).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count));

            // Revenue KPI
            const paidPayments = payments.filter(p => p.status === 'Pagado');
            const totalRevenue = paidPayments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);

            // Inventory KPI
            const criticalCount = inventory.filter(p => (p.quantity || 0) < 5).length;

            setKpi({
                active: activeCount,
                total: totalCount,
                churn: churnCount,
                revenue: totalRevenue,
                txCount: paidPayments.length,
                inventory: inventory.length,
                critical: criticalCount
            });

            // Monthly charts (mock labels for structure)
            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
            setGrowthData(months.map(m => ({ month: m, altas: Math.floor(Math.random() * 20 + 5) })));
            setRevenueData(months.map(m => ({ month: m, ingresos: Math.floor(Math.random() * 5000 + 2000) })));

        } catch (err) {
            console.error('Analytics Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
                <RefreshCw size={32} className="text-orange" style={{ animation: 'spin 2s linear infinite' }} />
                <p className="text-muted">Calculando métricas del negocio...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <header className="page-header stagger-1 flex-responsive">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h1 className="page-title">Centro de Analítica</h1>
                        <HelpTooltip title="Métricas" content="Visión estratégica del negocio. Monitorea el crecimiento, retención y salud financiera en tiempo real." />
                    </div>
                    <p className="page-subtitle text-muted">Dashboard ejecutivo de rendimiento</p>
                </div>
                <button className="btn-ghost" onClick={fetchData}>
                    <RefreshCw size={16} /> Actualizar
                </button>
            </header>

            <div className="responsive-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(180px, 45%, 280px), 1fr))', gap: 16, marginTop: 32 }}>
                <StatCard label="Miembros Activos" value={kpi.active} color="var(--color-success)" icon={Users} trend={12} />
                <StatCard label="Ingresos Totales" value={fmtCurrency(kpi.revenue)} color="var(--color-accent-orange)" icon={CreditCard} trend={5} />
                <StatCard label="Riesgo Retención" value={kpi.churn} color="var(--color-danger)" icon={AlertCircle} />
                <StatCard label="Ventas Realizadas" value={kpi.txCount} color="#4da6ff" icon={Activity} />
                <StatCard label="Stock Crítico" value={kpi.critical} color="var(--color-danger)" icon={Package} />
            </div>

            <div className="responsive-grid" style={{ gap: 24, marginTop: 24 }}>
                {/* COMUNIDAD DONUT */}
                <div className="glass-panel" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Users size={18} className="text-orange" /> Composición de Comunidad
                    </h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie data={statusData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value">
                                {statusData.map((entry, i) => (
                                    <Cell key={i} fill={Object.values(DONUT_COLORS)[i] || COLORS[i]} />
                                ))}
                            </Pie>
                            <RTooltip content={<ChartTip />} />
                            <Legend iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* CRECIMIENTO AREA */}
                <div className="glass-panel" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TrendingUp size={18} className="text-orange" /> Crecimiento (Nuevas Altas)
                    </h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={growthData}>
                            <defs>
                                <linearGradient id="colorAltas" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-accent-orange)" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="var(--color-accent-orange)" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} />
                            <RTooltip content={<ChartTip suffix=" altas" />} />
                            <Area type="monotone" dataKey="altas" stroke="var(--color-accent-orange)" fillOpacity={1} fill="url(#colorAltas)" strokeWidth={3} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* PLANES BAR */}
                <div className="glass-panel" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Target size={18} className="text-orange" /> Preferencia de Planes
                    </h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={planData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#aaa', fontSize: 12}} width={90} />
                            <RTooltip content={<ChartTip suffix=" atletas" />} />
                            <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                {planData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* INGRESOS BAR */}
                <div className="glass-panel" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CreditCard size={18} className="text-success" /> Proyección de Ingresos
                    </h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} />
                            <RTooltip content={<ChartTip prefix="$" />} />
                            <Bar dataKey="ingresos" fill="var(--color-success)" radius={[6, 6, 0, 0]} fillOpacity={0.8} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
