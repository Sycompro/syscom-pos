'use client';
import Link from 'next/link';
import { AlertCircle, ChevronLeft } from 'lucide-react';

export default function AuthError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-4 text-center">
      <div className="glass p-10 max-w-sm w-full space-y-6">
        <div className="text-red-500 inline-block p-4 rounded-full bg-red-500/10 mb-4">
          <AlertCircle size={48} />
        </div>
        <h1 className="text-2xl font-bold">Acceso Denegado</h1>
        <p className="text-text-muted text-sm leading-relaxed">
          Tu cuenta no tiene los permisos necesarios para acceder a este sistema de ventas. 
          Contacta al administrador para solicitar acceso.
        </p>
        <Link href="/auth/signin" className="btn-primary w-full flex items-center justify-center gap-2">
          <ChevronLeft size={18} />
          Volver a intentar
        </Link>
      </div>
    </div>
  );
}
