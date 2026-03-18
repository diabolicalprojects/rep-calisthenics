import React, { useState, useEffect } from 'react';
import { UserCheck, Clock, Users, BarChart3, Search, Calendar, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import BaseModal from '../components/BaseModal';
import SearchInput from '../components/SearchInput';
import { fmtDate, fmtTime } from '../utils/formatters';

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
            const [membersData, visitsData] = await Promise.all([
                api.getMembers(),
                api.getVisits()
            ]);
            setMembers(membersData);
            setVisits(visitsData);
            
            const today = new Date().toISOString().split('T')[0];
            const todayCount = visitsData.filter(v => v.timestamp?.startsWith(today)).length;
            
            const counts = {};
            visitsData.forEach(v => {
                counts[v.member_name] = (counts[v.member_name] || 0) + 1;
            });
            const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

            setStats({
                today: todayCount,
                week: visitsData.length,
                topMember: top ? top[0] : 'N/A'
            });
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const registerVisit = async (member) => {
        if (member.status !== 'Activo') {
            if (!window.confirm(`⚠️ ESTADO: ${member.status.toUpperCase()}\n¿Permitir acceso de todos modos?`)) return;
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
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);

    return (
        <div className="animate-fade-in">
            <header className="page-header stagger-1 flex-responsive">
                <div>
                    <h1 className="page-title">Asistencia y Visitas</h1>
                    <p className="page-subtitle text-muted">Registro de ingresos de atletas en tiempo real</p>
                </div>
                <button className="btn-primary" onClick={() => setShowModal(true)}>
                    <UserCheck size={18} /> Registrar Registro
                </button>
            </header>

            <div className="metrics-grid responsive-grid" style={{ marginTop: 32, marginBottom: 32 }}>
                <div className="glass-panel metric-card">
                    <div className="metric-header">
                        <span className="text-muted">Visitas Hoy</span>
                        <div className="icon-wrapper orange"><Clock size={20} /></div>
                    </div>
                    <div className="metric-value">{stats.today}</div>
                </div>
                <div className="glass-panel metric-card">
                    <div className="metric-header">
                        <span className="text-muted">Total Reciente</span>
                        <div className="icon-wrapper blue"><BarChart3 size={20} /></div>
                    </div>
                    <div className="metric-value">{stats.week}</div>
                </div>
                <div className="glass-panel metric-card">
                    <div className="metric-header">
                        <span className="text-muted">Atleta más recurrente</span>
                        <div className="icon-wrapper green"><Users size={20} /></div>
                    </div>
                    <div className="metric-value" style={{ fontSize: 18, marginTop: 12 }}>{stats.topMember}</div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: 24, borderBottom: '1px solid var(--color-glass-border)' }}>
                    <h2 style={{ fontSize: 18 }}>Historial de Ingresos</h2>
                </div>
                <div className="table-container">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Atleta</th>
                                <th>Plan / Membresía</th>
                                <th>Fecha y Hora</th>
                                <th style={{ textAlign: 'right' }}>Acceso</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: 40 }}>Cargando...</td></tr>
                            ) : visits.length === 0 ? (
                                <tr><td colSpan="4" style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>No hay visitas registradas aún.</td></tr>
                            ) : visits.map(visit => (
                                <tr key={visit.id}>
                                    <td data-label="Atleta">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-accent-orange)15', color: 'var(--color-accent-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                                                {visit.member_name?.charAt(0)}
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{visit.member_name}</span>
                                        </div>
                                    </td>
                                    <td data-label="Plan"><span className="text-muted">{visit.plan || 'Plan Normal'}</span></td>
                                    <td data-label="Fecha/Hora">
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span>{fmtDate(visit.timestamp)}</span>
                                            <span style={{ fontSize: 11, color: 'var(--color-accent-orange)' }}>{fmtTime(visit.timestamp)}</span>
                                        </div>
                                    </td>
                                    <td data-label="Acceso" style={{ textAlign: 'right' }}>
                                        <span className="status-badge success">EXITOSO</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <BaseModal isOpen={showModal} onClose={() => setShowModal(false)} title="Registrar Entrada">
                    <div style={{ marginBottom: 20 }}>
                        <SearchInput 
                            autoFocus 
                            placeholder="Buscar miembro por nombre o correo..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto' }}>
                        {searchTerm && filteredMembers.map(member => (
                            <button
                                key={member.id}
                                className="glass-panel"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 16, padding: 16, width: '100%',
                                    textAlign: 'left', background: 'var(--color-glass)', cursor: 'pointer',
                                    border: '1px solid var(--color-glass-border)', transition: '0.2s'
                                }}
                                onClick={() => registerVisit(member)}
                            >
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-accent-orange)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                    {member.name.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: 16 }}>{member.name}</div>
                                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                        {member.plan} • <span style={{ color: member.status === 'Activo' ? 'var(--color-success)' : 'var(--color-danger)' }}>{member.status}</span>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-muted" />
                            </button>
                        ))}
                        {searchTerm && filteredMembers.length === 0 && (
                            <p style={{ textAlign: 'center', padding: 20, opacity: 0.5 }}>Sin resultados.</p>
                        )}
                    </div>
                </BaseModal>
            )}
        </div>
    );
};

export default Visits;
