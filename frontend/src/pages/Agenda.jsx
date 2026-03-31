import React, { useState, useEffect } from 'react';
import { 
    Calendar as CalendarIcon, Clock, User, X, Check, 
    Link as LinkIcon, MessageCircle, AlertCircle, 
    CalendarDays, Plus, Copy, Link2
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import HelpTooltip from '../components/HelpTooltip';
import BaseModal from '../components/BaseModal';
import SearchInput from '../components/SearchInput';
import { fmtDate } from '../utils/formatters';

const Agenda = () => {
    const { isAdmin } = useAuth();
    const { settings } = useTheme();
    const [appointments, setAppointments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showLinkModal, setShowLinkModal] = useState(null);
    const [allMembers, setAllMembers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ title: '', memberName: '', time: '10:00', duration: '1 hr' });
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [aptData, membersData] = await Promise.all([
                api.getAppointments(selectedDate),
                api.getMembers()
            ]);
            
            const parsedApts = aptData.map(apt => {
                let phone = null;
                let email = null;
                if (apt.notes) {
                    const phoneMatch = apt.notes.match(/Teléfono:\s*([^,]+)/);
                    const emailMatch = apt.notes.match(/Email:\s*(.+)/);
                    if (phoneMatch && phoneMatch[1] !== 'N/A') phone = phoneMatch[1].trim();
                    if (emailMatch && emailMatch[1] !== 'N/A') email = emailMatch[1].trim();
                }
                return { ...apt, phone, email };
            });

            setAppointments(parsedApts);
            setAllMembers(membersData);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [selectedDate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.addAppointment({ ...formData, date: selectedDate, status: 'Pendiente' });
            setShowModal(false);
            setFormData({ title: '', memberName: '', time: '10:00', duration: '1 hr' });
            fetchData();
        } catch (err) { alert('Error: ' + err.message); }
    };

    const handleLinkMember = async (aptId, member) => {
        try {
            await api.updateAppointment(aptId, { member_id: member.id, member_name: member.name });
            setShowLinkModal(null);
            fetchData();
        } catch (err) { alert('Error al vincular: ' + err.message); }
    };

    const updateStatus = async (id, status, apt = null) => {
        if (status === 'Cancelada' && apt?.phone) {
            if (window.confirm("¿Deseas enviar WhatsApp antes de cancelar?")) {
                const msg = `Hola ${apt.memberName}, sobre tu solicitud en ${settings.brandName}...`;
                window.open(`https://wa.me/${apt.phone}?text=${encodeURIComponent(msg)}`, '_blank');
            }
        }
        try {
            await api.updateAppointmentStatus(id, status);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const confirmedToday = appointments.filter(a => a.status === 'Confirmada');
    const allPending = appointments.filter(a => a.status === 'Pendiente');

    return (
        <div className="animate-fade-in">
            <header className="page-header stagger-1 flex-responsive">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h1 className="page-title">Agenda y Citas</h1>
                        <HelpTooltip title="Agenda" content="Gestiona solicitudes de clases y citas. Vincula prospectos a miembros existentes." />
                    </div>
                    <p className="page-subtitle text-muted">Control de solicitudes y asistencias</p>
                </div>
                <div className="flex-responsive" style={{ gap: 12, alignItems: 'center' }}>
                    <input type="date" className="form-input" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ width: 'auto', flex: 1 }} />
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button className="btn-ghost" onClick={() => {
                            navigator.clipboard.writeText(window.location.origin + '/reservar');
                            alert('Link copiado');
                        }} title="Link Público">
                            <Link2 size={18} />
                        </button>
                        <button className="btn-primary" onClick={() => setShowModal(true)}>
                            <Plus size={18} /> Agendar Cita
                        </button>
                    </div>
                </div>
            </header>

            <div className="dashboard-grid-main">
                {/* DAILY VIEW */}
                <div className="glass-panel" style={{ minHeight: 500 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                        <h2 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <CalendarDays size={20} className="text-success" /> Confirmadas: {fmtDate(selectedDate)}
                        </h2>
                        <span className="badge-status-active">{confirmedToday.length}</span>
                    </div>

                    {confirmedToday.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '100px 40px', opacity: 0.5 }}>
                            <Clock size={40} style={{ margin: '0 auto 16px' }} />
                            <p>No hay clases confirmadas para hoy.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {confirmedToday.map(apt => (
                                <div key={apt.id} className="glass-panel" style={{ padding: 20, borderLeft: '4px solid var(--color-success)', background: 'var(--color-success)08' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <Clock size={14} /> {apt.time} - {apt.title}
                                            </div>
                                            <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 4 }}>
                                                Miembro: <span style={{ color: '#fff' }}>{apt.memberName}</span>
                                                {apt.isLead && <span style={{ marginLeft: 8, fontSize: 10, background: 'var(--color-accent)', color: '#000', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold' }}>LEAD</span>}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {!apt.member_id && (
                                                <button className="btn-ghost" style={{ fontSize: 11, padding: '4px 8px' }} onClick={() => setShowLinkModal(apt)}>
                                                    <User size={14} /> Vincular
                                                </button>
                                            )}
                                            {apt.phone && (
                                                <button className="btn-ghost" style={{ padding: 6, color: '#25D366' }} onClick={() => window.open(`https://wa.me/${apt.phone}?text=${encodeURIComponent('Recordatorio de clase...')}`)}>
                                                    <MessageCircle size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* SIDEBAR: PENDING */}
                <div className="glass-panel" style={{ border: '1px solid var(--color-accent-glass)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-accent)' }}>
                            <AlertCircle size={18} /> Pendientes
                        </h3>
                        <span style={{ fontSize: 12, fontWeight: 800, background: 'var(--color-accent)', color: '#000', padding: '2px 8px', borderRadius: 10 }}>
                            {allPending.length}
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 'calc(100vh - 250px)', overflowY: 'auto', paddingRight: 4 }}>
                        {allPending.length === 0 ? (
                            <p className="text-muted" style={{ textAlign: 'center', fontSize: 12, padding: 20 }}>Sin solicitudes pendientes.</p>
                        ) : allPending.map(apt => (
                            <div key={apt.id} className="glass-panel" style={{ padding: 16, background: 'var(--color-accent-glass)', borderLeft: '4px solid var(--color-accent)' }}>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{apt.time} | {fmtDate(apt.date)}</div>
                                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{apt.title}</div>
                                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>{apt.memberName}</div>
                                
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn-primary" style={{ flex: 1, fontSize: 11, padding: '6px' }} onClick={() => updateStatus(apt.id, 'Confirmada')}>
                                        Confirmar
                                    </button>
                                    <button className="btn-ghost" style={{ flex: 1, fontSize: 11, padding: '6px', color: 'var(--color-text-muted)' }} onClick={() => updateStatus(apt.id, 'Cancelada', apt)}>
                                        X
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {showModal && (
                <BaseModal isOpen={showModal} onClose={() => setShowModal(false)} title="Nueva Cita / Clase">
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="form-group">
                            <label>Título / Actividad</label>
                            <input required className="form-input" placeholder="Ej. Clase muestra Calistenia" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                        </div>
                        <div className="form-group">
                            <label>Miembro / Lead</label>
                            <input required className="form-input" placeholder="Nombre completo" value={formData.memberName} onChange={e => setFormData({...formData, memberName: e.target.value})} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="form-group">
                                <label>Hora</label>
                                <input required type="time" className="form-input" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>Duración</label>
                                <select className="form-input" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})}>
                                    <option value="30 min">30 min</option>
                                    <option value="1 hr">1 hr</option>
                                    <option value="1.5 hr">1.5 hr</option>
                                    <option value="2 hr">2 hr</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="btn-primary">Agendar Ahora</button>
                    </form>
                </BaseModal>
            )}

            {showLinkModal && (
                <BaseModal isOpen={!!showLinkModal} onClose={() => setShowLinkModal(null)} title="Vincular a Miembro">
                    <div style={{ marginBottom: 20 }}>
                        <SearchInput placeholder="Buscar por nombre..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                        {allMembers
                            .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(m => (
                                <button key={m.id} className="btn-ghost" style={{ justifyContent: 'space-between', padding: 16, background: 'var(--color-glass)' }} onClick={() => handleLinkMember(showLinkModal.id, m)}>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{m.phone || 'Sin número'}</div>
                                    </div>
                                    <LinkIcon size={16} />
                                </button>
                            ))
                        }
                    </div>
                </BaseModal>
            )}
        </div>
    );
};

export default Agenda;
