'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Calculator, Banknote, CreditCard, AlertTriangle, Printer, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function CloseCash() {
    const [idApeCaj, setIdApeCaj] = useState(null);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [closing, setClosing] = useState(false);
    const [closed, setClosed] = useState(false);

    useEffect(() => {
        fetchActiveCash();
    }, []);

    const fetchActiveCash = async () => {
        try {
            const res = await fetch('/api/cash/active');
            const result = await res.json();
            if (result.idapecaj) {
                setIdApeCaj(result.idapecaj);
                fetchSummary(result.idapecaj);
            } else {
                setLoading(false);
            }
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    const fetchSummary = async (id) => {
        try {
            const res = await fetch(`/api/cash/summary?id=${id}`);
            const result = await res.json();
            setData(result);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = async () => {
        if (!confirm('¿Estás seguro de cerrar la caja? No podrás realizar más ventas hoy desde este terminal.')) return;
        setClosing(true);
        try {
            const res = await fetch('/api/cash/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: idApeCaj })
            });
            const result = await res.json();
            if (result.success) {
                setClosed(true);
            } else {
                alert('Error: ' + result.details);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setClosing(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-cyan-400"></div></div>;

    if (!idApeCaj) return (
        <div className="min-h-screen bg-[#0f172a] text-white flex flex-col items-center justify-center p-8">
            <AlertTriangle className="w-20 h-20 text-orange-500 mb-6" />
            <h1 className="text-3xl font-black mb-4">No hay caja abierta</h1>
            <p className="text-slate-400 mb-8">Debes realizar una apertura desde el sistema de escritorio para comenzar.</p>
            <Link href="/pos" className="bg-white text-black px-8 py-3 rounded-2xl font-bold">Volver al POS</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-4 lg:p-12 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 flex justify-between items-center bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem]">
                    <div className="flex items-center gap-6">
                        <Link href="/pos" className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10">
                            <ArrowLeft className="w-6 h-6 text-cyan-400" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                Arqueo y Cierre de Caja
                            </h1>
                            <p className="text-slate-400">Sesión ID: {idApeCaj} | Estado: {data?.session?.status}</p>
                        </div>
                    </div>
                    <button onClick={() => window.print()} className="p-4 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/20 hover:bg-cyan-500/20 transition-all">
                        <Printer className="w-6 h-6" />
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* Resumen de Ventas */}
                    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 shadow-2xl">
                        <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                            <Calculator className="text-cyan-400" /> Resumen de Ventas
                        </h2>
                        
                        <div className="space-y-6">
                            <div className="flex justify-between items-center p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <Banknote className="text-emerald-400" />
                                    <span className="font-bold">Efectivo</span>
                                </div>
                                <span className="text-xl font-black">S/ {data?.summary?.cash.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center p-5 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <CreditCard className="text-blue-400" />
                                    <span className="font-bold">Tarjetas</span>
                                </div>
                                <span className="text-xl font-black">S/ {data?.summary?.card.toFixed(2)}</span>
                            </div>

                            <div className="flex justify-between items-center p-5 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <FileText className="text-purple-400" />
                                    <span className="font-bold">Créditos</span>
                                </div>
                                <span className="text-xl font-black">S/ {data?.summary?.credit.toFixed(2)}</span>
                            </div>

                            <div className="pt-6 border-t border-white/10">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 font-bold">TOTAL VENTAS</span>
                                    <span className="text-3xl font-black text-cyan-400">S/ {data?.summary?.totalSales.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Otros Datos y Acciones */}
                    <div className="flex flex-col gap-8">
                        <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 flex-1">
                            <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                                <AlertTriangle className="text-orange-400" /> Datos de Sesión
                            </h2>
                            <div className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Saldo Inicial:</span>
                                    <span className="font-bold">S/ {data?.summary?.openingBalance.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">Docs. Emitidos:</span>
                                    <span className="font-bold">{(data?.summary?.totalSales > 0 ? (data?.summary?.cash + data?.summary?.card + data?.summary?.credit) : 0).toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-rose-400">
                                    <span>Ventas Anuladas:</span>
                                    <span className="font-bold">S/ {data?.summary?.voidedTotal.toFixed(2)} ({data?.summary?.voidedQty})</span>
                                </div>
                            </div>
                        </div>

                        {!closed ? (
                            <button 
                                onClick={handleClose}
                                disabled={closing}
                                className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 py-8 rounded-[2.5rem] font-black text-2xl shadow-2xl shadow-rose-900/20 transition-all flex items-center justify-center gap-4 border border-rose-500/20"
                            >
                                {closing ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div> : <><Lock className="w-8 h-8" /> CERRAR CAJA</>}
                            </button>
                        ) : (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-10 rounded-[3rem] text-center">
                                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                                <h3 className="text-2xl font-black text-emerald-400 mb-2">CAJA CERRADA</h3>
                                <p className="text-emerald-400/60 text-sm">El arqueo se guardó correctamente.</p>
                                <Link href="/" className="mt-8 inline-block bg-emerald-500 text-white px-8 py-3 rounded-2xl font-bold">Salir al Menú</Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Área de Impresión (Invisible) */}
                <div id="print-area" className="hidden print:block text-black bg-white p-10 font-mono text-xs">
                    <h1 className="text-center font-bold text-lg uppercase mb-4">REPORTE Z - CIERRE DE CAJA</h1>
                    <p>Sesión: {idApeCaj}</p>
                    <p>Fecha Cierre: {new Date().toLocaleString()}</p>
                    <hr className="my-2 border-black" />
                    <div className="space-y-1">
                        <p className="flex justify-between"><span>SALDO INICIAL:</span> <span>S/ {data?.summary?.openingBalance.toFixed(2)}</span></p>
                        <p className="flex justify-between"><span>VENTAS EFECTIVO:</span> <span>S/ {data?.summary?.cash.toFixed(2)}</span></p>
                        <p className="flex justify-between"><span>VENTAS TARJETA:</span> <span>S/ {data?.summary?.card.toFixed(2)}</span></p>
                        <p className="flex justify-between"><span>VENTAS CRÉDITO:</span> <span>S/ {data?.summary?.credit.toFixed(2)}</span></p>
                        <hr className="my-2 border-black" />
                        <p className="flex justify-between font-bold text-sm"><span>TOTAL VENTAS:</span> <span>S/ {data?.summary?.totalSales.toFixed(2)}</span></p>
                        <p className="flex justify-between text-rose-600"><span>TOTAL ANULADOS:</span> <span>S/ {data?.summary?.voidedTotal.toFixed(2)}</span></p>
                    </div>
                    <div className="mt-10 text-center">
                        <p className="border-t border-black inline-block px-10 pt-1">Firma Cajero</p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-area, #print-area * { visibility: visible; }
                    #print-area { position: absolute; left: 0; top: 0; width: 100%; }
                }
            `}</style>
        </div>
    );
}
