import React, { useState, useEffect } from 'react';
import { 
    ShoppingCart, User, Ticket, CreditCard, Lock, Unlock, 
    Download, CheckCircle, ArrowRight, X, Search, RefreshCw,
    UserPlus, Tag, Plus, Minus, Receipt
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import HelpTooltip from '../components/HelpTooltip';
import ModuleMetricBar from '../components/ModuleMetricBar';
import SearchInput from '../components/SearchInput';
import BaseModal from '../components/BaseModal';
import { fmtCurrency, fmtDate, initials } from '../utils/formatters';

const POS = () => {
    const { user } = useAuth();
    const { settings } = useTheme();
    const [cashRegister, setCashRegister] = useState(null);
    const [loading, setLoading] = useState(true);
    const [openAmount, setOpenAmount] = useState('');
    const [activeTab, setActiveTab] = useState('retail');
    const [inventory, setInventory] = useState([]);
    const [members, setMembers] = useState([]);
    const [cart, setCart] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [showReceipt, setShowReceipt] = useState(null);
    const [memberships, setMemberships] = useState([]);
    const [processing, setProcessing] = useState(false);

    const cashierName = user?.name || 'Administrador';

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
        try {
            const data = await api.getActiveCashRegister();
            setCashRegister(data || null);
        } catch (err) {
            console.error("Error checking register:", err);
        } finally {
            setLoading(false);
        }
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
            const data = await api.openCashRegister({ opening_balance: Number(openAmount) });
            setCashRegister(data);
        } catch (err) {
            alert("Error abriendo caja: " + err.message);
        }
    };

    const handleCloseRegister = async () => {
        if (!window.confirm('¿Estás seguro de cerrar la caja actual? Se generará un resumen de cierre.')) return;
        try {
            await api.closeCashRegister({ id: cashRegister.id, closing_balance: cashRegister.initialAmount + cashRegister.totalSales });
            setCashRegister(null);
            setOpenAmount('');
        } catch (err) {
            alert("Error cerrando caja: " + err.message);
        }
    };

    const addToCart = (item, type = 'retail') => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id && i.type === type && type !== 'sub');
            if (existing) {
                return prev.map(i => i.cartId === existing.cartId 
                    ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.price }
                    : i
                );
            }
            return [...prev, { ...item, type, quantity: 1, totalPrice: item.price, cartId: Date.now() + Math.random() }];
        });
    };

    const updateCartQuantity = (cartId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.cartId === cartId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty, totalPrice: newQty * item.price };
            }
            return item;
        }));
    };

    const removeFromCart = (cartId) => {
        setCart(cart.filter(item => item.cartId !== cartId));
    };

    const cartTotal = cart.reduce((acc, item) => acc + (Number(item.totalPrice) || 0), 0);

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setProcessing(true);
        try {
            const transactionData = {
                total_amount: cartTotal,
                payment_method: paymentMethod,
                cashier_name: cashierName,
                register_id: cashRegister.id,
                items: cart,
                type: cart.some(i => i.type === 'sub') ? 'subscription' : cart.some(i => i.type === 'visit') ? 'visit' : 'retail',
                timestamp: new Date()
            };
            
            // Simular respuesta del API para efectos visuales premium si el API falla o es lento
            const savedTx = await api.createTransaction(transactionData);
            
            setCashRegister(prev => ({
                ...prev,
                totalSales: (prev.totalSales || 0) + cartTotal,
                transactionsCount: (prev.transactionsCount || 0) + 1
            }));

            setShowReceipt({ ...transactionData, id: savedTx.id || Math.random().toString(36).substr(2, 9) });
            setCart([]);
            setPaymentMethod('cash');
            fetchInventory();
        } catch (err) {
            alert("Error en el checkout: " + err.message);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: 20 }}>
                <div className="spinner-modern" />
                <p className="text-muted">Iniciando terminal de punto de venta...</p>
            </div>
        );
    }

    if (!cashRegister) {
        return (
            <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div className="glass-panel" style={{ maxWidth: '440px', width: '100%', padding: '48px', textAlign: 'center' }}>
                    <div className="icon-wrapper orange" style={{ width: 64, height: 64, margin: '0 auto 24px' }}>
                        <Lock size={32} />
                    </div>
                    <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>Caja Cerrada</h2>
                    <p className="text-muted" style={{ marginBottom: 32 }}>Es necesario establecer un fondo inicial para habilitar las operaciones del día.</p>
                    
                    <form onSubmit={handleOpenRegister} style={{ textAlign: 'left' }}>
                        <div className="form-group" style={{ marginBottom: 24 }}>
                            <label style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'block' }}>FONDO DE APERTURA ($)</label>
                            <input 
                                required 
                                type="number" 
                                className="form-input" 
                                placeholder="Ej. 1500" 
                                style={{ fontSize: 20, textAlign: 'center', fontWeight: 'bold' }}
                                value={openAmount} 
                                onChange={e => setOpenAmount(e.target.value)} 
                            />
                        </div>
                        <button className="btn-primary" type="submit" style={{ width: '100%', padding: '16px', fontSize: 16 }}>
                            <Unlock size={20} /> ABRIR TURNO DE CAJA
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <header className="page-header stagger-1 flex-responsive">
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h1 className="page-title">Punto de Venta</h1>
                        <HelpTooltip title="POS Inteligente" content="Procesa ventas de productos, renovaciones de membresía y entradas diarias de forma ágil." />
                    </div>
                    <p className="page-subtitle text-muted">Operado por: <span className="text-orange" style={{ fontWeight: 700 }}>{cashierName}</span></p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn-ghost" onClick={() => { fetchInventory(); fetchMembers(); }} title="Sincronizar Datos">
                        <RefreshCw size={18} />
                    </button>
                    <button className="btn-ghost" onClick={handleCloseRegister} style={{ color: 'var(--color-accent-orange)', border: '1px solid var(--color-accent-orange)33' }}>
                        <Lock size={18} /> CERRAR TURNO
                    </button>
                </div>
            </header>

            <ModuleMetricBar stats={[
                { label: 'Ventas del Turno', value: fmtCurrency(cashRegister.totalSales || 0), color: 'var(--color-success)' },
                { label: 'Transacciones', value: cashRegister.transactionsCount || 0, color: 'var(--color-accent-orange)' },
                { label: 'Fondo Inicial', value: fmtCurrency(cashRegister.initialAmount || 0), color: '#4da6ff' },
                { label: 'Efectivo en Caja', value: fmtCurrency(cashRegister.initialAmount + (cashRegister.totalSales || 0)), color: 'var(--color-text-muted)' },
            ]} />

            <div className="pos-layout-grid" style={{ gap: '24px', alignItems: 'start', marginTop: 8, height: 'calc(100vh - 220px)' }}>
                {/* Product/Service Selection */}
                <div className="glass-panel stagger-2" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', padding: 6, borderRadius: 14 }}>
                        {[
                            { id: 'retail', label: 'PRODUCTOS', icon: <Tag size={16}/> },
                            { id: 'subs', label: 'MEMBRESÍAS', icon: <UserPlus size={16}/> },
                            { id: 'visits', label: 'VISITAS', icon: <Ticket size={16}/> }
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                className={activeTab === tab.id ? 'btn-primary' : 'btn-ghost'} 
                                style={{ 
                                    flex: 1, 
                                    padding: '10px', 
                                    fontSize: 11, 
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    borderRadius: 10,
                                    background: activeTab === tab.id ? 'var(--color-accent-orange)' : 'transparent',
                                    color: activeTab === tab.id ? '#000' : 'inherit'
                                }}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <SearchInput 
                            placeholder={`Buscar por ${activeTab === 'retail' ? 'nombre de producto' : 'nombre del atleta'}...`} 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                        />
                    </div>

                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(140px, 45%, 200px), 1fr))', 
                        gap: '12px', 
                        flex: 1,
                        overflowY: 'auto',
                        paddingRight: '8px'
                    }}>
                        {activeTab === 'retail' && inventory
                            .filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(item => (
                                <div key={item.id} className="glass-panel item-card scale-hover" style={{ 
                                    padding: '20px', 
                                    textAlign: 'center', 
                                    cursor: 'pointer',
                                    background: 'rgba(255,255,255,0.02)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center'
                                }} onClick={() => addToCart(item, 'retail')}>
                                    <div style={{ fontWeight: '700', fontSize: 14, marginBottom: 8, color: '#fff' }}>{item.name}</div>
                                    <div style={{ fontSize: 22, fontWeight: '900', color: 'var(--color-success)' }}>{fmtCurrency(item.price)}</div>
                                    <div style={{ fontSize: 11, color: item.quantity <= 5 ? 'var(--color-danger)' : 'var(--color-text-muted)', marginTop: 8, fontWeight: 600 }}>
                                        {item.quantity <= 0 ? 'AGOTADO' : `STOCK: ${item.quantity} U.`}
                                    </div>
                                </div>
                            ))
                        }

                        {activeTab === 'subs' && members
                            .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(m => (
                                <div key={m.id} className="glass-panel item-card scale-hover" style={{ 
                                    padding: '16px', 
                                    cursor: 'pointer',
                                    background: 'rgba(255,115,0,0.03)'
                                }} onClick={() => {
                                    const plan = memberships.find(p => p.name === m.plan);
                                    addToCart({ id: m.id, name: `Renovación: ${m.name}`, price: plan?.price || 0, member_id: m.id }, 'sub');
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                        <div className="avatar-small" style={{ width: 28, height: 28, fontSize: 10 }}>{initials(m.name)}</div>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: 13, lineHeight: 1.2 }}>{m.name}</div>
                                            <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{m.plan}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: '800', background: 'var(--color-accent-orange)15', color: 'var(--color-accent-orange)', textAlign: 'center', padding: '6px', borderRadius: 8 }}>
                                        COBRAR RENOVACIÓN
                                    </div>
                                </div>
                            ))
                        }

                        {activeTab === 'visits' && (
                            <>
                                <div className="glass-panel item-card scale-hover" style={{ 
                                    padding: '32px 24px', 
                                    textAlign: 'center', 
                                    cursor: 'pointer',
                                    border: '2px dashed var(--color-accent-orange)33',
                                    background: 'linear-gradient(135deg, rgba(255,115,0,0.05) 0%, rgba(0,0,0,0) 100%)'
                                }} onClick={() => addToCart({ id: 'visit-regular', name: 'Pase de Día (Regular)', price: 100 }, 'visit')}>
                                    <div className="icon-wrapper orange" style={{ width: 48, height: 48, margin: '0 auto 16px' }}>
                                        <Ticket size={24} />
                                    </div>
                                    <div style={{ fontWeight: '800', fontSize: 16 }}>Acceso Diario</div>
                                    <div style={{ fontSize: 24, fontWeight: '900', color: 'var(--color-success)', marginTop: 8 }}>$100</div>
                                </div>

                                <div className="glass-panel item-card scale-hover" style={{ 
                                    padding: '32px 24px', 
                                    textAlign: 'center', 
                                    cursor: 'pointer',
                                    border: '2px dashed #4da6ff33',
                                    background: 'linear-gradient(135deg, rgba(77,166,255,0.05) 0%, rgba(0,0,0,0) 100%)'
                                }} onClick={() => addToCart({ id: 'visit-promo', name: 'Pase de Día (Promo)', price: 80 }, 'visit')}>
                                    <div className="icon-wrapper blue" style={{ width: 48, height: 48, margin: '0 auto 16px' }}>
                                        <Tag size={24} />
                                    </div>
                                    <div style={{ fontWeight: '800', fontSize: 16 }}>Día Promo</div>
                                    <div style={{ fontSize: 24, fontWeight: '900', color: '#4da6ff', marginTop: 8 }}>$80</div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Checkout Column */}
                <div className="glass-panel stagger-3" style={{ padding: 0, boxShadow: '0 20px 40px rgba(0,0,0,0.4)', borderColor: 'var(--color-accent-orange)33', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                    <div style={{ padding: 24, borderBottom: '1px solid var(--color-glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 800 }}><ShoppingCart size={22} className="text-orange" /> Ticket Actual</h3>
                        <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 4 }}>{cart.length} ITEMS</span>
                    </div>

                    <div style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
                        {cart.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 340, opacity: 0.3 }}>
                                <ShoppingCart size={48} style={{ marginBottom: 16 }} />
                                <p style={{ fontSize: 14 }}>Selecciona productos o servicios</p>
                            </div>
                        ) : (
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                 {cart.map(item => (
                                     <div key={item.cartId} className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--color-glass-border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <div style={{ fontWeight: 700, fontSize: 14 }}>{item.name}</div>
                                            <button onClick={() => removeFromCart(item.cartId)} style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}><X size={14}/></button>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '2px 8px' }}>
                                                <button onClick={() => updateCartQuantity(item.cartId, -1)} disabled={item.type === 'sub'} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><Minus size={12}/></button>
                                                <span style={{ fontSize: 14, fontWeight: 800, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                                                <button onClick={() => updateCartQuantity(item.cartId, 1)} disabled={item.type === 'sub'} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><Plus size={12}/></button>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--color-success)' }}>{fmtCurrency(item.totalPrice)}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ padding: 24, borderTop: '1px solid var(--color-glass-border)', background: 'rgba(255,115,0,0.05)' }}>
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text-muted)', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Método de Pago</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <button className={paymentMethod === 'cash' ? 'btn-primary' : 'btn-ghost'} onClick={() => setPaymentMethod('cash')} style={{ gap: 8 }}><Receipt size={14}/> Efectivo</button>
                                <button className={paymentMethod === 'card' ? 'btn-primary' : 'btn-ghost'} onClick={() => setPaymentMethod('card')} style={{ gap: 8 }}><CreditCard size={14}/> Tarjeta</button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <div style={{ color: 'var(--color-text-muted)', fontWeight: 700, fontSize: 14 }}>TOTAL A PAGAR</div>
                            <div style={{ fontSize: 32, fontWeight: 950, color: '#fff', letterSpacing: -1 }}>{fmtCurrency(cartTotal)}</div>
                        </div>

                        <button 
                            className="btn-primary" 
                            style={{ width: '100%', padding: '18px', fontSize: 18, fontWeight: 900, boxShadow: '0 10px 20px rgba(255,115,0,0.2)' }} 
                            disabled={cart.length === 0 || processing} 
                            onClick={handleCheckout}
                        >
                            {processing ? <RefreshCw className="animate-spin" /> : <>FINALIZAR Y COBRAR <ArrowRight size={20} /></>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Receipt Modal */}
            {showReceipt && (
                <BaseModal isOpen={!!showReceipt} onClose={() => setShowReceipt(null)} title="Transacción Confirmada">
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ width: 80, height: 80, background: 'var(--color-success)15', color: 'var(--color-success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <CheckCircle size={48} />
                        </div>
                        <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>¡Venta Exitosa!</h2>
                        <p className="text-muted" style={{ marginBottom: 32 }}>El comprobante ha sido generado exitosamente.</p>
                        
                        <div style={{ 
                            background: '#fff', 
                            color: '#000', 
                            padding: '32px 24px', 
                            borderRadius: 16, 
                            textAlign: 'left', 
                            fontFamily: '"JetBrains Mono", monospace', 
                            fontSize: 12, 
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            position: 'relative',
                            overflow: 'hidden',
                            marginBottom: 32
                        }}>
                            {/* Decorative Cutout Edge */}
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around' }}>
                                {Array(20).fill(0).map((_, i) => <div key={i} style={{ width: 10, height: 10, background: 'var(--color-bg-primary)', borderRadius: '50%', marginTop: -5 }} />)}
                            </div>

                            <div style={{ textAlign: 'center', fontWeight: '900', fontSize: 16, marginBottom: 8, letterSpacing: 2 }}>{settings.brandName.toUpperCase()}</div>
                            <div style={{ textAlign: 'center', fontSize: 10, marginBottom: 20, color: '#666' }}>SISTEMA DE GESTIÓN INTELIGENTE</div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>ORDEN:</span> <span>#{showReceipt.id?.toUpperCase()}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>FECHA:</span> <span>{fmtDate(showReceipt.timestamp)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><span>CAJERO:</span> <span>{showReceipt.cashier_name}</span></div>
                            
                            <div style={{ borderTop: '2px dashed #000', margin: '16px 0' }} />
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                                {showReceipt.items.map(i => (
                                    <div key={i.cartId} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ maxWidth: '180px' }}>{i.quantity}x {i.name}</span>
                                        <span style={{ fontWeight: 'bold' }}>{fmtCurrency(i.totalPrice)}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ borderTop: '2px dashed #000', margin: '16px 0' }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}><span>MÉTODO:</span> <span>{showReceipt.payment_method?.toUpperCase()}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: 20, marginTop: 8 }}>
                                <span>TOTAL</span>
                                <span>{fmtCurrency(showReceipt.total_amount)}</span>
                            </div>

                            <div style={{ textAlign: 'center', marginTop: 32, fontSize: 10, fontWeight: '700', color: '#888' }}>
                                *** GRACIAS POR TU CONFIANZA ***<br/>
                                #{settings.brandName.toUpperCase().replace(/\s+/g, '')}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 16 }}>
                            <button className="btn-ghost" style={{ flex: 1, padding: '14px' }} onClick={() => setShowReceipt(null)}>
                                <Download size={18} /> IMPRIMIR TICKET
                            </button>
                            <button className="btn-primary" style={{ flex: 1, padding: '14px', fontWeight: 800 }} onClick={() => setShowReceipt(null)}>
                                NUEVA VENTA
                            </button>
                        </div>
                    </div>
                </BaseModal>
            )}
        </div>
    );
};

export default POS;
