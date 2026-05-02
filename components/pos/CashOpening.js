'use client';
import { motion } from 'framer-motion';
import { Wallet, ArrowRight, LogOut } from 'lucide-react';

export default function CashOpening({ amount, onAmountChange, onSubmit, onSignOut, loading }) {
    return (
        <div className="min-h-screen w-full bg-[#f8fafc] flex items-center justify-center font-outfit p-6 overflow-hidden relative">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-400/5 blur-[120px] rounded-full" />

            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-white rounded-[40px] shadow-[0_40px_100px_rgba(15,23,42,0.1)] border border-slate-100 p-12 relative z-10 text-center"
            >
                <div className="w-24 h-24 bg-blue-50 rounded-[30px] flex items-center justify-center mx-auto mb-8 text-blue-600 shadow-inner">
                    <Wallet size={48} strokeWidth={1.5} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Iniciar Turno</h1>
                <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                    Bienvenido al sistema. Ingresa el monto de apertura disponible en tu caja para comenzar.
                </p>

                <form onSubmit={onSubmit} className="space-y-8">
                    <div className="text-left">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-3 block">Monto de Apertura (S/)</label>
                        <div className="relative group">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-300 group-focus-within:text-blue-500 transition-colors">S/</span>
                            <input 
                                type="number" 
                                step="0.01"
                                autoFocus
                                required
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => onAmountChange(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-8 pl-16 pr-8 text-4xl font-black text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    <button 
                        disabled={loading}
                        className="w-full bg-slate-900 hover:bg-black text-white py-6 rounded-3xl font-black text-xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        {loading ? 'Procesando...' : 'Abrir Caja y Empezar'}
                        <ArrowRight size={24} />
                    </button>
                </form>

                <div className="mt-12 pt-8 border-t border-slate-50">
                    <button 
                        onClick={onSignOut}
                        className="flex items-center gap-2 mx-auto text-slate-400 hover:text-rose-500 font-bold transition-colors"
                    >
                        <LogOut size={18} /> Cerrar Sesión
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
