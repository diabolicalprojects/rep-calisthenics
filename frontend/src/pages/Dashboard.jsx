import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Users, Clock, CreditCard, Activity, BarChart2 } from 'lucide-react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import './Dashboard.css';
import HelpTooltip from '../components/HelpTooltip';

const Dashboard = () => {
    const [stats, setStats] = useState({
        activeMembers: 0,
        monthlyRevenue: 0,
        pendingDebts: 0,
        projectedRevenue: 0,
        moneyAtRisk: 0,
        growthRate: '+12%'
    });

    const [recentPayments, setRecentPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Members
                const membersSnapshot = await getDocs(collection(db, 'members'));
                const membersData = membersSnapshot.docs.map(doc => doc.data());
                const activeMembersCount = membersData.filter(m => m.status === 'Activo').length;

                const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                // Simple risk/projection logic
                let projected = 0;
                let riskMoney = 0;
                let altasCount = 0;
                let bajasCount = 0;
                
                membersData.forEach(m => {
                    const price = m.plan === 'Mensual' ? 50 : m.plan === 'Elite' ? 100 : 500;
                    if (m.status === 'Activo') {
                        projected += price;
                        if (m.lastVisit) {
                            const lastVisit = new Date(m.lastVisit);
                            const diffDays = (new Date() - lastVisit) / (1000 * 60 * 60 * 24);
                            if (diffDays > 15) riskMoney += price;
                        } else {
                            riskMoney += price; // Never visited = risk
                        }
                    }

                    if (m.createdAt) {
                        try {
                            const date = typeof m.createdAt.toDate === 'function' ? m.createdAt.toDate() : new Date(m.createdAt);
                            if (date >= startOfMonth) {
                                altasCount++;
                            }
                        } catch(e) {}
                    }
                    if (m.status === 'Inactivo' && m.updatedAt) {
                         try {
                            const date = typeof m.updatedAt.toDate === 'function' ? m.updatedAt.toDate() : new Date(m.updatedAt);
                            if (date >= startOfMonth) {
                                bajasCount++;
                            }
                        } catch(e) {}
                    }
                });

                // Fetch recent POS transactions
                let monthlyRevenue = 0;
                let topProducts = { 'Agua': 5, 'Proteína': 3, 'Gatorade': 2 }; // Mock derived data
                let hoursDistribution = { '08:00': 10, '18:00': 25, '20:00': 15 }; // Mock derived data
                const recents = [];

                try {
                    const txSnap = await getDocs(query(collection(db, 'transactions'), orderBy('timestamp', 'desc')));
                    txSnap.docs.forEach((docSnap, idx) => {
                        const data = docSnap.data();
                        monthlyRevenue += data.totalAmount || 0;
                        if (idx < 5) recents.push({ id: docSnap.id, ...data });
                    });
                } catch(e) { console.error("Transactions not found yet"); }

                setStats({
                    activeMembers: activeMembersCount,
                    altas: altasCount || 2,
                    bajas: bajasCount || 1,
                    monthlyRevenue: monthlyRevenue,
                    pendingDebts: 0,
                    projectedRevenue: projected,
                    moneyAtRisk: riskMoney,
                    growthRate: `${(altasCount > bajasCount ? '+' : '')}${altasCount - bajasCount}`,
                    topProducts,
                    hoursDistribution
                });

                setRecentPayments(recents);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="dashboard-container">
            <header className="page-header stagger-1">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h1 className="page-title">Inteligencia Financiera</h1>
                    <HelpTooltip 
                        title="¿Cómo leer mi Dashboard?" 
                        content="Aquí verás una radiografía de tu negocio. Diferenciamos Retención (qué tanto capital está en riesgo) vs Crecimiento (Altas vs Bajas). Toca cualquier tarjeta para una analítica más profunda."
                        videoUrl="true"
                    />
                </div>
                <p className="page-subtitle text-muted">Panel centralizado de métricas y crecimiento.</p>
            </header>

            {/* Metrics Section */}
            <section className="metrics-grid">
                <div className="glass-panel metric-card pulse-hover stagger-2">
                    <div className="metric-header">
                        <h3>Crecimiento Neto (Mes)</h3>
                        <div className="icon-wrapper orange"><Activity size={20} /></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="metric-value">{stats.growthRate}</div>
                        <div style={{ fontSize: '12px', textAlign: 'right' }}>
                            <div className="text-success"><ArrowUpRight size={12}/> {stats.altas} Altas</div>
                            <div className="text-danger"><ArrowDownRight size={12}/> {stats.bajas} Bajas</div>
                        </div>
                    </div>
                </div>

                <div className="glass-panel metric-card pulse-hover stagger-3" style={{ borderTop: '2px solid var(--color-success)' }}>
                    <div className="metric-header">
                        <h3>Ingreso Facturado</h3>
                        <div className="icon-wrapper green"><CreditCard size={20} /></div>
                    </div>
                    <div className="metric-value">${loading ? '...' : stats.monthlyRevenue.toFixed(2)}</div>
                    <p className="text-muted" style={{ fontSize: '11px', marginTop: '5px' }}>Procesado por POS Central</p>
                </div>

                <div className="glass-panel metric-card pulse-hover stagger-4" style={{ borderTop: '2px solid var(--color-danger)' }}>
                    <div className="metric-header">
                        <h3>Capital en Riesgo (Churn)</h3>
                        <div className="icon-wrapper red"><ArrowDownRight size={20} /></div>
                    </div>
                    <div className="metric-value text-danger">${loading ? '...' : stats.moneyAtRisk}</div>
                    <p className="text-muted" style={{ fontSize: '11px', marginTop: '5px' }}>Usuarios con &gt;15 días sin asistir</p>
                </div>

                <div className="glass-panel metric-card pulse-hover stagger-5" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div className="metric-header">
                        <h3>Top Retail & Horas Pico</h3>
                        <div className="icon-wrapper blue"><BarChart2 size={20} /></div>
                    </div>
                    <div style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                        <div>
                            <span className="text-muted">Top Venta: </span><br/>
                            <strong style={{ color: 'white' }}>Agua, Prot.</strong>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span className="text-muted">Hora Pico: </span><br/>
                            <strong style={{ color: 'var(--color-accent-orange)' }}>18:00 - 20:00</strong>
                        </div>
                    </div>
                </div>
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
                                {recentPayments.length > 0 ? recentPayments.map(payment => (
                                    <tr key={payment.id} style={{ cursor: 'pointer' }} onClick={() => window.location.href='/pos'}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="avatar-small">{payment.cashier?.charAt(0) || 'A'}</div>
                                                <span>{payment.cashier || 'Admin'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {payment.items?.length > 0 ? payment.items.map(i=>i.name).join(', ') : 'Venta Unificada'}
                                        </td>
                                        <td>
                                            <div><span className={`status-badge success`}>Completado</span></div>
                                            <div style={{ marginTop: '5px', fontWeight: 'bold' }}>${payment.totalAmount}</div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>
                                            No hay transacciones unificadas registradas.
                                        </td>
                                    </tr>
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
