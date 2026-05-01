'use client';
import { useState, useEffect } from 'react';
import { ShoppingBag, Box, TrendingUp, Search, Clock, ChevronRight, LogOut } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

export default function SalesDashboard() {
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sales/recent')
      .then(res => res.json())
      .then(data => {
        setRecentSales(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-gradient">Syscom Ventas</h1>
          <p className="text-text-muted mt-2">Panel de Consulta en Tiempo Real</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass px-6 py-3 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium">Conectado a BdNava01</span>
          </div>
          <button 
            onClick={() => signOut()}
            className="glass p-3 text-text-muted hover:text-red-500 transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Ventas Hoy', value: 'S/ 0.00', icon: TrendingUp, color: 'text-orange-500' },
          { title: 'Productos', value: '+1,500', icon: Box, color: 'text-blue-500' },
          { title: 'Documentos', value: '45', icon: ShoppingBag, color: 'text-purple-500' },
        ].map((stat, i) => (
          <div key={i} className="glass p-6 glass-hover group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-text-muted text-sm font-medium">{stat.title}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl bg-slate-800/50 ${stat.color}`}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Sales Table */}
        <div className="lg:col-span-2 glass overflow-hidden">
          <div className="p-6 border-b border-glass flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-primary" />
              <h2 className="font-semibold text-lg">Últimas Ventas (Solo Consulta)</h2>
            </div>
            <button className="text-sm text-primary hover:underline font-medium">Ver todo</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-800/30 text-text-muted text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Documento</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass">
                {loading ? (
                   [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-40"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-16"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-700 rounded w-12 ml-auto"></div></td>
                    </tr>
                  ))
                ) : recentSales.map((sale, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-medium">{sale.number}</td>
                    <td className="px-6 py-4 text-text-muted truncate max-w-[200px]">{sale.client}</td>
                    <td className="px-6 py-4 text-sm">{new Date(sale.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-primary">
                      {sale.currency === 'S' ? 'S/' : '$'} {sale.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Search Card */}
        <div className="space-y-6">
          <div className="glass p-6 bg-gradient-to-br from-orange-500/10 to-transparent">
            <h2 className="font-semibold text-lg mb-4">Consulta de Stock</h2>
            <Link href="/catalog" className="relative block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input 
                type="text" 
                readOnly
                placeholder="Ir al buscador de productos..." 
                className="input-glass w-full pl-10 cursor-pointer hover:border-primary transition-all"
              />
            </Link>
            <p className="text-xs text-text-muted mt-3">
              Ingresa al buscador para ver stock en tiempo real.
            </p>
          </div>

          <div className="glass p-6">
            <h2 className="font-semibold text-lg mb-4">Enlaces Rápidos</h2>
            <div className="space-y-3">
              <Link href="/catalog" className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all text-sm group">
                <span>Consultar Catálogo</span>
                <ChevronRight size={16} className="text-text-muted group-hover:text-primary transition-colors" />
              </Link>
              {['Historial por Cliente', 'Reporte de Almacén'].map((link, i) => (
                <button key={i} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all text-sm group text-left">
                  <span>{link}</span>
                  <ChevronRight size={16} className="text-text-muted group-hover:text-primary transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
