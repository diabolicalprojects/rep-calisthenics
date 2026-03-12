import React, { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, Legend, Tooltip as RTooltip,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import { Users, CreditCard, Activity, Package, TrendingUp, RefreshCw, Calendar, Target } from 'lucide-react';
import { api } from '../services/api';
import HelpTooltip from '../components/HelpTooltip';

/* ─── shared palette ───────────────────────────── */
const C = ['#f48c25', '#1fe074', '#ff4d4f', '#4da6ff', '#a78bfa', '#fb923c'];
const DONUT_COLORS = { Activo: '#1fe074', Inactivo: '#ff4d4f' };

/* ─── custom tooltip ────────────────────────────── */
const ChartTip = ({ active, payload, label, prefix = '', suffix = '' }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
            {label && <div style={{ color: '#888', marginBottom: 4 }}>{label}</div>}
            {payload.map((p, i) => (
                <div key={i} style={{ color: p.color || '#fff' }}>
                    {p.name}: <strong>{prefix}{p.value}{suffix}</strong>
                </div>
            ))}
        </div>
    );
};

/* ─── section header ────────────────────────────── */
const SectionTitle = ({ icon: Icon, children }) => (
    <h3 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '1.8px', color: 'var(--color-text-muted)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={13} />{children}
    </h3>
);

