import React, { useState, useRef, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Camera, PenTool, Trash2, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import SignatureCanvas from 'react-signature-canvas';

const OnboardingModal = ({ plans, onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        plan: plans.length > 0 ? plans[0].name : '',
        status: 'Activo',
        signature: null,      // will hold base64 SVG data URL
        biometrics: false,
        joinDate: today,
        cutoffDate: '',
    });
    const [loading, setLoading] = useState(false);
    const sigCanvasRef = useRef(null);

    // Auto-calculate cutoff date = joinDate + 30 days
    useEffect(() => {
        if (formData.joinDate) {
            const d = new Date(formData.joinDate);
            d.setDate(d.getDate() + 30);
            setFormData(prev => ({ ...prev, cutoffDate: d.toISOString().split('T')[0] }));
        }
    }, [formData.joinDate]);

    const handleNext = () => {
        if (step === 3 && sigCanvasRef.current && sigCanvasRef.current.isEmpty()) {
            alert('Por favor dibuja tu firma antes de continuar.');
            return;
        }
        if (step === 3 && sigCanvasRef.current) {
            const signatureData = sigCanvasRef.current.toDataURL('image/svg+xml');
            setFormData(prev => ({ ...prev, signature: signatureData }));
        }
        setStep(step + 1);
    };

    const handlePrev = () => setStep(step - 1);

    const clearSig = () => {
        if (sigCanvasRef.current) sigCanvasRef.current.clear();
        setFormData(prev => ({ ...prev, signature: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.signature && sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
            const signatureData = sigCanvasRef.current.toDataURL('image/svg+xml');
            setFormData(prev => ({ ...prev, signature: signatureData }));
        }
        setLoading(true);
        try {
            await api.addMember({
                ...formData,
                lastVisit: null,
                visitsCount: 0,
            });
            setLoading(false);
            onSuccess();
        } catch (err) {
            console.error(err);
            setLoading(false);
            alert('Error: ' + err.message);
        }
    };

    const totalSteps = 4;
    const stepTitles = ['Identidad y Contacto', 'Asignación de Plan', 'Firma Digital', 'Fechas de Membresía'];

    const isStep1Valid = formData.name && formData.email && formData.phone;

    return (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
            <div style={{
                width: '100%',
                maxWidth: '520px',
                background: 'var(--color-bg-secondary, #111)',
                border: '1px solid var(--color-glass-border)',
                borderRadius: '20px',
                overflow: 'hidden',
                margin: 'auto',
                boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
                animation: 'modal-appear 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                color: 'var(--color-text-main)',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '18px 24px',
                    borderBottom: '1px solid var(--color-glass-border)',
                    background: 'var(--color-glass)',
                }}>
                    <div>
                        <h2 style={{ fontSize: '17px', margin: 0 }}>Alta de Miembro</h2>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                            Paso {step} de {totalSteps}: {stepTitles[step - 1]}
                        </p>
                    </div>
                    <button onClick={onClose} className="btn-ghost" style={{ padding: '6px', minHeight: 'unset', border: 'none' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Progress bar */}
                <div style={{ height: '3px', background: 'var(--color-glass-border)' }}>
                    <div style={{
                        width: `${(step / totalSteps) * 100}%`,
                        background: 'var(--color-accent-orange)',
                        height: '100%',
                        transition: 'width 0.35s ease',
                        boxShadow: '0 0 10px var(--color-accent-orange)',
                    }} />
                </div>

                {/* Body */}
                <div style={{ padding: '28px 24px', maxHeight: '75vh', overflowY: 'auto' }}>

                    {/* STEP 1: Info */}
                    {step === 1 && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="form-group">
                                <label>Nombre Completo *</label>
                                <input required type="text" placeholder="Ej. Juan Pérez" className="form-input"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Correo Electrónico *</label>
                                <input required type="email" placeholder="correo@ejemplo.com" className="form-input"
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Teléfono (WhatsApp) *</label>
                                <input required type="tel" placeholder="+52 55 1234 5678" className="form-input"
                                    value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div
                                onClick={() => setFormData({ ...formData, biometrics: !formData.biometrics })}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '14px',
                                    padding: '14px 16px',
                                    border: formData.biometrics ? '1px solid var(--color-accent-orange)' : '1px solid var(--color-glass-border)',
                                    borderRadius: '10px',
                                    background: formData.biometrics ? 'rgba(244,140,37,0.08)' : 'var(--color-glass)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <Camera size={22} color={formData.biometrics ? 'var(--color-accent-orange)' : 'var(--color-text-muted)'} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Captura Biométrica</div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Para acceso por reconocimiento facial (opcional)</div>
                                </div>
                                {formData.biometrics && <Check size={18} color="var(--color-accent-orange)" />}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Plan */}
                    {step === 2 && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {plans.length === 0 && (
                                <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '30px 0' }}>
                                    No hay planes configurados. Ve a "Membresías" para crearlos primero.
                                </p>
                            )}
                            {plans.map(p => (
                                <div key={p.id}
                                    onClick={() => setFormData({ ...formData, plan: p.name })}
                                    style={{
                                        padding: '18px 20px',
                                        borderRadius: '10px',
                                        border: formData.plan === p.name ? '2px solid var(--color-accent-orange)' : '1px solid var(--color-glass-border)',
                                        background: formData.plan === p.name ? 'rgba(244,140,37,0.08)' : 'var(--color-glass)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '15px' }}>{p.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
                                            {p.description || 'Acceso completo al gimnasio'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-accent-orange)' }}>
                                            ${p.price}
                                        </span>
                                        {formData.plan === p.name && <Check size={16} color="var(--color-accent-orange)" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* STEP 3: Signature Canvas */}
                    {step === 3 && (
                        <div className="animate-fade-in">
                            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '10px' }}>
                                El miembro debe firmar en el recuadro de abajo usando el mouse o pantalla táctil.
                            </p>

                            {/* Terms */}
                            <div style={{
                                background: 'var(--color-glass)',
                                border: '1px solid var(--color-glass-border)',
                                borderRadius: '8px',
                                padding: '14px',
                                marginBottom: '16px',
                                maxHeight: '120px',
                                overflowY: 'auto',
                                fontSize: '11px',
                                color: 'var(--color-text-muted)',
                                lineHeight: '1.6',
                            }}>
                                <strong style={{ color: 'var(--color-text-main)' }}>TÉRMINOS Y EXENCIÓN DE RESPONSABILIDAD</strong><br /><br />
                                Al firmar, el usuario reconoce que participa en actividades deportivas de REP Calisthenics bajo su propio riesgo. Acepta respetar el reglamento interno y realizar los pagos puntuales del plan <strong>{formData.plan}</strong>. La membresía inicia el <strong>{formData.joinDate}</strong>.
                            </div>

                            {/* Canvas */}
                            <div style={{
                                border: '2px dashed var(--color-accent-orange)',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                background: '#fafafa',
                                position: 'relative',
                            }}>
                                <SignatureCanvas
                                    ref={sigCanvasRef}
                                    penColor="#111"
                                    canvasProps={{
                                        width: 460,
                                        height: 180,
                                        style: { display: 'block', width: '100%', height: '180px', touchAction: 'none' }
                                    }}
                                />
                                <div style={{
                                    position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)',
                                    fontSize: '11px', color: '#aaa', pointerEvents: 'none', whiteSpace: 'nowrap'
                                }}>
                                    ✒ Dibuja tu firma aquí
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                                <button className="btn-ghost" style={{ flex: 1, gap: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }} onClick={clearSig}>
                                    <RotateCcw size={14} /> Limpiar firma
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: Dates */}
                    {step === 4 && (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                                Define el día de ingreso oficial y la fecha de corte (cobro de renovación).
                            </p>
                            <div className="form-group">
                                <label>📅 Fecha de Ingreso</label>
                                <input type="date" className="form-input"
                                    value={formData.joinDate}
                                    onChange={e => setFormData({ ...formData, joinDate: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>🔄 Fecha de Corte (Renovación)</label>
                                <input type="date" className="form-input"
                                    value={formData.cutoffDate}
                                    onChange={e => setFormData({ ...formData, cutoffDate: e.target.value })}
                                />
                                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                    Se calcula automáticamente (+30 días). Puedes ajustarla manualmente.
                                </span>
                            </div>

                            {/* Summary */}
                            <div style={{
                                background: 'var(--color-glass)',
                                border: '1px solid var(--color-glass-border)',
                                borderRadius: '12px',
                                padding: '16px',
                                display: 'flex', flexDirection: 'column', gap: '10px'
                            }}>
                                <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--color-accent-orange)' }}>Resumen de Registro</h4>
                                {[
                                    ['Nombre', formData.name],
                                    ['Email', formData.email],
                                    ['Teléfono', formData.phone],
                                    ['Plan', formData.plan],
                                    ['Ingreso', formData.joinDate],
                                    ['Corte', formData.cutoffDate],
                                ].map(([label, value]) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '6px' }}>
                                        <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                                        <span style={{ fontWeight: 600 }}>{value || '—'}</span>
                                    </div>
                                ))}
                                {formData.signature && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '4px' }}>
                                        <Check size={14} color="var(--color-success)" />
                                        <span style={{ fontSize: '12px', color: 'var(--color-success)' }}>Firma digital capturada</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid var(--color-glass-border)',
                    background: 'var(--color-glass)',
                    display: 'flex', justifyContent: 'space-between', gap: '12px',
                }}>
                    <button className="btn-ghost" onClick={step === 1 ? onClose : handlePrev}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', minHeight: '40px' }}>
                        {step === 1 ? 'Cancelar' : <><ArrowLeft size={15} /> Atrás</>}
                    </button>

                    {step < totalSteps ? (
                        <button className="btn-primary"
                            style={{ minHeight: '40px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={handleNext}
                            disabled={step === 1 && !isStep1Valid}
                        >
                            Siguiente <ArrowRight size={15} />
                        </button>
                    ) : (
                        <button className="btn-primary"
                            style={{ background: 'var(--color-success)', border: 'none', minHeight: '40px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Procesando...' : <><Check size={15} /> Completar Registro</>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
