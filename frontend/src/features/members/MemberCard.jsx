import React from 'react';
import { User, Phone, Calendar, ArrowRight } from 'lucide-react';
import { fmtDate, initials } from '../../utils/formatters';

const MemberCard = ({ member, onClick }) => {
    const isExpired = member.expiration_date && new Date(member.expiration_date) < new Date();
    const isExpiringSoon = !isExpired && member.expiration_date && 
        (new Date(member.expiration_date) - new Date()) / (1000 * 60 * 60 * 24) < 5;

    const statusColor = isExpired ? 'var(--color-danger)' : isExpiringSoon ? 'var(--color-accent-orange)' : 'var(--color-success)';

    return (
        <div 
            className="glass-panel glass-hover stagger-1" 
            style={{ 
                padding: '20px', 
                cursor: 'pointer',
                borderLeft: `4px solid ${statusColor}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
            }}
            onClick={onClick}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div className="avatar" style={{ width: '46px', height: '46px', fontSize: '18px' }}>
                        {initials(member.name)}
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{member.name}</h3>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{member.plan || 'Sin plan'}</span>
                    </div>
                </div>
                <div style={{ 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    background: `${statusColor}22`, 
                    color: statusColor,
                    fontSize: '11px',
                    fontWeight: '700',
                    textTransform: 'uppercase'
                }}>
                    {isExpired ? 'Vencido' : isExpiringSoon ? 'Por vencer' : 'Activo'}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                    <Calendar size={14} />
                    <span>Vence: {fmtDate(member.expiration_date)}</span>
                </div>
                {member.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                        <Phone size={14} />
                        <span>{member.phone}</span>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '5px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    Ver Ficha <ArrowRight size={14} />
                </button>
            </div>
        </div>
    );
};

export default MemberCard;
