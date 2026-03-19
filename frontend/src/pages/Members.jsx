import React, { useState, useEffect } from 'react';
import { 
    Plus, LayoutGrid, List, Users, Filter, ChevronRight, MessageCircle 
} from 'lucide-react';
import HelpTooltip from '../components/HelpTooltip';
import OnboardingModal from '../components/OnboardingModal';
import ModuleMetricBar from '../components/ModuleMetricBar';
import ConfirmModal from '../components/ConfirmModal';
import SearchInput from '../components/SearchInput';
import MemberCard from '../features/members/MemberCard';
import MemberDetailModal from '../features/members/MemberDetailModal';
import { useMembersData } from '../features/members/useMembersData';
import { fmtDate, initials } from '../utils/formatters';
import { api } from '../services/api';

const Members = () => {
    const { 
        members, 
        loading, 
        refetch, 
        deleteMember, 
        updateMember 
    } = useMembersData();
    
    const [plans, setPlans] = useState([]);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todos');
    const [viewMode, setViewMode] = useState('grid');
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const data = await api.getMemberships();
                setPlans(data);
            } catch (err) { console.error(err); }
        };
        fetchPlans();
    }, []);

    const filtered = members.filter(m => {
        const matchSearch = (m.name + m.email).toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'Todos' || m.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        await deleteMember(confirmDeleteId);
        setConfirmDeleteId(null);
        setSelectedMember(null);
    };

    if (loading && members.length === 0) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
                <div className="pulse-hover">
                    <Users size={48} className="text-muted" style={{ opacity: 0.2 }} />
                </div>
                <p className="text-muted">Desplegando comunidad activa...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <header className="page-header stagger-1 flex-responsive">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h1 className="page-title">Comunidad REP</h1>
                        <HelpTooltip
                            title="Gestión de Miembros"
                            content="CRM centralizado. Gestiona suscripciones, historial y perfiles de los atletas en un solo lugar."
                        />
                    </div>
                    <p className="page-subtitle text-muted">
                        Hay <span className="text-success" style={{ fontWeight: 700 }}>{(members || []).filter(m => (m.status || '').toLowerCase() === 'activo').length}</span> atletas entrenando hoy
                    </p>
                </div>
                <button className="btn-primary" onClick={() => setShowOnboarding(true)}>
                    <Plus size={18} /> Nuevo Registro
                </button>
            </header>

            <ModuleMetricBar stats={[
                { label: 'Suscritos', value: (members || []).filter(m => (m.status || '').toLowerCase() === 'activo').length, color: 'var(--color-success)' },
                { label: 'Ex-Atletas', value: (members || []).filter(m => (m.status || '').toLowerCase() === 'inactivo').length, color: 'var(--color-danger)' },
                { label: 'Ecosistema', value: (members || []).length, color: 'var(--color-accent-orange)' },
                { label: 'Segmentados', value: (filtered || []).length, color: '#4da6ff' },
            ]} />

            <div className="flex-responsive" style={{ marginBottom: 32, alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="flex-responsive" style={{ flex: 1, minWidth: 'min(300px, 100%)' }}>
                    <SearchInput 
                        placeholder="Buscar por nombre, email o ID..." 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                    />
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 4, border: '1px solid var(--color-glass-border)' }}>
                        {['Todos', 'Activo', 'Inactivo'].map(f => (
                            <button 
                                key={f} 
                                className={filterStatus === f ? 'btn-primary' : 'btn-ghost'}
                                style={{ 
                                    padding: '6px 16px', 
                                    fontSize: '11px', 
                                    fontWeight: 700,
                                    borderRadius: 8,
                                    background: filterStatus === f ? 'var(--color-accent-orange)' : 'transparent',
                                    color: filterStatus === f ? '#000' : 'inherit',
                                    border: 'none'
                                }}
                                onClick={() => setFilterStatus(f)}
                            >
                                {f.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 4, border: '1px solid var(--color-glass-border)' }}>
                    <button 
                        onClick={() => setViewMode('grid')} 
                        className="btn-ghost"
                        style={{ padding: '8px 12px', background: viewMode === 'grid' ? 'rgba(255,255,255,0.05)' : 'transparent', borderRadius: 8 }}
                    >
                        <LayoutGrid size={18} className={viewMode === 'grid' ? 'text-orange' : ''} />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')} 
                        className="btn-ghost"
                        style={{ padding: '8px 12px', background: viewMode === 'list' ? 'rgba(255,255,255,0.05)' : 'transparent', borderRadius: 8 }}
                    >
                        <List size={18} className={viewMode === 'list' ? 'text-orange' : ''} />
                    </button>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="glass-panel" style={{ padding: '100px 20px', textAlign: 'center', borderStyle: 'dashed' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <Users size={40} style={{ color: 'var(--color-text-muted)', opacity: 0.3 }} />
                    </div>
                    <h3 style={{ fontSize: 18, marginBottom: 8 }}>Sin Resultados</h3>
                    <p style={{ color: 'var(--color-text-muted)', maxWidth: 400, margin: '0 auto' }}>
                        No encontramos atletas que coincidan con <strong>"{search}"</strong> en el segmento de <strong>{filterStatus}</strong>.
                    </p>
                    <button className="btn-ghost" style={{ marginTop: 24 }} onClick={() => { setSearch(''); setFilterStatus('Todos'); }}>Limpiar Filtros</button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="responsive-grid">
                    {filtered.map((m, idx) => (
                        <div className={`stagger-${(idx % 5) + 1}`} key={m.id}>
                            <MemberCard member={m} onClick={() => setSelectedMember(m)} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass-panel mobile-full stagger-2" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="table-container">
                        <table className="modern-table clickable-rows">
                            <thead>
                                <tr>
                                    <th>Atleta</th>
                                    <th>Plan Contratado</th>
                                    <th>Próximo Corte</th>
                                    <th>Estado</th>
                                    <th style={{ textAlign: 'right' }}>Análisis</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(m => (
                                    <tr key={m.id} onClick={() => setSelectedMember(m)}>
                                        <td data-label="Atleta">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                                <div className="avatar-small" style={{ background: 'var(--color-accent-orange)15', color: 'var(--color-accent-orange)', fontWeight: 800 }}>
                                                    {initials(m.name)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{m.name}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <MessageCircle size={10}/> {m.phone || 'Sin WhatsApp'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="Plan">
                                            <span style={{ fontWeight: 600, fontSize: 13 }}>{m.plan}</span>
                                        </td>
                                        <td data-label="Corte" className="text-muted" style={{ fontSize: 13 }}>{fmtDate(m.expiration_date)}</td>
                                        <td data-label="Estado">
                                            <span className={`status-badge ${m.status === 'Activo' ? 'success' : 'danger'}`}>
                                                {m.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td data-label="Perfil" style={{ textAlign: 'right' }}>
                                            <button className="btn-ghost" style={{ padding: 8 }} onClick={(e) => { e.stopPropagation(); setSelectedMember(m); }}>
                                                <ChevronRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODALS */}
            {showOnboarding && (
                <OnboardingModal 
                    plans={plans} 
                    onClose={() => setShowOnboarding(false)} 
                    onSuccess={() => { setShowOnboarding(false); refetch(); }} 
                />
            )}

            {selectedMember && (
                <MemberDetailModal 
                    member={selectedMember}
                    isOpen={!!selectedMember}
                    onClose={() => setSelectedMember(null)}
                    onUpdate={updateMember}
                    onDelete={(id) => setConfirmDeleteId(id)}
                />
            )}

            <ConfirmModal 
                isOpen={!!confirmDeleteId}
                title="¿Eliminar miembro?"
                message="Esta acción es irreversible. Se perderá todo el historial de pagos, asistencias y rutinas del atleta."
                onConfirm={handleDelete}
                onCancel={() => setConfirmDeleteId(null)}
                type="danger"
            />
        </div>
    );
};

export default Members;
