import React, { useState, useEffect } from 'react';
import {
    Search, User, Edit2, Trash2, X, Plus,
    LayoutGrid, List, Phone, Mail, Calendar,
    Award, Activity, Clock, CheckCircle, AlertTriangle,
    MessageCircle, BarChart2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import HelpTooltip from '../components/HelpTooltip';
import OnboardingModal from '../components/OnboardingModal';
import ModuleMetricBar from '../components/ModuleMetricBar';
import ConfirmModal from '../components/ConfirmModal';

/* ── helper ──────────────────────────────────────── */
const statusColor = (s) => s === 'Activo' ? 'var(--color-success)' : 'var(--color-danger)';
const initials = (name = '') => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
const fmtDate = (val) => {
    if (!val) return '—';
    const d = new Date(val);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};
const daysSince = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return Math.floor((Date.now() - d.getTime()) / 86400000);
};

/* ── Full Member Detail Modal ────────────────────── */
const MemberDetailModal = ({ member, plans, onClose, onEdit, onDelete }) => {
    const days = daysSince(member.lastVisit);
    const riskLevel = !member.lastVisit ? 'Alta' : days > 30 ? 'Alta' : days > 15 ? 'Media' : 'Baja';
    const riskColor = { Alta: 'var(--color-danger)', Media: 'var(--color-accent-orange)', Baja: 'var(--color-success)' }[riskLevel];
    const planPrice = plans.find(p => p.name === member.plan)?.price || '—';

    const sendWA = () => {
        if (!member.phone) return alert('Sin número de teléfono registrado.');
        let n = member.phone.replace(/\D/g, '');
        if (n.length === 10) n = '521' + n;
        window.open(`https://api.whatsapp.com/send?phone=${n}&text=${encodeURIComponent(`¡Hola ${member.name}! 👋 Te contactamos desde REP Calisthenics.`)}`, '_blank');
    };

    return (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
            <div style={{
                width: '100%', maxWidth: '560px',
                background: 'var(--color-bg-secondary, #111)',
                border: '1px solid var(--color-glass-border)',
                borderRadius: 20, overflow: 'hidden', margin: 'auto',
                boxShadow: '0 40px 100px rgba(0,0,0,0.85)',
                animation: 'modal-appear 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                color: 'var(--color-text-main)',
            }}>
                {/* top banner */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(244,140,37,0.2) 0%, rgba(0,0,0,0) 100%)',
                    padding: '28px 28px 20px',
                    borderBottom: '1px solid var(--color-glass-border)',
                    position: 'relative',
                }}>
                    <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                        <X size={20} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                        {/* avatar */}
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
                            background: `linear-gradient(135deg, var(--color-accent-orange), #ff6b35)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 24, fontWeight: 800, color: '#fff',
                            border: '3px solid rgba(255,255,255,0.1)',
                        }}>
                            {initials(member.name)}
                        </div>
                        <div>
                            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{member.name}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                                <span style={{
                                    background: `${statusColor(member.status)}22`,
                                    color: statusColor(member.status),
                                    border: `1px solid ${statusColor(member.status)}44`,
                                    borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600
                                }}>
                                    {member.status}
                                </span>
                                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                                    Plan: <strong style={{ color: 'var(--color-accent-orange)' }}>{member.plan || '—'}</strong>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* body */}
                <div style={{ padding: '22px 28px', maxHeight: '65vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Contact */}
                    <div>
                        <h4 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-text-muted)', marginBottom: 12 }}>Contacto</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {[
                                { icon: Mail, label: 'Email', value: member.email || '—' },
                                { icon: Phone, label: 'Teléfono', value: member.phone || '—' },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    <Icon size={15} color="var(--color-accent-orange)" style={{ marginTop: 2, flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{label}</div>
                                        <div style={{ fontSize: 13, fontWeight: 500, wordBreak: 'break-all' }}>{value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Membership */}
                    <div>
                        <h4 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-text-muted)', marginBottom: 12 }}>Membresía</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                            {[
                                { icon: Award, label: 'Plan', value: member.plan || '—' },
                                { icon: Calendar, label: 'Ingreso', value: fmtDate(member.joinDate || member.createdAt) },
                                { icon: Clock, label: 'Fecha de Corte', value: fmtDate(member.cutoffDate) },
                                { icon: CheckCircle, label: 'Precio Mensual', value: planPrice !== '—' ? `$${planPrice}` : '—' },
                                { icon: Activity, label: 'Visitas Totales', value: member.visitsCount ?? '—' },
                                { icon: Clock, label: 'Última Visita', value: fmtDate(member.lastVisit) },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', borderRadius: 10, padding: '12px 14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                                        <Icon size={12} color="var(--color-text-muted)" />
                                        <span style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</span>
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{value}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Risk indicator */}
                    <div style={{ background: `${riskColor}11`, border: `1px solid ${riskColor}33`, borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <AlertTriangle size={16} color={riskColor} />
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: riskColor }}>Riesgo de Abandono: {riskLevel}</div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                                    {days !== null ? `Última visita hace ${days} días` : 'Sin visitas registradas'}
                                </div>
                            </div>
                        </div>
                        <div style={{ width: 80, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                            <div style={{ width: riskLevel === 'Alta' ? '90%' : riskLevel === 'Media' ? '55%' : '20%', height: '100%', background: riskColor, borderRadius: 3 }} />
                        </div>
                    </div>

                    {/* Recent Activity / Account Breakdown */}
                    <div>
                        <h4 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-text-muted)', marginBottom: 12 }}>Actividad Reciente</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {member.lastVisit ? (
                                <div style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', borderRadius: 10, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)' }}></div>
                                        <span style={{ fontSize: 13 }}>Última entrada registrada</span>
                                    </div>
                                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{fmtDate(member.lastVisit)}</span>
                                </div>
                            ) : null}
                            <div style={{ background: 'var(--color-glass)', border: '1px solid var(--color-glass-border)', borderRadius: 10, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-accent-orange)' }}></div>
                                    <span style={{ fontSize: 13 }}>Pago de membresía: {member.plan}</span>
                                </div>
                                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{fmtDate(member.joinDate || member.createdAt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Signature preview */}
                    {member.signature && (
                        <div>
                            <h4 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--color-text-muted)', marginBottom: 8 }}>Firma Digital</h4>
                            <div style={{ background: '#fff', border: '1px solid var(--color-glass-border)', borderRadius: 10, padding: 12, textAlign: 'center', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)' }}>
                                <img src={member.signature} alt="Firma" style={{ maxHeight: 70, maxWidth: '100%', filter: 'contrast(1.2)' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* footer */}
                <div style={{ padding: '14px 28px', borderTop: '1px solid var(--color-glass-border)', background: 'var(--color-glass)', display: 'flex', gap: 10 }}>
                    <button onClick={sendWA} className="btn-ghost" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}>
                        <MessageCircle size={15} color="#25D366" /> WhatsApp
                    </button>
                    <button onClick={() => onEdit(member)} className="btn-ghost" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}>
                        <Edit2 size={15} /> Editar
                    </button>
                    <button onClick={() => onDelete(member.id)} style={{ flex: 1, background: 'rgba(255,77,79,0.15)', color: 'var(--color-danger)', border: '1px solid rgba(255,77,79,0.3)', borderRadius: 8, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 40 }}>
                        <Trash2 size={15} /> Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ── Grid Card ───────────────────────────────────── */
const MemberCard = ({ member, onClick }) => {
    const days = daysSince(member.lastVisit);
    const risk = !member.lastVisit ? 'danger' : days > 30 ? 'danger' : days > 15 ? 'orange' : 'success';
    const riskMap = { danger: 'var(--color-danger)', orange: 'var(--color-accent-orange)', success: 'var(--color-success)' };

    return (
        <div
            onClick={onClick}
            className="glass-panel"
            style={{ cursor: 'pointer', padding: 20, display: 'flex', flexDirection: 'column', gap: 14, transition: 'transform 0.2s, box-shadow 0.2s', borderTop: `2px solid ${riskMap[risk]}` }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
        >
            {/* Avatar + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                    width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${riskMap[risk]}88, ${riskMap[risk]}44)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: riskMap[risk],
                    border: `2px solid ${riskMap[risk]}44`,
                }}>
                    {initials(member.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.email || '—'}</div>
                </div>
            </div>

            {/* Info pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ background: `${riskMap[risk === 'orange' ? 'orange' : risk]}15`, color: riskMap[risk], border: `1px solid ${riskMap[risk]}33`, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                    {member.status}
                </span>
                {member.plan && (
                    <span style={{ background: 'rgba(244,140,37,0.1)', color: 'var(--color-accent-orange)', border: '1px solid rgba(244,140,37,0.3)', borderRadius: 20, padding: '2px 8px', fontSize: 11 }}>
                        {member.plan}
                    </span>
                )}
            </div>

            {/* Bottom row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)', borderTop: '1px solid var(--color-glass-border)', paddingTop: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={10} /> {fmtDate(member.joinDate || member.createdAt)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Activity size={10} /> {days !== null ? `${days}d sin visita` : 'Sin visitas'}
                </span>
            </div>
        </div>
    );
};

/* ── Main Component ─────────────────────────────── */
const Members = () => {
    const [members, setMembers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showOnboardingModal, setShowOnboardingModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMember, setEditingMember] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todos');
    const [viewMode, setViewMode] = useState('grid');
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', plan: '', status: 'Activo' });
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const data = await api.getMembers();
            setMembers(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchPlans = async () => {
        try {
            const data = await api.getMemberships();
            setPlans(data);
            if (data.length > 0) setFormData(f => ({ ...f, plan: data[0].name }));
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        fetchMembers();
        fetchPlans();
    }, []);

    const filtered = members.filter(m => {
        const matchSearch = m.name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'Todos' || m.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const handleEdit = (member) => {
        setEditingMember(member);
        setFormData({
            name: member.name,
            email: member.email,
            phone: member.phone || '',
            plan: member.plan,
            status: member.status
        });
        setSelectedMember(null);
        setShowEditModal(true);
    };

    const handleDelete = async () => {
        if (!confirmDelete.id) return;
        try {
            await api.deleteMember(confirmDelete.id);
            setConfirmDelete({ open: false, id: null });
            setSelectedMember(null);
            await fetchMembers();
        } catch (err) { console.error(err); }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.updateMember(editingMember.id, formData);
            setShowEditModal(false);
            setEditingMember(null);
            await fetchMembers();
        } catch (err) { console.error(err); }
    };

    const activeCount = members.filter(m => m.status === 'Activo').length;

    return (
        <div className="animate-fade-in">
            {/* HEADER */}
            <header className="page-header stagger-1">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <h1 className="page-title">Comunidad Activa</h1>
                        <HelpTooltip
                            title="CRM de Miembros"
                            content="Base de datos central de atletas. Usa 'Nuevo Miembro' para el alta con firma digital. Alterna entre vista lista y cuadrícula. Haz clic en cualquier miembro para ver su ficha completa."
                        />
                    </div>
                    <p className="page-subtitle text-muted">{activeCount} activos · {members.length} total</p>
                </div>
                <button className="btn-primary" onClick={() => setShowOnboardingModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Plus size={18} /> Nuevo Miembro
                </button>
            </header>

            {/* ONBOARDING */}
            {showOnboardingModal && (
                <OnboardingModal
                    plans={plans}
                    onClose={() => setShowOnboardingModal(false)}
                    onSuccess={() => { setShowOnboardingModal(false); fetchMembers(); }}
                />
            )}

            {/* EDIT MODAL */}
            {showEditModal && (
                <div className="modal-overlay" style={{ zIndex: 99999 }}>
                    <div style={{ width: '100%', maxWidth: 460, background: 'var(--color-bg-secondary,#111)', border: '1px solid var(--color-glass-border)', borderRadius: 20, padding: 28, margin: 'auto', boxShadow: '0 40px 100px rgba(0,0,0,0.8)', animation: 'modal-appear 0.3s cubic-bezier(0.34,1.56,0.64,1)', color: 'var(--color-text-main)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 18 }}>Editar Miembro</h2>
                            <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {['name', 'email', 'phone'].map(field => (
                                <div key={field} className="form-group">
                                    <label style={{ textTransform: 'capitalize' }}>{field === 'name' ? 'Nombre' : field === 'email' ? 'Email' : 'Teléfono'}</label>
                                    <input type={field === 'email' ? 'email' : 'text'} className="form-input" value={formData[field]} onChange={e => setFormData({ ...formData, [field]: e.target.value })} />
                                </div>
                            ))}
                            <div className="form-group">
                                <label>Plan</label>
                                <select className="form-input" value={formData.plan} onChange={e => setFormData({ ...formData, plan: e.target.value })}>
                                    {plans.map(p => <option key={p.id} value={p.name}>{p.name} (${p.price})</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Estado</label>
                                <select className="form-input" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option>Activo</option>
                                    <option>Inactivo</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary" style={{ flex: 2 }}>Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DETAIL MODAL */}
            {selectedMember && (
                <MemberDetailModal
                    member={selectedMember}
                    plans={plans}
                    onClose={() => setSelectedMember(null)}
                    onEdit={handleEdit}
                    onDelete={(id) => setConfirmDelete({ open: true, id })}
                />
            )}

            <ModuleMetricBar stats={[
                { label: 'Activos', value: members.filter(m => m.status === 'Activo').length, color: 'var(--color-success)' },
                { label: 'Inactivos', value: members.filter(m => m.status === 'Inactivo').length, color: 'var(--color-danger)' },
                { label: 'Total', value: members.length, color: 'var(--color-accent-orange)' },
                { label: 'Filtrados', value: filtered.length, color: '#4da6ff' },
            ]} />

            {/* TOOLBAR */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                    <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input type="text" className="form-input" placeholder="Buscar por nombre o email…" style={{ paddingLeft: 42 }} value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {['Todos', 'Activo', 'Inactivo'].map(f => (
                    <button key={f} className={filterStatus === f ? 'btn-primary' : 'btn-ghost'}
                        style={{ padding: '8px 16px', minHeight: 40, fontSize: 13 }}
                        onClick={() => setFilterStatus(f)}>
                        {f}
                    </button>
                ))}
                <div style={{ display: 'flex', border: '1px solid var(--color-glass-border)', borderRadius: 8, overflow: 'hidden' }}>
                    <button onClick={() => setViewMode('list')} style={{ padding: '8px 12px', background: viewMode === 'list' ? 'var(--color-accent-orange)' : 'transparent', border: 'none', cursor: 'pointer', color: viewMode === 'list' ? '#fff' : 'var(--color-text-muted)', transition: 'all 0.2s' }}>
                        <List size={16} />
                    </button>
                    <button onClick={() => setViewMode('grid')} style={{ padding: '8px 12px', background: viewMode === 'grid' ? 'var(--color-accent-orange)' : 'transparent', border: 'none', cursor: 'pointer', color: viewMode === 'grid' ? '#fff' : 'var(--color-text-muted)', transition: 'all 0.2s' }}>
                        <LayoutGrid size={16} />
                    </button>
                </div>
            </div>

            {/* GRID VIEW */}
            {viewMode === 'grid' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                    {filtered.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--color-text-muted)', padding: '40px 0' }}>Sin resultados</p>}
                    {filtered.map(m => (
                        <MemberCard key={m.id} member={m} onClick={() => setSelectedMember(m)} />
                    ))}
                </div>
            )}

            {/* LIST VIEW */}
            {viewMode === 'list' && (
                <div className="glass-panel mobile-full" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-container">
                        <table className="modern-table clickable-rows" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th>Atleta</th>
                                    <th>Contacto</th>
                                    <th>Plan</th>
                                    <th>Ingreso</th>
                                    <th>Estado</th>
                                    <th style={{ textAlign: 'right' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: 30, color: '#888' }}>Sin miembros todavía</td></tr>
                                ) : filtered.map(m => (
                                    <tr key={m.id} onClick={() => setSelectedMember(m)} style={{ cursor: 'pointer' }}>
                                        <td>
                                            <div className="user-cell">
                                                <div className="avatar-small" style={{ background: `${statusColor(m.status)}22`, color: statusColor(m.status) }}>
                                                    {initials(m.name)}
                                                </div>
                                                <span style={{ fontWeight: 500 }}>{m.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{m.email}</td>
                                        <td><span style={{ color: 'var(--color-accent-orange)', fontWeight: 500 }}>{m.plan}</span></td>
                                        <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{fmtDate(m.joinDate || m.createdAt)}</td>
                                        <td>
                                            <span style={{ background: `${statusColor(m.status)}22`, color: statusColor(m.status), border: `1px solid ${statusColor(m.status)}44`, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
                                                {m.status}
                                            </span>
                                        </td>
                                        <td onClick={e => e.stopPropagation()}>
                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                <button className="btn-ghost" style={{ padding: 5 }} title="Editar" onClick={() => handleEdit(m)}>
                                                    <Edit2 size={15} color="var(--color-text-muted)" />
                                                </button>
                                                <button className="btn-ghost" style={{ padding: 5 }} title="Eliminar" onClick={() => setConfirmDelete({ open: true, id: m.id })}>
                                                    <Trash2 size={15} color="var(--color-danger)" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <ConfirmModal 
                isOpen={confirmDelete.open}
                title="¿Eliminar Miembro?"
                message="Esta acción eliminará permanentemente al miembro y sus registros históricos de acceso. Esta acción no se puede revertir."
                confirmText="No se puede deshacer"
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete({ open: false, id: null })}
                type="danger"
            />
        </div>
    );
};

export default Members;
