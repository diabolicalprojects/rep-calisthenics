import React, { useState, useEffect } from 'react';
import { ShieldAlert, Send, RefreshCw, TrendingDown, Users, DollarSign } from 'lucide-react';
import { api } from '../services/api';
import HelpTooltip from '../components/HelpTooltip';
import ModuleMetricBar from '../components/ModuleMetricBar';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Cell } from 'recharts';

const Retention = () => {
    const [atRiskMembers, setAtRiskMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [metrics, setMetrics] = useState({
        totalAtRisk: 0,
        moneyAtRisk: 0,
        reactivationPotential: 0
    });
    const [loading, setLoading] = useState(true);
    const [notificationLogs, setNotificationLogs] = useState([]);

    const calculateRiskScore = (member, lastAttendanceDate) => {
        if (!lastAttendanceDate) return 100; // High risk if never attended
        const lastVisit = new Date(lastAttendanceDate);
        const today = new Date();
        const diffDays = Math.ceil((today - lastVisit) / (1000 * 60 * 60 * 24));

        if (diffDays > 30) return 90; // Critical
        if (diffDays > 15) return 60; // Warning
        if (diffDays > 7) return 30;  // Normal
        return 10; // Safe
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const allMembers = await api.getMembers();

            const atRisk = allMembers.map(m => {
                const score = calculateRiskScore(m, m.last_visit);
                return { ...m, riskScore: score };
            }).filter(m => m.riskScore > 50 || m.status === 'Inactivo');

            const totalMoneyAtRisk = atRisk.reduce((acc, curr) => {
                const planPrice = curr.plan === 'Mensual' ? 50 : curr.plan === 'Elite' ? 100 : 500;
                return acc + (curr.status === 'active' || curr.status === 'Activo' ? planPrice : 0);
            }, 0);

            setAtRiskMembers(atRisk);
            setMetrics({
                totalAtRisk: atRisk.filter(m => m.status === 'active' || m.status === 'Activo').length,
                moneyAtRisk: totalMoneyAtRisk,
                reactivationPotential: atRisk.filter(m => m.status === 'Inactivo' || m.status === 'inactive').length
            });

            // Fetch Notification Logs
            const logs = await api.getNotifications();
            setNotificationLogs(logs);
        } catch (error) {
            console.error("Error fetching retention data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRowClick = (member) => {
        if (window.innerWidth <= 768) {
            setSelectedMember(member);
        }
    };

    const sendAutomation = (member, type) => {
        if (!member.phone) {
            alert('El cliente no tiene un número de teléfono registrado.');
            return;
        }

        // Limpiar el número de teléfono
        let cleanPhone = member.phone.replace(/\D/g, '');

        // Formateo para México (52 + 1 + número) si detectamos número de 10 dígitos
        if (cleanPhone.length === 10) {
            cleanPhone = '521' + cleanPhone;
        }

        let message = '';
        if (type === 'Reactivación') {
            message = `¡Hola ${member.name}! 💪 Te extrañamos en REP Calisthenics. Tenemos una oferta especial para que vuelvas a entrenar con nosotros. ¡Pregúntanos por la promo de reactivación! ⚡`;
        } else {
            message = `¡Hola ${member.name}! 👋 Notamos que has estado un poco ausente. ¡Queremos motivarte a seguir dándole duro! Te regalamos una clase de cortesía para tu próxima visita. Prepárate para el entrenamiento 🔋`;
        }

        // Usar api.whatsapp.com para mayor compatibilidad con mensajes largos y emojis
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="animate-fade-in dashboard-container">
            <header className="page-header" style={{ marginBottom: '32px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <h1 className="page-title">Inteligencia de Retención</h1>
                        <HelpTooltip 
                            title="Motor Anti-Churn" 
                            content="El sistema calcula automáticamente el nivel de riesgo de cada atleta basado en sus días de inactividad. Con un clic puedes enviar mensajes de reactivación por WhatsApp."
                        />
                    </div>
                    <p className="page-subtitle text-muted">IA para detectar clientes en riesgo y automatizar reactivaciones</p>
                </div>
            </header>

            <ModuleMetricBar stats={[
                { label: 'Clientes en Riesgo', value: metrics.totalAtRisk, color: 'var(--color-danger)' },
                { label: 'Ingreso Vulnerable', value: `$${metrics.moneyAtRisk}`, color: 'var(--color-accent-orange)' },
                { label: 'Recuperables', value: metrics.reactivationPotential, color: 'var(--color-success)' },
                { label: 'Tasa Retención', value: '92%', color: '#4da6ff' },
            ]} />

            {/* RISK ANALYSIS CHART */}
            <div className="glass-panel" style={{ marginBottom: 32, padding: 24, display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ height: 180, width: 300, flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                            { name: 'Crítico', value: atRiskMembers.filter(m => m.riskScore > 80).length },
                            { name: 'Alto', value: atRiskMembers.filter(m => m.riskScore > 50 && m.riskScore <= 80).length },
                            { name: 'Inactivos', value: atRiskMembers.filter(m => m.status === 'Inactivo').length }
                        ]}>
                            <XAxis dataKey="name" hide />
                            <YAxis hide />
                            <RechartsTooltip 
                                contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-glass-border)', borderRadius: 12 }} 
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                { [0,1,2].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--color-danger)' : index === 1 ? 'var(--color-accent-orange)' : 'var(--color-success)'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <h3 style={{ marginBottom: 8, fontSize: 16 }}>Análisis de Vulnerabilidad</h3>
                    <p className="text-muted" style={{ fontSize: 13, maxWidth: 500 }}>
                        El motor de inteligencia detecta patrones de abandono basados en la frecuencia de asistencia. Los clientes en "Crítico" no han asistido en más de 30 días.
                    </p>
                    <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
                         <div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-danger)' }}>{atRiskMembers.filter(m => m.riskScore > 80).length}</div>
                            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Críticos</div>
                         </div>
                         <div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-accent-orange)' }}>{atRiskMembers.filter(m => m.riskScore > 50 && m.riskScore <= 80).length}</div>
                            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Alto Riesgo</div>
                         </div>
                         <div>
                            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-success)' }}>{atRiskMembers.filter(m => m.status === 'Inactivo').length}</div>
                            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Inactivos</div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="metrics-grid" style={{ marginBottom: '32px' }}>
                <div className="glass-panel metric-card pulse-hover" style={{ borderLeft: '4px solid var(--color-danger)' }}>
                    <div className="metric-header">
                        <h3>Clientes en Riesgo</h3>
                        <div className="icon-wrapper red"><ShieldAlert size={20} /></div>
                    </div>
                    <div className="metric-value">{metrics.totalAtRisk}</div>
                    <p className="text-muted" style={{ fontSize: '11px', marginTop: '5px' }}>Inactividad &gt; 15 días</p>
                </div>

                <div className="glass-panel metric-card pulse-hover" style={{ borderLeft: '4px solid var(--color-accent-orange)' }}>
                    <div className="metric-header">
                        <h3>Dinero en Riesgo</h3>
                        <div className="icon-wrapper orange"><DollarSign size={20} /></div>
                    </div>
                    <div className="metric-value">${metrics.moneyAtRisk}</div>
                    <p className="text-muted" style={{ fontSize: '11px', marginTop: '5px' }}>Valor total en riesgo de churn</p>
                </div>

                <div className="glass-panel metric-card pulse-hover" style={{ borderLeft: '4px solid var(--color-success)' }}>
                    <div className="metric-header">
                        <h3>Potencial de Reactivación</h3>
                        <div className="icon-wrapper green"><RefreshCw size={20} /></div>
                    </div>
                    <div className="metric-value">{metrics.reactivationPotential}</div>
                    <p className="text-muted" style={{ fontSize: '11px', marginTop: '5px' }}>Ex-miembros recuperables</p>
                </div>
            </div>

            <div className="dashboard-content">
                {/* At Risk List */}
                <div className="glass-panel mobile-full" style={{ padding: '0' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--color-glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '18px' }}>Clientes a Priorizar</h2>
                        <button className="btn-ghost" onClick={fetchData} style={{ padding: '8px' }}><RefreshCw size={16} /></button>
                    </div>
                    <div className="table-container">
                        <table className="modern-table clickable-rows">
                            <thead>
                                <tr>
                                    <th>Miembro</th>
                                    <th>Nivel de Riesgo</th>
                                    <th>Última Visita</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {atRiskMembers.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>No hay alertas de riesgo</td></tr>
                                ) : atRiskMembers.map(member => (
                                    <tr key={member.id} onClick={() => handleRowClick(member)}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="avatar-small" style={{ background: member.riskScore > 80 ? 'rgba(255, 77, 79, 0.2)' : 'rgba(244, 140, 37, 0.2)', color: member.riskScore > 80 ? 'var(--color-danger)' : 'var(--color-accent-orange)' }}>
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <span style={{ fontWeight: '500', display: 'block' }}>{member.name}</span>
                                                    <span className="text-muted" style={{ fontSize: '11px' }}>{member.plan}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ minWidth: '100px' }}>
                                                <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '10px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        width: `${member.riskScore}%`,
                                                        background: member.riskScore > 80 ? 'var(--color-danger)' : 'var(--color-accent-orange)',
                                                        height: '100%'
                                                    }}></div>
                                                </div>
                                                <span style={{ fontSize: '11px', color: member.riskScore > 80 ? 'var(--color-danger)' : 'var(--color-accent-orange)', fontWeight: '600', marginTop: '4px', display: 'block' }}>
                                                    {member.riskScore > 80 ? 'CRÍTICO' : 'ALTO RIESGO'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-muted" style={{ fontSize: '13px' }}>
                                            {member.last_visit ? new Date(member.last_visit).toLocaleDateString() : 'Sin registros'}
                                        </td>
                                        <td>
                                            <button
                                                className="btn-primary"
                                                style={{ padding: '8px 16px', fontSize: '12px', minWidth: '120px' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    sendAutomation(member, member.status === 'Inactivo' ? 'Reactivación' : 'Incentivo');
                                                }}
                                            >
                                                <Send size={14} /> <span>{member.status === 'Inactivo' ? 'Reactivar' : 'Oferta'}</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail Modal (Solo móvil) */}
                {selectedMember && (
                    <div className="modal-overlay">
                        <div className="glass-panel modal-content">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', alignItems: 'center' }}>
                                <h2 style={{ fontSize: '20px' }}>Análisis de Cliente</h2>
                                <button onClick={() => setSelectedMember(null)} className="btn-ghost" style={{ padding: '5px' }}>
                                    <ShieldAlert size={20} />
                                </button>
                            </div>

                            <div className="detail-card">
                                <div className="detail-item">
                                    <span className="detail-label">Nombre del Atleta</span>
                                    <span className="detail-value">{selectedMember.name}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Nivel de Alerta</span>
                                    <span className="detail-value" style={{ color: selectedMember.riskScore > 80 ? 'var(--color-danger)' : 'var(--color-accent-orange)' }}>
                                        {selectedMember.riskScore}% - {selectedMember.riskScore > 80 ? 'Crítico' : 'Alto'}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Última actividad</span>
                                    <span className="detail-value">{selectedMember.lastVisit ? new Date(selectedMember.lastVisit).toLocaleTimeString() + ' ' + new Date(selectedMember.lastVisit).toLocaleDateString() : 'Sin visitas registradas'}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Sugerencia de la IA</span>
                                    <span className="detail-value" style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
                                        {selectedMember.status === 'Inactivo'
                                            ? 'El cliente ha dejado de asistir. Se recomienda enviar una oferta de reactivación con descuento.'
                                            : 'Baja frecuencia detectada. Enviar recordatorio motivacional o clase de cortesía.'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
                                <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setSelectedMember(null)}>Cerrar</button>
                                <button className="btn-primary" style={{ flex: 2 }} onClick={() => sendAutomation(selectedMember, 'Atención')}>
                                    <Send size={16} /> Contactar WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sidebar info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="glass-panel" style={{ background: 'linear-gradient(135deg, rgba(244, 140, 37, 0.1) 0%, rgba(0,0,0,0) 100%)' }}>
                        <h3 style={{ marginBottom: '15px', color: 'var(--color-accent-orange)' }}>Automatizaciones</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.03)' }}>
                                <div style={{ fontWeight: '500', fontSize: '14px' }}>Vencimientos</div>
                                <div className="text-muted" style={{ fontSize: '12px' }}>Envío auto. 3 días antes.</div>
                            </div>
                            <div className="glass-panel" style={{ padding: '12px', background: 'rgba(255,255,255,0.03)' }}>
                                <div style={{ fontWeight: '500', fontSize: '14px' }}>Churn Prevention</div>
                                <div className="text-muted" style={{ fontSize: '12px' }}>Ofertas para rescatar ex-miembros.</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="glass-panel" style={{ marginTop: '20px' }}>
                        <h3 style={{ marginBottom: '15px', fontSize: '16px' }}>Bitácora de Eventos</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
                            {notificationLogs.length === 0 ? (
                                <p className="text-muted" style={{ fontSize: '12px' }}>No hay registros de notificaciones.</p>
                            ) : notificationLogs.map(log => (
                                <div key={log.id} style={{ padding: '10px', borderBottom: '1px solid var(--color-glass-border)', fontSize: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 'bold' }}>{log.member_name}</span>
                                        <span style={{ color: log.status === 'Error' ? 'var(--color-danger)' : 'var(--color-success)' }}>{log.status}</span>
                                    </div>
                                    <div style={{ color: 'var(--color-text-muted)' }}>{log.type} - {new Date(log.timestamp).toLocaleString()}</div>
                                    {log.error && <div style={{ color: 'var(--color-danger)', marginTop: '4px', fontSize: '11px', background: 'rgba(255, 77, 79, 0.05)', padding: '4px', borderRadius: '4px' }}>Error: {log.error}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Retention;
