'use client';
import { signIn } from 'next-auth/react';
import { User, Lock } from 'lucide-react';

export default function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-4">
      <div className="glass p-8 md:p-12 max-w-md w-full space-y-8 animate-in zoom-in-95 duration-500">
        <div className="text-center">
          <div className="inline-flex p-4 rounded-2xl bg-orange-500/20 text-primary mb-6">
            <Lock size={48} />
          </div>
          <h1 className="text-3xl font-bold text-gradient">Syscom Ventas</h1>
          <p className="text-text-muted mt-3 text-sm">
            Acceso restringido para personal autorizado. Consulta de ERP Navasof.
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition-all transform active:scale-95 shadow-xl"
          >
            <User size={24} className="text-blue-600" />
            Ingresar con Google
          </button>
          
          <p className="text-[10px] text-center text-text-muted uppercase tracking-[0.2em] pt-4">
            Sistema de Consulta de Ventas & Stock
          </p>
        </div>

        <div className="pt-6 border-t border-glass flex justify-center gap-6">
           {/* Subtle glass badges */}
           <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-text-muted font-medium">
             SSL SECURE
           </div>
           <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-text-muted font-medium">
             ERP CONNECTED
           </div>
        </div>
      </div>
    </div>
  );
}
