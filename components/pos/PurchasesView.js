'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  Search, Trash2, Calendar, Loader2, Save, ShoppingCart, 
  User, Receipt, ArrowRight, Check, AlertCircle, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PurchasesView({ idApeCaj, onPurchaseSuccess }) {
  // Estados de carga e interfaz
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Estados del Proveedor
  const [isGenericSupplier, setIsGenericSupplier] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [supplierResults, setSupplierResults] = useState([]);
  const [searchingSupplier, setSearchingSupplier] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [manualSupplierName, setManualSupplierName] = useState('');
  const [manualSupplierRuc, setManualSupplierRuc] = useState('');

  // Estados del Comprobante
  const [docType, setDocType] = useState('01'); // '01' = FACTURA, '03' = BOLETA VTA
  const [docSerie, setDocSerie] = useState('');
  const [docCorrelativo, setDocCorrelativo] = useState('');
  const [fechaEmision, setFechaEmision] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  // Estados del Buscador de Productos
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [searchingProduct, setSearchingProduct] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Detalle de Compra (Carrito)
  const [cartItems, setCartItems] = useState([]);

  const supplierRef = useRef(null);
  const productRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(1200);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // Inicializar fecha de hoy
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFechaEmision(today);
    setFechaVencimiento(today);
  }, []);

  // Cerrar dropdowns al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (supplierRef.current && !supplierRef.current.contains(event.target)) {
        setShowSupplierDropdown(false);
      }
      if (productRef.current && !productRef.current.contains(event.target)) {
        setShowProductDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Búsqueda de Proveedores (Debounce)
  useEffect(() => {
    if (isGenericSupplier) return;
    if (supplierSearchQuery.length < 2) {
      setSupplierResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearchingSupplier(true);
      try {
        const res = await fetch(`/api/suppliers/search?q=${encodeURIComponent(supplierSearchQuery)}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setSupplierResults(data);
        }
      } catch (err) {
        console.error('Error searching suppliers:', err);
      } finally {
        setSearchingSupplier(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [supplierSearchQuery, isGenericSupplier]);

  // Búsqueda de Productos (Debounce)
  useEffect(() => {
    if (productSearchQuery.length < 2) {
      setProductResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearchingProduct(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(productSearchQuery)}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setProductResults(data);
        }
      } catch (err) {
        console.error('Error searching products:', err);
      } finally {
        setSearchingProduct(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [productSearchQuery]);

  // Manejar selección de proveedor
  const handleSelectSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setSupplierSearchQuery(supplier.nompro);
    setShowSupplierDropdown(false);
    setErrorMsg(null);
  };

  // Manejar selección de producto
  const handleAddProductToCart = (prod) => {
    const exists = cartItems.find(item => item.id === prod.id);
    if (exists) {
      // Incrementar cantidad
      setCartItems(cartItems.map(item => 
        item.id === prod.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      // Agregar nuevo ítem con costo por defecto
      setCartItems([...cartItems, {
        id: prod.id,
        userCode: prod.userCode,
        name: prod.name,
        brand: prod.brand,
        unit: prod.unit,
        quantity: 1,
        cost: prod.price || 0 // Usar precio venta como costo de compra tentativo por defecto
      }]);
    }
    setProductSearchQuery('');
    setProductResults([]);
    setShowProductDropdown(false);
    setErrorMsg(null);
  };

  const handleUpdateQuantity = (id, val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) return;
    setCartItems(cartItems.map(item => 
      item.id === id ? { ...item, quantity: num } : item
    ));
  };

  const handleUpdateCost = (id, val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) return;
    setCartItems(cartItems.map(item => 
      item.id === id ? { ...item, cost: num } : item
    ));
  };

  const handleRemoveItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  // Calcular totales en tiempo real
  const calculateCartTotals = () => {
    const total = cartItems.reduce((acc, item) => acc + (item.cost * item.quantity), 0);
    // Redondear y desglosar impuesto (IGV 18%)
    const subtotal = total / 1.18;
    const igv = total - subtotal;
    return {
      subtotal: Number(subtotal.toFixed(2)),
      igv: Number(igv.toFixed(2)),
      total: Number(total.toFixed(2))
    };
  };

  const totals = calculateCartTotals();

  // Enviar el registro de compra
  const handleRegisterPurchase = async () => {
    setErrorMsg(null);

    // Validar datos básicos
    if (!idApeCaj) {
      setErrorMsg("Debe abrir caja antes de registrar una compra.");
      return;
    }

    let supplierData = null;
    if (isGenericSupplier) {
      if (!manualSupplierName.trim()) {
        setErrorMsg("Por favor, ingrese el nombre del proveedor manual.");
        return;
      }
      if (manualSupplierRuc.trim().length !== 11 && manualSupplierRuc.trim().length !== 8 && manualSupplierRuc.trim().length > 0) {
        setErrorMsg("El RUC del proveedor manual debe tener 11 dígitos (o DNI de 8 dígitos).");
        return;
      }
      supplierData = {
        codpro: 'P00000',
        nompro: manualSupplierName.trim().toUpperCase(),
        rucpro: manualSupplierRuc.trim()
      };
    } else {
      if (!selectedSupplier) {
        setErrorMsg("Debe buscar y seleccionar un proveedor registrado en el ERP o activar 'Proveedor Varios'.");
        return;
      }
      supplierData = selectedSupplier;
    }

    if (!docSerie.trim() || !docCorrelativo.trim()) {
      setErrorMsg("Debe ingresar la serie y el número correlativo del comprobante del proveedor.");
      return;
    }

    if (cartItems.length === 0) {
      setErrorMsg("Agregue al menos un producto para registrar la compra.");
      return;
    }

    // Validar cantidades/costos mayores a cero
    const invalidItem = cartItems.find(item => item.quantity <= 0 || item.cost <= 0);
    if (invalidItem) {
      setErrorMsg(`El artículo '${invalidItem.name}' debe tener una cantidad y costo mayor a cero.`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        idApeCaj,
        supplier: supplierData,
        docType,
        docNumber: `${docSerie.trim().toUpperCase()}-${docCorrelativo.trim()}`,
        fechaEmision: fechaStr,
        fechaVencimiento: fechaVencStr,
        items: cartItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          cost: item.cost // Costo unitario ingresado (con IGV)
        }))
      };

      const res = await fetch('/api/purchases/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result.success) {
        setSuccessData(result);
        setCartItems([]);
        setDocSerie('');
        setDocCorrelativo('');
        setSelectedSupplier(null);
        setSupplierSearchQuery('');
        setManualSupplierName('');
        setManualSupplierRuc('');
        if (onPurchaseSuccess) onPurchaseSuccess();
      } else {
        throw new Error(result.error || result.details || 'Error desconocido al registrar compra');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount || 0);
  };

  if (!idApeCaj) {
    return (
      <div style={warningContainerStyle}>
        <AlertCircle size={48} color="#f59e0b" />
        <h3 style={{ margin: '16px 0 8px', fontWeight: 900, color: '#1e293b' }}>Caja Cerrada</h3>
        <p style={{ color: '#64748b', fontSize: '13px', maxWidth: '400px', textAlign: 'center', lineHeight: '1.5' }}>
          Debe abrir caja antes de registrar transacciones de compra en el sistema. Vaya al menú de caja para proceder.
        </p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Cabecera Principal */}
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>Registro de Compras</h2>
          <p style={subtitleStyle}>Ingreso físico de inventario y generación de cuentas por pagar en el ERP.</p>
        </div>
      </div>

      <div style={mainGridLayout}>
        {/* Formulario Izquierdo: Proveedor y Comprobante */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Card 1: Proveedor */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <User size={16} color="#3b82f6" />
              <h3 style={cardTitleStyle}>Proveedor</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label style={checkboxLabelStyle}>
                <input 
                  type="checkbox" 
                  checked={isGenericSupplier} 
                  onChange={(e) => {
                    setIsGenericSupplier(e.target.checked);
                    setSelectedSupplier(null);
                    setSupplierSearchQuery('');
                    setErrorMsg(null);
                  }}
                  style={checkboxInputStyle}
                />
                <span style={{ fontWeight: 800, color: '#475569' }}>Proveedor Varios (Manual)</span>
              </label>

              {!isGenericSupplier ? (
                // Buscador de Proveedor Registrado
                <div ref={supplierRef} style={{ position: 'relative' }}>
                  <div style={inputWrapperStyle}>
                    <Search size={16} color="#94a3b8" />
                    <input 
                      type="text" 
                      placeholder="Buscar por RUC o Razón Social..."
                      value={supplierSearchQuery}
                      onChange={(e) => {
                        setSupplierSearchQuery(e.target.value);
                        setSelectedSupplier(null);
                        setShowSupplierDropdown(true);
                      }}
                      onFocus={() => setShowSupplierDropdown(true)}
                      style={inputStyle}
                    />
                    {searchingSupplier && <Loader2 className="animate-spin" size={14} color="#3b82f6" />}
                  </div>

                  {showSupplierDropdown && supplierResults.length > 0 && (
                    <div style={dropdownListStyle}>
                      {supplierResults.map((s, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => handleSelectSupplier(s)}
                          style={dropdownItemStyle}
                        >
                          <div style={{ fontWeight: 800, color: '#334155' }}>{s.nompro}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            RUC: {s.rucpro} | Código: {s.codpro}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedSupplier && (
                    <div style={selectedSupplierBadgeStyle}>
                      <Check size={14} color="#10b981" style={{ marginRight: '6px' }} />
                      <div style={{ fontSize: '12px' }}>
                        <strong>Seleccionado:</strong> {selectedSupplier.nompro} ({selectedSupplier.rucpro})
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Formulario Manual
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={fieldLabelStyle}>RUC / Doc</span>
                    <input 
                      type="text" 
                      placeholder="Ingresar RUC" 
                      value={manualSupplierRuc}
                      onChange={e => setManualSupplierRuc(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={11}
                      style={textInputStyle}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={fieldLabelStyle}>Razón Social o Nombre</span>
                    <input 
                      type="text" 
                      placeholder="Ingresar Nombre/Razón Social" 
                      value={manualSupplierName}
                      onChange={e => setManualSupplierName(e.target.value)}
                      style={textInputStyle}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Datos del Comprobante */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <Receipt size={16} color="#3b82f6" />
              <h3 style={cardTitleStyle}>Datos del Comprobante</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Tipo de Comprobante */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={fieldLabelStyle}>Tipo Comprobante ERP</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setDocType('01')}
                    style={docType === '01' ? activeTabBtnStyle : inactiveTabBtnStyle}
                  >
                    FACTURA (01)
                  </button>
                  <button 
                    onClick={() => setDocType('03')}
                    style={docType === '03' ? activeTabBtnStyle : inactiveTabBtnStyle}
                  >
                    BOLETA VTA (03)
                  </button>
                </div>
              </div>

              {/* Serie y Correlativo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={fieldLabelStyle}>Serie</span>
                  <input 
                    type="text" 
                    placeholder="F001" 
                    value={docSerie}
                    onChange={e => setDocSerie(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    maxLength={4}
                    style={textInputStyle}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={fieldLabelStyle}>Número</span>
                  <input 
                    type="text" 
                    placeholder="0001234" 
                    value={docCorrelativo}
                    onChange={e => setDocCorrelativo(e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={8}
                    style={textInputStyle}
                  />
                </div>
              </div>

              {/* Fechas */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={fieldLabelStyle}>Fecha Emisión</span>
                  <div style={dateInputWrapperStyle}>
                    <Calendar size={14} color="#64748b" style={{ marginRight: '6px' }} />
                    <input 
                      type="date" 
                      value={fechaEmision}
                      onChange={e => setFechaEmision(e.target.value)}
                      style={dateStyle}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={fieldLabelStyle}>Fecha Vencimiento</span>
                  <div style={dateInputWrapperStyle}>
                    <Calendar size={14} color="#64748b" style={{ marginRight: '6px' }} />
                    <input 
                      type="date" 
                      value={fechaVencimiento}
                      onChange={e => setFechaVencimiento(e.target.value)}
                      style={dateStyle}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario Derecho: Carrito de Compra y Selección de Productos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <ShoppingCart size={16} color="#3b82f6" />
              <h3 style={cardTitleStyle}>Detalle de Artículos</h3>
            </div>

            {/* Buscador de Productos */}
            <div ref={productRef} style={{ position: 'relative', marginBottom: '14px' }}>
              <div style={inputWrapperStyle}>
                <Search size={16} color="#94a3b8" />
                <input 
                  type="text" 
                  placeholder="Buscar producto por nombre o código ERP..."
                  value={productSearchQuery}
                  onChange={(e) => {
                    setProductSearchQuery(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                  style={inputStyle}
                />
                {searchingProduct && <Loader2 className="animate-spin" size={14} color="#3b82f6" />}
              </div>

              {showProductDropdown && productResults.length > 0 && (
                <div style={dropdownListStyle}>
                  {productResults.map((p, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleAddProductToCart(p)}
                      style={dropdownItemStyle}
                    >
                      <div style={{ fontWeight: 800, color: '#334155' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Cod: {p.id} | Marca: {p.brand}</span>
                        <span style={{ fontWeight: 800, color: '#3b82f6' }}>Venta: {formatCurrency(p.price)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tabla de ítems agregados */}
            <div style={itemsTableWrapperStyle}>
              {cartItems.length === 0 ? (
                <div style={emptyCartStyle}>
                  <ShoppingCart size={32} color="#cbd5e1" />
                  <p style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>El carrito está vacío.</p>
                </div>
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Producto</th>
                      <th style={{ ...thStyle, width: '90px' }}>Cant</th>
                      <th style={{ ...thStyle, width: '120px' }}>Costo c/IGV</th>
                      <th style={{ ...thStyle, width: '100px', textAlign: 'right' }}>Total</th>
                      <th style={{ ...thStyle, width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item, idx) => (
                      <tr key={idx} style={trStyle}>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 800, color: '#1e293b' }}>{item.name}</span>
                            <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                              Cód: {item.id} | {item.brand} | {item.unit}
                            </span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <input 
                            type="number" 
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(item.id, e.target.value)}
                            style={tableInputStyle}
                            min="0.0001"
                            step="any"
                          />
                        </td>
                        <td style={tdStyle}>
                          <input 
                            type="number" 
                            value={item.cost}
                            onChange={(e) => handleUpdateCost(item.id, e.target.value)}
                            style={tableInputStyle}
                            min="0.01"
                            step="any"
                          />
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>
                          {formatCurrency(item.cost * item.quantity)}
                        </td>
                        <td style={tdStyle}>
                          <button 
                            onClick={() => handleRemoveItem(item.id)}
                            style={deleteBtnStyle}
                            title="Quitar ítem"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Totales y Registro */}
            <div style={totalsWrapperStyle}>
              <div style={totalRowStyle}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Subtotal (Sin IGV)</span>
                <span style={{ color: '#334155', fontWeight: 800 }}>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div style={totalRowStyle}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>IGV (18%)</span>
                <span style={{ color: '#334155', fontWeight: 800 }}>{formatCurrency(totals.igv)}</span>
              </div>
              <div style={{ ...totalRowStyle, borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
                <span style={{ color: '#0f172a', fontSize: '15px', fontWeight: 900 }}>Total Neto a Pagar</span>
                <span style={{ color: '#10b981', fontSize: '18px', fontWeight: 950 }}>{formatCurrency(totals.total)}</span>
              </div>

              {errorMsg && (
                <div style={errorBannerStyle}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button 
                onClick={handleRegisterPurchase}
                disabled={loading}
                style={loading ? disabledRegisterBtnStyle : registerBtnStyle}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Guardar y Sincronizar Compra</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal / Banner de Éxito */}
      <AnimatePresence>
        {successData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={overlayStyle}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={successModalStyle}
            >
              <div style={successIconContainerStyle}>
                <Check size={32} color="#fff" />
              </div>
              <h3 style={{ margin: '14px 0 6px', fontWeight: 900, color: '#1e293b', fontSize: '18px' }}>Compra Registrada</h3>
              <p style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', marginBottom: '16px' }}>
                Los documentos se han sincronizado con BdNava01.
              </p>

              <div style={modalInfoGridStyle}>
                <div style={modalInfoItemStyle}>
                  <span style={modalInfoLabelStyle}>Nota: Ingreso (GIM)</span>
                  <span style={modalInfoValueStyle}>{successData.notaIngreso}</span>
                </div>
                <div style={modalInfoItemStyle}>
                  <span style={modalInfoLabelStyle}>Voucher Compra</span>
                  <span style={modalInfoValueStyle}>{successData.voucher}</span>
                </div>
                <div style={modalInfoItemStyle}>
                  <span style={modalInfoLabelStyle}>Documento Referencia</span>
                  <span style={modalInfoValueStyle}>{successData.docType === '01' ? 'FACTURA' : 'BOLETA VTA'} {successData.docNumber}</span>
                </div>
                <div style={modalInfoItemStyle}>
                  <span style={modalInfoLabelStyle}>Total Importe</span>
                  <span style={{ ...modalInfoValueStyle, color: '#10b981' }}>{formatCurrency(successData.total)}</span>
                </div>
              </div>

              <button 
                onClick={() => setSuccessData(null)}
                style={closeModalBtnStyle}
              >
                <span>Continuar</span>
                <ArrowRight size={14} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ESTILOS GLASSMORPHIC / PORCELAIN
const containerStyle = {
  padding: '24px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  background: '#f8fafc',
  overflowY: 'auto',
  width: '100%',
  maxWidth: '1400px',
  margin: '0 auto'
};

const warningContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: '40px',
  background: '#f8fafc',
  width: '100%'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const titleStyle = {
  margin: 0,
  fontSize: '22px',
  fontWeight: 950,
  color: '#0f172a',
  letterSpacing: '-0.02em'
};

const subtitleStyle = {
  margin: '4px 0 0',
  color: '#64748b',
  fontSize: '11px',
  fontWeight: 500
};

const mainGridLayout = {
  display: 'grid',
  gridTemplateColumns: 'minmax(300px, 450px) 1fr',
  gap: '20px',
  alignItems: 'start',
  flex: 1,
  width: '100%'
};

// CSS hacks to handle grid in mobile
if (typeof window !== 'undefined' && window.innerWidth < 1024) {
  mainGridLayout.gridTemplateColumns = '1fr';
}

const cardStyle = {
  background: '#ffffff',
  borderRadius: '20px',
  border: '1px solid #e2e8f0',
  padding: '20px',
  boxShadow: '0 4px 20px -2px rgba(15,23,42,0.01)',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const cardHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  borderBottom: '1px solid #f1f5f9',
  paddingBottom: '10px'
};

const cardTitleStyle = {
  margin: 0,
  fontSize: '13px',
  fontWeight: 900,
  color: '#334155',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const checkboxLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  userSelect: 'none',
  fontSize: '12px'
};

const checkboxInputStyle = {
  width: '15px',
  height: '15px',
  borderRadius: '4px',
  cursor: 'pointer'
};

const inputWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  padding: '8px 12px',
  transition: 'all 0.2s ease-in-out'
};

const inputStyle = {
  border: 'none',
  background: 'transparent',
  outline: 'none',
  width: '100%',
  fontSize: '12px',
  color: '#334155',
  fontWeight: 600
};

const textInputStyle = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  padding: '8px 12px',
  fontSize: '12px',
  color: '#334155',
  fontWeight: 650,
  outline: 'none',
  width: '100%'
};

const dateInputWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '10px',
  padding: '6px 10px',
  width: '100%'
};

const dateStyle = {
  border: 'none',
  background: 'transparent',
  outline: 'none',
  fontSize: '11px',
  color: '#334155',
  fontWeight: 700,
  cursor: 'pointer',
  width: '100%'
};

const fieldLabelStyle = {
  fontSize: '10px',
  fontWeight: 800,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const dropdownListStyle = {
  position: 'absolute',
  top: 'calc(100% + 4px)',
  left: 0,
  right: 0,
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  boxShadow: '0 10px 25px -5px rgba(15,23,42,0.1)',
  zIndex: 100,
  maxHeight: '200px',
  overflowY: 'auto',
  padding: '4px'
};

const dropdownItemStyle = {
  padding: '8px 12px',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'background-color 0.15s',
  fontSize: '12px'
};

// Handle hover inside dropdowns via CSS simulation
const selectedSupplierBadgeStyle = {
  display: 'flex',
  alignItems: 'center',
  background: '#ecfdf5',
  border: '1px solid #a7f3d0',
  color: '#065f46',
  borderRadius: '8px',
  padding: '8px 12px',
  marginTop: '10px'
};

const activeTabBtnStyle = {
  flex: 1,
  padding: '8px',
  borderRadius: '8px',
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  color: '#2563eb',
  fontSize: '11px',
  fontWeight: 900,
  cursor: 'pointer'
};

const inactiveTabBtnStyle = {
  flex: 1,
  padding: '8px',
  borderRadius: '8px',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  color: '#64748b',
  fontSize: '11px',
  fontWeight: 700,
  cursor: 'pointer'
};

const itemsTableWrapperStyle = {
  width: '100%',
  overflowX: 'auto',
  minHeight: '200px',
  maxHeight: '400px',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  background: '#f8fafc'
};

const emptyCartStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '200px'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left'
};

const thStyle = {
  padding: '10px 14px',
  background: '#f1f5f9',
  borderBottom: '1px solid #e2e8f0',
  color: '#475569',
  fontSize: '10px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const trStyle = {
  borderBottom: '1px solid #e2e8f0',
  background: '#fff'
};

const tdStyle = {
  padding: '10px 14px',
  fontSize: '12px',
  color: '#334155',
  verticalAlign: 'middle'
};

const tableInputStyle = {
  width: '100%',
  padding: '6px',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 700,
  textAlign: 'center',
  color: '#1e293b',
  outline: 'none'
};

const deleteBtnStyle = {
  border: 'none',
  background: 'transparent',
  color: '#ef4444',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s'
};

const totalsWrapperStyle = {
  borderTop: '2px dashed #e2e8f0',
  paddingTop: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  marginTop: '10px'
};

const totalRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '13px'
};

const registerBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '12px',
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: '12px',
  fontSize: '13px',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 4px 14px rgba(16,185,129,0.2)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  marginTop: '10px'
};

const disabledRegisterBtnStyle = {
  ...registerBtnStyle,
  background: '#cbd5e1',
  boxShadow: 'none',
  cursor: 'not-allowed'
};

const errorBannerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: '#fef2f2',
  border: '1px solid #fee2e2',
  color: '#b91c1c',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '11px',
  fontWeight: 750,
  marginTop: '6px'
};

const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(15,23,42,0.4)',
  backdropFilter: 'blur(4px)',
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
};

const successModalStyle = {
  background: '#ffffff',
  borderRadius: '24px',
  padding: '24px',
  width: '100%',
  maxWidth: '460px',
  boxShadow: '0 20px 50px -12px rgba(15,23,42,0.15)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const successIconContainerStyle = {
  width: '56px',
  height: '56px',
  borderRadius: '18px',
  background: '#10b981',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
};

const modalInfoGridStyle = {
  width: '100%',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  padding: '14px',
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: '10px',
  marginBottom: '20px'
};

const modalInfoItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '11px',
  borderBottom: '1px solid #e2e8f0',
  paddingBottom: '6px'
};

const modalInfoLabelStyle = {
  color: '#64748b',
  fontWeight: 700
};

const modalInfoValueStyle = {
  color: '#1e293b',
  fontWeight: 900
};

const closeModalBtnStyle = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '10px',
  background: '#1e293b',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  fontSize: '12px',
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};
