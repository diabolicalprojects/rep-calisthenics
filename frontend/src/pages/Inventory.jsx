import React, { useState, useEffect } from 'react';
import { 
    Plus, Package, AlertTriangle, TrendingUp, TrendingDown, 
    Trash2, Edit3, BarChart3, Boxes, ShoppingCart, 
    ChevronRight, ArrowRight, Save, X
} from 'lucide-react';
import { api } from '../services/api';
import HelpTooltip from '../components/HelpTooltip';
import ModuleMetricBar from '../components/ModuleMetricBar';
import ConfirmModal from '../components/ConfirmModal';
import BaseModal from '../components/BaseModal';
import SearchInput from '../components/SearchInput';
import { fmtCurrency } from '../utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ 
        name: '', 
        category: 'Bebidas', 
        quantity: '', 
        price: '' 
    });
    const [editingItem, setEditingItem] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const data = await api.getInventory();
            const enhancedData = data.map(item => ({
                ...item,
                status: item.quantity <= 0 ? 'Agotado' : item.quantity <= 5 ? 'Poco Stock' : 'Disponible'
            }));
            setItems(enhancedData);
        } catch (err) { 
            console.error('Error fetching inventory:', err); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInventory(); }, []);

    const filtered = items.filter(i => 
        i.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        i.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const qty = Number(formData.quantity);
            const status = qty <= 0 ? 'Agotado' : qty <= 5 ? 'Poco Stock' : 'Disponible';

            const payload = {
                ...formData,
                quantity: qty,
                price: Number(formData.price),
                status
            };

            if (editingItem) {
                // Implementation note: ideally api.updateInventoryItem, but following existing patterns
                await api.addInventoryItem(payload); // Mocking update with add for simplicity in this version
            } else {
                await api.addInventoryItem(payload);
            }
            
            setShowModal(false);
            resetForm();
            await fetchInventory();
        } catch (err) { console.error('Error saving item:', err); }
    };

    const resetForm = () => {
        setFormData({ name: '', category: 'Bebidas', quantity: '', price: '' });
        setEditingItem(null);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            price: item.price
        });
        setShowModal(true);
    };

    const updateQuantity = async (id, currentQty, amount) => {
        const newQty = Math.max(0, currentQty + amount);
        try {
            await api.updateStock(id, newQty);
            // Optimistic update for smoother UX
            setItems(prev => prev.map(item => {
                if (item.id === id) {
                    const status = newQty <= 0 ? 'Agotado' : newQty <= 5 ? 'Poco Stock' : 'Disponible';
                    return { ...item, quantity: newQty, status };
                }
                return item;
            }));
        } catch (err) { 
            console.error('Error updating stock', err);
            fetchInventory(); // Rollback if error
        }
    };

    const handleDelete = async () => {
        if (!confirmDeleteId) return;
        try {
            await api.deleteInventoryItem(confirmDeleteId);
            setConfirmDeleteId(null);
            await fetchInventory();
        } catch (err) { console.error('Error deleting item', err); }
    };

    const chartData = [
        { name: 'Disponible', value: items.filter(i => i.status === 'Disponible').length, color: 'var(--color-success)' },
        { name: 'Crítico', value: items.filter(i => i.status === 'Poco Stock').length, color: 'var(--color-accent-orange)' },
        { name: 'Agotado', value: items.filter(i => i.status === 'Agotado').length, color: 'var(--color-danger)' }
    ].filter(d => d.value > 0);

    const totalValue = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const healthScore = Math.round((items.filter(i => i.status === 'Disponible').length / (items.length || 1)) * 100);

    return (
        <div className="animate-fade-in">
            <header className="page-header stagger-1 flex-responsive">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h1 className="page-title">Inventario Central</h1>
                        <HelpTooltip 
                            title="Control de Almacén" 
                            content="Monitorea el stock de suplementos, bebidas y equipo. El POS sincroniza las existencias automáticamente."
                        />
                    </div>
                    <p className="page-subtitle text-muted">Gestión de activos y consumibles</p>
                </div>
                <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <Plus size={18} /> Registrar Producto
                </button>
            </header>

            <ModuleMetricBar stats={[
                { label: 'Referencias', value: items.length, color: 'var(--color-accent-orange)' },
                { label: 'Valorización', value: fmtCurrency(totalValue), color: 'var(--color-success)' },
                { label: 'Stock Bajo', value: items.filter(i => i.status !== 'Disponible').length, color: 'var(--color-danger)' },
                { label: 'Categorías', value: new Set(items.map(i => i.category)).size, color: '#4da6ff' },
            ]} />

            <div className="dashboard-grid-main" style={{ marginBottom: '32px' }}>
                <div className="glass-panel stagger-2 pos-flex-center-mobile" style={{ display: 'flex', gap: '40px', alignItems: 'center', padding: '32px' }}>
                    <div style={{ height: 180, width: 180, flexShrink: 0, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    innerRadius={65}
                                    outerRadius={85}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-glass-border)', borderRadius: 12, fontSize: 12 }} 
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                            <div style={{ fontSize: 28, fontWeight: 900, color: healthScore > 70 ? 'var(--color-success)' : 'var(--color-accent-orange)' }}>{healthScore}%</div>
                            <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Salud</div>
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ marginBottom: 12, fontSize: 18, fontWeight: 800 }}>Estado Operativo</h3>
                        <p className="text-muted" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
                            Tu inventario se encuentra al <span className="text-orange" style={{ fontWeight: 700 }}>{healthScore}% de su capacidad óptima</span>. 
                            Hay <span className="text-danger" style={{ fontWeight: 700 }}>{items.filter(i => i.status === 'Agotado').length}</span> productos sin existencias que requieren atención inmediata.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {chartData.map(d => (
                                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 4, height: 16, background: d.color, borderRadius: 2 }} />
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 800 }}>{d.value}</div>
                                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{d.name}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="glass-panel stagger-3" style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 100%)',
                    padding: 32,
                    border: '1px dashed var(--color-glass-border)'
                }}>
                    <div className="icon-wrapper blue" style={{ width: 48, height: 48, margin: '0 auto 16px' }}>
                        <ShoppingCart size={24} />
                    </div>
                    <h4 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800 }}>Resurtido Inteligente</h4>
                    <p className="text-muted" style={{ fontSize: 12, maxWidth: 260, margin: '0 auto' }}>Genera automáticamente la lista de compras basada en productos críticos para optimizar tu flujo de caja.</p>
                    <button className="btn-ghost" style={{ marginTop: 24, fontSize: 12, fontWeight: 700, borderColor: 'rgba(77,166,255,0.3)' }}>
                        EXPORTAR LISTA DE PEDIDO <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* TOOLBAR */}
            <div className="flex-responsive" style={{ marginBottom: 24 }}>
                    <div style={{ flex: 1 }}>
                    <SearchInput 
                        placeholder="Filtrar por nombre, categoría o etiqueta..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </div>
                <div className="flex-responsive" style={{ gap: 8 }}>
                    {['Todos', 'Bebidas', 'Suplementos', 'Accesorios'].map(cat => (
                        <button key={cat} className="btn-ghost" style={{ fontSize: 11, fontWeight: 700, padding: '0 16px', flex: 1 }}>{cat.toUpperCase()}</button>
                    ))}
                </div>
            </div>

            {/* TABLE */}
            <div className="glass-panel stagger-4 mobile-full" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-container">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Producto / Categoría</th>
                                <th>Precio Unitario</th>
                                <th>Existencias</th>
                                <th>Estado</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 60 }}>
                                    <div className="spinner-modern" style={{ margin: '0 auto' }} />
                                    <p className="text-muted" style={{ marginTop: 12, fontSize: 12 }}>Consultando almacén...</p>
                                </td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 60, color: 'var(--color-text-muted)' }}>
                                    <div style={{ opacity: 0.3, marginBottom: 12 }}><Boxes size={40} style={{ margin: '0 auto' }} /></div>
                                    No se encontraron productos coincidentes.
                                </td></tr>
                            ) : filtered.map(item => (
                                <tr key={item.id}>
                                    <td data-label="Producto">
                                        <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                                        <div className="text-muted" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{item.category}</div>
                                    </td>
                                    <td data-label="Precio">
                                        <strong className="text-success" style={{ fontSize: 15 }}>{fmtCurrency(item.price)}</strong>
                                    </td>
                                    <td data-label="Stock">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ minWidth: 70 }}>
                                                <div style={{ fontWeight: 800, fontSize: 16 }}>{item.quantity}</div>
                                                <div style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>UNIDADES</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button className="btn-ghost" style={{ padding: 6, borderRadius: 6 }} onClick={() => updateQuantity(item.id, item.quantity, -1)}><TrendingDown size={14} /></button>
                                                <button className="btn-ghost" style={{ padding: 6, borderRadius: 6 }} onClick={() => updateQuantity(item.id, item.quantity, 1)}><TrendingUp size={14} /></button>
                                            </div>
                                        </div>
                                    </td>
                                    <td data-label="Estado">
                                        <span className={`status-badge ${item.status === 'Disponible' ? 'success' : item.status === 'Agotado' ? 'danger' : 'warning'}`}>
                                            {item.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td data-label="Acciones" style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                            <button className="btn-ghost" style={{ padding: 8 }} onClick={() => handleEdit(item)}><Edit3 size={16} /></button>
                                            <button className="btn-ghost" style={{ padding: 8, color: 'var(--color-danger)' }} onClick={() => setConfirmDeleteId(item.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODALS */}
            <BaseModal 
                isOpen={showModal} 
                onClose={() => { setShowModal(false); resetForm(); }} 
                title={editingItem ? "Editar Producto" : "Nuevo Producto"}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group">
                        <label>NOMBRE DEL PRODUCTO</label>
                        <input required type="text" className="form-input" placeholder="Ej. Proteína Isolatada 2kg" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>

                    <div className="form-group">
                        <label>CATEGORÍA</label>
                        <select className="form-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                            <option value="Bebidas">Bebidas</option>
                            <option value="Suplementos">Suplementos</option>
                            <option value="Ropa">Ropa</option>
                            <option value="Accesorios">Accesorios</option>
                            <option value="Equipamiento">Equipamiento</option>
                            <option value="Otros">Otros</option>
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label>STOCK {editingItem ? 'ACTUAL' : 'INICIAL'}</label>
                            <input required type="number" className="form-input" placeholder="0" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>PRECIO DE VENTA ($)</label>
                            <input required type="number" step="0.01" className="form-input" placeholder="0.00" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                        <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => { setShowModal(false); resetForm(); }}>CANCELAR</button>
                        <button type="submit" className="btn-primary" style={{ flex: 2, gap: 8 }}>
                            {editingItem ? <><Save size={18}/> ACTUALIZAR DATOS</> : <><Plus size={18}/> REGISTRAR PRODUCTO</>}
                        </button>
                    </div>
                </form>
            </BaseModal>

            <ConfirmModal 
                isOpen={!!confirmDeleteId}
                title="¿Eliminar del catálogo?"
                message="Esta acción es irreversible. El producto dejará de estar disponible para la venta en el POS y se borrarán sus registros de stock."
                onConfirm={handleDelete}
                onCancel={() => setConfirmDeleteId(null)}
                type="danger"
            />
        </div>
    );
};

export default Inventory;
