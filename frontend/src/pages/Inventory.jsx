import { useState, useEffect } from 'react';
import { Plus, X, Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '../services/api';
import HelpTooltip from '../components/HelpTooltip';
import ModuleMetricBar from '../components/ModuleMetricBar';
import ConfirmModal from '../components/ConfirmModal';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const Inventory = () => {
    const [items, setItems] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', category: 'Bebidas', quantity: '', price: '' });
    const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

    const fetchInventory = async () => {
        try {
            const data = await api.getInventory();
            setItems(data);
        } catch (err) { console.error('Error fetching inventory:', err); }
    };

    useEffect(() => { fetchInventory(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const qty = Number(formData.quantity);
            let status = 'Disponible';
            if (qty <= 0) status = 'Agotado';
            else if (qty <= 5) status = 'Poco Stock';

            await api.addInventoryItem({
                ...formData,
                quantity: qty,
                price: Number(formData.price),
                status
            });
            setShowModal(false);
            setFormData({ name: '', category: 'Bebidas', quantity: '', price: '' });
            await fetchInventory();
        } catch (err) { console.error('Error saving item:', err); }
    };

    const updateQuantity = async (id, currentQty, amount) => {
        const newQty = currentQty + amount;
        if (newQty < 0) return;

        try {
            await api.updateStock(id, newQty);
            await fetchInventory();
        } catch (err) { console.error('Error updating stock', err); }
    };

    const deleteItem = async () => {
        if (!confirmDelete.id) return;
        try {
            await api.deleteInventoryItem(confirmDelete.id);
            setConfirmDelete({ open: false, id: null });
            await fetchInventory();
        } catch (err) { console.error('Error deleting item', err); }
    };

    return (
        <div className="animate-fade-in">
            <header className="page-header" style={{ marginBottom: '24px', flexWrap: 'wrap' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <h1 className="page-title">Inventario</h1>
                        <HelpTooltip 
                            title="Control de Inventario" 
                            content="Registra bebidas, suplementos y ropa aquí. Cuando vendas estos artículos en el Punto de Venta (POS), el sistema descontará automáticamente la cantidad. Los productos marcados en rojo tienen inventario crítico y necesitan reabastecimiento pronto."
                        />
                    </div>
                    <p className="page-subtitle text-muted">Gestión de insumos y productos</p>
                </div>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '10px' }}>
                    <button className="btn-primary" onClick={() => setShowModal(true)} style={{ flex: '1', justifyContent: 'center' }}>
                        <Plus size={18} /> Añadir Producto
                    </button>
                </div>
            </header>

            <ModuleMetricBar stats={[
                { label: 'Total Items', value: items.length, color: 'var(--color-accent-orange)' },
                { label: 'Valor Inventario', value: `$${items.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(0)}`, color: 'var(--color-success)' },
                { label: 'Stock Crítico', value: items.filter(i => i.status !== 'Disponible').length, color: 'var(--color-danger)' },
                { label: 'Salud Stock', value: `${Math.round((items.filter(i => i.status === 'Disponible').length / (items.length || 1)) * 100)}%`, color: '#4da6ff' },
            ]} />

            {/* QUICK OVERVIEW CHART */}
            <div className="glass-panel" style={{ marginBottom: 32, padding: 24, display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ height: 180, width: 220, flexShrink: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Disponible', value: items.filter(i => i.status === 'Disponible').length },
                                    { name: 'Poco Stock', value: items.filter(i => i.status === 'Poco Stock').length },
                                    { name: 'Agotado', value: items.filter(i => i.status === 'Agotado').length }
                                ]}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                <Cell fill="var(--color-success)" />
                                <Cell fill="var(--color-accent-orange)" />
                                <Cell fill="var(--color-danger)" />
                            </Pie>
                            <RechartsTooltip 
                                contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-glass-border)', borderRadius: 12 }} 
                                itemStyle={{ color: '#fff' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <h3 style={{ marginBottom: 8, fontSize: 16 }}>Estado Global</h3>
                    <p className="text-muted" style={{ fontSize: 13, maxWidth: 400 }}>
                        Monitoreo del flujo de productos. El sistema detecta automáticamente cuando un producto está por agotarse (&lt; 5 unidades) y lo marca para reabastecimiento.
                    </p>
                    <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
                         <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-success)' }}>{items.filter(i => i.status === 'Disponible').length}</div>
                            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Sanos</div>
                         </div>
                         <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-accent-orange)' }}>{items.filter(i => i.status === 'Poco Stock').length}</div>
                            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Bajo Stock</div>
                         </div>
                         <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-danger)' }}>{items.filter(i => i.status === 'Agotado').length}</div>
                            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Agotados</div>
                         </div>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="glass-panel modal-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h2>Nuevo Producto</h2>
                            <button onClick={() => setShowModal(false)} className="btn-ghost" style={{ padding: '5px' }}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <input required type="text" placeholder="Nombre completo del producto" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />

                            <select className="form-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <option value="Bebidas">Bebidas</option>
                                <option value="Suplementos">Suplementos</option>
                                <option value="Ropa">Ropa</option>
                                <option value="Accesorios">Accesorios</option>
                                <option value="Otros">Otros</option>
                            </select>

                            <input required type="number" placeholder="Cantidad Inicial" className="form-input" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                            <input required type="number" placeholder="Precio ($)" className="form-input" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />

                            <button type="submit" className="btn-primary" style={{ marginTop: '10px', justifyContent: 'center' }}>Guardar Producto</button>
                        </form>
                    </div>
                </div>
            )}

            <section className="metrics-grid" style={{ marginBottom: '32px' }}>
                <div className="glass-panel metric-card pulse-hover stagger-2">
                    <div className="metric-header">
                        <h3>Total Productos</h3>
                        <div className="icon-wrapper green"><Package size={20} /></div>
                    </div>
                    <div className="metric-value">{items.length}</div>
                </div>

                <div className="glass-panel metric-card pulse-hover stagger-3">
                    <div className="metric-header">
                        <h3>Poco Stock</h3>
                        <div className="icon-wrapper orange"><AlertTriangle size={20} /></div>
                    </div>
                    <div className="metric-value text-orange">{items.filter(i => i.status === 'Poco Stock').length}</div>
                </div>

                <div className="glass-panel metric-card pulse-hover stagger-4">
                    <div className="metric-header">
                        <h3>Agotados</h3>
                        <div className="icon-wrapper red"><AlertTriangle size={20} /></div>
                    </div>
                    <div className="metric-value text-danger">{items.filter(i => i.status === 'Agotado').length}</div>
                </div>
            </section>

            <div className="glass-panel stagger-5" style={{ padding: '0', overflow: 'hidden' }}>
                <div className="table-container">
                    <table className="modern-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Categoría</th>
                                <th>Precio</th>
                                <th>Stock</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>No hay inventario registrado</td></tr>
                            ) : items.map(item => (
                                <tr key={item.id}>
                                    <td><span style={{ fontWeight: '500' }}>{item.name}</span></td>
                                    <td><span style={{ color: 'var(--color-text-muted)' }}>{item.category}</span></td>
                                    <td><strong>${item.price}</strong></td>
                                    <td>
                                        <button
                                            className="btn-ghost"
                                            onClick={() => {
                                                const newQty = prompt(`Editar stock de ${item.name}:`, item.quantity);
                                                if (newQty !== null && !isNaN(newQty)) {
                                                    updateQuantity(item.id, Number(newQty), 0);
                                                }
                                            }}
                                            style={{ color: 'white', fontWeight: 'bold', borderBottom: '1px dashed #444', padding: '2px 5px' }}
                                        >
                                            {item.quantity} unds.
                                        </button>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${item.status === 'Disponible' ? 'success' : item.status === 'Agotado' ? 'danger' : 'warning'}`} style={item.status === 'Poco Stock' ? { background: 'rgba(244, 140, 37, 0.1)', color: 'var(--color-accent-orange)', border: '1px solid rgba(244, 140, 37, 0.3)' } : {}}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="btn-ghost" style={{ padding: '4px', display: 'flex', alignItems: 'center' }} title="Aumentar" onClick={() => updateQuantity(item.id, item.quantity, 1)}>
                                                <TrendingUp size={16} color="var(--color-success)" />
                                            </button>
                                            <button className="btn-ghost" style={{ padding: '4px', display: 'flex', alignItems: 'center' }} title="Disminuir" onClick={() => updateQuantity(item.id, item.quantity, -1)}>
                                                <TrendingDown size={16} color="var(--color-danger)" />
                                            </button>
                                            <button className="btn-ghost" style={{ padding: '4px', display: 'flex', alignItems: 'center', marginLeft: '8px' }} onClick={() => setConfirmDelete({ open: true, id: item.id })} title="Eliminar">
                                                <X size={16} color="var(--color-text-muted)" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmModal 
                isOpen={confirmDelete.open}
                title="¿Eliminar Producto?"
                message="Esta acción eliminará el producto del inventario permanentemente. Las transacciones pasadas que incluyan este producto no se verán afectadas."
                confirmText="Eliminar permanentemente"
                onConfirm={deleteItem}
                onCancel={() => setConfirmDelete({ open: false, id: null })}
                type="danger"
            />
        </div>
    );
};

export default Inventory;
