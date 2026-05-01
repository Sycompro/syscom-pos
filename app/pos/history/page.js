'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCcw, Trash2, Calendar, FileText, User, ShoppingBag, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function SalesHistory() {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSale, setSelectedSale] = useState(null);
    const [saleItems, setSaleItems] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);
    const [isVoiding, setIsVoiding] = useState(false);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchHistory();
    }, [filterDate]);

    useEffect(() => {
        if (selectedSale) {
            fetchDetails(selectedSale);
        } else {
            setSaleItems([]);
        }
    }, [selectedSale]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/sales/history?date=${filterDate}`);
            const data = await res.json();
            setSales(data);
        } catch (e) {
            console.error('History load error:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchDetails = async (sale) => {
        setLoadingItems(true);
        try {
            const res = await fetch(`/api/sales/details?cdocu=${sale.cdocu}&ndocu=${sale.ndocu}`);
            const data = await res.json();
            setSaleItems(data);
        } catch (e) {
            console.error('Details load error:', e);
        } finally {
            setLoadingItems(false);
        }
    };

    const voidSale = async (sale) => {
        if (!confirm(`¿Estás seguro de ANULAR la venta ${sale.ndocu}? Esta acción devolverá el stock al inventario.`)) return;
        
        setIsVoiding(true);
        try {
            const res = await fetch('/api/sales/void', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cdocu: sale.cdocu, ndocu: sale.ndocu })
            });
            const result = await res.json();
            if (result.success) {
                alert('Venta anulada con éxito');
                fetchHistory();
                setSelectedSale(null);
            } else {
                alert('Error: ' + result.details);
            }
        } catch (e) {
            console.error('Void error:', e);
        } finally {
            setIsVoiding(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-4 lg:p-8 font-sans">
            <header className="mb-8 flex flex-col md:flex-row justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/pos" className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10">
                        <ArrowLeft className="w-6 h-6 text-cyan-400" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                            Historial de Ventas
                        </h1>
                        <p className="text-slate-400 text-sm">Gestiona y anula comprobantes emitidos</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-black/30 border border-white/10 rounded-2xl px-4 py-2">
                        <Calendar className="w-5 h-5 text-cyan-400 mr-2" />
                        <input 
                            type="date" 
                            className="bg-transparent outline-none text-sm font-bold" 
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={fetchHistory}
                        className="p-3 bg-cyan-500/20 text-cyan-400 rounded-2xl hover:bg-cyan-500/30 transition-all border border-cyan-500/20"
                    >
                        <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Tabla de Ventas */}
                <div className="xl:col-span-2 bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-widest border-b border-white/10">
                                    <th className="px-6 py-4">Fecha/Hora</th>
                                    <th className="px-6 py-4">Documento</th>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-6 py-4">Total</th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="6" className="px-6 py-8"><div className="h-4 bg-white/5 rounded w-full"></div></td>
                                        </tr>
                                    ))
                                ) : sales.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center text-slate-500 italic">No se encontraron ventas para esta fecha</td>
                                    </tr>
                                ) : (
                                    sales.map((sale) => (
                                        <tr 
                                            key={sale.ndocu} 
                                            onClick={() => setSelectedSale(sale)}
                                            className={`hover:bg-white/5 transition-colors cursor-pointer group ${selectedSale?.ndocu === sale.ndocu ? 'bg-cyan-500/10' : ''}`}
                                        >
                                            <td className="px-6 py-4 text-sm font-medium">
                                                {new Date(sale.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-slate-500" />
                                                    <span className="font-bold text-sm">{sale.ndocu}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-slate-200 line-clamp-1">{sale.nomcli}</div>
                                                <div className="text-[10px] text-slate-500">{sale.ruccli}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-black text-white">S/ {sale.tota.toFixed(2)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {sale.flag === '*' ? (
                                                    <span className="px-3 py-1 bg-rose-500/20 text-rose-400 text-[10px] font-black rounded-full border border-rose-500/20">ANULADO</span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-full border border-emerald-500/20">PAGADO</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {sale.flag !== '*' && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); voidSale(sale); }}
                                                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detalle de Venta Seleccionada */}
                <div className="space-y-6">
                    <AnimatePresence mode="wait">
                        {selectedSale ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 20 }}
                                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 h-fit shadow-2xl sticky top-8"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <h2 className="text-xl font-bold flex items-center gap-3">
                                        <ShoppingBag className="text-cyan-400" /> Detalle de Venta
                                    </h2>
                                    <button onClick={() => setSelectedSale(null)} className="text-slate-500 hover:text-white"><RefreshCcw className="w-5 h-5" /></button>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Cliente</p>
                                        <p className="font-bold text-slate-200">{selectedSale.nomcli}</p>
                                        <p className="text-xs text-slate-400">{selectedSale.ruccli}</p>
                                    </div>
                                    
                                    <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-white/5 text-slate-500">
                                                <tr>
                                                    <th className="px-4 py-2">Cant</th>
                                                    <th className="px-4 py-2">Producto</th>
                                                    <th className="px-4 py-2 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {loadingItems ? (
                                                    <tr><td colSpan="3" className="px-4 py-8 text-center animate-pulse">Cargando ítems...</td></tr>
                                                ) : saleItems.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-4 py-2 font-bold text-cyan-400">{item.quantity}</td>
                                                        <td className="px-4 py-2 text-slate-300 uppercase text-[10px]">{item.name}</td>
                                                        <td className="px-4 py-2 text-right font-medium">S/ {item.total.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Documento</p>
                                            <p className="font-bold text-slate-200">{selectedSale.ndocu}</p>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Total Pagado</p>
                                            <p className="font-bold text-cyan-400">S/ {selectedSale.tota.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                {selectedSale.flag === '*' ? (
                                    <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl text-center mb-8">
                                        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                                        <p className="font-bold text-rose-400">ESTA VENTA ESTÁ ANULADA</p>
                                        <p className="text-[10px] text-rose-400/60 mt-1">El stock ya fue devuelto al inventario</p>
                                    </div>
                                ) : (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl text-center mb-8">
                                        <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                                        <p className="font-bold text-emerald-400">VENTA ACTIVA Y VÁLIDA</p>
                                        <p className="text-[10px] text-emerald-400/60 mt-1">Fecha: {new Date(selectedSale.fecha).toLocaleDateString()}</p>
                                    </div>
                                )}

                                {selectedSale.flag !== '*' && (
                                    <button 
                                        onClick={() => voidSale(selectedSale)}
                                        disabled={isVoiding}
                                        className="w-full bg-rose-500 hover:bg-rose-400 py-4 rounded-2xl font-black text-lg shadow-xl shadow-rose-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isVoiding ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'ANULAR COMPROBANTE'}
                                    </button>
                                )}
                            </motion.div>
                        ) : (
                            <div className="bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] p-16 text-center text-slate-500">
                                <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p className="italic">Selecciona una venta para ver el detalle y opciones</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