/* ─── stat card (small) ─────────────────────────── */
const Stat = ({ label, value, color = 'var(--color-accent-orange)' }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</span>
        <span style={{ fontSize: 24, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
    </div>
);

/* ─── main component ────────────────────────────── */
const Analytics = () => {
    const [loading, setLoading] = useState(true);
    const [statusData, setStatusData] = useState([]);      // donut: Activo / Inactivo
    const [planData, setPlanData] = useState([]);           // bar: plans
    const [growthData, setGrowthData] = useState([]);       // area: monthly altas
    const [revenueData, setRevenueData] = useState([]);     // bar: revenue by month
    const [kpi, setKpi] = useState({
        active: 0, total: 0, churn: 0, revenue: 0,
        txCount: 0, inventory: 0, critical: 0, todayEvents: 0,
    });

    const load = async () => {
        setLoading(true);
        try {
            /* MEMBERS */
            const members = await api.getMembers();
            const active = members.filter(m => m.status === 'Activo').length;
            const total = members.length;

            // status donut
            const inactive = total - active;
            setStatusData([
                { name: 'Activos', value: active },
                { name: 'Inactivos', value: inactive },
            ]);

            // plan distribution bar
            const planMap = {};
            members.forEach(m => { if (m.plan) planMap[m.plan] = (planMap[m.plan] || 0) + 1; });
            setPlanData(Object.entries(planMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));

            // monthly growth (last 6 months from created_at)
            const now = new Date();
            const months = Array.from({ length: 6 }, (_, i) => {
                const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
                return { month: d.toLocaleString('es', { month: 'short' }), altas: 0 };
            });
            members.forEach(m => {
                const created = m.created_at ? new Date(m.created_at) : null;
                if (!created) return;
                const diff = (now.getMonth() + now.getFullYear() * 12) - (created.getMonth() + created.getFullYear() * 12);
                if (diff >= 0 && diff < 6) {
                    const idx = 5 - diff;
                    if (months[idx]) months[idx].altas += 1;
                }
            });
            setGrowthData(months);

            // churn risk
            let churn = 0;
            members.forEach(m => {
                if (m.status === 'Activo') {
                    if (!m.last_visit) churn++;
                    else if ((now - new Date(m.last_visit)) / 86400000 > 15) churn++;
                }
            });

            /* TRANSACTIONS */
            let revenue = 0, txCount = 0;
            const revByMonth = {};
            try {
                const transactions = await api.getTransactions();
                transactions.forEach(data => {
                    const amt = parseFloat(data.total_amount) || 0;
                    revenue += amt;
                    txCount++;
                    const ts = new Date(data.timestamp || Date.now());
                    const key = ts.toLocaleString('es', { month: 'short' });
                    revByMonth[key] = (revByMonth[key] || 0) + amt;
                });
            } catch (e) { }
            setRevenueData(months.map(m => ({ month: m.month, ingresos: revByMonth[m.month] || 0 })));

            /* INVENTORY */
            let invTotal = 0, critical = 0;
            try {
                const inventory = await api.getInventory();
                invTotal = inventory.length;
                inventory.forEach(item => { if ((item.quantity || 0) < 5) critical++; });
            } catch (e) { }

            /* AGENDA (Mocked for now as background doesn't have it yet) */
            let todayEvents = 0;
            /* try {
                const appointments = await api.getAppointments();
                const todayStr = now.toISOString().split('T')[0];
                todayEvents = appointments.filter(d => d.date === todayStr).length;
            } catch (e) { } */

            setKpi({ active, total, churn, revenue, txCount, inventory: invTotal, critical, todayEvents });
        } catch (err) {
            console.error('Analytics:', err);
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const sectionBox = { marginBottom: 36 };
    const panel = (extra = {}) => ({
        background: 'var(--color-glass)',
        border: '1px solid var(--color-glass-border)',
        borderRadius: 16,
        padding: '22px 24px',
        ...extra,
    });

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 14, color: 'var(--color-text-muted)' }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-accent-orange)' }} />
            <p style={{ fontSize: 14 }}>Cargando métricas del sistema…</p>
        </div>
    );

    return (
        <div className="animate-fade-in">
            {/* ── HEADER ──────────────────────────────────── */}
            <header className="page-header stagger-1" style={{ marginBottom: 32 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <h1 className="page-title">Centro de Métricas</h1>
                        <HelpTooltip
                            title="Centro de Métricas"
                            content="Vista consolidada de todo el sistema. Las gráficas muestran tendencias en tiempo real. Cada módulo tiene su propio acceso directo a su métrica."
                            videoUrl="true"
                        />
                    </div>
                    <p className="page-subtitle text-muted">Dashboard analítico en tiempo real</p>
                </div>
                <button className="btn-ghost" onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <RefreshCw size={14} /> Actualizar
                </button>
            </header>

            {/* ── KPI BAND ─────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14, marginBottom: 36 }}>
                {[
                    { label: 'Miembros Activos', value: kpi.active, color: 'var(--color-success)' },
                    { label: 'Total Comunidad', value: kpi.total, color: 'var(--color-text-main)' },
                    { label: 'Riesgo Churn', value: kpi.churn, color: 'var(--color-danger)' },
                    { label: 'Ingresos Tot.', value: `$${kpi.revenue.toFixed(0)}`, color: 'var(--color-accent-orange)' },
                    { label: 'Transacciones', value: kpi.txCount, color: '#4da6ff' },
                    { label: 'Citas Hoy', value: kpi.todayEvents, color: '#a78bfa' },
                    { label: 'Inventario', value: kpi.inventory, color: 'var(--color-text-muted)' },
                    { label: 'Stock Crítico', value: kpi.critical, color: 'var(--color-danger)' },
                ].map(k => (
                    <div key={k.label} style={{ ...panel(), borderTop: `2px solid ${k.color}` }}>
                        <Stat label={k.label} value={k.value} color={k.color} />
                    </div>
                ))}
            </div>

            {/* ── ROW 1: DONUT + GROWTH AREA ───────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: 20, ...sectionBox }}>

                {/* Donut: Estado de comunidad */}
                <div style={panel()}>
                    <SectionTitle icon={Users}>Comunidad</SectionTitle>
                    {statusData.every(d => d.value === 0) ? (
                        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>Sin datos aún</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                                    {statusData.map((entry, i) => (
                                        <Cell key={i} fill={Object.values(DONUT_COLORS)[i] || C[i]} />
                                    ))}
                                </Pie>
                                <RTooltip content={<ChartTip />} />
                                <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, color: 'var(--color-text-muted)' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                    {/* mini stats */}
                    <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 8 }}>
                        <Stat label="Activos" value={kpi.active} color="var(--color-success)" />
                        <Stat label="Inactivos" value={kpi.total - kpi.active} color="var(--color-danger)" />
                        <Stat label="Churn" value={kpi.churn} color="#f87171" />
                    </div>
                </div>

                {/* Area: crecimiento mensual */}
                <div style={panel()}>
                    <SectionTitle icon={TrendingUp}>Altas Mensuales (últimos 6 meses)</SectionTitle>
                    <ResponsiveContainer width="100%" height={270}>
                        <AreaChart data={growthData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f48c25" stopOpacity={0.35} />
                                    <stop offset="95%" stopColor="#f48c25" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <RTooltip content={<ChartTip suffix=" altas" />} />
                            <Area type="monotone" dataKey="altas" name="Nuevos" stroke="#f48c25" strokeWidth={2.5} fill="url(#ga)" dot={{ fill: '#f48c25', r: 4 }} activeDot={{ r: 6 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── ROW 2: BAR PLANS + BAR REVENUE ──────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, ...sectionBox }}>

                {/* Bar: distribución de planes */}
                <div style={panel()}>
                    <SectionTitle icon={Activity}>Distribución de Planes</SectionTitle>
                    {planData.length === 0 ? (
                        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>Sin datos</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={planData} layout="vertical" margin={{ left: 8, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                <XAxis type="number" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis type="category" dataKey="name" tick={{ fill: '#aaa', fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
                                <RTooltip content={<ChartTip suffix=" miembros" />} />
                                <Bar dataKey="count" name="Miembros" radius={[0, 6, 6, 0]}>
                                    {planData.map((_, i) => <Cell key={i} fill={C[i % C.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Bar: ingresos por mes */}
                <div style={panel()}>
                    <SectionTitle icon={CreditCard}>Ingresos por Mes</SectionTitle>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={revenueData} margin={{ top: 4, right: 10, left: -16, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#1fe074" stopOpacity={1} />
                                    <stop offset="100%" stopColor="#1fe074" stopOpacity={0.4} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <RTooltip content={<ChartTip prefix="$" />} />
                            <Bar dataKey="ingresos" name="Ingresos" fill="url(#gr)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── ROW 3: INVENTORY STATUS ──────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, ...sectionBox }}>
                {[
                    { label: 'Total Inventario', value: kpi.inventory, icon: Package, color: '#4da6ff', sub: 'artículos registrados' },
                    { label: 'Stock Crítico', value: kpi.critical, icon: Target, color: 'var(--color-danger)', sub: 'menos de 5 unidades' },
                    { label: 'Stock Saludable', value: kpi.inventory - kpi.critical, icon: Activity, color: 'var(--color-success)', sub: 'artículos disponibles' },
                ].map(k => (
                    <div key={k.label} style={{ ...panel(), display: 'flex', alignItems: 'center', gap: 18 }}>
                        <div style={{ background: `${k.color}22`, borderRadius: 12, padding: 12, flexShrink: 0 }}>
                            <k.icon size={22} color={k.color} />
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{k.label}</div>
                            <div style={{ fontSize: 28, fontWeight: 800, color: k.color, lineHeight: 1.1 }}>{k.value}</div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{k.sub}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Analytics;
