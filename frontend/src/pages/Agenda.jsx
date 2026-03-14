import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, User, X, Check, Link as LinkIcon, MessageCircle, AlertCircle, CalendarDays } from 'lucide-react';
import { api } from '../services/api';
import HelpTooltip from '../components/HelpTooltip';

const Agenda = () => {
    const [appointments, setAppointments] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: '', memberName: '', time: '10:00', duration: '1 hr' });

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

    const updateStatus = async (id, status, apt = null) => {
        if (status === 'Cancelada' && apt && apt.phone) {
            if (window.confirm("¿Deseas enviar un WhatsApp para reagendar antes de cancelar la solicitud?")) {
                const msg = `Hola ${apt.memberName}, te escribimos de REP Calisthenics sobre tu solicitud de clase. Desafortunadamente ese horario no está disponible, ¿te gustaría reagendar para otro momento?`;
                window.open(`https://wa.me/${apt.phone}?text=${encodeURIComponent(msg)}`, '_blank');
            }
        }
        
        try {
            await api.updateAppointmentStatus(id, status);
            fetchAppointments();
        } catch (err) { console.error('Error updating appointment status:', err); }
    };

    // Separamos las confirmadas del día seleccionado vs todas las pendientes del sistema
    const confirmedToday = appointments.filter(a => a.status === 'Confirmada' && a.date?.split('T')[0] === selectedDate);
    const allPending = appointments.filter(a => a.status === 'Pendiente');

    return (
        <div className="animate-fade-in" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

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

            <div className="agenda-main" style={{ flex: '1.5', minWidth: '350px' }}>
                <header className="page-header" style={{ marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div className="page-header stagger-1">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <h1 className="page-title">Agenda y Control</h1>
                            <HelpTooltip
                                title="Motor de Crecimiento"
                                content="Aquí caen automáticamente los leads de tu link público /reservar. Manda recordatorios por WhatsApp con un clic. Confirma las asistencias para que se agreguen a tu CRM."
                            />
                        </div>
                        <p className="page-subtitle text-muted">Control de asistencias confirmadas</p>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <CalendarDays size={20} color="var(--color-success)" /> Clases para el {selectedDate}
                        </h2>
                        <span className="badge-status-active">{confirmedToday.length} Confirmadas</span>
                    </div>

                    {confirmedToday.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 40px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <Clock size={40} style={{ opacity: 0.1, marginBottom: '15px' }} />
                            <p style={{ color: 'var(--color-text-muted)' }}>No hay clases confirmadas para esta fecha.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {confirmedToday.map(apt => (
                                <div key={apt.id} className="glass-panel pulse-hover" style={{ padding: '20px', borderLeft: '4px solid var(--color-success)', background: 'rgba(31, 224, 116, 0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <h3 style={{ fontSize: '18px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Clock size={16} /> {apt.time} - {apt.title}
                                            </h3>
                                            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
                                                Atleta: <strong style={{ color: 'white' }}>{apt.memberName}</strong>
                                                {apt.isLead && <span style={{ marginLeft: '10px', background: 'rgba(255, 115, 0, 0.2)', color: 'var(--color-accent-orange)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>PROSPECTO</span>}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{apt.duration}</span>
                                            {apt.phone && (
                                                <button 
                                                    className="btn-ghost" 
                                                    style={{ padding: '6px 12px', fontSize: '12px', color: '#25D366', background: 'rgba(37, 211, 102, 0.05)', borderRadius: '8px' }}
                                                    onClick={() => {
                                                        const msg = `Hola ${apt.memberName}, te escribimos de REP Calisthenics para recordarte tu clase de muestra el ${apt.date.split('T')[0]} a las ${apt.time}. ¡Confirmamos tu asistencia!`;
                                                        window.open(`https://wa.me/${apt.phone}?text=${encodeURIComponent(msg)}`, '_blank');
                                                    }}
                                                >
                                                    <MessageCircle size={14} /> Recordar por WhatsApp
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

            <div className="agenda-sidebar" style={{ flex: '1', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: '20px' }}>
                <div style={{ background: 'rgba(255, 115, 0, 0.03)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(255, 115, 0, 0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-accent-orange)' }}>
                            <AlertCircle size={20} /> Solicitudes Globales
                        </h2>
                        <span style={{ background: 'var(--color-accent-orange)', color: 'black', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>
                            {allPending.length}
                        </span>
                    </div>

                    {allPending.length === 0 ? (
                        <p className="text-muted" style={{ fontSize: '13px', textAlign: 'center', padding: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                            No hay solicitudes pendientes en el sistema.
                        </p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '5px' }}>
                            {allPending.map(apt => (
                                <div key={apt.id} className="glass-panel" style={{ padding: '18px', borderLeft: '4px solid #f48c25', background: 'rgba(244, 140, 37, 0.05)', borderRadius: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{apt.time} hrs</span>
                                            <span style={{ fontSize: '12px', color: 'var(--color-accent-orange)', fontWeight: '600' }}>{apt.date?.split('T')[0]}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '11px', display: 'block', color: 'var(--color-text-muted)' }}>{apt.duration}</span>
                                        </div>
                                    </div>
                                    
                                    <p style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>{apt.title}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{apt.memberName}</p>
                                        {apt.phone && (
                                            <button 
                                                className="btn-ghost" 
                                                style={{ padding: '6px', color: '#25D366', background: 'rgba(37, 211, 102, 0.1)', borderRadius: '50%' }} 
                                                onClick={() => {
                                                    const msg = `Hola ${apt.memberName}, te escribimos de REP Calisthenics sobre tu clase para el ${apt.date?.split('T')[0]} a las ${apt.time}...`;
                                                    window.open(`https://wa.me/${apt.phone}?text=${encodeURIComponent(msg)}`, '_blank');
                                                }}
                                            >
                                                <MessageCircle size={14} />
                                            </button>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            onClick={() => updateStatus(apt.id, 'Confirmada')} 
                                            className="btn-primary" 
                                            style={{ flex: 2, padding: '10px', background: 'var(--color-success)', color: 'black', borderRadius: '10px', fontSize: '12px' }}
                                        >
                                            <Check size={14} style={{ marginRight: '5px' }} /> CONFIRMAR
                                        </button>
                                        <button 
                                            onClick={() => updateStatus(apt.id, 'Cancelada', apt)} 
                                            className="btn-ghost" 
                                            style={{ flex: 1, padding: '10px', color: 'var(--color-danger)', border: '1px solid rgba(255,100,100,0.2)', borderRadius: '10px' }}
                                        >
                                            <X size={14} />
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
