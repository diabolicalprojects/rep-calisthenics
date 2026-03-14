import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, User, X, Check, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { api } from '../services/api';
import HelpTooltip from '../components/HelpTooltip';

const Agenda = () => {
    const [appointments, setAppointments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', memberName: '', time: '10:00', duration: '1 hr' });

    // Almacenamos la fecha como string YYYY-MM-DD para evitar problemas de zona horaria
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchAppointments = async () => {
        try {
            const data = await api.getAppointments(selectedDate);
            const parsedData = data.map(apt => {
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
            setAppointments(parsedData);
        } catch (err) { console.error('Error fetching appointments:', err); }
    };

    useEffect(() => {
        fetchAppointments();
    }, [selectedDate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.addAppointment({
                ...formData,
                date: selectedDate,
                status: 'Pendiente'
            });

            alert('¡Cita agendada con éxito! Revisa la sección de solicitudes pendientes.');
            setShowModal(false);
            setFormData({ title: '', memberName: '', time: '10:00', duration: '1 hr' });
            fetchAppointments();
        } catch (err) {
            console.error('Error saving appointment', err);
            alert('Hubo un error al guardar la cita. Inténtalo de nuevo.');
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.updateAppointmentStatus(id, status);
            fetchAppointments();
        } catch (err) { console.error('Error updating appointment status:', err); }
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>

            {showModal && (
                <div className="modal-overlay">
                    <div className="glass-panel modal-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2 style={{ fontSize: '20px' }}>Nueva Cita / Clase</h2>
                            <button onClick={() => setShowModal(false)} className="btn-ghost" style={{ padding: '5px' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="form-group">
                                <label>Título de la actividad</label>
                                <input required type="text" placeholder="ej. Clase Front Lever" className="form-input" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Atleta</label>
                                <input required type="text" placeholder="Nombre completo" className="form-input" value={formData.memberName} onChange={e => setFormData({ ...formData, memberName: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Hora</label>
                                <input required type="time" className="form-input" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Duración estimada</label>
                                <select className="form-input" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })}>
                                    <option value="30 min">30 min</option>
                                    <option value="1 hr">1 hr</option>
                                    <option value="2 hr">2 hr</option>
                                </select>
                            </div>
                            <button type="submit" className="btn-primary" style={{ marginTop: '10px', justifyContent: 'center' }}>Agendar Cita</button>
                        </form>
                    </div>
                </div>
            )}

            <div className="agenda-main" style={{ flex: '1.5', minWidth: '300px' }}>
                <header className="page-header" style={{ marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div className="page-header stagger-1">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <h1 className="page-title">Agenda y Control</h1>
                            <HelpTooltip
                                title="Motor de Crecimiento"
                                content="Aquí caen automáticamente los leads de tu link público /reservar. Manda recordatorios por WhatsApp con un clic. Confirma las asistencias para que se agreguen a tu CRM."
                            />
                        </div>
                        <p className="page-subtitle text-muted">Alineación diaria de clases</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                            type="date"
                            className="form-input"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            style={{ width: 'fit-content' }}
                        />
                        <button className="btn-ghost" onClick={() => {
                            navigator.clipboard.writeText(window.location.origin + '/reservar');
                            alert('Link de reserva copiado al portapapeles');
                        }} title="Copiar Link Externo">
                            <LinkIcon size={18} />
                        </button>
                        <button className="btn-primary" onClick={() => { setShowModal(true); setFormData(prev => ({ ...prev, time: '10:00' })); }}>
                            <CalendarIcon size={18} /> Nueva Cita
                        </button>
                    </div>
                </header>

                <div className="glass-panel" style={{ minHeight: '400px', padding: '24px' }}>
                    <h2 style={{ fontSize: '18px', marginBottom: '20px' }}>Clases Confirmadas</h2>
                    {appointments.filter(a => a.status === 'Confirmada').length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <Clock size={40} style={{ opacity: 0.1, marginBottom: '15px' }} />
                            <p style={{ color: 'var(--color-text-muted)' }}>No hay citas confirmadas para hoy.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {appointments.filter(a => a.status === 'Confirmada').map(apt => (
                                <div key={apt.id} className="glass-panel pulse-hover" style={{ padding: '20px', borderLeft: '4px solid var(--color-success)', background: 'rgba(31, 224, 116, 0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{apt.time} - {apt.title}</h3>
                                            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                                                Atleta: <strong>{apt.memberName}</strong>
                                                {apt.isLead && <span style={{ marginLeft: '10px', color: 'var(--color-accent-orange)', fontSize: '12px' }}>[Nuevo Prospecto]</span>}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{apt.duration}</span>
                                            {apt.phone && (
                                                <button 
                                                    className="btn-ghost" 
                                                    style={{ padding: '5px 10px', fontSize: '12px', color: '#25D366' }}
                                                    onClick={() => {
                                                        const msg = `Hola ${apt.memberName}, te escribimos de REP Calisthenics para recordarte tu clase de muestra hoy a las ${apt.time}. ¡Te esperamos!`;
                                                        window.open(`https://wa.me/${apt.phone}?text=${encodeURIComponent(msg)}`, '_blank');
                                                    }}
                                                >
                                                    <MessageCircle size={14} /> Enviar Recordatorio
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="agenda-sidebar" style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'var(--color-glass)', padding: '20px', borderRadius: '16px', border: '1px solid var(--color-glass-border)' }}>
                    <h2 style={{ fontSize: '18px', marginBottom: '20px', color: 'var(--color-accent-orange)' }}>Por Confirmar</h2>

                    {appointments.filter(a => a.status === 'Pendiente').length === 0 ? (
                        <p className="text-muted" style={{ fontSize: '13px', textAlign: 'center', padding: '20px' }}>No hay solicitudes pendientes.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {appointments.filter(a => a.status === 'Pendiente').map(apt => (
                                <div key={apt.id} className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #f48c25', background: 'rgba(244, 140, 37, 0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 'bold' }}>{apt.time}</span>
                                            <span style={{ fontSize: '11px', color: 'var(--color-accent-orange)' }}>{apt.date}</span>
                                        </div>
                                        <span style={{ fontSize: '12px' }}>{apt.duration}</span>
                                    </div>
                                    <p style={{ fontSize: '15px', fontWeight: '500' }}>{apt.title}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>{apt.memberName}</p>
                                        {apt.phone && (
                                            <button 
                                                className="btn-ghost" 
                                                style={{ padding: '4px', color: '#25D366' }} 
                                                title="Contactar por WhatsApp"
                                                onClick={() => {
                                                    const msg = `Hola ${apt.memberName}, te escribimos de REP Calisthenics Academy sobre tu solicitud de clase para el ${apt.date} a las ${apt.time}...`;
                                                    window.open(`https://wa.me/${apt.phone}?text=${encodeURIComponent(msg)}`, '_blank');
                                                }}
                                            >
                                                <MessageCircle size={16} />
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => updateStatus(apt.id, 'Confirmada')} className="btn-primary" style={{ flex: 1, padding: '8px', background: 'var(--color-success)', color: 'black' }}>
                                            <Check size={16} style={{ margin: '0 auto' }} />
                                        </button>
                                        <button onClick={() => {
                                            if (apt.phone) {
                                                if (window.confirm("¿Deseas enviar un WhatsApp para reagendar antes de cancelar la solicitud?")) {
                                                    const msg = `Hola ${apt.memberName}, te escribimos de REP Calisthenics sobre tu solicitud de clase. Desafortunadamente ese horario no está disponible, ¿te gustaría reagendar para otro momento?`;
                                                    window.open(`https://wa.me/${apt.phone}?text=${encodeURIComponent(msg)}`, '_blank');
                                                }
                                            }
                                            updateStatus(apt.id, 'Cancelada');
                                        }} className="btn-primary" style={{ flex: 1, padding: '8px', background: 'var(--color-danger)' }}>
                                            <X size={16} style={{ margin: '0 auto' }} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Agenda;
