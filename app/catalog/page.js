'use client';
import { useState, useEffect } from 'react';
import { Search, Box, Tag, Layers, RefreshCw, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';

export default function CatalogPage() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchProducts = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    searchProducts();
  }, []);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
      {/* Header & Back Link */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors text-sm w-fit">
            <ChevronLeft size={16} />
            Volver al Dashboard
          </Link>
          <button 
            onClick={() => signOut()}
            className="glass p-2 text-text-muted hover:text-red-500 transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Catálogo de Productos</h1>
            <p className="text-text-muted mt-1">Consulta de precios y stock consolidado</p>
          </div>
          
          <form onSubmit={searchProducts} className="relative min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escribe el nombre o código..." 
              className="input-glass w-full pl-10 pr-24"
            />
            <button 
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 btn-primary !py-1.5 !px-4 text-xs"
            >
              Buscar
            </button>
          </form>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <RefreshCw className="animate-spin text-primary" size={48} />
          <p className="text-text-muted font-medium">Consultando el ERP...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map((product, i) => (
            <div key={i} className="glass p-6 glass-hover group flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-slate-800/50 text-blue-400">
                  <Box size={24} />
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Stock</span>
                  <p className={`text-xl font-bold ${product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {product.stock.toFixed(0)} {product.unit.trim()}
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-semibold leading-tight mb-2 group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              
              <div className="flex items-center gap-2 text-xs text-text-muted mb-4">
                <Tag size={12} />
                <span>Cód: {product.code}</span>
                <span className="mx-1">•</span>
                <Layers size={12} />
                <span>{product.brand.trim() || 'Sin Marca'}</span>
              </div>

              <div className="mt-auto pt-4 border-t border-glass flex justify-between items-center">
                <div>
                  <span className="text-xs text-text-muted block">Precio Sugerido</span>
                  <span className="text-2xl font-bold text-white">
                    S/ {product.price.toFixed(2)}
                  </span>
                </div>
                <button className="p-2 rounded-lg bg-white/5 hover:bg-primary/20 text-text-muted hover:text-primary transition-all">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass p-20 text-center flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-slate-800/50 text-text-muted">
            <Search size={40} />
          </div>
          <h3 className="text-xl font-semibold">No se encontraron productos</h3>
          <p className="text-text-muted max-w-xs mx-auto">
            Intenta con otro término de búsqueda o asegúrate de que el código sea correcto.
          </p>
        </div>
      )}
    </div>
  );
}
