import React, { useState, useEffect } from 'react';
import { UserCheck, Search, Calendar, Users, BarChart3, Clock, X } from 'lucide-react';
import { api } from '../services/api';

const Visits = () => {
    const [members, setMembers] = useState([]);
    const [visits, setVisits] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ today: 0, week: 0, topMember: 'N/A' });

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Members
            const membersData = await api.getMembers();
            setMembers(membersData);

            // Fetch Recent Visits (last 50 - assuming backend handles limit or we do it here)
            const visitsData = await api.getVisits(); 
            setVisits(visitsData);

            // Calculate Stats
            calculateStats(visitsData, membersData);
        } catch (err) {
            console.error('Error fetching visits data:', err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (visitsData, membersData) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayVisits = visitsData.filter(v => {
            const vDate = new Date(v.timestamp);
            return vDate >= today;
        }).length;

        // Simple Top Member logic (from the loaded 50 visits for simplicity)
        const counts = {};
        visitsData.forEach(v => {
            counts[v.memberName] = (counts[v.memberName] || 0) + 1;
        });
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

        setStats({
            today: todayVisits,
            week: visitsData.length, // Placeholder for simplicity
            topMember: top ? top[0] : 'N/A'
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const registerVisit = async (member) => {
        const isSuspended = member.status !== 'Activo';
        
        if (isSuspended) {
            if (!window.confirm(`⚠️ EL SOCIO ESTÁ ${member.status.toUpperCase()}\n\nFavor de solicitar pago o regularizar situación.\n\n¿Deseas permitir el acceso de todos modos?`)) {
                return;
            }
        }

        try {
            await api.recordVisit({
                memberId: member.id,
                memberName: member.name,
                plan: member.plan
            });
            setShowModal(false);
            setSearchTerm('');
            fetchData();
            
            // Success alert with distinct style
            const msg = isSuspended ? `⚠ Acceso MANUAL para ${member.name}` : `✅ Visita registrada: ${member.name}`;
            alert(msg);
        } catch (err) {
            console.error('Error registering visit:', err);
            alert('Error al registrar visita');
        }
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);

    return (
        <div className="animate-fade-in dashboard-container">
            <header className="page-header" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 className="page-title">Asistencia y Visitas</h1>
                    <p className="page-subtitle text-muted">Registro de entrada de atletas en tiempo real</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <UserCheck size={18} /> Registrar Entrada
                </button>
            </header>

            {/* Metrics Row */}
            <div className="metrics-grid" style={{ marginBottom: '32px' }}>
                <div className="glass-panel metric-card pulse-hover">
                    <div className="metric-header">
                        <h3>Visitas Hoy</h3>
                        <div className="icon-wrapper orange"><Clock size={20} /></div>
                    </div>
                    <div className="metric-value">{stats.today}</div>
                </div>
                <div className="glass-panel metric-card pulse-hover">
                    <div className="metric-header">
                        <h3>Actividad Reciente</h3>
                        <div className="icon-wrapper blue"><BarChart3 size={20} /></div>
                    </div>
                    <div className="metric-value">{stats.week}</div>
                    <p className="text-muted" style={{ fontSize: '12px' }}>Últimos registros</p>
                </div>
                <div className="glass-panel metric-card pulse-hover">
                    <div className="metric-header">
                        <h3>Atleta más frecuente</h3>
                        <div className="icon-wrapper green"><Users size={20} /></div>
                    </div>
                    <div className="metric-value" style={{ fontSize: '18px', marginTop: '10px' }}>{stats.topMember}</div>
                </div>
            </div>

            {/* Modal de Registro */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="glass-panel modal-content" style={{ maxWidth: '450px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px' }}>Registrar Entrada</h2>
                            <button onClick={() => setShowModal(false)} className="btn-ghost" style={{ padding: '5px' }}><X size={20} /></button>
                        </div>

                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label>Buscar Miembro</label>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                <input
                                    autoFocus
                                    type="text"
                                    className="form-input"
                                    style={{ paddingLeft: '40px' }}
                                    placeholder="Nombre o correo..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                            {searchTerm && filteredMembers.map(member => (
                                <button
                                    key={member.id}
                                    className="glass-panel pulse-hover"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        padding: '16px',
                                        width: '100%',
                                        textAlign: 'left',
                                        background: 'rgba(255,255,255,0.08)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => registerVisit(member)}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                                        e.currentTarget.style.borderColor = 'var(--color-accent-orange)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                                    }}
                                >
                                    <div className="avatar-small" style={{ background: 'var(--color-accent-orange)', color: 'white', border: 'none' }}>{member.name.charAt(0)}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '16px' }}>{member.name}</div>
                                        <div style={{ fontSize: '12px', color: '#cccccc' }}>{member.plan} • <span style={{ color: member.status === 'Activo' ? 'var(--color-success)' : 'var(--color-danger)' }}>{member.status}</span></div>
                                    </div>
                                    <div style={{ color: 'var(--color-accent-orange)', background: 'rgba(244, 140, 37, 0.1)', padding: '6px', borderRadius: '50%' }}>
                                        <UserCheck size={20} />
                                    </div>
                                </button>
                            ))}
                            {searchTerm && filteredMembers.length === 0 && (
                                <p style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>No se encontraron miembros.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* History Table */}
            <div className="glass-panel mobile-full" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--color-glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '18px' }}>Historial de Asistencia</h2>
                    <Clock size={16} className="text-muted" />
                </div>
                <div className="table-container">
                    <table className="modern-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Atleta</th>
                                <th>Membresía</th>
                                <th>Fecha y Hora</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visits.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No hay visitas registradas hoy.</td></tr>
                            ) : visits.map(visit => (
                                <tr key={visit.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="avatar-small" style={{ background: 'rgba(244, 140, 37, 0.1)', color: 'var(--color-accent-orange)' }}>{visit.memberName.charAt(0)}</div>
                                            <span style={{ fontWeight: '500' }}>{visit.memberName}</span>
                                        </div>
                                    </td>
                                    <td><span className="text-muted">{visit.plan}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span>{visit.timestamp ? new Date(visit.timestamp).toLocaleDateString() : '---'}</span>
                                            <span style={{ fontSize: '11px', color: 'var(--color-accent-orange)' }}>
                                                {visit.timestamp ? new Date(visit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="status-badge success">Presente</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Visits;
