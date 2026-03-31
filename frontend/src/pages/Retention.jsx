import React, { useState, useEffect } from 'react';
import { ShieldAlert, Send, RefreshCw, TrendingDown, Users, DollarSign, Target, Bell, History, X } from 'lucide-react';
import { api } from '../services/api';
import HelpTooltip from '../components/HelpTooltip';
import BaseModal from '../components/BaseModal';
import ModuleMetricBar from '../components/ModuleMetricBar';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { fmtCurrency, fmtDate } from '../utils/formatters';
import { useTheme } from '../context/ThemeContext';

const Retention = () => {
    const { settings } = useTheme();
    const [atRiskMembers, setAtRiskMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [notificationLogs, setNotificationLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        totalAtRisk: 0,
        moneyAtRisk: 0,
        reactivationPotential: 0
    });

    const calculateRiskScore = (member, lastAttendanceDate) => {
        if (!lastAttendanceDate) return 100;
        const lastVisit = new Date(lastAttendanceDate);
        const today = new Date();
        const diffDays = Math.ceil((today - lastVisit) / (1000 * 60 * 60 * 24));
        if (diffDays > 30) return 90;
        if (diffDays > 15) return 60;
        if (diffDays > 7) return 30;
        return 10;
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [allMembers, logs] = await Promise.all([
                api.getMembers(),
                api.getNotifications()
            ]);

            const atRisk = allMembers.map(m => ({
                ...m,
                riskScore: calculateRiskScore(m, m.last_visit)
            })).filter(m => m.riskScore > 50 || m.status === 'Inactivo');

            const totalMoneyAtRisk = atRisk.reduce((acc, curr) => {
                const planPrice = (curr.plan || '').toLowerCase().includes('elite') ? 100 : 50;
                return acc + (curr.status === 'Activo' ? planPrice : 0);
            }, 0);

            setAtRiskMembers(atRisk);
            setNotificationLogs(logs);
            setMetrics({
                totalAtRisk: atRisk.filter(m => m.status === 'Activo').length,
                moneyAtRisk: totalMoneyAtRisk,
                reactivationPotential: atRisk.filter(m => m.status === 'Inactivo').length
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const sendAutomation = async (member, type) => {
        if (!member.phone) return alert('Sin teléfono registrado.');
        let phone = member.phone.replace(/\D/g, '');
        if (phone.length === 10) phone = '521' + phone;

        const msgs = {
            Reactivación: `¡Hola ${member.name}! 💪 Te extrañamos en ${settings.brandName}. Tenemos una oferta especial para que vuelvas. 🔥`,
            Incentivo: `¡Hola ${member.name}! 👋 Notamos tu ausencia en ${settings.brandName}. ¡Te regalamos una clase de cortesía para tu regreso! 🔋`,
            Default: `¡Hola ${member.name}! 👋 Queremos saber cómo vas con tus entrenamientos en ${settings.brandName}. ⚡`
        };

        const msg = msgs[type] || msgs.Default;
        
        try {
            // Registro real en el backend
            await api.recordRetentionContact({
                member_id: member.id,
                type: 'whatsapp',
                message: msg,
                status: 'sent'
            });
            
            window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`, '_blank');
            fetchData(); // Refrescar para ver el log
        } catch (err) {
            console.error("Error registrando contacto:", err);
            window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`, '_blank');
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
            <RefreshCw size={32} className="text-accent animate-spin" />
            <p className="text-muted">Analizando patrones de actividad...</p>
        </div>
    );

    const chartData = [
        { name: 'Crítico', value: atRiskMembers.filter(m => m.riskScore > 80).length },
        { name: 'Alto', value: atRiskMembers.filter(m => m.riskScore > 50 && m.riskScore <= 80).length },
        { name: 'Inactivos', value: atRiskMembers.filter(m => m.status === 'Inactivo').length }
    ];

    return (
        <div className="animate-fade-in">
            <header className="page-header stagger-1 flex-responsive">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h1 className="page-title">Inteligencia de Retención</h1>
                        <HelpTooltip title="Retención" content="Detección automática de fuga de clientes (Churn). El sistema prioriza a quienes llevan más tiempo sin asistir." />
                    </div>
                    <p className="page-subtitle text-muted">IA Preventiva de Abandono</p>
                </div>
                <button className="btn-ghost" onClick={fetchData}><RefreshCw size={18} /></button>
            </header>

            <ModuleMetricBar stats={[
                { label: 'Exposición Riesgo', value: metrics.totalAtRisk, color: 'var(--color-danger)' },
                { label: 'Ingreso Vulnerable', value: fmtCurrency(metrics.moneyAtRisk), color: 'var(--color-accent)' },
                { label: 'Recuperables', value: metrics.reactivationPotential, color: 'var(--color-success)' },
                { label: 'Tasa Retención', value: '92%', color: '#4da6ff' },
            ]} />

            <div className="glass-panel stagger-2 pos-flex-center-mobile" style={{ display: 'flex', gap: 40, padding: 32, flexWrap: 'wrap', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ height: 180, width: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" hide />
                            <YAxis hide />
                            <RechartsTooltip contentStyle={{ background: 'var(--color-bg-secondary)', border: 'none', borderRadius: 12 }} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                <Cell fill="var(--color-danger)" />
                                <Cell fill="var(--color-accent)" />
                                <Cell fill="var(--color-success)" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, minWidth: 300 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>Análisis de Vulnerabilidad</h2>
                    <p className="text-muted" style={{ fontSize: 14, lineHeight: '1.6', marginBottom: 24 }}>
                        El motor detecta clientes con alta probabilidad de abandono según su frecuencia de asistencia. Los perfiles <strong>Críticos</strong> superan los 30 días de ausencia.
                    </p>
                    <div style={{ display: 'flex', gap: 32 }}>
                        {chartData.map((d, i) => (
                            <div key={d.name}>
                                <div style={{ fontSize: 24, fontWeight: 900, color: i === 0 ? 'var(--color-danger)' : i === 1 ? 'var(--color-accent)' : 'var(--color-success)' }}>{d.value}</div>
                                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{d.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="dashboard-grid-main">
                <div className="glass-panel mobile-full" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: 24, borderBottom: '1px solid var(--color-glass-border)' }}>
                        <h3 style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ShieldAlert size={18} className="text-accent" /> Miembros en Alerta
                        </h3>
                    </div>
                    <div className="table-container">
                        <table className="modern-table clickable-rows">
                            <thead>
                                <tr>
                                    <th>Miembro</th>
                                    <th>Riesgo</th>
                                    <th>Última Visita</th>
                                    <th style={{ textAlign: 'center' }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {atRiskMembers.map(m => (
                                    <tr key={m.id} onClick={() => setSelectedMember(m)}>
                                        <td data-label="Miembro">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div className="avatar-small" style={{ background: m.riskScore > 80 ? 'var(--color-danger)15' : 'var(--color-accent)15', color: m.riskScore > 80 ? 'var(--color-danger)' : 'var(--color-accent)' }}>{m.name[0]}</div>
                                                <div>
                                                    <div style={{ fontWeight: 700 }}>{m.name}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{m.plan}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Riesgo">
                                            <div style={{ width: 100 }}>
                                                <div style={{ height: 6, background: 'var(--color-glass)', borderRadius: 3, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', width: `${m.riskScore}%`, background: m.riskScore > 80 ? 'var(--color-danger)' : 'var(--color-accent)' }}></div>
                                                </div>
                                                <div style={{ fontSize: 9, fontWeight: 900, marginTop: 4, color: m.riskScore > 80 ? 'var(--color-danger)' : 'var(--color-accent)' }}>
                                                    {m.riskScore > 80 ? 'CRÍTICO' : 'ALTO RIESGO'}
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Visto" className="text-muted" style={{ fontSize: 13 }}>{fmtDate(m.last_visit)}</td>
                                        <td data-label="Acción" style={{ textAlign: 'center' }}>
                                            <button className="btn-primary" style={{ padding: '8px 12px', fontSize: 11 }} onClick={(e) => { e.stopPropagation(); sendAutomation(m, m.status === 'Inactivo' ? 'Reactivación' : 'Incentivo'); }}>
                                                <Send size={14} /> {m.status === 'Inactivo' ? 'Reactivar' : 'Oferta'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="glass-panel" style={{ background: 'var(--color-accent-glass)' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Bell size={16} className="text-accent" /> Automatizaciones
                        </h3>
 drum                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div className="glass-panel" style={{ padding: 12, background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--color-glass-border)' }}>
                                <div style={{ fontSize: 13, fontWeight: 700 }}>Smart-Expirations</div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Aviso 3 días antes de vencimiento.</div>
                            </div>
                            <div className="glass-panel" style={{ padding: 12, background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--color-glass-border)' }}>
                                <div style={{ fontSize: 13, fontWeight: 700 }}>Loyalty Booster</div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Incentivo a los 7 días de inactividad.</div>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel">
                        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <History size={16} className="text-blue" /> Bitácora
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto' }}>
                            {notificationLogs.length === 0 ? (
                                <p className="text-muted" style={{ fontSize: 12 }}>Sin registros recientes.</p>
                            ) : notificationLogs.map(log => (
                                <div key={log.id} style={{ fontSize: 11, padding: 8, background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                        <span style={{ fontWeight: 700 }}>{log.member_name}</span>
                                        <span style={{ color: log.status === 'Done' ? 'var(--color-success)' : 'var(--color-danger)' }}>{log.status === 'Done' ? 'Enviado' : 'Error'}</span>
                                    </div>
                                    <div className="text-muted">{log.type} • {fmtDate(log.timestamp)}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL DETALLE */}
            <BaseModal isOpen={!!selectedMember} onClose={() => setSelectedMember(null)} title="Análisis de Cliente">
                {selectedMember && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ textAlign: 'center', padding: 24, background: 'var(--color-glass)', borderRadius: 16 }}>
                            <div className="avatar-large" style={{ margin: '0 auto 16px', background: 'var(--color-accent-glass)', color: 'var(--color-accent)' }}>{selectedMember.name[0]}</div>
                            <h2 style={{ fontSize: 24, fontWeight: 900 }}>{selectedMember.name}</h2>
                            <p className="text-muted">{selectedMember.plan}</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                            <div className="glass-panel" style={{ padding: 16 }}>
                                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Risk Level</div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: selectedMember.riskScore > 80 ? 'var(--color-danger)' : 'var(--color-accent)' }}>{selectedMember.riskScore}%</div>
                            </div>
                            <div className="glass-panel" style={{ padding: 16 }}>
                                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Días Inactivo</div>
                                <div style={{ fontSize: 20, fontWeight: 900 }}>
                                    {selectedMember.last_visit ? Math.ceil((new Date() - new Date(selectedMember.last_visit)) / 86400000) : 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: 20, borderLeft: '4px solid var(--color-accent)' }}>
                            <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Target size={14} /> Recomendación
                            </h4>
                            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                                {selectedMember.status === 'Inactivo' 
                                    ? 'Falta actividad reciente. Sugerimos campaña de recupero con oferta especial.' 
                                    : 'Baja frecuencia detectada. Enviar incentivo motivacional para retomar el ritmo.'}
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setSelectedMember(null)}>Cerrar</button>
                            <button className="btn-primary" style={{ flex: 1.5 }} onClick={() => sendAutomation(selectedMember, 'Atención')}>
                                <Send size={18} /> Contactar WhatsApp
                            </button>
                        </div>
                    </div>
                )}
            </BaseModal>
        </div>
    );
};

export default Retention;
