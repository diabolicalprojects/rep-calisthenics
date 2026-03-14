import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Ticket, CreditCard, Lock, Unlock, Download, CheckCircle, Search, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import HelpTooltip from '../components/HelpTooltip';
import ModuleMetricBar from '../components/ModuleMetricBar';
import '../pages/Dashboard.css';

const POS = () => {
    const [cashRegister, setCashRegister] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openAmount, setOpenAmount] = useState('');

    // Core states
    const [activeTab, setActiveTab] = useState('retail');
    const [inventory, setInventory] = useState([]);
    const [members, setMembers] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash'); // Added for new checkout logic

    // Auth context (mocked as Admin for now)
    const cashierName = 'Admin';

    // Receipt Modal
    const [showReceipt, setShowReceipt] = useState(null);
    const [memberships, setMemberships] = useState([]);

    // Initial load
    useEffect(() => {
        checkCashRegister();
        fetchInventory();
        fetchMembers();
        fetchMemberships();
    }, []);

    const fetchMemberships = async () => {
        try {
            const data = await api.getMemberships();
            setMemberships(data);
        } catch (err) { console.error(err); }
    };

    const checkCashRegister = async () => {
        // Simplified for new backend migration
        setCashRegister({ id: 'dummy-reg', isOpen: true, initialAmount: 1000, totalSales: 0, transactionsCount: 0 }); // Adjusted to match original state structure
        setLoading(false);
    };

    const fetchInventory = async () => {
        try {
            const data = await api.getInventory();
            setInventory(data);
        } catch (err) { console.error(err); }
    };

    const fetchMembers = async () => {
        try {
            const data = await api.getMembers();
            setMembers(data);
        } catch (err) { console.error(err); }
    };

    const handleOpenRegister = async (e) => {
        e.preventDefault();
        try {
            // This logic would typically involve an API call to open a register
            // For now, we'll just set a dummy register as checkCashRegister does
            setCashRegister({ id: 'dummy-reg', isOpen: true, initialAmount: Number(openAmount), totalSales: 0, transactionsCount: 0 });
        } catch (err) {
            console.error(err);
        }
    };

    const handleCloseRegister = async () => {
        if (!confirm('¿Estás seguro de cerrar la caja actual?')) return;
        try {
            // This logic would typically involve an API call to close a register
            setCashRegister(null);
            setOpenAmount('');
        } catch (err) {
            console.error(err);
        }
    };

    const addToCart = (item, type = 'retail') => {
        setCart(prevCart => {
            const existingItemIndex = prevCart.findIndex(i => i.id === item.id && i.type === type && type !== 'sub');
            if (existingItemIndex > -1) {
                const newCart = [...prevCart];
                newCart[existingItemIndex] = {
                    ...newCart[existingItemIndex],
                    quantity: (newCart[existingItemIndex].quantity || 1) + 1,
                    totalPrice: (newCart[existingItemIndex].quantity + 1) * (Number(item.price) || 0)
                };
                return newCart;
            }
            return [...prevCart, { ...item, type, quantity: 1, totalPrice: Number(item.price) || 0, cartId: Date.now() + Math.random() }];
        });
    };

    const removeFromCart = (cartId) => {
        setCart(cart.filter(item => item.cartId !== cartId));
    };

    const cartTotal = cart.reduce((acc, item) => acc + (Number(item.totalPrice) || 0), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;

        try {
            const transactionData = {
                total_amount: cartTotal,
                payment_method: paymentMethod,
                cashier_name: cashierName,
                items: cart,
                type: cart.some(i => i.type === 'sub') ? 'subscription' : 'retail',
                timestamp: new Date()
            };

            const savedTx = await api.createTransaction(transactionData);

            // Update local cash register state for display (assuming API handles backend update)
            setCashRegister(prev => ({
                ...prev,
                totalSales: (prev.totalSales || 0) + cartTotal,
                transactionsCount: (prev.transactionsCount || 0) + 1
            }));

            setShowReceipt({ ...transactionData, id: savedTx.id });
            setCart([]);
            setPaymentMethod('cash');
            fetchInventory(); // refresh stock
        } catch (err) {
            console.error("Checkout failed:", err);
            alert("Error en el checkout: " + err.message);
        }
    };

    if (loading) return <div>Cargando Caja...</div>;

    if (!cashRegister) {
        return (
            <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div className="glass-panel" style={{ maxWidth: '400px', width: '100%', padding: '40px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <div className="icon-wrapper orange" style={{ margin: '0 auto 20px auto', width: '60px', height: '60px' }}>
                            <Lock size={30} />
                        </div>
                        <h2>Caja Cerrada</h2>
                        <p className="text-muted">Abre la caja para iniciar transacciones.</p>
                    </div>
                    <form onSubmit={handleOpenRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="form-group">
                            <label>Monto de Apertura ($)</label>
                            <input
                                required type="number"
                                className="form-input"
                                placeholder="Ej. 1500"
                                value={openAmount}
                                onChange={e => setOpenAmount(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Identidad</label>
                            <input disabled type="text" className="form-input" value={cashierName} />
                        </div>
                        <button className="btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                            <Unlock size={18} /> Abrir Caja
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <header className="page-header stagger-1" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <h1 className="page-title" style={{ margin: 0 }}>Punto de Venta Unificado</h1>
                        <HelpTooltip
                            title="¿Cómo funciona el POS?"
                            content="El POS unificado te permite añadir productos de retail, mensualidades y visitas a un mismo carrito de compra. Selecciona los productos, elige el cliente si corresponde, revisa el total a la derecha e indica el método de pago para registrar la transacción."
                        />
                    </div>
                    <p className="page-subtitle text-muted">Retail, Suscripciones y Accesos Únicos</p>
                </div>
                <div>
                    <button className="btn-primary" style={{ background: 'var(--color-danger)', border: 'none' }} onClick={handleCloseRegister}>
                        <Lock size={18} /> Cierre de Caja
                    </button>
                </div>
            </header>

            <ModuleMetricBar stats={[
                { label: 'Ventas Caja', value: `$${(cashRegister.totalSales || 0).toFixed(0)}`, color: 'var(--color-success)' },
                { label: 'Transacciones', value: cashRegister.transactionsCount || 0, color: 'var(--color-accent-orange)' },
                { label: 'Efectivo Inicial', value: `$${cashRegister.initialAmount || 0}`, color: '#4da6ff' },
                { label: 'Miembros Cargados', value: members.length, color: 'var(--color-text-muted)' },
            ]} />

            <div className="pos-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                {/* Left Side: Items Selection */}
                <div className="glass-panel" style={{ minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
                    <div className="pos-tabs-container" style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '15px', overflowX: 'auto', flexWrap: 'nowrap', WebkitOverflowScrolling: 'touch' }}>
                        <button className={`btn-ghost ${activeTab === 'retail' ? 'active-tab' : ''}`} style={{ flexShrink: 0 }} onClick={() => setActiveTab('retail')}>
                            <ShoppingCart size={18} /> Tienda (Retail)
                        </button>
                        <button className={`btn-ghost ${activeTab === 'subs' ? 'active-tab' : ''}`} style={{ flexShrink: 0 }} onClick={() => setActiveTab('subs')}>
                            <User size={18} /> Suscripciones
                        </button>
                        <button className={`btn-ghost ${activeTab === 'visits' ? 'active-tab' : ''}`} style={{ flexShrink: 0 }} onClick={() => setActiveTab('visits')}>
                            <Ticket size={18} /> Accesos Únicos
                        </button>
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '15px', top: '12px', color: 'var(--color-text-muted)' }} />
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Buscar productos, nombres..."
                                style={{ paddingLeft: '45px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ overflowY: 'auto', flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', alignContent: 'start' }}>
                        {activeTab === 'retail' && inventory
                            .filter(i => i.name?.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(item => (
                                <div key={item.id} className="glass-panel glass-hover" style={{ padding: '15px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '10px' }} onClick={() => addToCart(item, 'retail')}>
                                    <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Stock: {item.quantity || 0}</div>
                                    <div style={{ color: 'var(--color-success)', fontWeight: 'bold', fontSize: '18px' }}>${item.price}</div>
                                </div>
                            ))}

                        {activeTab === 'subs' && members
                            .filter(m => m.name?.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(m => {
                                const mPlan = memberships.find(p => p.name === m.plan);
                                const price = mPlan ? mPlan.price : 0;
                                const isExpiringSoon = m.expiration_date && (new Date(m.expiration_date) - new Date()) / (1000 * 60 * 60 * 24) < 5;
                                const isExpired = m.expiration_date && new Date(m.expiration_date) < new Date();
                                
                                return (
                                    <div key={m.id} className="glass-panel glass-hover" style={{ padding: '15px', cursor: 'pointer', border: isExpiringSoon ? '1px solid var(--color-accent-orange)' : '1px solid var(--color-glass-border)' }} 
                                        onClick={() => {
                                            if (!isExpired && !isExpiringSoon && m.expiration_date) {
                                                if (!confirm(`El socio ${m.name} tiene membresía vigente hasta el ${new Date(m.expiration_date).toLocaleDateString()}. ¿Deseas cobrar de todas formas?`)) return;
                                            }
                                            addToCart({ id: m.id, name: `Mensualidad: ${m.name}`, price, plan: m.plan, member_id: m.id, member_name: m.name }, 'sub');
                                        }}>
                                        <div style={{ fontWeight: 'bold' }}>{m.name}</div>
                                        <div style={{ fontSize: '13px', color: isExpired ? 'var(--color-danger)' : (isExpiringSoon ? 'var(--color-accent-orange)' : 'var(--color-success)') }}>
                                            {m.expiration_date ? `Vence: ${new Date(m.expiration_date).toLocaleDateString()}` : 'Sin membresía'}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Plan actual: {m.plan}</div>
                                    </div>
                                );
                            })}

                        {activeTab === 'visits' && (
                            <div className="glass-panel glass-hover" style={{ padding: '20px', cursor: 'pointer', textAlign: 'center' }} onClick={() => addToCart({ id: 'daily-visit', name: 'Visita Diaria', price: 100 }, 'visit')}>
                                <Ticket size={40} style={{ color: 'var(--color-accent-orange)', margin: '0 auto 10px auto' }} />
                                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Visita Única (Pase de Día)</div>
                                <div style={{ color: 'var(--color-success)', fontWeight: 'bold', fontSize: '20px', marginTop: '10px' }}>$100</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Cart Interface */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--color-glass-border)', background: 'var(--color-bg-secondary)' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <CreditCard size={20} /> Cuenta Actual
                        </h3>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {cart.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '40px' }}>El carrito está vacío</p>
                        ) : cart.map((item) => (
                            <div key={item.cartId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-glass-border)', paddingBottom: '10px' }}>
                                <div>
                                    <div style={{ fontWeight: '500', fontSize: '14px' }}>{item.quantity > 1 ? `${item.quantity}x ` : ''}{item.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{item.type.toUpperCase()}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <span style={{ fontWeight: 'bold' }}>${item.totalPrice}</span>
                                    <button onClick={() => removeFromCart(item.cartId)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '5px' }}>
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '20px', borderTop: '1px solid var(--color-glass-border)', background: 'var(--color-bg-secondary)' }}>
                        <div className="form-group" style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '12px', marginBottom: '8px' }}>Método de Pago</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <button className={`btn-ghost ${paymentMethod === 'cash' ? 'active-tab' : ''}`} style={{ padding: '8px', fontSize: '12px' }} onClick={() => setPaymentMethod('cash')}>Efectivo</button>
                                <button className={`btn-ghost ${paymentMethod === 'card' ? 'active-tab' : ''}`} style={{ padding: '8px', fontSize: '12px' }} onClick={() => setPaymentMethod('card')}>Tarjeta</button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '20px', fontWeight: 'bold' }}>
                            <span>Total</span>
                            <span style={{ color: 'var(--color-success)' }}>${cartTotal}</span>
                        </div>
                        <button
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '15px' }}
                            disabled={cart.length === 0}
                            onClick={handleCheckout}
                        >
                            Cerrar Transacción <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Receipt Modal */}
            {showReceipt && (
                <div className="modal-overlay">
                    <div className="glass-panel modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <CheckCircle size={50} style={{ color: 'var(--color-success)', margin: '0 auto 20px auto' }} />
                        <h2 style={{ marginBottom: '10px' }}>¡Transacción Exitosa!</h2>
                        <p className="text-muted" style={{ marginBottom: '30px' }}>Comprobante fiscal / Recibo interno</p>

                        <div style={{ textAlign: 'left', background: '#fcfcfc', color: '#111', padding: '24px', borderRadius: '12px', marginBottom: '30px', fontFamily: 'monospace', boxShadow: 'inset 0 0 15px rgba(0,0,0,0.05)', border: '1px solid #ddd' }}>
                            <div style={{ textAlign: 'center', marginBottom: 20 }}>
                                <div style={{ fontSize: 16, fontWeight: 800 }}>REP CALISTHENICS</div>
                                <div style={{ fontSize: 10, color: '#666' }}>RFC: GAMA900101-XXX</div>
                                <div style={{ fontSize: 10, color: '#666' }}>Recinto Deportivo Profesional</div>
                            </div>
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: 11 }}>
                                <span>Ticket:</span> <span>#{showReceipt.id?.substring(0, 8).toUpperCase() || 'TEMP'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: 11 }}>
                                <span>Cajero:</span> <span>{showReceipt.cashier_name}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #aaa', paddingBottom: '10px', marginBottom: '12px', fontSize: 11 }}>
                                <span>Fecha:</span> <span>{showReceipt.timestamp.toLocaleString()}</span>
                            </div>
                            {showReceipt.items.map(i => (
                                <div key={i.cartId} style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: 12 }}>
                                    <span style={{ maxWidth: '70%' }}>{i.quantity > 1 ? `${i.quantity}x ` : '1x '} {i.name}</span>
                                    <span>${i.totalPrice}</span>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #333', paddingTop: '12px', marginTop: '12px', fontWeight: 'bold', fontSize: '20px' }}>
                                <span>TOTAL</span>
                                <span>${showReceipt.total_amount}</span>
                            </div>
                            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 9, color: '#999' }}>
                                GRACIAS POR ENTRENAR CON NOSOTROS
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-glass-border)', color: 'white' }} onClick={() => setShowReceipt(null)}>
                                Imprimir / PDF
                            </button>
                            <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowReceipt(null)}>
                                Nueva Venta
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POS;
