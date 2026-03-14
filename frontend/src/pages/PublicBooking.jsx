import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import Logo from '../components/Logo';

const PublicBooking = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
    const [status, setStatus] = useState('selection'); // selection, form, success

    // Config: working hours for trial classes
    const ALL_SLOTS = ['08:00', '10:00', '12:00', '16:00', '18:00', '20:00'];

    useEffect(() => {
        checkAvailability();
    }, [selectedDate]);

    const checkAvailability = async () => {
        try {
            const data = await api.getAppointments(selectedDate);
            const bookedTimes = data.map(app => app.time);
            
            // Allow only slots not currently booked
            const freeSlots = ALL_SLOTS.filter(slot => !bookedTimes.includes(slot));
            setAvailableSlots(freeSlots);
            setSelectedSlot(null);
        } catch (err) {
            console.error('Error fetching availability:', err);
        }
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        try {
            await api.addAppointment({
                title: 'Clase de Muestra (Lead)',
                memberName: formData.name,
                phone: formData.phone,
                email: formData.email,
                date: selectedDate,
                time: selectedSlot,
                duration: '1 hr',
                status: 'Pendiente',
                isLead: true
            });
            setStatus('success');
        } catch (err) {
            alert('Hubo un error al reservar. Inténtalo de nuevo.');
        }
    };

    if (status === 'success') {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center', background: 'var(--color-bg-main)' }}>
                <div className="glass-panel" style={{ textAlign: 'center', maxWidth: '400px', width: '90%', padding: '40px' }}>
                    <CheckCircle size={60} color="var(--color-success)" style={{ margin: '0 auto 20px auto' }} />
                    <h2 style={{ color: 'white', marginBottom: '15px' }}>¡Reserva Confirmada!</h2>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                        Tu lugar para la clase de muestra está asegurado el <strong>{selectedDate}</strong> a las <strong>{selectedSlot}</strong>.
                    </p>
                    <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6', marginTop: '10px' }}>
                        Te enviaremos un recordatorio por WhatsApp pronto.
                    </p>
                    <button className="btn-primary" style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }} onClick={() => window.location.href = '/'}>
                        Volver al Inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg-main)', display: 'flex', flexDirection: 'column' }}>
            <header style={{ padding: '20px', display: 'flex', justifyContent: 'center', borderBottom: '1px solid var(--color-glass)' }}>
                <Logo animated={false} />
            </header>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '15px 10px' }}>
                <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '20px 15px' }}>
                    <h2 style={{ textAlign: 'center', fontSize: '22px', marginBottom: '10px' }}>Reserva tu Clase de Muestra</h2>
                    <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: '20px', fontSize: '14px' }}>Selecciona un horario disponible en tiempo real.</p>

                    {status === 'selection' && (
                        <div className="animate-fade-in">
                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CalendarIcon size={18} /> Día de la clase</label>
                                <input 
                                    type="date" 
                                    className="form-input" 
                                    value={selectedDate} 
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setSelectedDate(e.target.value)} 
                                />
                            </div>

                            <p style={{ marginBottom: '15px', color: 'var(--color-text-muted)' }}>Horarios Disponibles</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '30px' }}>
                                {availableSlots.length > 0 ? availableSlots.map(slot => (
                                    <button 
                                        key={slot}
                                        onClick={() => setSelectedSlot(slot)}
                                        style={{ 
                                            padding: '15px', 
                                            background: selectedSlot === slot ? 'var(--color-accent-orange)' : 'var(--color-glass)',
                                            color: selectedSlot === slot ? 'black' : 'white',
                                            border: '1px solid var(--color-glass-border)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            transition: '0.2s'
                                        }}
                                    >
                                        <Clock size={16} /> {slot}
                                    </button>
                                )) : (
                                    <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '20px', color: 'var(--color-danger)' }}>
                                        No hay cupos disponibles. Intenta otro día.
                                    </div>
                                )}
                            </div>

                            <button 
                                className="btn-primary" 
                                style={{ width: '100%', justifyContent: 'center', padding: '15px' }}
                                disabled={!selectedSlot}
                                onClick={() => setStatus('form')}
                            >
                                Continuar
                            </button>
                        </div>
                    )}

                    {status === 'form' && (
                        <form className="animate-fade-in" onSubmit={handleBooking} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ background: 'rgba(255, 115, 0, 0.1)', border: '1px solid var(--color-accent-orange)', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Tu reserva:</div>
                                    <div style={{ fontWeight: 'bold' }}>{selectedDate} a las {selectedSlot}</div>
                                </div>
                                <button type="button" onClick={() => setStatus('selection')} style={{ background: 'none', border: 'none', color: 'var(--color-accent-orange)', cursor: 'pointer', textDecoration: 'underline' }}>Cambiar</button>
                            </div>

                            <div className="form-group" style={{ marginBottom: '10px' }}>
                                <label style={{ fontSize: '13px' }}>Nombre Completo</label>
                                <input required type="text" className="form-input" placeholder="Ej. Carlos Martínez" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ height: '40px' }} />
                            </div>
                            <div className="form-group" style={{ marginBottom: '10px' }}>
                                <label style={{ fontSize: '13px' }}>Teléfono (WhatsApp)</label>
                                <input required type="tel" className="form-input" placeholder="+52 ..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ height: '40px' }} />
                            </div>
                            <div className="form-group" style={{ marginBottom: '10px' }}>
                                <label style={{ fontSize: '13px' }}>Correo Electrónico</label>
                                <input required type="email" className="form-input" placeholder="correo@ejemplo.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ height: '40px' }} />
                            </div>

                            <button className="btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '10px', fontSize: '16px' }}>
                                Confirmar Clase de Muestra
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicBooking;
