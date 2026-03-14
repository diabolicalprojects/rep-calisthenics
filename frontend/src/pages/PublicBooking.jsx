import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle, ChevronLeft, User, Phone, Mail } from 'lucide-react';
import { api } from '../services/api';
import Logo from '../components/Logo';

const PublicBooking = () => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
    const [status, setStatus] = useState('selection'); // selection, form, success
    const [loading, setLoading] = useState(false);

    const ALL_SLOTS = ['08:00', '10:00', '12:00', '16:00', '18:00', '20:00'];

    useEffect(() => {
        checkAvailability();
    }, [selectedDate]);

    const checkAvailability = async () => {
        try {
            const data = await api.getAppointments(selectedDate);
            const bookedTimes = data.map(app => app.time);
            const freeSlots = ALL_SLOTS.filter(slot => !bookedTimes.includes(slot));
            setAvailableSlots(freeSlots);
            setSelectedSlot(null);
        } catch (err) {
            console.error('Error fetching availability:', err);
        }
    };

    const handleBooking = async (e) => {
        e.preventDefault();
        setLoading(true);
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
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (selectedSlot) setStatus('form');
    };

    const prevStep = () => {
        setStatus('selection');
    };

    if (status === 'success') {
        return (
            <div className="booking-page-container">
                <div className="booking-glass-card success-card">
                    <div className="success-icon-container">
                        <CheckCircle size={80} color="var(--color-success)" />
                    </div>
                    <h2 className="display-font accent-text">¡RESERVA CONFIRMADA!</h2>
                    <div className="success-divider"></div>
                    <p className="success-text">
                        Tu lugar para la clase de muestra está asegurado. Nos vemos el:
                    </p>
                    <div className="booking-summary-badge">
                        <span>{selectedDate}</span>
                        <span>•</span>
                        <span>{selectedSlot} hrs</span>
                    </div>
                    <p className="success-subtext">
                        Hemos recibido tu solicitud. Te contactaremos por WhatsApp para enviarte la ubicación y detalles finales. ¡Prepárate para el reto!
                    </p>
                    <button className="btn-primary" style={{ marginTop: '30px', width: '100%', height: '54px' }} onClick={() => window.location.href = '/'}>
                        VOLVER AL INICIO
                    </button>
                    <p style={{ marginTop: '20px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px' }}>
                        POWERED BY DIABOLICAL ENGINE
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="booking-page-container">
            <header className="booking-header animate-fade-in" style={{ padding: '15px 0', marginBottom: '10px' }}>
                <div style={{ width: '60px', cursor: 'pointer', filter: 'grayscale(1) brightness(2)' }} onClick={() => window.location.href = '/'}>
                    <Logo animated={false} />
                </div>
            </header>

            <main className="booking-main">
                <div className="booking-glass-card">
                    {/* Header del Card */}
                    <div className="card-header-booking">
                        <div className="step-indicator">
                            <div className={`step-dot ${status === 'selection' ? 'active' : 'completed'}`}></div>
                            <div className="step-line"></div>
                            <div className={`step-dot ${status === 'form' ? 'active' : ''}`}></div>
                        </div>
                        <h1 className="display-font card-title">
                            {status === 'selection' ? 'RESERVA TU CLASE' : 'TUS DATOS'}
                        </h1>
                        <p className="card-subtitle">
                            {status === 'selection' 
                                ? 'Selecciona el momento ideal para tu entrenamiento inicial.' 
                                : 'Completa tu registro para asegurar tu lugar.'}
                        </p>
                    </div>

                    {status === 'selection' ? (
                        <div className="animate-fade-in section-content">
                            <div className="booking-form-group">
                                <label className="booking-label">
                                    <CalendarIcon size={16} /> ELIGE EL DÍA
                                </label>
                                <div className="date-input-wrapper">
                                    <input 
                                        type="date" 
                                        className="booking-input" 
                                        value={selectedDate} 
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setSelectedDate(e.target.value)} 
                                    />
                                </div>
                            </div>

                            <label className="booking-label" style={{ marginTop: '20px', marginBottom: '15px' }}>
                                <Clock size={16} /> HORARIOS DISPONIBLES
                            </label>
                            
                            <div className="slots-grid">
                                {availableSlots.length > 0 ? (
                                    availableSlots.map(slot => (
                                        <button 
                                            key={slot}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`slot-pill ${selectedSlot === slot ? 'selected' : ''}`}
                                        >
                                            {slot}
                                        </button>
                                    ))
                                ) : (
                                    <div className="no-slots-message">
                                        No hay cupos disponibles para este día. Por favor elige otra fecha.
                                    </div>
                                )}
                            </div>

                            <div className="action-footer">
                                <button 
                                    className="btn-primary main-booking-btn"
                                    disabled={!selectedSlot}
                                    onClick={nextStep}
                                >
                                    CONTINUAR
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form className="animate-fade-in section-content" onSubmit={handleBooking}>
                            <button type="button" onClick={prevStep} className="back-link">
                                <ChevronLeft size={16} /> Ir atrás
                            </button>

                            <div className="booking-review">
                                <span className="review-label">TU ELECCIÓN:</span>
                                <span className="review-value">{selectedDate} @ {selectedSlot}</span>
                            </div>

                            <div className="booking-form-group">
                                <label className="booking-label"><User size={14} /> NOMBRE COMPLETO</label>
                                <input 
                                    required 
                                    type="text" 
                                    className="booking-input" 
                                    placeholder="Nombre Apellido" 
                                    value={formData.name} 
                                    onChange={e => setFormData({...formData, name: e.target.value})} 
                                />
                            </div>

                            <div className="booking-form-group">
                                <label className="booking-label"><Phone size={14} /> WHATSAPP</label>
                                <input 
                                    required 
                                    type="tel" 
                                    className="booking-input" 
                                    placeholder="+52 000 000 0000" 
                                    value={formData.phone} 
                                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                                />
                                <span className="input-hint">Usaremos este número para confirmar tu asistencia.</span>
                            </div>

                            <div className="booking-form-group">
                                <label className="booking-label"><Mail size={14} /> CORREO ELECTRÓNICO</label>
                                <input 
                                    required 
                                    type="email" 
                                    className="booking-input" 
                                    placeholder="tu@correo.com" 
                                    value={formData.email} 
                                    onChange={e => setFormData({...formData, email: e.target.value})} 
                                />
                            </div>

                            <div className="action-footer">
                                <button 
                                    className="btn-primary main-booking-btn shadow-glow" 
                                    type="submit" 
                                    disabled={loading}
                                >
                                    {loading ? 'PROCESANDO...' : 'CONFIRMAR MI CLASE'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </main>

            <style>{`
                .booking-page-container {
                    min-height: 100vh;
                    background: linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,20,0.9) 100%), 
                                url('/calisthenics_gym_premium_background_1773480690654.png');
                    background-size: cover;
                    background-position: center;
                    background-attachment: fixed;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    color: white;
                    padding: 20px 15px;
                    font-family: 'Inter', sans-serif;
                }

                .booking-header {
                    width: 100%;
                    max-width: 1200px;
                    padding: 20px 0;
                    display: flex;
                    justify-content: center;
                    margin-bottom: 20px;
                }

                .booking-main {
                    flex: 1;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .booking-glass-card {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(25px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 24px;
                    width: 100%;
                    max-width: 480px;
                    padding: 40px 30px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    position: relative;
                    overflow: hidden;
                }

                .booking-glass-card::before {
                    content: '';
                    position: absolute;
                    top: -100px;
                    right: -100px;
                    width: 200px;
                    height: 200px;
                    background: radial-gradient(circle, rgba(255, 115, 0, 0.1) 0%, transparent 70%);
                }

                .card-title {
                    font-size: 28px;
                    letter-spacing: 2px;
                    margin-bottom: 8px;
                    background: linear-gradient(90deg, #fff, #ff7300);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .card-subtitle {
                    color: rgba(255,255,255,0.5);
                    font-size: 14px;
                    line-height: 1.5;
                }

                .step-indicator {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 25px;
                }

                .step-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.1);
                    transition: 0.3s;
                }

                .step-dot.active {
                    background: var(--color-accent-orange);
                    box-shadow: 0 0 10px var(--color-accent-orange);
                }

                .step-dot.completed {
                    background: #fff;
                }

                .step-line {
                    height: 1px;
                    width: 40px;
                    background: rgba(255,255,255,0.1);
                }

                .section-content {
                    margin-top: 35px;
                }

                .booking-label {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 1.5px;
                    color: rgba(255,255,255,0.4);
                    margin-bottom: 12px;
                }

                .booking-input {
                    width: 100%;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 14px 18px;
                    border-radius: 12px;
                    color: white;
                    font-size: 15px;
                    transition: 0.3s;
                    outline: none;
                }

                .booking-input:focus {
                    background: rgba(255,255,255,0.08);
                    border-color: var(--color-accent-orange);
                    box-shadow: 0 0 0 4px rgba(255, 115, 0, 0.1);
                }

                .slots-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 12px;
                    margin-bottom: 30px;
                }

                .slot-pill {
                    padding: 12px;
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 12px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    text-align: center;
                    font-size: 14px;
                }

                .slot-pill:hover {
                    background: rgba(255,255,255,0.08);
                    transform: translateY(-2px);
                }

                .slot-pill.selected {
                    background: var(--color-accent-orange);
                    color: black;
                    border-color: var(--color-accent-orange);
                    box-shadow: 0 10px 20px -10px rgba(255, 115, 0, 0.4);
                }

                .action-footer {
                    margin-top: 40px;
                }

                .main-booking-btn {
                    width: 100%;
                    height: 56px;
                    font-weight: 800;
                    font-size: 16px;
                    letter-spacing: 2px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .back-link {
                    background: none;
                    border: none;
                    color: var(--color-accent-orange);
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 13px;
                    cursor: pointer;
                    margin-bottom: 25px;
                    padding: 0;
                    opacity: 0.8;
                    transition: 0.2s;
                }

                .back-link:hover {
                    opacity: 1;
                    transform: translateX(-3px);
                }

                .booking-review {
                    background: rgba(255, 115, 0, 0.05);
                    padding: 15px 20px;
                    border-radius: 12px;
                    border-left: 3px solid var(--color-accent-orange);
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                    margin-bottom: 30px;
                }

                .review-label {
                    font-size: 10px;
                    color: var(--color-accent-orange);
                    font-weight: 800;
                    letter-spacing: 1px;
                }

                .review-value {
                    font-weight: 700;
                    font-size: 16px;
                }

                .input-hint {
                    display: block;
                    font-size: 11px;
                    color: rgba(255,255,255,0.3);
                    margin-top: 6px;
                }

                .no-slots-message {
                    grid-column: span 3;
                    text-align: center;
                    padding: 30px;
                    background: rgba(255, 0, 0, 0.05);
                    border: 1px dashed rgba(255, 100, 100, 0.2);
                    border-radius: 12px;
                    color: rgba(255, 100, 100, 0.8);
                    font-size: 13px;
                }

                .success-card {
                    text-align: center;
                    max-width: 440px;
                }

                .success-icon-container {
                    margin-bottom: 30px;
                    animation: bounce 2s infinite;
                }

                .success-divider {
                    height: 2px;
                    width: 60px;
                    background: var(--color-accent-orange);
                    margin: 20px auto;
                }

                .success-text {
                    font-size: 16px;
                    color: rgba(255,255,255,0.8);
                    margin-bottom: 20px;
                }

                .booking-summary-badge {
                    display: inline-flex;
                    gap: 15px;
                    background: rgba(255,255,255,0.05);
                    padding: 10px 25px;
                    border-radius: 30px;
                    font-weight: 700;
                    color: var(--color-accent-orange);
                    font-size: 14px;
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .success-subtext {
                    margin-top: 25px;
                    font-size: 14px;
                    color: rgba(255,255,255,0.4);
                    line-height: 1.6;
                }

                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }

                @media (max-width: 480px) {
                    .booking-glass-card {
                        padding: 30px 20px;
                        border-radius: 0;
                        background: transparent;
                        backdrop-filter: none;
                        border: none;
                        box-shadow: none;
                    }
                    .booking-page-container {
                        background: #000;
                    }
                    .slots-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                    .card-title {
                        font-size: 24px;
                    }
                }
            `}</style>
        </div>
    );
};

export default PublicBooking;
