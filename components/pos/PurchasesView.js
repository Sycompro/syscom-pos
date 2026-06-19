'use client';
import { useState, useEffect, useRef } from 'react';
import { 
  Search, Trash2, Calendar, Loader2, Save, ShoppingCart, 
  User, Receipt, ArrowRight, Check, AlertCircle, RefreshCw,
  FileText, Clipboard, Link as LinkIcon, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PurchasesView({ idApeCaj, onPurchaseSuccess, currentTab }) {
  // Pestañas principales: 'ocm' = Orden de Compra, 'gim' = Nota de Ingreso, 'ccp' = Facturas/Boletas
  const [subTab, setSubTab] = useState('ccp');
  // Modo de visualización: 'list' (historial) o 'create' (formulario de registro)
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    if (currentTab) {
      setSubTab(currentTab);
      setViewMode('list');
      setErrorMsg(null);
      setSuccessData(null);
    }
  }, [currentTab]);

  // Estados generales de carga y error
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Estados para los listados (historial)
  const [ocmList, setOcmList] = useState([]);
  const [gimList, setGimList] = useState([]);
  const [ccpList, setCcpList] = useState([]);
  const [listSearchTerm, setListSearchTerm] = useState('');
  const [loadingList, setLoadingList] = useState(false);

  // Estados del Proveedor (Compartido en formularios de creación)
  const [isGenericSupplier, setIsGenericSupplier] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [supplierResults, setSupplierResults] = useState([]);
  const [searchingSupplier, setSearchingSupplier] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [manualSupplierName, setManualSupplierName] = useState('');
  const [manualSupplierRuc, setManualSupplierRuc] = useState('');

  // Estados del Carrito de Artículos (Compartido)
  const [cartItems, setCartItems] = useState([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productResults, setProductResults] = useState([]);
  const [searchingProduct, setSearchingProduct] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Estados específicos de OCM (Creación)
  const [fechaOCMEmision, setFechaOCMEmision] = useState('');
  const [fechaOCMVencimiento, setFechaOCMVencimiento] = useState('');

  // Estados específicos de GIM (Creación)
  const [gimImportMode, setGimImportMode] = useState('direct'); // 'direct' o 'import'
  const [pendingOcms, setPendingOcms] = useState([]);
  const [selectedOcmNumber, setSelectedOcmNumber] = useState('');
  const [gimDocNumber, setGimDocNumber] = useState(''); // Guía de remisión del proveedor
  const [fechaGIMEmision, setFechaGIMEmision] = useState('');

  // Estados específicos de CCP (Creación)
  const [ccpImportMode, setCcpImportMode] = useState('direct'); // 'direct' (GIM+CCP directa) o 'import' (Asociar a GIM)
  const [pendingGims, setPendingGims] = useState([]);
  const [selectedGimNumber, setSelectedGimNumber] = useState('');
  const [docType, setDocType] = useState('01'); // '01' = Factura, '03' = Boleta
  const [docSerie, setDocSerie] = useState('');
  const [docCorrelativo, setDocCorrelativo] = useState('');
  const [fechaCCPEmision, setFechaCCPEmision] = useState('');
  const [fechaCCPVencimiento, setFechaCCPVencimiento] = useState('');

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

  // Inicializar fechas hoy
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFechaOCMEmision(today);
    setFechaOCMVencimiento(today);
    setFechaGIMEmision(today);
    setFechaCCPEmision(today);
    setFechaCCPVencimiento(today);
  }, []);

  // Cargar historial en base a pestaña activa
  useEffect(() => {
    setViewMode('list');
    setListSearchTerm('');
    fetchHistory();
  }, [subTab]);

  // Búsqueda en historial con Debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchHistory();
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [listSearchTerm]);

  // Cargar datos del historial
  const fetchHistory = async () => {
    setLoadingList(true);
    try {
      if (subTab === 'ocm') {
        const res = await fetch(`/api/purchases/ocm/list?q=${encodeURIComponent(listSearchTerm)}`);
        const data = await res.json();
        if (data.success) setOcmList(data.orders || []);
      } else if (subTab === 'gim') {
        const res = await fetch(`/api/purchases/gim/list?q=${encodeURIComponent(listSearchTerm)}`);
        const data = await res.json();
        if (data.success) setGimList(data.notes || []);
      } else if (subTab === 'ccp') {
        const res = await fetch(`/api/purchases/ccp/list?q=${encodeURIComponent(listSearchTerm)}`);
        const data = await res.json();
        if (data.success) setCcpList(data.invoices || []);
      }
    } catch (err) {
      console.error('Error fetching purchase history:', err);
    } finally {
      setLoadingList(false);
    }
  };

  // Cargar referencias pendientes (OCM o GIM) al abrir formulario de creación
  const handleOpenCreateForm = async () => {
    setViewMode('create');
    setErrorMsg(null);
    setCartItems([]);
    setSelectedSupplier(null);
    setSupplierSearchQuery('');
    setIsGenericSupplier(false);
    
    if (subTab === 'gim') {
      setGimImportMode('direct');
      setSelectedOcmNumber('');
      setGimDocNumber('');
      try {
        const res = await fetch('/api/purchases/ocm/pending');
        const data = await res.json();
        if (data.success) setPendingOcms(data.orders || []);
      } catch (err) {
        console.error('Error fetching pending OCMs:', err);
      }
    } else if (subTab === 'ccp') {
      setCcpImportMode('direct');
      setSelectedGimNumber('');
      setDocSerie('');
      setDocCorrelativo('');
      try {
        const res = await fetch('/api/purchases/gim/pending');
        const data = await res.json();
        if (data.success) setPendingGims(data.notes || []);
      } catch (err) {
        console.error('Error fetching pending GIMs:', err);
      }
    }
  };

  // Importar detalle de OCM seleccionada para la Nota de Ingreso GIM
  const handleImportOcm = async (ndocu) => {
    if (!ndocu) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/purchases/ocm/pending?ndocu=${encodeURIComponent(ndocu)}`);
      const data = await res.json();
      if (data.success) {
        setSelectedSupplier({
          codpro: data.order.codpro,
          nompro: data.order.nompro,
          rucpro: data.order.rucpro
        });
        setSupplierSearchQuery(data.order.nompro);
        setIsGenericSupplier(data.order.codpro === 'P00000');
        
        // Cargar ítems pendientes en el carrito
        const mappedItems = data.items.map(item => ({
          id: item.id,
          userCode: item.userCode,
          name: item.name,
          brand: item.brand,
          unit: item.unit,
          quantity: item.pendingQty,
          cost: item.cost // costo referencial
        }));
        setCartItems(mappedItems);
      } else {
        throw new Error(data.error || 'Error al importar Orden de Compra');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Importar detalle de GIM seleccionada para la Factura/Boleta CCP
  const handleImportGim = async (ndocu) => {
    if (!ndocu) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/purchases/gim/pending?ndocu=${encodeURIComponent(ndocu)}`);
      const data = await res.json();
      if (data.success) {
        setSelectedSupplier({
          codpro: data.note.codpro,
          nompro: data.note.nompro,
          rucpro: data.note.rucpro
        });
        setSupplierSearchQuery(data.note.nompro);
        setIsGenericSupplier(data.note.codpro === 'P00000');

        // Cargar ítems recibidos en el carrito
        const mappedItems = data.items.map(item => ({
          id: item.id,
          userCode: item.userCode,
          name: item.name,
          brand: item.brand,
          unit: item.unit,
          quantity: item.cant,
          cost: item.cost // Costo cargado de la GIM
        }));
        setCartItems(mappedItems);
      } else {
        throw new Error(data.error || 'Error al importar Nota de Ingreso');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cerrar desplegables de búsqueda al clickear fuera
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

  // Búsqueda de Proveedores
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
        if (Array.isArray(data)) setSupplierResults(data);
      } catch (err) {
        console.error('Error searching suppliers:', err);
      } finally {
        setSearchingSupplier(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [supplierSearchQuery, isGenericSupplier]);

  // Búsqueda de Productos
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
        if (Array.isArray(data)) setProductResults(data);
      } catch (err) {
        console.error('Error searching products:', err);
      } finally {
        setSearchingProduct(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [productSearchQuery]);

  const handleSelectSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setSupplierSearchQuery(supplier.nompro);
    setShowSupplierDropdown(false);
    setErrorMsg(null);
  };

  const handleAddProductToCart = (prod) => {
    const exists = cartItems.find(item => item.id === prod.id);
    if (exists) {
      setCartItems(cartItems.map(item => 
        item.id === prod.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCartItems([...cartItems, {
        id: prod.id,
        userCode: prod.userCode,
        name: prod.name,
        brand: prod.brand,
        unit: prod.unit,
        quantity: 1,
        cost: prod.price || 0 // Usar precio venta como costo compra por defecto
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

  const calculateCartTotals = () => {
    const total = cartItems.reduce((acc, item) => acc + (item.cost * item.quantity), 0);
    const subtotal = total / 1.18;
    const igv = total - subtotal;
    return {
      subtotal: Number(subtotal.toFixed(2)),
      igv: Number(igv.toFixed(2)),
      total: Number(total.toFixed(2))
    };
  };

  const totals = calculateCartTotals();

  // ENVÍO DE FORMULARIOS AL SERVIDOR

  // 1. Guardar Orden de Compra (OCM)
  const handleSaveOCM = async () => {
    setErrorMsg(null);
    if (!validateBasicForm()) return;

    setLoading(true);
    try {
      const payload = {
        idApeCaj,
        supplier: getSupplierData(),
        fechaEmision: fechaOCMEmision,
        fechaVencimiento: fechaOCMVencimiento,
        items: cartItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          cost: item.cost
        }))
      };

      const res = await fetch('/api/purchases/ocm/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        setSuccessData({
          title: 'Orden de Compra Registrada',
          subtitle: 'El pedido se ha programado en el ERP.',
          info: [
            { label: 'Orden de Compra (OCM)', value: result.ndocu },
            { label: 'Proveedor', value: result.supplier.nompro },
            { label: 'Total Importe', value: formatCurrency(result.total), highlight: true }
          ]
        });
        setViewMode('list');
        fetchHistory();
      } else {
        throw new Error(result.error || result.details || 'Error al guardar OCM');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Guardar Nota de Ingreso (GIM)
  const handleSaveGIM = async () => {
    setErrorMsg(null);
    if (!validateBasicForm()) return;

    setLoading(true);
    try {
      const payload = {
        idApeCaj,
        supplier: getSupplierData(),
        fechaEmision: fechaGIMEmision,
        ocmNumber: gimImportMode === 'import' ? selectedOcmNumber : undefined,
        docNumber: gimDocNumber, // guía de remisión física
        items: cartItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          cost: item.cost
        }))
      };

      const res = await fetch('/api/purchases/gim/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        setSuccessData({
          title: 'Nota de Ingreso Registrada',
          subtitle: 'Se ha ingresado la mercadería física al almacén y actualizado el stock.',
          info: [
            { label: 'Nota de Ingreso (GIM)', value: result.ndocu },
            { label: 'Proveedor', value: result.supplier.nompro },
            { label: 'Referencia Pedido', value: gimImportMode === 'import' ? selectedOcmNumber : 'Directo' },
            { label: 'Total Stockizado', value: formatCurrency(result.total), highlight: true }
          ]
        });
        setViewMode('list');
        fetchHistory();
      } else {
        throw new Error(result.error || result.details || 'Error al guardar GIM');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Guardar Factura / Boleta (CCP)
  const handleSaveCCP = async () => {
    setErrorMsg(null);
    if (!validateBasicForm()) return;
    if (!docSerie.trim() || !docCorrelativo.trim()) {
      setErrorMsg("Debe ingresar la serie y el número correlativo del comprobante del proveedor.");
      return;
    }

    setLoading(true);
    try {
      // Si el modo es directo, usamos la ruta antigua unificada que crea GIM + CCP de un solo golpe.
      // Si el modo es importado, usamos la nueva ruta de CCP que asocia una GIM física existente.
      const url = ccpImportMode === 'direct' ? '/api/purchases/create' : '/api/purchases/ccp/create';

      const payload = {
        idApeCaj,
        supplier: getSupplierData(),
        docType,
        docNumber: `${docSerie.trim().toUpperCase()}-${docCorrelativo.trim()}`,
        gimNumber: ccpImportMode === 'import' ? selectedGimNumber : undefined,
        fechaEmision: fechaCCPEmision,
        fechaVencimiento: fechaCCPVencimiento,
        items: cartItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          cost: item.cost
        }))
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        setSuccessData({
          title: 'Comprobante de Compra Registrado',
          subtitle: 'Se ha creado la obligación contable en Cuentas por Pagar.',
          info: [
            { label: 'Voucher Compra', value: result.voucher },
            { label: 'Documento Proveedor', value: `${docType === '01' ? 'FACTURA' : 'BOLETA VTA'} ${docSerie.trim().toUpperCase()}-${docCorrelativo.trim()}` },
            { label: 'Proveedor', value: result.supplier.nompro },
            { label: 'Nota Ingreso (GIM)', value: result.notaIngreso || selectedGimNumber || 'Asociada' },
            { label: 'Deuda Provisión', value: formatCurrency(result.total), highlight: true }
          ]
        });
        if (onPurchaseSuccess) onPurchaseSuccess();
        setViewMode('list');
        fetchHistory();
      } else {
        throw new Error(result.error || result.details || 'Error al guardar CCP');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Validaciones del formulario
  const validateBasicForm = () => {
    if (!idApeCaj) {
      setErrorMsg("Debe abrir caja antes de registrar una compra.");
      return false;
    }
    if (isGenericSupplier) {
      if (!manualSupplierName.trim()) {
        setErrorMsg("Por favor, ingrese el nombre del proveedor manual.");
        return false;
      }
      if (manualSupplierRuc.trim().length !== 11 && manualSupplierRuc.trim().length !== 8 && manualSupplierRuc.trim().length > 0) {
        setErrorMsg("El RUC del proveedor manual debe tener 11 dígitos (o DNI de 8 dígitos).");
        return false;
      }
    } else {
      if (!selectedSupplier) {
        setErrorMsg("Debe buscar y seleccionar un proveedor registrado en el ERP o activar 'Proveedor Varios'.");
        return false;
      }
    }
    if (cartItems.length === 0) {
      setErrorMsg("Agregue al menos un producto.");
      return false;
    }
    const invalidItem = cartItems.find(item => item.quantity <= 0 || item.cost <= 0);
    if (invalidItem) {
      setErrorMsg(`El artículo '${invalidItem.name}' debe tener una cantidad y costo mayor a cero.`);
      return false;
    }
    return true;
  };

  const getSupplierData = () => {
    if (isGenericSupplier) {
      return {
        codpro: 'P00000',
        nompro: manualSupplierName.trim().toUpperCase(),
        rucpro: manualSupplierRuc.trim()
      };
    }
    return selectedSupplier;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount || 0);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-PE', { timeZone: 'UTC' });
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
          <h2 style={titleStyle}>Módulo de Compras</h2>
          <p style={subtitleStyle}>Planificación, abastecimiento físico y provisión contable conectada al ERP Navasoft.</p>
        </div>
      </div>



      {/* RENDERIZADO MODO: HISTORIAL (LIST) */}
      {viewMode === 'list' && (
        <div style={listContainerStyle}>
          <div style={listHeaderStyle}>
            <div style={{ ...inputWrapperStyle, flex: 1, maxWidth: '400px' }}>
              <Search size={16} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Buscar en el historial..."
                value={listSearchTerm}
                onChange={e => setListSearchTerm(e.target.value)}
                style={inputStyle}
              />
            </div>
            <button 
              onClick={handleOpenCreateForm}
              style={createNewBtnStyle}
            >
              <Plus size={16} style={{ marginRight: '6px' }} />
              {subTab === 'ocm' ? 'Crear Orden' : subTab === 'gim' ? 'Nuevo Ingreso' : 'Registrar Factura'}
            </button>
          </div>

          <div style={historyTableWrapperStyle}>
            {loadingList ? (
              <div style={loadingListContainerStyle}>
                <Loader2 className="animate-spin" size={24} color="#3b82f6" />
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Cargando historial...</span>
              </div>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Fecha</th>
                    <th style={thStyle}>Código / Documento</th>
                    <th style={thStyle}>Proveedor</th>
                    {subTab === 'ccp' && <th style={thStyle}>Voucher</th>}
                    {subTab !== 'ocm' && <th style={thStyle}>Referencia</th>}
                    <th style={{ ...thStyle, textAlign: 'right' }}>Importe</th>
                    <th style={{ ...thStyle, width: '60px' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {subTab === 'ocm' && ocmList.length === 0 && (
                    <tr><td colSpan="5" style={emptyRowStyle}>No se encontraron órdenes de compra registradas.</td></tr>
                  )}
                  {subTab === 'gim' && gimList.length === 0 && (
                    <tr><td colSpan="6" style={emptyRowStyle}>No se encontraron notas de ingreso registradas.</td></tr>
                  )}
                  {subTab === 'ccp' && ccpList.length === 0 && (
                    <tr><td colSpan="6" style={emptyRowStyle}>No se encontraron facturas registradas.</td></tr>
                  )}

                  {subTab === 'ocm' && ocmList.map((item, idx) => (
                    <tr key={idx} style={trStyle}>
                      <td style={tdStyle}>{formatDate(item.fecha)}</td>
                      <td style={{ ...tdStyle, fontWeight: 900, color: '#3b82f6' }}>{item.ndocu}</td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 800 }}>{item.nompro}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>RUC: {item.rucpro}</div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 900 }}>{formatCurrency(item.totn)}</td>
                      <td style={tdStyle}>
                        <span style={item.flag === '1' ? activeBadgeStyle : inactiveBadgeStyle}>
                          {item.flag === '1' ? 'Activo' : 'Cerrado'}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {subTab === 'gim' && gimList.map((item, idx) => (
                    <tr key={idx} style={trStyle}>
                      <td style={tdStyle}>{formatDate(item.fecha)}</td>
                      <td style={{ ...tdStyle, fontWeight: 900, color: '#10b981' }}>{item.ndocu}</td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 800 }}>{item.nompro}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>RUC: {item.rucpro}</div>
                      </td>
                      <td style={tdStyle}>
                        {item.nrefe ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                            <LinkIcon size={12} color="#94a3b8" />
                            {item.crefe === '28' ? 'OCM: ' : 'DOC: '}{item.nrefe}
                          </div>
                        ) : 'Directo'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 900 }}>{formatCurrency(item.totn)}</td>
                      <td style={tdStyle}>
                        <span style={activeBadgeStyle}>Ingresado</span>
                      </td>
                    </tr>
                  ))}

                  {subTab === 'ccp' && ccpList.map((item, idx) => (
                    <tr key={idx} style={trStyle}>
                      <td style={tdStyle}>{formatDate(item.fecha)}</td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 900, color: '#0f172a' }}>{item.ndocu}</div>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>{item.cdocu === '01' ? 'FACTURA' : 'BOLETA'}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 800 }}>{item.nompro}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>RUC: {item.rucpro}</div>
                      </td>
                      <td style={{ ...tdStyle, color: '#6366f1', fontWeight: 800 }}>{item.compro}</td>
                      <td style={tdStyle}>
                        {item.nrefe ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#475569' }}>
                            <LinkIcon size={12} color="#94a3b8" />
                            GIM: {item.nrefe}
                          </div>
                        ) : 'Directo'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 900 }}>{formatCurrency(item.monto)}</td>
                      <td style={tdStyle}>
                        <span style={item.saldo > 0 ? pendingBadgeStyle : activeBadgeStyle}>
                          {item.saldo > 0 ? 'Pendiente' : 'Pagado'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* RENDERIZADO MODO: CREACIÓN (FORMULARIO) */}
      {viewMode === 'create' && (
        <div style={mainGridLayout}>
          {/* Columna Izquierda: Ajustes de Cabecera y Referencias */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Opciones de Importación y Referencias (Solo para GIM y CCP) */}
            {subTab !== 'ocm' && (
              <div style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <LinkIcon size={16} color="#3b82f6" />
                  <h3 style={cardTitleStyle}>Vincular Operación</h3>
                </div>

                {subTab === 'gim' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => {
                          setGimImportMode('direct');
                          setSelectedOcmNumber('');
                          setCartItems([]);
                          setSelectedSupplier(null);
                          setSupplierSearchQuery('');
                        }}
                        style={gimImportMode === 'direct' ? activeTabBtnStyle : inactiveTabBtnStyle}
                      >
                        Ingreso Directo
                      </button>
                      <button 
                        onClick={() => {
                          setGimImportMode('import');
                          setCartItems([]);
                          setSelectedSupplier(null);
                          setSupplierSearchQuery('');
                        }}
                        style={gimImportMode === 'import' ? activeTabBtnStyle : inactiveTabBtnStyle}
                      >
                        Importar Pedido (OCM)
                      </button>
                    </div>

                    {gimImportMode === 'import' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={fieldLabelStyle}>Seleccionar OCM Pendiente</span>
                        <select 
                          value={selectedOcmNumber}
                          onChange={(e) => {
                            setSelectedOcmNumber(e.target.value);
                            handleImportOcm(e.target.value);
                          }}
                          style={selectStyle}
                        >
                          <option value="">-- Seleccionar Orden --</option>
                          {pendingOcms.map((ocm, i) => (
                            <option key={i} value={ocm.ndocu}>
                              {ocm.ndocu} | {ocm.nompro} ({formatCurrency(ocm.totn)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {subTab === 'ccp' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={() => {
                          setCcpImportMode('direct');
                          setSelectedGimNumber('');
                          setCartItems([]);
                          setSelectedSupplier(null);
                          setSupplierSearchQuery('');
                        }}
                        style={ccpImportMode === 'direct' ? activeTabBtnStyle : inactiveTabBtnStyle}
                      >
                        Compra Directa
                      </button>
                      <button 
                        onClick={() => {
                          setCcpImportMode('import');
                          setCartItems([]);
                          setSelectedSupplier(null);
                          setSupplierSearchQuery('');
                        }}
                        style={ccpImportMode === 'import' ? activeTabBtnStyle : inactiveTabBtnStyle}
                      >
                        Importar Ingreso (GIM)
                      </button>
                    </div>

                    {ccpImportMode === 'import' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={fieldLabelStyle}>Seleccionar GIM Pendiente</span>
                        <select 
                          value={selectedGimNumber}
                          onChange={(e) => {
                            setSelectedGimNumber(e.target.value);
                            handleImportGim(e.target.value);
                          }}
                          style={selectStyle}
                        >
                          <option value="">-- Seleccionar Nota Ingreso --</option>
                          {pendingGims.map((gim, i) => (
                            <option key={i} value={gim.ndocu}>
                              {gim.ndocu} | {gim.nompro} ({formatCurrency(gim.totn)})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Datos del Proveedor */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <User size={16} color="#3b82f6" />
                <h3 style={cardTitleStyle}>Proveedor</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Checkbox de proveedor genérico deshabilitado si estamos en modo importación */}
                <label style={{
                  ...checkboxLabelStyle,
                  opacity: (subTab === 'gim' && gimImportMode === 'import') || (subTab === 'ccp' && ccpImportMode === 'import') ? 0.5 : 1,
                  pointerEvents: (subTab === 'gim' && gimImportMode === 'import') || (subTab === 'ccp' && ccpImportMode === 'import') ? 'none' : 'auto'
                }}>
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
                  <div ref={supplierRef} style={{ position: 'relative' }}>
                    <div style={{
                      ...inputWrapperStyle,
                      opacity: (subTab === 'gim' && gimImportMode === 'import') || (subTab === 'ccp' && ccpImportMode === 'import') ? 0.6 : 1,
                      pointerEvents: (subTab === 'gim' && gimImportMode === 'import') || (subTab === 'ccp' && ccpImportMode === 'import') ? 'none' : 'auto'
                    }}>
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
                      <span style={fieldLabelStyle}>Nombre / Razón Social</span>
                      <input 
                        type="text" 
                        placeholder="Nombre comercial" 
                        value={manualSupplierName}
                        onChange={e => setManualSupplierName(e.target.value)}
                        style={textInputStyle}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Detalles del Comprobante (Diferente según OCM, GIM, CCP) */}
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <Receipt size={16} color="#3b82f6" />
                <h3 style={cardTitleStyle}>Detalles del Documento</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* 1. Campos para ORDEN DE COMPRA (OCM) */}
                {subTab === 'ocm' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={fieldLabelStyle}>Fecha Emisión</span>
                        <div style={dateInputWrapperStyle}>
                          <Calendar size={14} color="#64748b" style={{ marginRight: '6px' }} />
                          <input 
                            type="date" 
                            value={fechaOCMEmision}
                            onChange={e => setFechaOCMEmision(e.target.value)}
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
                            value={fechaOCMVencimiento}
                            onChange={e => setFechaOCMVencimiento(e.target.value)}
                            style={dateStyle}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* 2. Campos para NOTA DE INGRESO (GIM) */}
                {subTab === 'gim' && (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={fieldLabelStyle}>Nro Guía Remisión Proveedor</span>
                      <input 
                        type="text" 
                        placeholder="G001-0001234" 
                        value={gimDocNumber}
                        onChange={e => setGimDocNumber(e.target.value.toUpperCase())}
                        style={textInputStyle}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={fieldLabelStyle}>Fecha de Ingreso</span>
                      <div style={dateInputWrapperStyle}>
                        <Calendar size={14} color="#64748b" style={{ marginRight: '6px' }} />
                        <input 
                          type="date" 
                          value={fechaGIMEmision}
                          onChange={e => setFechaGIMEmision(e.target.value)}
                          style={dateStyle}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* 3. Campos para FACTURAS / BOLETAS (CCP) */}
                {subTab === 'ccp' && (
                  <>
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
                          BOLETA (03)
                        </button>
                      </div>
                    </div>

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

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={fieldLabelStyle}>Fecha Emisión</span>
                        <div style={dateInputWrapperStyle}>
                          <Calendar size={14} color="#64748b" style={{ marginRight: '6px' }} />
                          <input 
                            type="date" 
                            value={fechaCCPEmision}
                            onChange={e => setFechaCCPEmision(e.target.value)}
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
                            value={fechaCCPVencimiento}
                            onChange={e => setFechaCCPVencimiento(e.target.value)}
                            style={dateStyle}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <button 
              onClick={() => setViewMode('list')}
              style={backToListBtnStyle}
            >
              Cancelar y volver al historial
            </button>
          </div>

          {/* Columna Derecha: Detalle de Artículos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <ShoppingCart size={16} color="#3b82f6" />
                <h3 style={cardTitleStyle}>Detalle de Artículos</h3>
              </div>

              {/* Buscador de Productos (Oculto si importamos para evitar desajustes, a menos que sea directo) */}
              {((subTab === 'gim' && gimImportMode === 'direct') || (subTab === 'ccp' && ccpImportMode === 'direct') || subTab === 'ocm') && (
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
              )}

              {/* Tabla de Artículos en Carrito */}
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
                        {subTab !== 'gim' && <th style={{ ...thStyle, width: '120px' }}>Costo c/IGV</th>}
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
                              disabled={(subTab === 'gim' && gimImportMode === 'import') || (subTab === 'ccp' && ccpImportMode === 'import')}
                              style={tableInputStyle}
                              min="0.0001"
                              step="any"
                            />
                          </td>
                          {subTab !== 'gim' && (
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
                          )}
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>
                            {formatCurrency(item.cost * item.quantity)}
                          </td>
                          <td style={tdStyle}>
                            <button 
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={(subTab === 'gim' && gimImportMode === 'import') || (subTab === 'ccp' && ccpImportMode === 'import')}
                              style={{
                                ...deleteBtnStyle,
                                opacity: (subTab === 'gim' && gimImportMode === 'import') || (subTab === 'ccp' && ccpImportMode === 'import') ? 0.3 : 1
                              }}
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
                  <span style={{ color: '#0f172a', fontSize: '15px', fontWeight: 900 }}>Total Neto</span>
                  <span style={{ color: '#10b981', fontSize: '18px', fontWeight: 950 }}>{formatCurrency(totals.total)}</span>
                </div>

                {errorMsg && (
                  <div style={errorBannerStyle}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <button 
                  onClick={
                    subTab === 'ocm' ? handleSaveOCM :
                    subTab === 'gim' ? handleSaveGIM : handleSaveCCP
                  }
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
                      <span>
                        {subTab === 'ocm' ? 'Guardar Orden de Compra' :
                         subTab === 'gim' ? 'Registrar Nota de Ingreso' : 'Guardar y Sincronizar Comprobante'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito Genérico */}
      <AnimatePresence>
        {successData && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={overlayStyle}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={successModalStyle}
            >
              <div style={successIconContainerStyle}>
                <Check size={32} color="#fff" />
              </div>
              <h3 style={{ margin: '14px 0 6px', fontWeight: 900, color: '#1e293b', fontSize: '18px' }}>
                {successData.title}
              </h3>
              <p style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', marginBottom: '16px' }}>
                {successData.subtitle}
              </p>

              <div style={modalInfoGridStyle}>
                {successData.info.map((inf, i) => (
                  <div key={i} style={modalInfoItemStyle}>
                    <span style={modalInfoLabelStyle}>{inf.label}</span>
                    <span style={{ 
                      ...modalInfoValueStyle, 
                      color: inf.highlight ? '#10b981' : '#1e293b',
                      fontSize: inf.highlight ? '13px' : '11px'
                    }}>{inf.value}</span>
                  </div>
                ))}
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

const subTabContainerStyle = {
  display: 'flex',
  background: '#f1f5f9',
  padding: '4px',
  borderRadius: '12px',
  gap: '4px',
  width: '100%',
  maxWidth: '650px',
  border: '1px solid #e2e8f0'
};

const inactiveSubTabBtnStyle = {
  flex: 1,
  padding: '8px 12px',
  borderRadius: '8px',
  border: 'none',
  background: 'transparent',
  color: '#64748b',
  fontSize: '12px',
  fontWeight: 800,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease'
};

const activeSubTabBtnStyle = {
  ...inactiveSubTabBtnStyle,
  background: '#ffffff',
  color: '#3b82f6',
  boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
  fontWeight: 900
};

const listContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '20px',
  padding: '20px',
  boxShadow: '0 4px 20px -2px rgba(15,23,42,0.01)',
  flex: 1
};

const listHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '12px'
};

const createNewBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 16px',
  background: '#3b82f6',
  color: '#ffffff',
  border: 'none',
  borderRadius: '10px',
  fontSize: '12px',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 2px 10px rgba(59,130,246,0.15)',
  transition: 'background-color 0.2s'
};

const historyTableWrapperStyle = {
  width: '100%',
  overflowX: 'auto',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  background: '#f8fafc'
};

const loadingListContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px',
  gap: '10px'
};

const emptyRowStyle = {
  padding: '40px',
  textAlign: 'center',
  color: '#94a3b8',
  fontSize: '12px',
  fontWeight: 600
};

const mainGridLayout = {
  display: 'grid',
  gridTemplateColumns: 'minmax(300px, 460px) 1fr',
  gap: '20px',
  alignItems: 'start',
  flex: 1,
  width: '100%'
};

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

const selectStyle = {
  ...textInputStyle,
  cursor: 'pointer'
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
  minHeight: '220px',
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
  height: '220px'
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
  marginTop: '10px',
  width: '100%'
};

const disabledRegisterBtnStyle = {
  ...registerBtnStyle,
  background: '#cbd5e1',
  boxShadow: 'none',
  cursor: 'not-allowed'
};

const backToListBtnStyle = {
  width: '100%',
  padding: '10px',
  background: 'transparent',
  border: '1px solid #cbd5e1',
  borderRadius: '12px',
  color: '#64748b',
  fontSize: '12px',
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textAlign: 'center',
  marginTop: '10px'
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

const activeBadgeStyle = {
  background: '#dcfce7',
  color: '#15803d',
  padding: '3px 8px',
  borderRadius: '6px',
  fontSize: '10px',
  fontWeight: 800,
  textTransform: 'uppercase'
};

const inactiveBadgeStyle = {
  background: '#f1f5f9',
  color: '#475569',
  padding: '3px 8px',
  borderRadius: '6px',
  fontSize: '10px',
  fontWeight: 800,
  textTransform: 'uppercase'
};

const pendingBadgeStyle = {
  background: '#fef3c7',
  color: '#d97706',
  padding: '3px 8px',
  borderRadius: '6px',
  fontSize: '10px',
  fontWeight: 800,
  textTransform: 'uppercase'
};

// Responsive mobile grid adjustments
if (typeof window !== 'undefined') {
  const checkWidth = () => {
    if (window.innerWidth < 1024) {
      mainGridLayout.gridTemplateColumns = '1fr';
    } else {
      mainGridLayout.gridTemplateColumns = 'minmax(300px, 460px) 1fr';
    }
  };
  checkWidth();
  window.addEventListener('resize', checkWidth);
}
