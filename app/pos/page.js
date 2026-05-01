'use client';

import { useState, useEffect, useRef } from 'react';
import { 
    Search, ShoppingCart, Package, Info, Plus, Minus, X, 
    CheckCircle2, AlertCircle, Receipt, User, Clock, Lock, 
    Banknote, CreditCard, LayoutGrid, History, Settings, LogOut,
    ChevronRight, Wallet, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';

export default function POSPage() {
    const { data: session } = useSession();
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [cart, setCart] = useState([]);
    const [warehouse, setWarehouse] = useState('01');
    const [idApeCaj, setIdApeCaj] = useState(null);
    const [isOpeningCash, setIsOpeningCash] = useState(false);
    const [openingAmount, setOpeningAmount] = useState('');
    const [docType, setDocType] = useState('03'); // 03 = Boleta
    const [paymentMethod, setPaymentMethod] = useState(1); // 1 = Efectivo
    const [selectedTar, setSelectedTar] = useState(''); 
    const [availableMethods, setAvailableMethods] = useState([]);
    const [customer, setCustomer] = useState({ name: 'CLIENTE VARIOS', ruc: '', code: '000000' });
    const [orderSuccess, setOrderSuccess] = useState(null);
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState('sales');

    const searchInputRef = useRef(null);

    useEffect(() => {
        setMounted(true);
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            // Cargar caja activa
            const cashRes = await fetch('/api/cash/active');
            const cashData = await cashRes.json();
            if (cashData.id) setIdApeCaj(cashData.id);

            // Cargar métodos de pago
            const methodsRes = await fetch('/api/payment-methods');
            const methodsData = await methodsRes.json();
            if (Array.isArray(methodsData)) setAvailableMethods(methodsData);
        } catch (e) {
            console.error('Error loading initial data:', e);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length >= 2) {
                fetchProducts();
            } else if (searchTerm.length === 0) {
                setProducts([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/products/search?q=${searchTerm}&alm=${warehouse}`);
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCash = async (e) => {
        e.preventDefault();
        setIsOpeningCash(true);
        try {
            const res = await fetch('/api/cash/open', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: parseFloat(openingAmount) || 0 })
            });
            const data = await res.json();
            if (data.success) {
                setIdApeCaj(data.id);
            } else {
                alert(data.error || 'Error al abrir caja');
            }
        } catch (error) {
            alert('Error de conexión');
        } finally {
            setIsOpeningCash(false);
        }
    };

    const addToCart = (product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => 
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (id, delta) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const finalizeSale = async () => {
        if (cart.length === 0 || !idApeCaj) return;
        setIsFinalizing(true);
        try {
            const res = await fetch('/api/sales/finalize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    docType,
                    pointOfSale: '01',
                    codcli: customer.code,
                    nomcli: customer.name,
                    ruccli: customer.ruc,
                    items: cart,
                    idApeCaj,
                    paymentMethod,
                    codtar: selectedTar,
                    warehouse
                })
            });
            const result = await res.json();
            if (result.success) {
                setOrderSuccess(result.documentNumber);
                setCart([]);
            } else {
                alert('Error: ' + result.details);
            }
        } catch (error) {
            alert('Error al procesar la venta');
        } finally {
            setIsFinalizing(false);
        }
    };

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    if (!mounted) return null;

    // --- RENDER APERTURA DE CAJA (DISEÑO PREMIUM) ---
    if (!idApeCaj) {
        return (
            <div style={{ 
                minHeight: '100vh', width: '100vw', background: '#f8fafc', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontFamily: "'Outfit', sans-serif", position: 'relative', overflow: 'hidden' 
            }}>
                {/* Adornos de fondo */}
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)' }} />
                <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)' }} />

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ 
                        background: '#ffffff', borderRadius: '40px', 
                        boxShadow: '0 30px 100px rgba(15, 23, 42, 0.08)', 
                        border: '1px solid #f1f5f9', padding: '60px', 
                        maxWidth: '480px', w: '90%', textAlign: 'center', position: 'relative', zIndex: 10 
                    }}
                >
                    <div style={{ 
                        width: '90px', height: '90px', background: '#eff6ff', 
                        borderRadius: '30px', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', margin: '0 auto 32px', color: '#3b82f6' 
                    }}>
                        <Wallet size={44} strokeWidth={2.5} />
                    </div>

                    <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0f172a', marginBottom: '16px', letterSpacing: '-1px' }}>
                        Caja Cerrada
                    </h1>
                    <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '40px', lineHeight: '1.6', fontWeight: '500' }}>
                        Para comenzar a vender, ingresa el monto inicial con el que cuentas en efectivo.
                    </p>
                    
                    <form onSubmit={handleOpenCash} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                        <div style={{ textAlign: 'left' }}>
                            <label style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.15em', marginLeft: '12px', marginBottom: '10px', display: 'block' }}>
                                SALDO INICIAL EN SOLES
                            </label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', fontSize: '24px', fontWeight: '800', color: '#cbd5e1' }}>S/</div>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    required
                                    autoFocus
                                    placeholder="0.00"
                                    value={openingAmount}
                                    onChange={(e) => setOpeningAmount(e.target.value)}
                                    style={{ 
                                        width: '100%', background: '#f8fafc', border: '2.5px solid #f1f5f9', 
                                        borderRadius: '24px', padding: '24px 24px 24px 60px', 
                                        fontSize: '28px', fontWeight: '900', color: '#0f172a', 
                                        outline: 'none', transition: 'all 0.3s', boxSizing: 'border-box' 
                                    }}
                                    onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.background = '#fff'; }}
                                    onBlur={(e) => { e.target.style.borderColor = '#f1f5f9'; e.target.style.background = '#f8fafc'; }}
                                />
                            </div>
                        </div>

                        <button 
                            disabled={isOpeningCash}
                            style={{ 
                                width: '100%', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', 
                                color: '#fff', padding: '24px', borderRadius: '24px', 
                                border: 'none', fontSize: '18px', fontWeight: '800', 
                                cursor: 'pointer', boxShadow: '0 20px 40px rgba(37, 99, 235, 0.25)', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                transition: 'all 0.4s', opacity: isOpeningCash ? 0.7 : 1
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'translateY(-3px)'}
                            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                            {isOpeningCash ? 'Procesando...' : 'Abrir Caja Ahora'}
                            {!isOpeningCash && <ArrowRight size={22} />}
                        </button>
                    </form>

                    <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid #f1f5f9' }}>
                        <button 
                            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '14px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}
                        >
                            <LogOut size={16} /> Salir del sistema
                        </button>
                    </div>
                </motion.div>
                
                <style jsx>{`
                    input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                `}</style>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#f1f5f9] flex overflow-hidden font-sans text-slate-900">
            
            {/* 1. SIDEBAR (Navegación Vertical) */}
            <aside className="w-24 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-10 z-20">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Package className="text-white w-8 h-8" />
                </div>
                
                <nav className="flex-1 flex flex-col gap-6">
                    {[
                        { id: 'sales', icon: LayoutGrid, label: 'Ventas' },
                        { id: 'history', icon: History, label: 'Historial' },
                        { id: 'settings', icon: Settings, label: 'Ajustes' },
                    ].map((item) => (
                        <button 
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`p-4 rounded-2xl transition-all group relative ${activeTab === item.id ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            <item.icon className="w-7 h-7" />
                            {activeTab === item.id && (
                                <motion.div layoutId="activeTab" className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-600 rounded-r-full" />
                            )}
                        </button>
                    ))}
                </nav>

                <button 
                    onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                    className="p-4 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all rounded-2xl"
                >
                    <LogOut className="w-7 h-7" />
                </button>
            </aside>

            {/* 2. AREA PRINCIPAL (Catálogo) */}
            <main className="flex-1 flex flex-col overflow-hidden">
                
                {/* Header Superior */}
                <header className="h-24 bg-white border-b border-slate-200 px-10 flex items-center justify-between">
                    <div className="flex items-center gap-6 flex-1 max-w-2xl">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                            <input 
                                ref={searchInputRef}
                                type="text" 
                                placeholder="Busca productos por nombre o código..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl py-4 pl-14 pr-6 outline-none transition-all font-medium text-slate-700"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6 ml-10">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-black text-slate-900">{session?.user?.name || 'Usuario'}</p>
                            <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center justify-end gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Caja Abierta #{idApeCaj}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                            <User className="text-slate-400 w-6 h-6" />
                        </div>
                    </div>
                </header>

                {/* Grid de Productos */}
                <div className="flex-1 overflow-y-auto p-10 bg-[#f8fafc]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Catálogo de Productos</h2>
                            <p className="text-slate-500 text-sm">Selecciona los productos para la venta directa.</p>
                        </div>
                        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                            {['03', '01'].map(t => (
                                <button 
                                    key={t}
                                    onClick={() => setDocType(t)}
                                    className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${docType === t ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {t === '03' ? 'BOLETA' : 'FACTURA'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1,2,3,4,5,6,7,8].map(i => (
                                <div key={i} className="bg-white rounded-3xl h-64 animate-pulse border border-slate-100" />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="h-[50vh] flex flex-col items-center justify-center text-slate-300">
                            <Package className="w-24 h-24 mb-4 opacity-20" />
                            <p className="text-xl font-bold">Busca algo para empezar</p>
                            <p className="text-sm">Escribe el nombre de un producto en el buscador.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                            <AnimatePresence>
                                {products.map((product) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => addToCart(product)}
                                        className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:border-blue-100 transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                                <Package className="text-slate-400 group-hover:text-blue-500 w-6 h-6 transition-colors" />
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${product.stock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                {product.stock > 0 ? `Stock: ${product.stock}` : 'Sin Stock'}
                                            </div>
                                        </div>
                                        <h3 className="font-bold text-slate-800 leading-tight mb-2 line-clamp-2 h-10">{product.name}</h3>
                                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-50">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio</p>
                                                <p className="text-2xl font-black text-slate-900">S/ {product.price.toFixed(2)}</p>
                                            </div>
                                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                                <Plus className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </main>

            {/* 3. CARRITO (Panel Derecho) */}
            <aside className="w-[420px] bg-white border-l border-slate-200 flex flex-col z-10 shadow-[20px_0_60px_rgba(0,0,0,0.05)]">
                <div className="p-10 flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <ShoppingCart className="text-blue-600 w-7 h-7" /> Resumen
                        </h2>
                        <button 
                            onClick={() => setCart([])}
                            className="text-xs font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest"
                        >
                            Vaciar
                        </button>
                    </div>

                    {/* Lista del Carrito */}
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                                <ShoppingCart className="w-20 h-20 mb-4" />
                                <p className="font-bold">Carrito vacío</p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {cart.map((item) => (
                                    <motion.div 
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="bg-slate-50 rounded-3xl p-5 border border-transparent hover:border-slate-200 transition-all"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <p className="font-bold text-sm text-slate-700 leading-tight flex-1">{item.name}</p>
                                            <button onClick={() => updateQuantity(item.id, -item.quantity)} className="text-slate-300 hover:text-rose-500 ml-4"><X className="w-4 h-4" /></button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors"><Minus className="w-4 h-4" /></button>
                                                <span className="px-4 font-black text-sm text-slate-800">{item.quantity}</span>
                                                <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors"><Plus className="w-4 h-4" /></button>
                                            </div>
                                            <p className="font-black text-lg text-slate-900">S/ {(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>

                    {/* Totales y Pago */}
                    <div className="mt-10 pt-10 border-t border-slate-100 space-y-6">
                        <div className="flex justify-between text-slate-400 text-sm">
                            <span className="font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                            <span className="font-black">S/ {(total / 1.18).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-400 text-sm">
                            <span className="font-bold uppercase tracking-widest text-[10px]">IGV (18%)</span>
                            <span className="font-black">S/ {(total - (total / 1.18)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-end pt-4">
                            <span className="text-slate-900 font-black text-lg uppercase tracking-tighter">Total a Pagar</span>
                            <span className="text-4xl font-black text-blue-600 tracking-tighter">S/ {total.toFixed(2)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-6">
                            {availableMethods.map(m => (
                                <button 
                                    key={m.id}
                                    onClick={() => {
                                        setPaymentMethod(m.type);
                                        setSelectedTar(m.id === 'EF' ? '' : m.id);
                                    }}
                                    className={`py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                        (m.id === 'EF' && paymentMethod === 1) || (selectedTar === m.id)
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                    }`}
                                >
                                    {m.type === 1 ? <Banknote className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                                    {m.name}
                                </button>
                            ))}
                        </div>

                        <button 
                            disabled={cart.length === 0 || isFinalizing}
                            onClick={finalizeSale}
                            className="w-full bg-slate-900 hover:bg-black text-white py-6 rounded-3xl font-black text-xl shadow-xl transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center gap-4 group"
                        >
                            {isFinalizing ? (
                                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Confirmar Pago <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Modal de Éxito */}
            <AnimatePresence>
                {orderSuccess && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-50 flex items-center justify-center p-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.2)] p-12 max-w-md w-full text-center border border-white"
                        >
                            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">¡Venta Completada!</h2>
                            <p className="text-slate-500 mb-10">El documento ha sido registrado exitosamente en el sistema ERP.</p>
                            
                            <div className="bg-slate-50 rounded-3xl p-8 mb-10 border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Comprobante No.</p>
                                <p className="text-4xl font-black text-blue-600 tracking-tighter">{orderSuccess}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <button 
                                    onClick={() => setOrderSuccess(null)}
                                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-lg hover:bg-black transition-all"
                                >
                                    Nueva Operación
                                </button>
                                <button 
                                    onClick={() => window.print()}
                                    className="w-full bg-white text-slate-400 py-4 rounded-2xl font-bold text-sm hover:text-slate-600 transition-all flex items-center justify-center gap-2"
                                >
                                    <Receipt className="w-4 h-4" /> Imprimir Ticket
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
                
                @media print {
                    .no-print { display: none !important; }
                    body * { visibility: hidden; }
                    #ticket-print, #ticket-print * { visibility: visible; }
                }
            `}</style>
        </div>
    );
}
