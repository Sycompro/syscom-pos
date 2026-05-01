'use client';

import { useState } from 'react';
import { Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function SignInContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/';
    const isPosRoute = callbackUrl.includes('/pos');

    const [mode, setMode] = useState(isPosRoute ? 'pos' : null);
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [code, setCode] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleVerifyCode = (e) => {
        e.preventDefault();
        if (!code.trim()) {
            setError('El código de empresa es obligatorio');
            return;
        }
        setError('');
        setStep(2);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const result = await signIn('credentials', {
                code: code.trim(),
                username: username.trim(),
                password: password.trim(),
                redirect: false,
                callbackUrl: '/pos'
            });
            if (result?.error) {
                setError('Código, usuario o contraseña incorrectos');
                setIsLoading(false);
            } else {
                router.push('/pos');
                router.refresh();
            }
        } catch (err) {
            setError('Ocurrió un error de conexión');
            setIsLoading(false);
        }
    };

    /* ─── PORTAL DE SELECCIÓN ─── */
    if (mode === null) {
        return (
            <div className="w-full max-w-3xl px-6 relative z-10">
                <div className="text-center mb-16">
                    {/* Logo */}
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 mb-8 shadow-2xl">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="url(#grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10b981"/><stop offset="100%" stopColor="#3b82f6"/></linearGradient></defs>
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                        </svg>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tight leading-tight">
                        Syscom<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">Pro</span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-md mx-auto">Selecciona el módulo al que deseas acceder</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
                    {/* Dashboard */}
                    <button
                        onClick={() => signIn('google', { callbackUrl: '/' })}
                        className="group relative bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 hover:border-blue-500/60 rounded-3xl p-10 text-left transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.3)]"
                    >
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-8 shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow">
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">Panel Admin</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">Acceso con Google Workspace para administradores y gerencia.</p>
                            <div className="flex items-center gap-2 mt-6 text-blue-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                <span>Continuar con Google</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </div>
                        </div>
                    </button>

                    {/* POS */}
                    <button
                        onClick={() => setMode('pos')}
                        className="group relative bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 hover:border-emerald-500/60 rounded-3xl p-10 text-left transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_-15px_rgba(16,185,129,0.3)]"
                    >
                        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow">
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-emerald-300 transition-colors">Punto de Venta</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">Sistema POS con credenciales del ERP. Código de empresa y sede.</p>
                            <div className="flex items-center gap-2 mt-6 text-emerald-400 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                <span>Ingresar al POS</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </div>
                        </div>
                    </button>
                </div>

                <p className="text-center text-slate-600 text-xs mt-16 uppercase tracking-[0.2em] font-medium">Syscom Pro &middot; Plataforma Unificada</p>
            </div>
        );
    }

    /* ─── FORMULARIO POS ─── */
    return (
        <div className="w-full max-w-[460px] px-6 relative z-10">
            <button
                onClick={() => setMode(null)}
                className="mb-8 text-sm font-medium text-slate-500 hover:text-white flex items-center gap-2 transition-colors group"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-1 transition-transform"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Volver al Portal
            </button>

            <div className="bg-slate-900/70 backdrop-blur-2xl border border-slate-700/50 rounded-3xl p-10 shadow-2xl shadow-black/40">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-6 shadow-lg shadow-emerald-500/25">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Acceso POS</h1>
                    <p className="text-slate-400 text-sm">
                        {step === 1 ? 'Ingresa el código de tu empresa' : 'Ingresa las credenciales de tu sede'}
                    </p>
                </div>

                {/* Steps */}
                <div className="flex items-center justify-center gap-4 mb-10">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= 1 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>1</div>
                        <span className={`text-sm font-medium ${step >= 1 ? 'text-emerald-400' : 'text-slate-600'}`}>Empresa</span>
                    </div>
                    <div className={`w-12 h-[2px] rounded-full transition-all ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-800'}`} />
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= 2 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>2</div>
                        <span className={`text-sm font-medium ${step >= 2 ? 'text-emerald-400' : 'text-slate-600'}`}>Acceso</span>
                    </div>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleVerifyCode} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-3">Código de Empresa</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                                </div>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    placeholder="Ej: gimobile24"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-xl h-14 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-sm">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold h-14 rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.98] flex items-center justify-center gap-3 text-base mt-2"
                        >
                            Verificar Empresa
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Empresa verificada */}
                        <div className="flex items-center gap-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Empresa verificada</p>
                                <p className="text-base text-white font-semibold truncate">{code}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setStep(1); setError(''); }}
                                className="text-xs text-slate-400 hover:text-white transition-colors font-medium px-3 py-1.5 rounded-lg hover:bg-white/5"
                            >
                                Cambiar
                            </button>
                        </div>

                        {/* Usuario */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-3">Usuario</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                </div>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    placeholder="Ingresa tu usuario"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-xl h-14 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-3">Contraseña</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                                </div>
                                <input
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700/50 text-white rounded-xl h-14 pl-12 pr-4 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/50 transition-all placeholder:text-slate-600"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-sm">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold h-14 rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-base mt-2"
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                            ) : (
                                <>
                                    Ingresar al POS
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                </>
                            )}
                        </button>
                    </form>
                )}

                <div className="mt-10 pt-6 border-t border-slate-800/50 text-center">
                    <p className="text-xs text-slate-600 uppercase tracking-[0.15em] font-medium">Syscom Pro Ventas v2.0</p>
                </div>
            </div>
        </div>
    );
}

export default function SignInPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#070b14] relative overflow-hidden">
            {/* Background glow effects */}
            <div className="absolute top-[-20%] left-[-15%] w-[50%] h-[50%] bg-emerald-600/8 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-15%] w-[50%] h-[50%] bg-blue-600/8 blur-[150px] rounded-full pointer-events-none" />
            <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-teal-500/5 blur-[100px] rounded-full pointer-events-none" />

            <Suspense fallback={
                <div className="text-white relative z-10 flex flex-col items-center gap-4">
                    <svg className="animate-spin h-8 w-8 text-emerald-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    <span className="text-slate-400 text-sm">Cargando...</span>
                </div>
            }>
                <SignInContent />
            </Suspense>
        </div>
    );
}
