import React, { useState, useEffect } from 'react';
import { 
    Plus, ArrowDownCircle, PieChart as PieChartIcon, Trash2, 
    Settings, Receipt, Calendar, ChevronRight, X, Save,
    TrendingDown, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import HelpTooltip from '../components/HelpTooltip';
import ModuleMetricBar from '../components/ModuleMetricBar';
import ConfirmModal from '../components/ConfirmModal';
import BaseModal from '../components/BaseModal';
import SearchInput from '../components/SearchInput';
import { fmtCurrency, fmtDate } from '../utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const Expenses = () => {
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showCatModal, setShowCatModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ totalMonthly: 0, byCategory: [] });
    const [confirmDeleteCat, setConfirmDeleteCat] = useState(null);
    const [newCatName, setNewCatName] = useState('');
    
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: '',
        customCategory: '',
        date: new Date().toISOString().split('T')[0]
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [expensesData, catsData] = await Promise.all([
                api.getExpenses(),
                api.getExpenseCategories()
            ]);
            
            setExpenses(expensesData);
            setCategories(catsData);
            
            if (catsData.length > 0 && !formData.category) {
                setFormData(prev => ({ ...prev, category: catsData[0].name }));
            }

            let total = 0;
            const catMap = {};
            expensesData.forEach(ex => {
                const amt = parseFloat(ex.amount) || 0;
                total += amt;
                catMap[ex.category] = (catMap[ex.category] || 0) + amt;
            });

            const COLORS = ['#ff4d4d', '#ff7300', '#4da6ff', '#8884d8', '#00C49F', '#FFBB28'];
            const formattedStats = Object.entries(catMap).map(([name, value], index) => ({
                name,
                value,
                color: COLORS[index % COLORS.length]
            })).sort((a, b) => b.value - a.value);

            setStats({ totalMonthly: total, byCategory: formattedStats });
        } catch (err) {
            console.error('Error fetching expenses:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = expenses.filter(ex => 
        ex.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        ex.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const finalCategory = formData.category === 'Personalizada' ? formData.customCategory : formData.category;
            await api.createExpense({
                ...formData,
                amount: parseFloat(formData.amount),
                category: finalCategory,
                recorded_by: user?.id
            });
            setShowModal(false);
            setFormData(prev => ({
                ...prev,
                description: '',
                amount: '',
                customCategory: ''
            }));
            await fetchData();
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCatName.trim()) return;
        try {
            await api.createExpenseCategory(newCatName);
            setNewCatName('');
            await fetchData();
        } catch (err) { alert(err.message); }
    };

    const handleDeleteCategory = async () => {
        if (!confirmDeleteCat) return;
        try {
            await api.deleteExpenseCategory(confirmDeleteCat.id);
            setConfirmDeleteCat(null);
            await fetchData();
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="animate-fade-in">
            <header className="page-header stagger-1 flex-responsive">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h1 className="page-title">Egresos y Finanzas</h1>
                        <HelpTooltip title="Gestión de Gastos" content="Registra y categoriza cada salida de capital para mantener un balance financiero saludable." />
                    </div>
                    <p className="page-subtitle text-muted">Centro de control de flujo negativo</p>
                </div>
                <div className="flex-responsive" style={{ gap: 12 }}>
                    <button className="btn-ghost" onClick={() => setShowCatModal(true)}>
                        <Settings size={18} /> CONFIGURAR
                    </button>
                    <button className="btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> REGISTRAR GASTO
                    </button>
                </div>
            </header>

            <ModuleMetricBar stats={[
                { label: 'Egresos Mes', value: fmtCurrency(stats.totalMonthly), color: 'var(--color-danger)' },
                { label: 'Categorías', value: categories.length, color: 'var(--color-accent)' },
                { label: 'Operaciones', value: expenses.length, color: '#4da6ff' },
                { label: 'Impacto MRR', value: `${Math.round((stats.totalMonthly / 50000) * 100)}%`, color: 'var(--color-text-muted)' },
            ]} />

            <div className="dashboard-grid-main" style={{ marginBottom: 32 }}>
                {/* LISTING */}
                <div className="glass-panel stagger-2 mobile-full" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="flex-responsive" style={{ padding: 24, borderBottom: '1px solid var(--color-glass-border)', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Historial de Movimientos</h2>
                        <div style={{ flex: 1, minWidth: 'min(300px, 100%)', maxWidth: 400 }}>
                            <SearchInput placeholder="Filtrar movimientos..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                    <div className="table-container">
                        <table className="modern-table">
                            <thead>
                                <tr>
                                    <th>Concepto</th>
                                    <th>Categoría</th>
                                    <th>Fecha</th>
                                    <th style={{ textAlign: 'right' }}>Importe</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: 60 }}>
                                        <div className="spinner-modern" style={{ margin: '0 auto' }} />
                                    </td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: 80, color: 'var(--color-text-muted)' }}>
                                        <div style={{ opacity: 0.3, marginBottom: 12 }}><Receipt size={40} style={{ margin: '0 auto' }} /></div>
                                        Sin registros en este periodo
                                    </td></tr>
                                ) : filtered.map(ex => (
                                    <tr key={ex.id}>
                                        <td data-label="Concepto">
                                            <div style={{ fontWeight: 700, fontSize: 14 }}>{ex.description}</div>
                                            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <AlertCircle size={10}/> ID: {ex.id.substring(0,6)}
                                            </div>
                                        </td>
                                        <td data-label="Categoría">
                                            <span style={{ 
                                                fontSize: 10, 
                                                fontWeight: 800,
                                                background: 'rgba(255,255,255,0.05)', 
                                                padding: '4px 10px', 
                                                borderRadius: 20, 
                                                border: '1px solid var(--color-glass-border)',
                                                textTransform: 'uppercase',
                                                letterSpacing: 0.5
                                            }}>
                                                {ex.category}
                                            </span>
                                        </td>
                                        <td data-label="Fecha" className="text-muted" style={{ fontSize: 12 }}>{fmtDate(ex.date)}</td>
                                        <td data-label="Importe" style={{ textAlign: 'right' }}>
                                            <strong className="text-danger" style={{ fontSize: 16 }}>-{fmtCurrency(ex.amount)}</strong>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* DISTRIBUTION SIDEBAR */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="glass-panel stagger-3">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                            <div className="icon-wrapper orange" style={{ width: 32, height: 32 }}><PieChartIcon size={16} /></div>
                            <h3 style={{ fontSize: 16, fontWeight: 800 }}>Distribución de Gasto</h3>
                        </div>
                        
                        {stats.totalMonthly > 0 ? (
                            <>
                                <div style={{ height: 200, marginBottom: 24 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats.byCategory}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {stats.byCategory.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip 
                                                contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-glass-border)', borderRadius: 12, fontSize: 12 }} 
                                                itemStyle={{ color: '#fff' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {stats.byCategory.map((cat) => (
                                        <div key={cat.name}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, fontWeight: 700 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color }} />
                                                    {cat.name.toUpperCase()}
                                                </div>
                                                <span>{fmtCurrency(cat.value)}</span>
                                            </div>
                                            <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                                                <div style={{ 
                                                    height: '100%', 
                                                    background: cat.color, 
                                                    width: `${(cat.value / stats.totalMonthly) * 100}%` 
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.3 }}>
                                <TrendingDown size={40} style={{ margin: '0 auto 12px' }} />
                                <p style={{ fontSize: 13 }}>Sin datos de distribución</p>
                            </div>
                        )}
                    </div>

                    <div className="glass-panel stagger-4" style={{ background: 'rgba(255,77,77,0.02)', border: '1px dashed var(--color-danger)33', textAlign: 'center', padding: 24 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 800, marginBottom: 8 }}>Optimización de Costos</h4>
                        <p className="text-muted" style={{ fontSize: 11, lineHeight: 1.5 }}>Analizar los gastos hormiga puede reducir los egresos operativos hasta un 12% trimestral.</p>
                        <button className="btn-ghost" style={{ width: '100%', marginTop: 16, fontSize: 11, fontWeight: 700, borderColor: 'var(--color-danger)33' }}>DESCARGAR REPORTE</button>
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {showModal && (
                <BaseModal isOpen={showModal} onClose={() => setShowModal(false)} title="Nuevo Registro de Gasto">
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="form-group">
                            <label>CONCEPTO DEL GASTO</label>
                            <input required type="text" className="form-input" placeholder="Ej. Pago de Renta Marzo" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div className="form-group">
                                <label>IMPORTE TOTAL ($)</label>
                                <input required type="number" step="0.01" className="form-input" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                            </div>
                            <div className="form-group">
                                <label>CATEGORÍA</label>
                                <select className="form-input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    <option value="Personalizada">+ Personalizada...</option>
                                </select>
                            </div>
                        </div>
                        {formData.category === 'Personalizada' && (
                            <div className="form-group animate-slide-down">
                                <label>NOMBRE DE NUEVA CATEGORÍA</label>
                                <input required type="text" className="form-input" placeholder="Ej. Mantenimiento" value={formData.customCategory} onChange={e => setFormData({...formData, customCategory: e.target.value})} />
                            </div>
                        )}
                        <div className="form-group">
                            <label>FECHA DE OPERACIÓN</label>
                            <input type="date" className="form-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                            <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>CANCELAR</button>
                            <button type="submit" className="btn-primary" style={{ flex: 2, gap: 8 }}>
                                <Save size={18}/> GUARDAR MOVIMIENTO
                            </button>
                        </div>
                    </form>
                </BaseModal>
            )}

            {showCatModal && (
                <BaseModal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title="Configurar Categorías">
                    <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
                        <input required type="text" className="form-input" placeholder="Nueva categoría..." value={newCatName} onChange={e => setNewCatName(e.target.value)} />
                        <button type="submit" className="btn-primary" style={{ padding: '0 20px' }}><Plus size={20} /></button>
                    </form>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 350, overflowY: 'auto', paddingRight: 4 }}>
                        {categories.map(cat => (
                            <div key={cat.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.02)' }}>
                                <span style={{ fontWeight: 700, fontSize: 13 }}>{cat.name.toUpperCase()}</span>
                                <button className="btn-ghost" style={{ padding: 6, color: 'var(--color-danger)', borderRadius: 8 }} onClick={() => setConfirmDeleteCat(cat)}><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>
                </BaseModal>
            )}

            <ConfirmModal 
                isOpen={!!confirmDeleteCat}
                title="¿Eliminar categoría?"
                message={`Al eliminar "${confirmDeleteCat?.name}", los gastos asociados permanecerán pero sin categoría asignada.`}
                onConfirm={handleDeleteCategory}
                onCancel={() => setConfirmDeleteCat(null)}
                type="danger"
            />
        </div>
    );
};

export default Expenses;
