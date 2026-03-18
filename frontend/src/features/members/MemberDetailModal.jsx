import React, { useState } from 'react';
import { 
    X, Phone, Calendar, Mail, User, Shield, 
    Edit2, Trash2, MessageCircle, Save, CheckCircle 
} from 'lucide-react';
import BaseModal from '../../components/BaseModal';
import { fmtDate, daysSince } from '../../utils/formatters';

const MemberDetailModal = ({ member, isOpen, onClose, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...member });

    if (!member) return null;

    const handleSave = async () => {
        await onUpdate(member.id, editData);
        setIsEditing(false);
    };

    const handleWhatsApp = () => {
        const cleanPhone = member.phone?.replace(/\D/g, '');
        const msg = `Hola ${member.name}, te contactamos desde REP Calisthenics para...`;
        window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const isExpired = member.expiration_date && new Date(member.expiration_date) < new Date();
    const statusColor = isExpired ? 'var(--color-danger)' : 'var(--color-success)';

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? 'Editar Miembro' : 'Ficha del Miembro'}
            maxWidth={500}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Header Profile Section */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div className="avatar" style={{ width: '64px', height: '64px', fontSize: '24px' }}>
                        {member.name?.[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                        {isEditing ? (
                            <input 
                                className="form-input" 
                                value={editData.name} 
                                onChange={e => setEditData({...editData, name: e.target.value})}
                                style={{ fontSize: '1.2rem', fontWeight: 'bold' }}
                            />
                        ) : (
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>{member.name}</h2>
                        )}
                        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{member.plan || 'Plan no especificado'}</p>
                    </div>
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group">
                        <label>Teléfono</label>
                        {isEditing ? (
                            <input className="form-input" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Phone size={16} color="var(--color-text-muted)" />
                                <span>{member.phone || 'No registrado'}</span>
                            </div>
                        )}
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        {isEditing ? (
                            <input className="form-input" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} />
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Mail size={16} color="var(--color-text-muted)" />
                                <span>{member.email || 'No registrado'}</span>
                            </div>
                        )}
                    </div>
                    <div className="form-group">
                        <label>Vencimiento</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={16} color={statusColor} />
                            <span style={{ fontWeight: '600', color: statusColor }}>{fmtDate(member.expiration_date)}</span>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Estado</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle size={16} color={statusColor} />
                            <span style={{ color: statusColor, fontWeight: '700' }}>{isExpired ? 'VENCIDO' : 'ACTIVO'}</span>
                        </div>
                    </div>
                </div>

                {/* Statistics / Quick Info */}
                {!isEditing && (
                    <div className="glass-panel" style={{ padding: '15px', background: 'var(--color-bg-secondary)', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                        <div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Inasistencia</div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: daysSince(member.last_visit) > 7 ? 'var(--color-danger)' : 'inherit' }}>
                                {daysSince(member.last_visit) ?? '—'} <span style={{ fontSize: '12px' }}>días</span>
                            </div>
                        </div>
                        <div style={{ borderLeft: '1px solid var(--color-glass-border)' }}></div>
                        <div>
                            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Antigüedad</div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                {Math.floor(daysSince(member.created_at) / 30) || 0} <span style={{ fontSize: '12px' }}>meses</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                    {isEditing ? (
                        <>
                            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setIsEditing(false)}>Cancelar</button>
                            <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSave}>
                                <Save size={18} /> Guardar Cambios
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn-ghost" style={{ flex: 1 }} onClick={handleWhatsApp}>
                                <MessageCircle size={18} /> WhatsApp
                            </button>
                            <button className="btn-ghost" style={{ padding: '12px' }} onClick={() => setIsEditing(true)} title="Editar">
                                <Edit2 size={18} />
                            </button>
                            <button className="btn-ghost" style={{ padding: '12px', color: 'var(--color-danger)' }} onClick={() => onDelete(member.id)} title="Eliminar">
                                <Trash2 size={18} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </BaseModal>
    );
};

export default MemberDetailModal;
