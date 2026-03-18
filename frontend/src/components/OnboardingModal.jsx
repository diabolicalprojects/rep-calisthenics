import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Camera, PenTool, Calendar, ShieldCheck, DollarSign, User } from 'lucide-react';
import { api } from '../services/api';
import SignatureCanvas from 'react-signature-canvas';

const OnboardingModal = ({ plans, onClose, onSuccess }) => {
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        plan: plans.length > 0 ? plans[0].name : '',
        status: 'Activo',
        signature: null,
        biometrics: false,
        joinDate: today,
        cutoffDate: '',
        isCustomPlan: false,
        customPlanName: '',
        customPlanPrice: '',
        paymentMethod: 'Efectivo'
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (sigCanvasRef.current && sigCanvasRef.current.isEmpty()) {
            alert('Por favor dibuja tu firma antes de continuar.');
            return;
        }

        const signatureData = sigCanvasRef.current.toDataURL('image/svg+xml');
        setLoading(true);
        
        try {
            let planName = formData.plan;
            let planPrice = 0;

            // 1. Create custom plan if needed
            if (formData.isCustomPlan) {
                if (!formData.customPlanName || !formData.customPlanPrice) {
                    throw new Error('Nombre y precio del plan son requeridos.');
                }
                const newPlan = await api.addMembership({
                    name: formData.customPlanName,
                    price: parseFloat(formData.customPlanPrice),
                    duration: 30
                });
                planName = newPlan.name;
                planPrice = parseFloat(formData.customPlanPrice);
            } else {
                const selectedPlan = plans.find(p => p.name === formData.plan);
                planPrice = selectedPlan ? parseFloat(selectedPlan.price) : 0;
            }

            // 2. Add Member
            const newMember = await api.addMember({
                ...formData,
                plan: planName,
                signature: signatureData
            });

            // 3. Register initial transaction/payment
            await api.createTransaction({
                total_amount: planPrice,
                payment_method: formData.paymentMethod,
                cashier_name: 'Recepción',
                type: 'Membresía',
                items: [{ id: newMember.id, name: `Alta Membresía: ${planName}`, price: planPrice, type: 'membership' }]
            });

            setLoading(false);
            onSuccess();
        } catch (err) {
            console.error(err);
            setLoading(false);
            alert('Error: ' + err.message);
        }
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
            <div style={{
                width: '100%',
                maxWidth: '900px',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-glass-border)',
                borderRadius: '24px',
                overflow: 'hidden',
                margin: '20px',
                boxShadow: 'var(--shadow-md)',
                animation: 'modal-appear 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                color: 'var(--color-text-main)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '20px 32px',
                    borderBottom: '1px solid var(--color-glass-border)',
                    background: 'var(--color-glass)',
                }}>
                    <div>
                        <h2 style={{ fontSize: '20px', margin: 0, letterSpacing: '-0.5px' }}>Registro One-Flow</h2>
                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
                            Flujo continuo de contratación y firma digital
                        </p>
                    </div>
                    <button onClick={onClose} className="btn-ghost" style={{ padding: '8px', minHeight: 'unset', border: 'none' }}>
                        <X size={22} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                    {/* Left Column: Data & Plan */}
                    <div style={{ flex: 1.2, padding: '32px', overflowY: 'auto', borderRight: '1px solid var(--color-glass-border)' }}>
                        
                        {/* Section: Identity */}
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <div style={{ background: 'var(--color-accent-orange)', padding: '6px', borderRadius: '8px', color: '#000' }}>
                                    <User size={18} />
                                </div>
                                <h3 style={{ fontSize: '16px', margin: 0 }}>Identidad y Contacto</h3>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
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
                                    <label>Teléfono *</label>
                                    <input required type="tel" placeholder="55 1234 5678" className="form-input"
                                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* Section: Plan Selection */}
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <div style={{ background: 'var(--color-accent-blue)', padding: '6px', borderRadius: '8px', color: '#fff' }}>
                                    <ShieldCheck size={18} />
                                </div>
                                <h3 style={{ fontSize: '16px', margin: 0 }}>Membresía y Pago</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {plans.map(p => (
                                    <div key={p.id}
                                        onClick={() => setFormData({ ...formData, plan: p.name, isCustomPlan: false })}
                                        style={{
                                            padding: '14px 18px',
                                            borderRadius: '12px',
                                            border: (formData.plan === p.name && !formData.isCustomPlan) ? '2px solid var(--color-accent-orange)' : '1px solid var(--color-glass-border)',
                                            background: (formData.plan === p.name && !formData.isCustomPlan) ? 'rgba(244,140,37,0.1)' : 'var(--color-glass)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Membresía estándar</div>
                                        </div>
                                        <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-accent-orange)' }}>${p.price}</div>
                                    </div>
                                ))}

                                {/* Custom Plan Trigger */}
                                <div 
                                    onClick={() => setFormData({ ...formData, isCustomPlan: true })}
                                    style={{
                                        padding: '14px 18px',
                                        borderRadius: '12px',
                                        border: formData.isCustomPlan ? '2px solid var(--color-accent-orange)' : '1px dashed var(--color-glass-border)',
                                        background: formData.isCustomPlan ? 'rgba(244,140,37,0.1)' : 'transparent',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <PenTool size={16} />
                                        <span style={{ fontSize: '14px', fontWeight: 600 }}>Plan Personalizado</span>
                                    </div>
                                    {formData.isCustomPlan && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                                            <input type="text" className="form-input" placeholder="Nombre" 
                                                value={formData.customPlanName} 
                                                onChange={e => setFormData({ ...formData, customPlanName: e.target.value })}
                                                onClick={e => e.stopPropagation()} 
                                            />
                                            <input type="number" className="form-input" placeholder="Precio ($)" 
                                                value={formData.customPlanPrice} 
                                                onChange={e => setFormData({ ...formData, customPlanPrice: e.target.value })}
                                                onClick={e => e.stopPropagation()} 
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section: Payment Method */}
                        <div>
                            <label style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '8px', display: 'block' }}>Método de Pago Initial</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {['Efectivo', 'Tarjeta', 'Transferencia'].map(m => (
                                    <button
                                        type="button"
                                        key={m}
                                        onClick={() => setFormData({...formData, paymentMethod: m})}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid var(--color-glass-border)',
                                            background: formData.paymentMethod === m ? 'var(--color-accent-orange)' : 'var(--color-glass)',
                                            color: formData.paymentMethod === m ? '#000' : 'var(--color-text-main)',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Dates & Signature */}
                    <div style={{ flex: 1, padding: '32px', background: 'var(--color-glass)', overflowY: 'auto' }}>
                        
                        {/* Section: Dates */}
                        <div style={{ marginBottom: '32px' }}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                <div style={{ background: 'var(--color-accent-orange)', padding: '6px', borderRadius: '8px', color: '#000' }}>
                                    <Calendar size={18} />
                                </div>
                                <h3 style={{ fontSize: '16px', margin: 0 }}>Fechas de Vigencia</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group">
                                    <label>Fecha de Inicio</label>
                                    <input type="date" className="form-input"
                                        value={formData.joinDate} onChange={e => setFormData({ ...formData, joinDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Fecha de Corte</label>
                                    <input type="date" className="form-input"
                                        value={formData.cutoffDate} onChange={e => setFormData({ ...formData, cutoffDate: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* Section: Signature */}
                        <div style={{ marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                                <div style={{ background: 'var(--color-accent-blue)', padding: '6px', borderRadius: '8px', color: '#fff' }}>
                                    <PenTool size={18} />
                                </div>
                                <h3 style={{ fontSize: '16px', margin: 0 }}>Firma de Conformidad</h3>
                            </div>
                            
                            <div style={{
                                background: 'white',
                                borderRadius: '12px',
                                border: '2px solid var(--color-glass-border)',
                                height: '180px',
                                position: 'relative'
                            }}>
                                <SignatureCanvas
                                    ref={sigCanvasRef}
                                    penColor="#111"
                                    canvasProps={{
                                        width: 380,
                                        height: 180,
                                        className: 'sigCanvas',
                                        style: { width: '100%', height: '100%' }
                                    }}
                                />
                                <button 
                                    type="button"
                                    onClick={() => sigCanvasRef.current?.clear()}
                                    style={{
                                        position: 'absolute', top: '10px', right: '10px',
                                        background: 'rgba(0,0,0,0.1)', border: 'none', padding: '4px', borderRadius: '4px'
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Summary & Submit */}
                        <div style={{ 
                            background: 'var(--color-accent-orange-glass)', 
                            padding: '20px', 
                            borderRadius: '16px', 
                            border: '1px solid var(--color-accent-orange)',
                            marginTop: '20px'
                        }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontSize: '13px', opacity: 0.8 }}>Total a Cobrar:</span>
                                <span style={{ fontSize: '16px', fontWeight: 800 }}>${formData.isCustomPlan ? formData.customPlanPrice || 0 : plans.find(p => p.name === formData.plan)?.price || 0}</span>
                             </div>
                             <p style={{ fontSize: '11px', margin: '0 0 15px', opacity: 0.7 }}>Incluye inscripción y primer mes de membresía.</p>

                             <button 
                                type="submit" 
                                disabled={loading}
                                className="btn-primary" 
                                style={{ 
                                    width: '100%', 
                                    minHeight: '48px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    background: 'var(--color-accent-orange)',
                                    color: '#000',
                                    border: 'none',
                                    fontWeight: 700
                                }}
                            >
                                {loading ? 'Procesando...' : (
                                    <>
                                        <Check size={20} />
                                        Completar Registro y Cobro
                                    </>
                                )}
                             </button>
                        </div>
                    </div>
                </form>
            </div>

            <style>{`
                .sigCanvas { cursor: crosshair; }
            `}</style>
        </div>
    );
};

export default OnboardingModal;
