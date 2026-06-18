'use client';
import { useState, useEffect } from 'react';
import { 
  Search, Edit, Loader2, RefreshCw, AlertCircle, X, Check, 
  Store, Tag, Barcode, Package, Layers, Activity 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductsView() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtros y Buscador
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Estados de Modales
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [sedeStocks, setSedeStocks] = useState([]);
  
  const [editProduct, setEditProduct] = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Estados de interfaz responsiva
  const [windowWidth, setWindowWidth] = useState(1280);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileView = windowWidth < 768;

  // Categorías fijas en base a la lógica del ERP
  const categories = [
    { id: 'all', name: 'Todos los Artículos' },
    { id: '01', name: 'Membresías' },
    { id: '02', name: 'Suplementos y Productos' },
    { id: '03', name: 'Servicios / Entrenamientos' }
  ];

  // Cargar productos desde la API
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      // Usamos el endpoint existente de búsqueda con parámetros vacíos
      const categoryParam = selectedCategory !== 'all' ? selectedCategory : '';
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchTerm)}&category=${categoryParam}`);
      if (!res.ok) throw new Error('Fallo al cargar productos de la base de datos');
      const data = await res.json();
      setProducts(data || []);
    } catch (err) {
      console.error('[ProductsView] Error fetching products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Debounce para la búsqueda
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedCategory]);

  // Cargar stock en otras sedes
  const loadSedeStocks = async (product) => {
    setStockModalProduct(product);
    setStockLoading(true);
    setSedeStocks([]);
    try {
      const res = await fetch(`/api/products/stock-sedes?codi=${encodeURIComponent(product.id)}`);
      if (!res.ok) throw new Error('Error al consultar stock de sedes');
      const data = await res.json();
      setSedeStocks(data || []);
    } catch (err) {
      console.error('[ProductsView] Error loading stocks:', err);
    } finally {
      setStockLoading(false);
    }
  };

  // Guardar edición de producto
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setSavingProduct(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch('/api/products/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProduct)
      });
      const data = await res.json();

      if (data.success) {
        setSaveSuccess(true);
        // Refrescar los datos localmente
        setProducts(prev => prev.map(p => p.id === editProduct.id ? { 
          ...p, 
          name: editProduct.descr,
          brand: editProduct.marc,
          unit: editProduct.umed,
          price: editProduct.pvns,
          userCode: editProduct.codf,
          estado: editProduct.estado
        } : p));
        
        setTimeout(() => {
          setEditProduct(null);
          setSaveSuccess(false);
        }, 1500);
      } else {
        throw new Error(data.error || 'No se pudo actualizar el producto');
      }
    } catch (err) {
      console.error('[ProductsView] Error saving product:', err);
      setSaveError(err.message);
    } finally {
      setSavingProduct(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount || 0);
  };

  // Estilos adaptables reactivos
  const responsiveContainerStyle = {
    ...containerStyle,
    padding: isMobileView ? '16px' : '30px',
    gap: isMobileView ? '16px' : '24px',
  };

  const responsiveHeaderStyle = {
    ...headerStyle,
    flexDirection: isMobileView ? 'column' : 'row',
    alignItems: isMobileView ? 'stretch' : 'center',
    gap: isMobileView ? '12px' : '0'
  };

  const responsiveFiltersStyle = {
    ...filtersContainerStyle,
    flexDirection: isMobileView ? 'column' : 'row',
    alignItems: isMobileView ? 'stretch' : 'center',
  };

  return (
    <div style={responsiveContainerStyle}>
      {/* Cabecera */}
      <div style={responsiveHeaderStyle}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: isMobileView ? '20px' : '24px',
            fontWeight: 950,
            color: '#0f172a',
            letterSpacing: '-0.02em'
          }}>Catálogo de Productos y Artículos</h2>
          <p style={subtitleStyle}>Precios locales, herencia de precios maestros y stock consolidado multi-sede.</p>
        </div>
        <div>
          <button onClick={fetchProducts} style={refreshBtnStyle} disabled={loading} title="Actualizar lista">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div style={responsiveFiltersStyle}>
        <div style={{
          ...searchWrapperStyle,
          width: isMobileView ? '100%' : '350px',
          flex: isMobileView ? 'initial' : 'none'
        }}>
          <Search size={16} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Buscar por código, código físico o nombre..." 
            style={searchInputStyle}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Categorías (Pestañas horizontales Porcelain) */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: isMobileView ? '6px' : '0',
          width: isMobileView ? '100%' : 'auto',
          scrollbarWidth: 'none'
        }}>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                ...categoryTabStyle,
                background: selectedCategory === cat.id ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : '#fff',
                color: selectedCategory === cat.id ? '#fff' : '#475569',
                borderColor: selectedCategory === cat.id ? '#0f172a' : '#e2e8f0',
                fontWeight: selectedCategory === cat.id ? 850 : 650,
                boxShadow: selectedCategory === cat.id ? '0 4px 10px rgba(15,23,42,0.1)' : 'none'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Listado / Tabla de Productos */}
      <div style={contentCardStyle}>
        {loading && products.length === 0 ? (
          <div style={loadingContainerStyle}>
            <Loader2 className="animate-spin" size={32} color="#3b82f6" />
            <p style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Cargando catálogo del ERP...</p>
          </div>
        ) : error ? (
          <div style={errorContainerStyle}>
            <AlertCircle size={32} color="#ef4444" />
            <p style={{ color: '#ef4444', fontWeight: 800, marginTop: '8px' }}>Error al consultar base de datos</p>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 16px' }}>{error}</p>
            <button onClick={fetchProducts} style={retryBtnStyle}>Reintentar</button>
          </div>
        ) : products.length === 0 ? (
          <div style={emptyContainerStyle}>
            <Package size={48} color="#94a3b8" />
            <p style={{ marginTop: '12px', fontWeight: 800, color: '#475569' }}>No se encontraron artículos</p>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 16px' }}>No hay registros que coincidan con la búsqueda en esta sucursal.</p>
          </div>
        ) : isMobileView ? (
          /* VISTA MÓVIL: Tarjetas Adaptables */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', overflowY: 'auto' }}>
            {products.map((item, idx) => (
              <div key={item.id} style={mobileCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: '#eff6ff',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#3b82f6',
                      flexShrink: 0
                    }}>
                      <Package size={16} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>{item.name}</h4>
                      <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Cód: {item.id} {item.userCode ? `• ${item.userCode}` : ''}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>{formatCurrency(item.price)}</div>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 800,
                      color: item.stock > 0 ? '#16a34a' : '#dc2626',
                      background: item.stock > 0 ? '#f0fdf4' : '#fef2f2',
                      padding: '1px 6px',
                      borderRadius: '6px',
                      display: 'inline-block',
                      marginTop: '4px'
                    }}>
                      {item.stock > 0 ? `${Math.floor(item.stock)} Disp.` : 'Sin Stock'}
                    </span>
                  </div>
                </div>
                
                <div style={cardFooterActionsStyle}>
                  <button 
                    onClick={() => loadSedeStocks(item)} 
                    style={cardActionBtnStyle}
                  >
                    <Store size={14} />
                    <span>Ver Stock Sedes</span>
                  </button>
                  <button 
                    onClick={() => setEditProduct({
                      id: item.id,
                      descr: item.name,
                      marc: item.brand,
                      umed: item.unit,
                      pvns: item.price,
                      codf: item.userCode,
                      estado: item.estado ?? 1
                    })} 
                    style={cardActionBtnEditStyle}
                  >
                    <Edit size={14} />
                    <span>Editar Artículo</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* VISTA ESCRITORIO: Tabla Premium */
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Código</th>
                  <th style={thStyle}>Cód. Barras</th>
                  <th style={thStyle}>Descripción</th>
                  <th style={thStyle}>Marca / Medida</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Precio</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Stock Local</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((item, index) => (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.02, 0.2) }}
                    style={trStyle}
                  >
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#64748b' }}>{item.id}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontWeight: 600 }}>
                        <Barcode size={14} color="#94a3b8" />
                        <span>{item.userCode || '-'}</span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 800, color: '#0f172a' }}>{item.name}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 700, color: '#475569' }}>{item.brand || 'Navasoft'}</span>
                        <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Unid: {item.unit || 'UND'}</span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 900, color: '#0f172a', fontSize: '14px' }}>
                      {formatCurrency(item.price)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: item.stock > 0 ? '#16a34a' : '#dc2626',
                        background: item.stock > 0 ? '#f0fdf4' : '#fef2f2',
                        padding: '3px 10px',
                        borderRadius: '8px',
                        border: item.stock > 0 ? '1px solid #dcfce7' : '1px solid #fee2e2',
                        display: 'inline-block'
                      }}>
                        {item.stock > 0 ? `${Math.floor(item.stock)} disp.` : 'Agotado'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          onClick={() => loadSedeStocks(item)}
                          style={actionBtnSedeStyle}
                          title="Ver stock en otras sedes"
                        >
                          <Store size={14} />
                        </button>
                        <button 
                          onClick={() => setEditProduct({
                            id: item.id,
                            descr: item.name,
                            marc: item.brand,
                            umed: item.unit,
                            pvns: item.price,
                            codf: item.userCode,
                            estado: item.estado ?? 1
                          })}
                          style={actionBtnEditStyle}
                          title="Editar producto"
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: CONSULTA DE STOCK MULTI-SEDE */}
      <AnimatePresence>
        {stockModalProduct && (
          <div style={modalOverlayStyle}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                ...modalContentStyle,
                width: isMobileView ? '95%' : '480px',
                padding: '24px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Store size={20} color="#3b82f6" />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>Stock Consolidad Multi-Sede</h3>
                </div>
                <button onClick={() => setStockModalProduct(null)} style={closeModalBtnStyle}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', marginBottom: '16px' }}>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Artículo consultado:</p>
                <h4 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 850, color: '#1e293b' }}>{stockModalProduct.name}</h4>
                <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>Código ERP: {stockModalProduct.id}</p>
              </div>

              {stockLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }}>
                  <Loader2 className="animate-spin" size={28} color="#3b82f6" />
                  <p style={{ marginTop: '10px', fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Consultando servidores de sedes...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                  {sedeStocks.map(sede => (
                    <div 
                      key={sede.sedeId} 
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={14} color="#94a3b8" />
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#334155' }}>{sede.name}</span>
                      </div>
                      <span style={{
                        fontSize: '12px',
                        fontWeight: 900,
                        color: sede.stock > 0 ? '#16a34a' : '#94a3b8',
                        background: sede.stock > 0 ? '#f0fdf4' : '#f8fafc',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: sede.stock > 0 ? '1px solid #dcfce7' : '1px solid #f1f5f9'
                      }}>
                        {sede.stock > 0 ? `${Math.floor(sede.stock)} unds` : 'Sin stock'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: EDICIÓN DE PRODUCTO / ARTÍCULO */}
      <AnimatePresence>
        {editProduct && (
          <div style={modalOverlayStyle}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                ...modalContentStyle,
                width: isMobileView ? '95%' : '520px',
                padding: '24px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Edit size={18} color="#0f172a" />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>Editar Información del Artículo</h3>
                </div>
                <button onClick={() => setEditProduct(null)} style={closeModalBtnStyle} disabled={savingProduct}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveChanges} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Código ERP (Único)</label>
                    <input 
                      type="text" 
                      value={editProduct.id} 
                      disabled 
                      style={{ ...inputStyle, background: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }} 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Código Físico / Barras</label>
                    <input 
                      type="text" 
                      value={editProduct.codf || ''} 
                      onChange={e => setEditProduct({ ...editProduct, codf: e.target.value })} 
                      style={inputStyle}
                      placeholder="Ej: 775012..."
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Descripción / Nombre Maestro</label>
                  <input 
                    type="text" 
                    required
                    value={editProduct.descr} 
                    onChange={e => setEditProduct({ ...editProduct, descr: e.target.value })} 
                    style={inputStyle} 
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Marca / Fabricante</label>
                    <input 
                      type="text" 
                      value={editProduct.marc || ''} 
                      onChange={e => setEditProduct({ ...editProduct, marc: e.target.value })} 
                      style={inputStyle} 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Unidad de Medida</label>
                    <input 
                      type="text" 
                      required
                      value={editProduct.umed} 
                      onChange={e => setEditProduct({ ...editProduct, umed: e.target.value })} 
                      style={inputStyle} 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Precio de Venta Maestro (S/.)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={editProduct.pvns} 
                      onChange={e => setEditProduct({ ...editProduct, pvns: parseFloat(e.target.value) || 0 })} 
                      style={inputStyle} 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Estado del Producto</label>
                    <select
                      value={editProduct.estado}
                      onChange={e => setEditProduct({ ...editProduct, estado: parseInt(e.target.value) })}
                      style={inputStyle}
                    >
                      <option value={1}>Activo (Venta ERP)</option>
                      <option value={0}>Inactivo (Desactivado)</option>
                    </select>
                  </div>
                </div>

                {/* Notificaciones de éxito o error */}
                <AnimatePresence>
                  {saveSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={successAlertStyle}
                    >
                      <Check size={14} style={{ marginRight: '6px' }} />
                      <span>¡Artículo guardado y propagado en el ERP con éxito!</span>
                    </motion.div>
                  )}
                  {saveError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={errorAlertStyle}
                    >
                      <AlertCircle size={14} style={{ marginRight: '6px' }} />
                      <span>Error: {saveError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Botones de acción */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '8px', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    onClick={() => setEditProduct(null)} 
                    style={cancelBtnStyle}
                    disabled={savingProduct}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    style={submitBtnStyle}
                    disabled={savingProduct}
                  >
                    {savingProduct ? (
                      <>
                        <Loader2 className="animate-spin" size={14} style={{ marginRight: '6px' }} />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <span>Guardar Cambios</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ESTILOS DE INTERFAZ PORCELAIN GLASS (CSS INLINE)
const containerStyle = {
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: '#f8fafc',
  overflowY: 'auto'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const subtitleStyle = {
  margin: '4px 0 0',
  color: '#64748b',
  fontSize: '12px',
  fontWeight: 500
};

const refreshBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  background: '#fff',
  border: '1px solid #e2e8f0',
  color: '#475569',
  cursor: 'pointer',
  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  transition: 'all 0.2s',
  flexShrink: 0
};

const filtersContainerStyle = {
  display: 'flex',
  gap: '16px',
  alignItems: 'center',
  flexWrap: 'wrap'
};

const searchWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  background: '#fff',
  padding: '10px 16px',
  borderRadius: '14px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
};

const searchInputStyle = {
  border: 'none',
  outline: 'none',
  width: '100%',
  fontSize: '13px',
  fontWeight: 650,
  color: '#1e293b'
};

const categoryTabStyle = {
  padding: '10px 16px',
  borderRadius: '12px',
  border: '1px solid',
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  whiteSpace: 'nowrap'
};

const contentCardStyle = {
  flex: 1,
  background: '#fff',
  borderRadius: '24px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 20px -2px rgba(15,23,42,0.02)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  minHeight: '400px'
};

const loadingContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  padding: '50px'
};

const errorContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  padding: '50px',
  textAlign: 'center'
};

const retryBtnStyle = {
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  padding: '8px 16px',
  fontWeight: 700,
  fontSize: '13px',
  cursor: 'pointer',
  marginTop: '12px'
};

const emptyContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  padding: '50px',
  textAlign: 'center'
};

const tableWrapperStyle = {
  width: '100%',
  overflowX: 'auto'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left'
};

const thStyle = {
  padding: '16px 20px',
  background: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
  color: '#475569',
  fontSize: '11px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const trStyle = {
  borderBottom: '1px solid #f1f5f9',
  transition: 'background-color 0.2s'
};

const tdStyle = {
  padding: '16px 20px',
  fontSize: '13px',
  color: '#334155',
  verticalAlign: 'middle'
};

const actionBtnSedeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  background: '#eff6ff',
  color: '#3b82f6',
  border: '1px solid #dbeafe',
  cursor: 'pointer',
  transition: 'all 0.2s'
};

const actionBtnEditStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  background: '#f8fafc',
  color: '#475569',
  border: '1px solid #e2e8f0',
  cursor: 'pointer',
  transition: 'all 0.2s'
};

// Estilos móviles específicos
const mobileCardStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  padding: '14px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  boxShadow: '0 2px 6px rgba(0,0,0,0.01)'
};

const cardFooterActionsStyle = {
  display: 'flex',
  gap: '10px',
  borderTop: '1px solid #f1f5f9',
  paddingTop: '10px',
  marginTop: '4px'
};

const cardActionBtnStyle = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '8px',
  borderRadius: '8px',
  background: '#eff6ff',
  color: '#3b82f6',
  border: '1px solid #dbeafe',
  fontSize: '11px',
  fontWeight: 750,
  cursor: 'pointer'
};

const cardActionBtnEditStyle = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '8px',
  borderRadius: '8px',
  background: '#f8fafc',
  color: '#475569',
  border: '1px solid #e2e8f0',
  fontSize: '11px',
  fontWeight: 750,
  cursor: 'pointer'
};

// Estilos de Modales
const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(15, 23, 42, 0.4)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px'
};

const modalContentStyle = {
  background: '#fff',
  borderRadius: '24px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '90vh',
  overflowY: 'auto'
};

const closeModalBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  background: '#f1f5f9',
  border: 'none',
  color: '#64748b',
  cursor: 'pointer'
};

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 800,
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '6px'
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid #e2e8f0',
  fontSize: '13px',
  fontWeight: 650,
  color: '#1e293b',
  outline: 'none',
  transition: 'border-color 0.2s'
};

const cancelBtnStyle = {
  padding: '10px 16px',
  borderRadius: '10px',
  background: '#f1f5f9',
  color: '#475569',
  border: 'none',
  fontSize: '12px',
  fontWeight: 800,
  cursor: 'pointer'
};

const submitBtnStyle = {
  padding: '10px 18px',
  borderRadius: '10px',
  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  color: '#fff',
  border: 'none',
  fontSize: '12px',
  fontWeight: 850,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 10px rgba(15,23,42,0.1)'
};

const successAlertStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 14px',
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '10px',
  color: '#16a34a',
  fontSize: '12px',
  fontWeight: 700
};

const errorAlertStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 14px',
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '10px',
  color: '#dc2626',
  fontSize: '12px',
  fontWeight: 700
};
