'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Search, Trash2, Calendar, Loader2, Save, ShoppingCart, 
  User, Receipt, ArrowRight, Check, AlertCircle, RefreshCw,
  FileText, Clipboard, Link as LinkIcon, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCreateModal from './ProductCreateModal';

export default function PurchasesView({ idApeCaj, onPurchaseSuccess, currentTab }) {
  const { data: session } = useSession();
  const userRole = session?.user?.role?.toUpperCase() || '';
  const userId = session?.user?.id?.trim() || '';
  const isUserAdmin = userRole === 'ADMINISTRADOR' || userRole === 'SUPERVISOR' || userId === '001';

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
  const [isProductCreateOpen, setIsProductCreateOpen] = useState(false);

  // Estados específicos de OCM (Creación)
  const [fechaOCMEmision, setFechaOCMEmision] = useState('');
  const [fechaOCMVencimiento, setFechaOCMVencimiento] = useState('');
  const [ocmCond, setOcmCond] = useState('CONTADO');
  const [ocmCodcoc, setOcmCodcoc] = useState('01');
  const [conditionsList, setConditionsList] = useState([]);
  const [classificationsList, setClassificationsList] = useState([]);

  // Estados para Almacenes y Transportistas cargados de Metadata
  const [warehousesList, setWarehousesList] = useState([]);
  const [transportistsList, setTransportistsList] = useState([]);
  const [subCentersOfCostList, setSubCentersOfCostList] = useState([]);
  const [exchangeRateDaily, setExchangeRateDaily] = useState({ tcvta: 3.40, tccom: 3.39 });

  // Estados para Modal de Adición de Producto (Almacén por ítem)
  const [pendingProductToAdd, setPendingProductToAdd] = useState(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [selectedItemWarehouse, setSelectedItemWarehouse] = useState('');
  const [selectedItemQuantity, setSelectedItemQuantity] = useState(1);
  const [selectedItemCost, setSelectedItemCost] = useState(0);
  const [selectedItemDiscount, setSelectedItemDiscount] = useState(0);
  const [applyWarehouseToAll, setApplyWarehouseToAll] = useState(false);
  const [globalWarehouseSelected, setGlobalWarehouseSelected] = useState('');

  // Estados para Modal de Datos Adicionales de OCM al Guardar
  const [isAdditionalDataModalOpen, setIsAdditionalDataModalOpen] = useState(false);
  const [fechaOCMEntrega, setFechaOCMEntrega] = useState('');
  const [ocmPlazoDias, setOcmPlazoDias] = useState(0);
  const [ocmLugarEntrega, setOcmLugarEntrega] = useState('LUIS GONZALES');
  const [ocmPlazoCaducidad, setOcmPlazoCaducidad] = useState(90);
  const [fechaOCMCaducidad, setFechaOCMCaducidad] = useState('');
  const [ocmCodtra, setOcmCodtra] = useState('T0000');
  const [ocmNombco, setOcmNombco] = useState('');
  const [ocmNrocta, setOcmNrocta] = useState('');
  const [ocmMone, setOcmMone] = useState('S');
  const [ocmTcam, setOcmTcam] = useState(3.40);
  const [ocmAtte, setOcmAtte] = useState('');
  const [ocmRefe, setOcmRefe] = useState('');
  const [ocmCodscc, setOcmCodscc] = useState('');
  const [ocmObservacion, setOcmObservacion] = useState('');

  // Estado para bloquear OCM en edición
  const [isOcmBlocked, setIsOcmBlocked] = useState(false);
  const [ocmBlockReason, setOcmBlockReason] = useState(null); // 'has_gim' o 'approved'
  const [editingOcmNumber, setEditingOcmNumber] = useState(null);
  const [disapproving, setDisapproving] = useState(false);

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
  const ocmRef = useRef(null);
  const gimRef = useRef(null);

  // Búsqueda interactiva de OCM y GIM
  const [ocmSearchQuery, setOcmSearchQuery] = useState('');
  const [showOcmDropdown, setShowOcmDropdown] = useState(false);
  const [gimSearchQuery, setGimSearchQuery] = useState('');
  const [showGimDropdown, setShowGimDropdown] = useState(false);

  // Consulta de RUC rápido desde el buscador
  const [quickLookupResult, setQuickLookupResult] = useState(null);
  const [searchingQuickLookup, setSearchingQuickLookup] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // Inicializar fechas hoy y metadata de OCM
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFechaOCMEmision(today);
    setFechaOCMVencimiento(today);
    setFechaOCMEntrega(today);
    setFechaGIMEmision(today);
    setFechaCCPEmision(today);
    setFechaCCPVencimiento(today);

    // Calcular caducidad de 90 días por defecto
    const dCad = new Date();
    dCad.setDate(dCad.getDate() + 90);
    setFechaOCMCaducidad(dCad.toISOString().split('T')[0]);

    const fetchMetadata = async () => {
      try {
        const res = await fetch('/api/purchases/ocm/metadata');
        const data = await res.json();
        if (data.success) {
          setConditionsList(data.conditions || []);
          setClassificationsList(data.classifications || []);
          setWarehousesList(data.warehouses || []);
          setTransportistsList(data.transportists || []);
          setSubCentersOfCostList(data.subCentersOfCost || []);
          
          if (data.exchangeRate) {
            setExchangeRateDaily(data.exchangeRate);
            setOcmTcam(data.exchangeRate.tcvta);
          }

          if (data.conditions && data.conditions.length > 0) {
            const defaultCond = data.conditions.find(c => c.nomcdv.trim() === 'EFECTIVO' || c.nomcdv.trim() === 'CONTADO');
            if (defaultCond) {
              setOcmCond(defaultCond.nomcdv.trim());
            } else {
              setOcmCond(data.conditions[0].nomcdv.trim());
            }
          }
          if (data.classifications && data.classifications.length > 0) {
            const defaultCoc = data.classifications.find(c => c.codcoc.trim() === '01');
            if (defaultCoc) {
              setOcmCodcoc(defaultCoc.codcoc);
            } else {
              setOcmCodcoc(data.classifications[0].codcoc);
            }
          }
          if (data.transportists && data.transportists.length > 0) {
            setOcmCodtra(data.transportists[0].codtra);
          }
          if (data.subCentersOfCost && data.subCentersOfCost.length > 0) {
            setOcmCodscc(data.subCentersOfCost[0].codscc);
          }
        }
      } catch (err) {
        console.error('Error fetching OCM metadata:', err);
      }
    };
    fetchMetadata();
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
      if (ocmRef.current && !ocmRef.current.contains(event.target)) {
        setShowOcmDropdown(false);
      }
      if (gimRef.current && !gimRef.current.contains(event.target)) {
        setShowGimDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Búsqueda de Proveedores (Carga inicial y filtrado con debounce)
  useEffect(() => {
    if (isGenericSupplier) return;
    
    const fetchSuppliers = async () => {
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
    };

    if (supplierSearchQuery.length === 0) {
      fetchSuppliers();
      return;
    }

    const delayDebounceFn = setTimeout(fetchSuppliers, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [supplierSearchQuery, isGenericSupplier]);

  // Consulta rápida de RUC/DNI en SUNAT/RENIEC
  const handleQuickLookup = async (query) => {
    setSearchingQuickLookup(true);
    setQuickLookupResult(null);
    setErrorMsg(null);
    try {
      const docType = query.length === 11 ? '06' : '01';
      const res = await fetch(`/api/suppliers/lookup?q=${encodeURIComponent(query)}&docType=${docType}`);
      const data = await res.json();
      if (data.success) {
        if (data.exists) {
          handleSelectSupplier(data.supplier);
        } else if (data.data) {
          setQuickLookupResult({
            nompro: data.data.nompro,
            rucpro: query,
            dirpro: data.data.dirpro || ''
          });
        } else {
          setErrorMsg('No se encontraron datos en la consulta pública.');
        }
      } else {
        setErrorMsg(data.error || 'Error al consultar documento.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error al conectar con el servicio de consulta.');
    } finally {
      setSearchingQuickLookup(false);
    }
  };

  // Registrar proveedor rápido y seleccionarlo automáticamente
  const handleRegisterQuickSupplier = async () => {
    if (!quickLookupResult) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const docType = quickLookupResult.rucpro.length === 11 ? '06' : '01';
      const res = await fetch('/api/suppliers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nompro: quickLookupResult.nompro,
          rucpro: quickLookupResult.rucpro,
          dirpro: quickLookupResult.dirpro,
          docType: docType
        })
      });
      const data = await res.json();
      if (data.success) {
        handleSelectSupplier({
          codpro: data.codpro,
          nompro: quickLookupResult.nompro,
          rucpro: quickLookupResult.rucpro
        });
        setQuickLookupResult(null);
      } else {
        throw new Error(data.error || 'Error al registrar proveedor');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Búsqueda de Productos (Función Callback y filtrado con debounce)
  const fetchProducts = useCallback(async (query) => {
    setSearchingProduct(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (Array.isArray(data)) setProductResults(data);
    } catch (err) {
      console.error('Error searching products:', err);
    } finally {
      setSearchingProduct(false);
    }
  }, []);

  useEffect(() => {
    if (productSearchQuery.length === 0) {
      fetchProducts('');
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      fetchProducts(productSearchQuery);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [productSearchQuery, fetchProducts]);

  // Callback ejecutado cuando se crea un producto al vuelo
  const handleProductCreated = async (newProductData) => {
    if (!newProductData || !newProductData.codi) return;
    try {
      // Consultar el producto recién creado para obtenerlo en el formato de carrito
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(newProductData.codi)}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const prod = data[0];
        handleAddProductToCart(prod);
      }
    } catch (err) {
      console.error('Error al recuperar producto creado rápido:', err);
    }
  };

  const handleSelectSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setSupplierSearchQuery(supplier.nompro);
    setShowSupplierDropdown(false);
    setErrorMsg(null);
  };

  const handleAddProductToCart = (prod) => {
    if (subTab === 'ocm') {
      const defaultAlm = globalWarehouseSelected || (warehousesList[0]?.codalm || '03');
      
      if (applyWarehouseToAll && globalWarehouseSelected) {
        confirmAddProductToCart(prod, globalWarehouseSelected, 1, prod.price || 0, 0);
      } else {
        setPendingProductToAdd(prod);
        setSelectedItemWarehouse(defaultAlm);
        setSelectedItemQuantity(1);
        setSelectedItemCost(prod.price || 0);
        setSelectedItemDiscount(0);
        setIsAddProductModalOpen(true);
      }
    } else {
      handleAddProductDirect(prod);
    }
  };

  const handleAddProductDirect = (prod) => {
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
        cost: prod.price || 0,
        discount: 0
      }]);
    }
    setProductSearchQuery('');
    setProductResults([]);
    setShowProductDropdown(false);
    setErrorMsg(null);
  };

  const confirmAddProductToCart = (prod, codalm, qty, cost, dsct = 0) => {
    const targetWarehouse = warehousesList.find(w => w.codalm === codalm);
    const nomalm = targetWarehouse ? targetWarehouse.nomalm : '';

    if (applyWarehouseToAll) {
      setGlobalWarehouseSelected(codalm);
    }

    const exists = cartItems.find(item => item.id === prod.id);
    let updatedCart = [];
    if (exists) {
      updatedCart = cartItems.map(item => 
        item.id === prod.id 
          ? { ...item, quantity: item.quantity + qty, cost, codalm, nomalm, discount: dsct } 
          : item
      );
    } else {
      updatedCart = [...cartItems, {
        id: prod.id,
        userCode: prod.userCode,
        name: prod.name,
        brand: prod.brand,
        unit: prod.unit,
        quantity: qty,
        cost: cost,
        codalm,
        nomalm,
        discount: dsct
      }];
    }

    // Si se activa "aplicar a todo", propagar el almacén a todos los ítems actuales
    if (applyWarehouseToAll) {
      updatedCart = updatedCart.map(item => ({ ...item, codalm, nomalm }));
    }

    setCartItems(updatedCart);
    setIsAddProductModalOpen(false);
    setPendingProductToAdd(null);
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

  const handleUpdateDiscount = (id, val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0 || num > 100) return;
    setCartItems(cartItems.map(item => 
      item.id === id ? { ...item, discount: num } : item
    ));
  };

  const handleRemoveItem = (id) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const calculateCartTotals = () => {
    const total = cartItems.reduce((acc, item) => {
      const beforeDiscount = item.cost * item.quantity;
      const desc = item.discount || 0;
      return acc + (beforeDiscount * (1 - desc / 100));
    }, 0);
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
    
    // Antes de guardar, abrimos el modal de Datos Adicionales
    setIsAdditionalDataModalOpen(true);
  };

  const executeSaveOCM = async () => {
    setIsAdditionalDataModalOpen(false);
    setLoading(true);
    try {
      const payload = {
        idApeCaj,
        supplier: getSupplierData(),
        fechaEmision: fechaOCMEmision,
        fechaVencimiento: fechaOCMVencimiento,
        cond: ocmCond,
        codcoc: ocmCodcoc,
        fechaEntrega: fechaOCMEntrega,
        fechaCaducidad: fechaOCMCaducidad,
        lugarEntrega: ocmLugarEntrega,
        observacion: ocmObservacion,
        codtra: ocmCodtra,
        nombco: ocmNombco,
        nrocta: ocmNrocta,
        mone: ocmMone,
        tcam: ocmTcam,
        atte: ocmAtte,
        refe: ocmRefe,
        codscc: ocmCodscc,
        items: cartItems.map(item => ({
          id: item.id,
          quantity: item.quantity,
          cost: item.cost,
          dsct: item.discount || 0,
          codalm: item.codalm // Almacén destino individual
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
          subtitle: `Se generó el documento correlativo ${result.ndocu} en el ERP Navasoft.`,
          info: [
            { label: 'Número de OCM', value: result.ndocu },
            { label: 'Proveedor', value: result.supplier?.nompro || '' },
            { label: 'Condición', value: ocmCond },
            { label: 'Total Neto', value: formatCurrency(result.total), highlight: true }
          ]
        });

        // Limpiar carrito y proveedor
        setCartItems([]);
        setSelectedSupplier(null);
        setSupplierSearchQuery('');
        setGlobalWarehouseSelected('');
        
        // Limpiar datos adicionales
        setOcmNombco('');
        setOcmNrocta('');
        setOcmObservacion('');

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

  const handleDisapproveOcm = async (ndocu) => {
    if (!window.confirm(`¿Estás seguro de desaprobar la Orden de Compra ${ndocu}? Volverá a ser editable.`)) {
      return;
    }
    setDisapproving(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/purchases/ocm/disapprove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ndocu })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Error al desaprobar OCM');
      }
      alert(data.message || 'La Orden de Compra ha sido desaprobada.');
      fetchHistory();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setDisapproving(false);
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
      <style dangerouslySetInnerHTML={{__html: `
        .search-dropdown-item {
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 12px;
          color: #334155;
          margin: 2px 4px;
          font-weight: 750;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .search-dropdown-item:hover {
          background-color: #f1f5f9;
          color: #0f172a;
        }
        
        .quick-create-option {
          padding: 10px 14px;
          border-radius: 8px;
          margin: 4px;
          background-color: #ecfdf5; /* verde pastel fuerte */
          border: 1px dashed #a7f3d0;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #047857; /* verde fuerte */
          font-weight: 850;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }
        .quick-create-option:hover {
          background-color: #d1fae5;
          border-color: #6ee7b7;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(4,120,87,0.06);
        }
        
        .quick-lookup-option {
          padding: 10px 14px;
          border-radius: 8px;
          margin: 4px;
          background-color: #eff6ff; /* azul/celeste pastel fuerte */
          border: 1px dashed #bfdbfe;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #1d4ed8; /* azul fuerte */
          font-weight: 850;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }
        .quick-lookup-option:hover {
          background-color: #dbeafe;
          border-color: #93c5fd;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(29,78,216,0.06);
        }
      `}} />
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
                    {subTab === 'ocm' && <th style={{ ...thStyle, width: '90px' }}>Aprobación</th>}
                    <th style={{ ...thStyle, width: '70px' }}>Estado</th>
                    {subTab === 'ocm' && <th style={{ ...thStyle, width: '80px', textAlign: 'center' }}>Acción</th>}
                  </tr>
                </thead>
                <tbody>
                  {subTab === 'ocm' && ocmList.length === 0 && (
                    <tr><td colSpan="8" style={emptyRowStyle}>No se encontraron órdenes de compra registradas.</td></tr>
                  )}
                  {subTab === 'gim' && gimList.length === 0 && (
                    <tr><td colSpan="6" style={emptyRowStyle}>No se encontraron notas de ingreso registradas.</td></tr>
                  )}
                  {subTab === 'ccp' && ccpList.length === 0 && (
                    <tr><td colSpan="6" style={emptyRowStyle}>No se encontraron facturas registradas.</td></tr>
                  )}

                  {subTab === 'ocm' && ocmList.map((item, idx) => {
                    const isApproved = item.apro == 1 || item.apro === '1';
                    const hasGim = item.flag === '1' || item.flag === '2' || (item.nota && item.nota.trim() !== '');

                    return (
                      <tr key={idx} style={trStyle}>
                        <td style={tdStyle}>{formatDate(item.fecha)}</td>
                        <td style={{ ...tdStyle, fontWeight: 900, color: '#3b82f6' }}>{item.ndocu}</td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 800 }}>{item.nompro}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>RUC: {item.rucpro}</div>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 900 }}>{formatCurrency(item.totn)}</td>
                        <td style={tdStyle}>
                          <span style={isApproved ? activeBadgeStyle : pendingBadgeStyle}>
                            {isApproved ? 'Aprobado' : 'Pendiente'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <span style={hasGim ? inactiveBadgeStyle : activeBadgeStyle}>
                            {hasGim ? 'Cerrado/Atend' : 'Activo'}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          {isApproved && !hasGim ? (
                            <button
                              onClick={() => handleDisapproveOcm(item.ndocu)}
                              disabled={!isUserAdmin || disapproving}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                border: 'none',
                                background: isUserAdmin ? '#ef4444' : '#cbd5e1',
                                color: '#fff',
                                fontSize: '10px',
                                fontWeight: 800,
                                cursor: isUserAdmin ? 'pointer' : 'not-allowed'
                              }}
                              title={isUserAdmin ? 'Desaprobar OCM' : 'Requiere permisos de Administrador'}
                            >
                              {disapproving ? '...' : 'Desaprobar'}
                            </button>
                          ) : (
                            <span style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>
                              {hasGim ? 'Con Ingreso' : '-'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          <div style={{ ...cardStyle, padding: '8px 12px' }}>
            <div style={{ ...cardHeaderStyle, borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px', minHeight: 'auto' }}>
              <Receipt size={14} color="#3b82f6" />
              <h3 style={{ ...cardTitleStyle, fontSize: '11px', fontWeight: 900 }}>
                {subTab === 'ocm' ? 'Datos Generales de la Orden' :
                 subTab === 'gim' ? 'Datos de la Nota de Ingreso' : 'Datos Generales del Comprobante'}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              
              {subTab === 'ocm' ? (
                /* Caso ORDEN DE COMPRA (OCM): Fila Única de 7 Columnas */
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '2fr 0.9fr 0.9fr 1.1fr 1.1fr 0.8fr 0.7fr',
                  gap: '8px',
                  alignItems: 'end'
                }}>
                  {/* 1. Proveedor */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ ...fieldLabelStyle, fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2px' }}>Proveedor</span>
                      <label style={{ ...checkboxLabelStyle, margin: 0, padding: 0, display: 'flex', alignItems: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={isGenericSupplier} 
                          onChange={(e) => {
                            setIsGenericSupplier(e.target.checked);
                            setSelectedSupplier(null);
                            setSupplierSearchQuery('');
                            setErrorMsg(null);
                          }}
                          style={{ ...checkboxInputStyle, width: '12px', height: '12px' }}
                        />
                        <span style={{ fontWeight: 800, color: '#475569', fontSize: '9px', marginLeft: '3px' }}>Manual</span>
                      </label>
                    </div>

                    {!isGenericSupplier ? (
                      <div ref={supplierRef} style={{ position: 'relative' }}>
                        <div style={{ ...inputWrapperStyle, height: '28px', padding: '2px 8px' }}>
                          <Search size={12} color="#94a3b8" />
                          <input 
                            type="text" 
                            placeholder="Buscar por RUC o Razón..."
                            value={supplierSearchQuery}
                            onChange={(e) => {
                              setSupplierSearchQuery(e.target.value);
                              setSelectedSupplier(null);
                              setShowSupplierDropdown(true);
                            }}
                            onFocus={() => setShowSupplierDropdown(true)}
                            style={{ ...inputStyle, fontSize: '11px', height: '24px' }}
                          />
                        </div>

                        {showSupplierDropdown && (supplierResults.length > 0 || (/^[0-9]+$/.test(supplierSearchQuery) && (supplierSearchQuery.length === 8 || supplierSearchQuery.length === 11))) && (
                          <div style={{ ...dropdownListStyle, zIndex: 100, top: '30px' }}>
                            {supplierResults.map((s, idx) => (
                              <div key={idx} onClick={() => handleSelectSupplier(s)} className="search-dropdown-item" style={{ padding: '4px 8px', fontSize: '11px' }}>
                                <strong>{s.nompro}</strong>
                                <div style={{ fontSize: '9px', color: '#64748b' }}>RUC: {s.rucpro} | Código: {s.codpro}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {selectedSupplier && (
                          <div style={{ ...selectedSupplierBadgeStyle, marginTop: '2px', padding: '2px 6px', fontSize: '10px', height: '20px', display: 'flex', alignItems: 'center' }}>
                            <Check size={10} color="#10b981" style={{ marginRight: '3px' }} />
                            <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>{selectedSupplier.nompro}</strong>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '4px' }}>
                        <input 
                          type="text" 
                          placeholder="RUC" 
                          value={manualSupplierRuc}
                          onChange={e => setManualSupplierRuc(e.target.value.replace(/[^0-9]/g, ''))}
                          maxLength={11}
                          style={{ ...textInputStyle, height: '28px', fontSize: '11px', padding: '2px 6px' }}
                        />
                        <input 
                          type="text" 
                          placeholder="Razón Social" 
                          value={manualSupplierName}
                          onChange={e => setManualSupplierName(e.target.value)}
                          style={{ ...textInputStyle, height: '28px', fontSize: '11px', padding: '2px 6px' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* 2. Fecha Emisión */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ ...fieldLabelStyle, fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2px' }}>Emisión</span>
                    <div style={{ ...dateInputWrapperStyle, height: '28px', padding: '2px 6px' }}>
                      <Calendar size={12} color="#64748b" style={{ marginRight: '4px' }} />
                      <input 
                        type="date" 
                        value={fechaOCMEmision}
                        onChange={e => setFechaOCMEmision(e.target.value)}
                        style={{ ...dateStyle, fontSize: '11px', height: '24px' }}
                      />
                    </div>
                  </div>

                  {/* 3. Fecha Vencimiento */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ ...fieldLabelStyle, fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2px' }}>Venc.</span>
                    <div style={{ ...dateInputWrapperStyle, height: '28px', padding: '2px 6px' }}>
                      <Calendar size={12} color="#64748b" style={{ marginRight: '4px' }} />
                      <input 
                        type="date" 
                        value={fechaOCMVencimiento}
                        onChange={e => setFechaOCMVencimiento(e.target.value)}
                        style={{ ...dateStyle, fontSize: '11px', height: '24px' }}
                      />
                    </div>
                  </div>

                  {/* 4. Condición de Pago */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ ...fieldLabelStyle, fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2px' }}>Condición Pago</span>
                    <select 
                      value={ocmCond}
                      onChange={e => setOcmCond(e.target.value)}
                      style={{ ...selectStyle, height: '28px', fontSize: '11px', padding: '2px 4px' }}
                    >
                      {conditionsList.map((condObj, idx) => (
                        <option key={idx} value={condObj.nomcdv}>{condObj.nomcdv}</option>
                      ))}
                    </select>
                  </div>

                  {/* 5. Clasificación */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ ...fieldLabelStyle, fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2px' }}>Clasificación</span>
                    <select 
                      value={ocmCodcoc}
                      onChange={e => setOcmCodcoc(e.target.value)}
                      style={{ ...selectStyle, height: '28px', fontSize: '11px', padding: '2px 4px' }}
                    >
                      {classificationsList.map((cocObj, idx) => (
                        <option key={idx} value={cocObj.codcoc}>{cocObj.nomcoc}</option>
                      ))}
                    </select>
                  </div>

                  {/* 6. Moneda */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ ...fieldLabelStyle, fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2px' }}>Moneda</span>
                    <select 
                      value={ocmMone}
                      onChange={e => setOcmMone(e.target.value)}
                      style={{ ...selectStyle, height: '28px', fontSize: '11px', padding: '2px 4px' }}
                    >
                      <option value="S">SOLES (S/)</option>
                      <option value="D">DÓLARES ($)</option>
                    </select>
                  </div>

                  {/* 7. Tipo de Cambio */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ ...fieldLabelStyle, fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2px' }}>T. Cambio</span>
                    <input 
                      type="number"
                      step="0.001"
                      value={ocmTcam}
                      onChange={e => setOcmTcam(parseFloat(e.target.value) || 0)}
                      onFocus={e => e.target.select()}
                      style={{ ...textInputStyle, height: '28px', fontSize: '11px', padding: '2px 6px' }}
                      disabled={ocmMone === 'S'}
                    />
                  </div>
                </div>
              ) : (
                /* Casos GIM y CCP: 2 Filas Compactas */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* Fila 1 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : (
                      subTab === 'gim' ? '1fr 1.5fr 1fr' : '1fr 1.5fr 1fr 1.2fr'
                    ),
                    gap: '10px',
                    alignItems: 'end'
                  }}>
                    {/* Vincular Documento */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ ...fieldLabelStyle, fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2px' }}>Vincular Documento</span>
                      
                      {subTab === 'gim' && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button 
                            onClick={() => {
                              setGimImportMode('direct');
                              setSelectedOcmNumber('');
                              setCartItems([]);
                              setSelectedSupplier(null);
                              setSupplierSearchQuery('');
                            }}
                            style={gimImportMode === 'direct' ? { ...activeTabBtnStyle, padding: '4px 8px', fontSize: '10px' } : { ...inactiveTabBtnStyle, padding: '4px 8px', fontSize: '10px' }}
                          >
                            Directo
                          </button>
                          <button 
                            onClick={() => {
                              setGimImportMode('import');
                              setCartItems([]);
                              setSelectedSupplier(null);
                              setSupplierSearchQuery('');
                            }}
                            style={gimImportMode === 'import' ? { ...activeTabBtnStyle, padding: '4px 8px', fontSize: '10px' } : { ...inactiveTabBtnStyle, padding: '4px 8px', fontSize: '10px' }}
                          >
                            Importar OCM
                          </button>
                        </div>
                      )}

                      {subTab === 'ccp' && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button 
                            onClick={() => {
                              setCcpImportMode('direct');
                              setSelectedGimNumber('');
                              setCartItems([]);
                              setSelectedSupplier(null);
                              setSupplierSearchQuery('');
                            }}
                            style={ccpImportMode === 'direct' ? { ...activeTabBtnStyle, padding: '4px 8px', fontSize: '10px' } : { ...inactiveTabBtnStyle, padding: '4px 8px', fontSize: '10px' }}
                          >
                            Directa
                          </button>
                          <button 
                            onClick={() => {
                              setCcpImportMode('import');
                              setCartItems([]);
                              setSelectedSupplier(null);
                              setSupplierSearchQuery('');
                            }}
                            style={ccpImportMode === 'import' ? { ...activeTabBtnStyle, padding: '4px 8px', fontSize: '10px' } : { ...inactiveTabBtnStyle, padding: '4px 8px', fontSize: '10px' }}
                          >
                            Importar GIM
                          </button>
                        </div>
                      )}

                      {/* Selectores de importación flotantes */}
                      {subTab === 'gim' && gimImportMode === 'import' && (
                        <div ref={ocmRef} style={{ position: 'relative', marginTop: '2px' }}>
                          {!selectedOcmNumber ? (
                            <div style={{ ...inputWrapperStyle, height: '28px', padding: '2px 6px' }}>
                              <Search size={12} color="#94a3b8" />
                              <input 
                                type="text" 
                                placeholder="Buscar OCM..."
                                value={ocmSearchQuery}
                                onChange={(e) => {
                                  setOcmSearchQuery(e.target.value);
                                  setShowOcmDropdown(true);
                                }}
                                onFocus={() => setShowOcmDropdown(true)}
                                style={{ ...inputStyle, fontSize: '10px', height: '24px' }}
                              />
                            </div>
                          ) : (
                            <div style={{ ...selectedSupplierBadgeStyle, padding: '2px 6px', fontSize: '10px', height: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span><strong>OCM:</strong> {selectedOcmNumber}</span>
                              <button onClick={() => { setSelectedOcmNumber(''); setCartItems([]); setSelectedSupplier(null); }} style={{ color: '#ef4444', border: 'none', background: 'transparent', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}>X</button>
                            </div>
                          )}
                          {showOcmDropdown && !selectedOcmNumber && (
                            <div style={{ ...dropdownListStyle, zIndex: 100, top: '30px' }}>
                              {pendingOcms.filter(o => o.ndocu.toLowerCase().includes(ocmSearchQuery.toLowerCase()) || o.nompro.toLowerCase().includes(ocmSearchQuery.toLowerCase())).map((o, idx) => (
                                <div key={idx} onClick={() => { setSelectedOcmNumber(o.ndocu); handleImportOcm(o.ndocu); setShowOcmDropdown(false); }} className="search-dropdown-item" style={{ padding: '4px 8px', fontSize: '11px' }}>
                                  <strong>{o.ndocu}</strong> - {o.nompro}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {subTab === 'ccp' && ccpImportMode === 'import' && (
                        <div ref={gimRef} style={{ position: 'relative', marginTop: '2px' }}>
                          {!selectedGimNumber ? (
                            <div style={{ ...inputWrapperStyle, height: '28px', padding: '2px 6px' }}>
                              <Search size={12} color="#94a3b8" />
                              <input 
                                type="text" 
                                placeholder="Buscar GIM..."
                                value={gimSearchQuery}
                                onChange={(e) => {
                                  setGimSearchQuery(e.target.value);
                                  setShowGimDropdown(true);
                                }}
                                onFocus={() => setShowGimDropdown(true)}
                                style={{ ...inputStyle, fontSize: '10px', height: '24px' }}
                              />
                            </div>
                          ) : (
                            <div style={{ ...selectedSupplierBadgeStyle, padding: '2px 6px', fontSize: '10px', height: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span><strong>GIM:</strong> {selectedGimNumber}</span>
                              <button onClick={() => { setSelectedGimNumber(''); setCartItems([]); setSelectedSupplier(null); }} style={{ color: '#ef4444', border: 'none', background: 'transparent', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}>X</button>
                            </div>
                          )}
                          {showGimDropdown && !selectedGimNumber && (
                            <div style={{ ...dropdownListStyle, zIndex: 100, top: '30px' }}>
                              {pendingGims.filter(g => g.ndocu.toLowerCase().includes(gimSearchQuery.toLowerCase()) || g.nompro.toLowerCase().includes(gimSearchQuery.toLowerCase())).map((g, idx) => (
                                <div key={idx} onClick={() => { setSelectedGimNumber(g.ndocu); handleImportGim(g.ndocu); setShowGimDropdown(false); }} className="search-dropdown-item" style={{ padding: '4px 8px', fontSize: '11px' }}>
                                  <strong>{g.ndocu}</strong> - {g.nompro}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Proveedor */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ ...fieldLabelStyle, fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2px' }}>Proveedor</span>
                        <label style={{ ...checkboxLabelStyle, opacity: (subTab === 'gim' && gimImportMode === 'import') || (subTab === 'ccp' && ccpImportMode === 'import') ? 0.5 : 1 }}>
                          <input 
                            type="checkbox" 
                            checked={isGenericSupplier} 
                            onChange={(e) => {
                              setIsGenericSupplier(e.target.checked);
                              setSelectedSupplier(null);
                              setSupplierSearchQuery('');
                              setErrorMsg(null);
                            }}
                            style={{ ...checkboxInputStyle, width: '12px', height: '12px' }}
                          />
                          <span style={{ fontWeight: 800, color: '#475569', fontSize: '9px', marginLeft: '3px' }}>Manual</span>
                        </label>
                      </div>

                      {!isGenericSupplier ? (
                        <div ref={supplierRef} style={{ position: 'relative' }}>
                          <div style={{
                            ...inputWrapperStyle,
                            height: '28px',
                            padding: '2px 8px',
                            opacity: (subTab === 'gim' && gimImportMode === 'import') || (subTab === 'ccp' && ccpImportMode === 'import') ? 0.6 : 1,
                            pointerEvents: (subTab === 'gim' && gimImportMode === 'import') || (subTab === 'ccp' && ccpImportMode === 'import') ? 'none' : 'auto'
                          }}>
                            <Search size={12} color="#94a3b8" />
                            <input 
                              type="text" 
                              placeholder="Buscar por RUC o Razón..."
                              value={supplierSearchQuery}
                              onChange={(e) => {
                                setSupplierSearchQuery(e.target.value);
                                setSelectedSupplier(null);
                                setShowSupplierDropdown(true);
                              }}
                              onFocus={() => setShowSupplierDropdown(true)}
                              style={{ ...inputStyle, fontSize: '11px', height: '24px' }}
                            />
                          </div>

                          {showSupplierDropdown && (supplierResults.length > 0 || (/^[0-9]+$/.test(supplierSearchQuery) && (supplierSearchQuery.length === 8 || supplierSearchQuery.length === 11))) && (
                            <div style={{ ...dropdownListStyle, zIndex: 100, top: '30px' }}>
                              {supplierResults.map((s, idx) => (
                                <div key={idx} onClick={() => handleSelectSupplier(s)} className="search-dropdown-item" style={{ padding: '4px 8px', fontSize: '11px' }}>
                                  <strong>{s.nompro}</strong>
                                  <div style={{ fontSize: '9px', color: '#64748b' }}>RUC: {s.rucpro}</div>
                                </div>
                              ))}
                            </div>
                          )}

                          {selectedSupplier && (
                            <div style={{ ...selectedSupplierBadgeStyle, marginTop: '2px', padding: '2px 6px', fontSize: '10px', height: '20px', display: 'flex', alignItems: 'center' }}>
                              <Check size={10} color="#10b981" style={{ marginRight: '3px' }} />
                              <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '170px' }}>{selectedSupplier.nompro}</strong>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '4px' }}>
                          <input 
                            type="text" 
                            placeholder="RUC" 
                            value={manualSupplierRuc}
                            onChange={e => setManualSupplierRuc(e.target.value.replace(/[^0-9]/g, ''))}
                            maxLength={11}
                            style={{ ...textInputStyle, height: '28px', fontSize: '11px', padding: '2px 6px' }}
                          />
                          <input 
                            type="text" 
                            placeholder="Razón Social" 
                            value={manualSupplierName}
                            onChange={e => setManualSupplierName(e.target.value)}
                            style={{ ...textInputStyle, height: '28px', fontSize: '11px', padding: '2px 6px' }}
                          />
                        </div>
                      )}
                    </div>

                    {/* GIM: Guía de remisión */}
                    {subTab === 'gim' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ ...fieldLabelStyle, fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2px' }}>Guía Proveedor</span>
                        <input 
                          type="text" 
                          placeholder="G001-0001234" 
                          value={gimDocNumber}
                          onChange={e => setGimDocNumber(e.target.value.toUpperCase())}
                          style={{ ...textInputStyle, height: '28px', fontSize: '11px', padding: '2px 6px' }}
                        />
                      </div>
                    )}

                    {/* CCP: Comprobante y Nro */}
                    {subTab === 'ccp' && (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ ...fieldLabelStyle, fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2px' }}>Comp.</span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => setDocType('01')} style={docType === '01' ? { ...activeTabBtnStyle, padding: '4px 6px', fontSize: '9px' } : { ...inactiveTabBtnStyle, padding: '4px 6px', fontSize: '9px' }}>FACT (01)</button>
                            <button onClick={() => setDocType('03')} style={docType === '03' ? { ...activeTabBtnStyle, padding: '4px 6px', fontSize: '9px' } : { ...inactiveTabBtnStyle, padding: '4px 6px', fontSize: '9px' }}>BOL (03)</button>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '4px' }}>
                          <input type="text" placeholder="Serie" value={docSerie} onChange={e => setDocSerie(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} maxLength={4} style={{ ...textInputStyle, height: '28px', fontSize: '11px', padding: '2px 4px' }} />
                          <input type="text" placeholder="Número" value={docCorrelativo} onChange={e => setDocCorrelativo(e.target.value.replace(/[^0-9]/g, ''))} maxLength={8} style={{ ...textInputStyle, height: '28px', fontSize: '11px', padding: '2px 4px' }} />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Fila 2 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : (
                      subTab === 'gim' ? '1fr 1fr 1fr' : '1fr 1fr 1.2fr 1.2fr 1fr 0.8fr'
                    ),
                    gap: '10px',
                    alignItems: 'end'
                  }}>
                    {/* Fecha Emisión/Ingreso */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ ...fieldLabelStyle, fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2px' }}>
                        {subTab === 'gim' ? 'Fec. Ingreso' : 'Fec. Emisión'}
                      </span>
                      <div style={{ ...dateInputWrapperStyle, height: '28px', padding: '2px 6px' }}>
                        <Calendar size={12} color="#64748b" style={{ marginRight: '4px' }} />
                        <input 
                          type="date" 
                          value={subTab === 'gim' ? fechaGIMEmision : fechaCCPEmision}
                          onChange={e => {
                            if (subTab === 'gim') setFechaGIMEmision(e.target.value);
                            else setFechaCCPEmision(e.target.value);
                          }}
                          style={{ ...dateStyle, fontSize: '11px', height: '24px' }}
                        />
                      </div>
                    </div>

                    {/* Fecha Vencimiento (Solo CCP) */}
                    {subTab === 'ccp' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ ...fieldLabelStyle, fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2px' }}>Fec. Venc.</span>
                        <div style={{ ...dateInputWrapperStyle, height: '28px', padding: '2px 6px' }}>
                          <Calendar size={12} color="#64748b" style={{ marginRight: '4px' }} />
                          <input 
                            type="date" 
                            value={fechaCCPVencimiento}
                            onChange={e => setFechaCCPVencimiento(e.target.value)}
                            style={{ ...dateStyle, fontSize: '11px', height: '24px' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Condición de Pago y Clasificación (Solo CCP) */}
                    {subTab === 'ccp' && (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ ...fieldLabelStyle, fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2px' }}>Condición Pago</span>
                          <select 
                            value={ocmCond}
                            onChange={e => setOcmCond(e.target.value)}
                            style={{ ...selectStyle, height: '28px', fontSize: '11px', padding: '2px 4px' }}
                          >
                            {conditionsList.map((condObj, idx) => (
                              <option key={idx} value={condObj.nomcdv}>{condObj.nomcdv}</option>
                            ))}
                          </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ ...fieldLabelStyle, fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2px' }}>Clasificación</span>
                          <select 
                            value={ocmCodcoc}
                            onChange={e => setOcmCodcoc(e.target.value)}
                            style={{ ...selectStyle, height: '28px', fontSize: '11px', padding: '2px 4px' }}
                          >
                            {classificationsList.map((cocObj, idx) => (
                              <option key={idx} value={cocObj.codcoc}>{cocObj.nomcoc}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {/* Moneda */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ ...fieldLabelStyle, fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2px' }}>Moneda</span>
                      <select 
                        value={ocmMone}
                        onChange={e => setOcmMone(e.target.value)}
                        style={{ ...selectStyle, height: '28px', fontSize: '11px', padding: '2px 4px' }}
                      >
                        <option value="S">SOLES (S/)</option>
                        <option value="D">DÓLARES ($)</option>
                      </select>
                    </div>

                    {/* Tipo de Cambio */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ ...fieldLabelStyle, fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '2px' }}>T. Cambio</span>
                      <input 
                        type="number"
                        step="0.001"
                        value={ocmTcam}
                        onChange={e => setOcmTcam(parseFloat(e.target.value) || 0)}
                        onFocus={e => e.target.select()}
                        style={{ ...textInputStyle, height: '28px', fontSize: '11px', padding: '2px 6px' }}
                        disabled={ocmMone === 'S'}
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Bloque Inferior: Detalle de Artículos (Ocupa todo el ancho abajo) */}
          <div style={{ width: '100%' }}>
            
            <div style={{ ...cardStyle, padding: '8px 12px' }}>
              <div style={{ ...cardHeaderStyle, borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px', minHeight: 'auto' }}>
                <ShoppingCart size={14} color="#3b82f6" />
                <h3 style={{ ...cardTitleStyle, fontSize: '11px', fontWeight: 900 }}>Detalle de Artículos</h3>
              </div>

              {/* Buscador de Productos (Oculto si importamos para evitar desajustes, a menos que sea directo) */}
              {((subTab === 'gim' && gimImportMode === 'direct') || (subTab === 'ccp' && ccpImportMode === 'direct') || subTab === 'ocm') && (
                <div ref={productRef} style={{ position: 'relative', marginBottom: '6px' }}>
                  <div style={{ ...inputWrapperStyle, height: '28px', padding: '2px 8px' }}>
                    <Search size={12} color="#94a3b8" />
                    <input 
                      type="text" 
                      placeholder="Buscar producto por nombre o código ERP..."
                      value={productSearchQuery}
                      onChange={(e) => {
                        setProductSearchQuery(e.target.value);
                        setShowProductDropdown(true);
                      }}
                      onFocus={() => {
                        setShowProductDropdown(true);
                        if (productSearchQuery === '' && productResults.length === 0) {
                          fetchProducts('');
                        }
                      }}
                      style={{ ...inputStyle, fontSize: '11px', height: '24px' }}
                    />
                    {searchingProduct && <Loader2 className="animate-spin" size={12} color="#3b82f6" />}
                  </div>

                  {showProductDropdown && (
                    <div style={dropdownListStyle}>
                      {productResults.map((p, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => handleAddProductToCart(p)}
                          className="search-dropdown-item"
                        >
                          <div style={{ fontWeight: 800, color: '#334155' }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Cod: {p.id} | Marca: {p.brand}</span>
                            <span style={{ fontWeight: 800, color: '#3b82f6' }}>Venta: {formatCurrency(p.price)}</span>
                          </div>
                        </div>
                      ))}

                      {productSearchQuery.trim().length > 0 && (
                        <div 
                          onClick={() => {
                            setIsProductCreateOpen(true);
                            setShowProductDropdown(false);
                          }}
                          className="quick-create-option"
                        >
                          <Plus size={14} color="#0f766e" />
                          <span>Crear y registrar nuevo artículo "{productSearchQuery}"...</span>
                        </div>
                      )}

                      {productResults.length === 0 && !searchingProduct && productSearchQuery.trim().length === 0 && (
                        <div className="quick-lookup-option" style={{ textAlign: 'center', color: '#64748b', cursor: 'default' }}>
                          No se encontraron productos.
                        </div>
                      )}
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
                        <th style={{ ...thStyle, width: '60px' }}>Cant</th>
                        {subTab !== 'gim' && <th style={{ ...thStyle, width: '80px' }}>Costo c/IGV</th>}
                        {subTab !== 'gim' && <th style={{ ...thStyle, width: '65px' }}>Dscto %</th>}
                        <th style={{ ...thStyle, width: '80px', textAlign: 'right' }}>Total</th>
                        <th style={{ ...thStyle, width: '30px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item, idx) => (
                        <tr key={idx} style={trStyle}>
                          <td style={tdStyle}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '11px' }}>{item.name}</span>
                              <span style={{ fontSize: '9px', color: '#64748b' }}>
                                Cód: {item.id} | {item.brand} | {item.unit}
                              </span>
                              {subTab === 'ocm' && item.nomalm && (
                                <span style={{
                                  alignSelf: 'flex-start',
                                  fontSize: '8px',
                                  fontWeight: 800,
                                  color: '#0369a1',
                                  backgroundColor: '#e0f2fe',
                                  padding: '1px 4px',
                                  borderRadius: '3px',
                                  marginTop: '1px'
                                }}>
                                  Destino: {item.nomalm}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <input 
                              type="number" 
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.id, e.target.value)}
                              onFocus={(e) => e.target.select()}
                              disabled={(subTab === 'gim' && gimImportMode === 'import') || (subTab === 'ccp' && ccpImportMode === 'import')}
                              style={{ ...tableInputStyle, height: '22px', padding: '1px 2px' }}
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
                                onFocus={(e) => e.target.select()}
                                style={{ ...tableInputStyle, height: '22px', padding: '1px 2px', textAlign: 'right' }}
                                min="0.01"
                                step="any"
                              />
                            </td>
                          )}
                          {subTab !== 'gim' && (
                            <td style={tdStyle}>
                              <input 
                                type="number" 
                                value={item.discount || 0}
                                onChange={(e) => handleUpdateDiscount(item.id, e.target.value)}
                                onFocus={(e) => e.target.select()}
                                style={{ ...tableInputStyle, height: '22px', padding: '1px 2px' }}
                                min="0"
                                max="100"
                                step="any"
                              />
                            </td>
                          )}
                          <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 900, color: '#0f172a', fontSize: '11px' }}>
                            {formatCurrency(item.cost * item.quantity * (1 - (item.discount || 0) / 100))}
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
                              <Trash2 size={12} />
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
                  <span style={{ color: '#64748b', fontWeight: 700, fontSize: '11px' }}>Subtotal (Sin IGV)</span>
                  <span style={{ color: '#334155', fontWeight: 800, fontSize: '11px' }}>{formatCurrency(totals.subtotal)}</span>
                </div>
                <div style={totalRowStyle}>
                  <span style={{ color: '#64748b', fontWeight: 700, fontSize: '11px' }}>IGV (18%)</span>
                  <span style={{ color: '#334155', fontWeight: 800, fontSize: '11px' }}>{formatCurrency(totals.igv)}</span>
                </div>
                <div style={{ ...totalRowStyle, borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                  <span style={{ color: '#0f172a', fontSize: '12px', fontWeight: 900 }}>Total Neto</span>
                  <span style={{ color: '#10b981', fontSize: '13px', fontWeight: 950 }}>{formatCurrency(totals.total)}</span>
                </div>

                {errorMsg && (
                  <div style={errorBannerStyle}>
                    <AlertCircle size={12} style={{ flexShrink: 0 }} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button 
                    onClick={() => setViewMode('list')}
                    style={{
                      flex: 1,
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#64748b',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    Cancelar
                  </button>
                  
                  <button 
                    onClick={
                      subTab === 'ocm' ? handleSaveOCM :
                      subTab === 'gim' ? handleSaveGIM : handleSaveCCP
                    }
                    disabled={loading}
                    style={loading ? { ...disabledRegisterBtnStyle, flex: 2, margin: 0, padding: '6px 12px', borderRadius: '6px', fontSize: '11px' } : { ...registerBtnStyle, flex: 2, margin: 0, padding: '6px 12px', borderRadius: '6px', fontSize: '11px' }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={12} />
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <Save size={12} />
                        <span>
                          {subTab === 'ocm' ? 'Guardar OCM' :
                           subTab === 'gim' ? 'Registrar GIM' : 'Guardar Comprobante'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
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

      <ProductCreateModal 
        isOpen={isProductCreateOpen}
        onClose={() => setIsProductCreateOpen(false)}
        onSuccess={handleProductCreated}
        initialDescr={productSearchQuery}
      />

      {/* Modal de Configuración y Selección de Almacén por Producto */}
      <AnimatePresence>
        {isAddProductModalOpen && pendingProductToAdd && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={overlayStyle}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              style={{
                ...successModalStyle,
                width: '420px',
                padding: '24px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(226, 232, 240, 0.8)'
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontWeight: 900, color: '#0f172a', fontSize: '16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                Configuración del Producto
              </h3>
              
              <div style={{ marginBottom: '14px', textAlign: 'left' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Artículo</span>
                <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '13px', marginTop: '2px' }}>
                  {pendingProductToAdd.name}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  Cod: {pendingProductToAdd.id} | Marca: {pendingProductToAdd.brand || 'N/A'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px', textAlign: 'left' }}>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Cantidad
                  </label>
                  <input 
                    type="number"
                    value={selectedItemQuantity}
                    onChange={(e) => setSelectedItemQuantity(Math.max(0.0001, parseFloat(e.target.value) || 0))}
                    onFocus={(e) => e.target.select()}
                    style={tableInputStyle}
                    min="0.0001"
                    step="any"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Costo c/IGV
                  </label>
                  <input 
                    type="number"
                    value={selectedItemCost}
                    onChange={(e) => setSelectedItemCost(Math.max(0, parseFloat(e.target.value) || 0))}
                    onFocus={(e) => e.target.select()}
                    style={tableInputStyle}
                    min="0"
                    step="any"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Dscto %
                  </label>
                  <input 
                    type="number"
                    value={selectedItemDiscount}
                    onChange={(e) => setSelectedItemDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                    onFocus={(e) => e.target.select()}
                    style={tableInputStyle}
                    min="0"
                    max="100"
                    step="any"
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Almacén Destino
                </label>
                <select
                  value={selectedItemWarehouse}
                  onChange={(e) => setSelectedItemWarehouse(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#334155',
                    background: '#fff'
                  }}
                >
                  {warehousesList.map((alm) => (
                    <option key={alm.codalm} value={alm.codalm}>
                      {alm.codalm} - {alm.nomalm}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', textAlign: 'left' }}>
                <input 
                  type="checkbox"
                  id="applyAllAlm"
                  checked={applyWarehouseToAll}
                  onChange={(e) => setApplyWarehouseToAll(e.target.checked)}
                  style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                />
                <label htmlFor="applyAllAlm" style={{ fontSize: '11px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                  Aplicar este almacén a todos los artículos
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setIsAddProductModalOpen(false);
                    setPendingProductToAdd(null);
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => confirmAddProductToCart(pendingProductToAdd, selectedItemWarehouse, selectedItemQuantity, selectedItemCost, selectedItemDiscount)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#3b82f6',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Datos Adicionales al Guardar la OCM */}
      <AnimatePresence>
        {isAdditionalDataModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={overlayStyle}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              style={{
                ...successModalStyle,
                width: '560px',
                padding: '24px',
                background: 'rgba(255, 255, 255, 0.97)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(226, 232, 240, 0.8)'
              }}
            >
              <h3 style={{ margin: '0 0 16px', fontWeight: 950, color: '#0f172a', fontSize: '18px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                Datos Adicionales de la Orden
              </h3>

              {/* Sección 1: Despacho Destino */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '14px', textAlign: 'left' }}>
                <span style={{ fontSize: '11px', fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                  Despacho Destino
                </span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Fecha de Entrega
                    </label>
                    <input 
                      type="date"
                      value={fechaOCMEntrega}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFechaOCMEntrega(val);
                        const days = Math.round((new Date(val) - new Date(fechaOCMEmision)) / (24 * 60 * 60 * 1000));
                        setOcmPlazoDias(isNaN(days) ? 0 : days);
                      }}
                      style={{ ...tableInputStyle, height: '36px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Días de Plazo
                    </label>
                    <input 
                      type="number"
                      value={ocmPlazoDias}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setOcmPlazoDias(val);
                        const d = new Date(fechaOCMEmision || new Date());
                        d.setDate(d.getDate() + val);
                        setFechaOCMEntrega(d.toISOString().split('T')[0]);
                      }}
                      onFocus={(e) => e.target.select()}
                      style={{ ...tableInputStyle, height: '36px' }}
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Dirección de Entrega / Lugar
                  </label>
                  <input 
                    type="text"
                    value={ocmLugarEntrega}
                    onChange={(e) => setOcmLugarEntrega(e.target.value)}
                    style={{ ...tableInputStyle, height: '36px' }}
                    maxLength="60"
                  />
                </div>
              </div>

              {/* Sección 2: Caducidad */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '14px', textAlign: 'left' }}>
                <span style={{ fontSize: '11px', fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                  Caducidad del Documento
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Validez (Días)
                    </label>
                    <input 
                      type="number"
                      value={ocmPlazoCaducidad}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setOcmPlazoCaducidad(val);
                        const d = new Date(fechaOCMEmision || new Date());
                        d.setDate(d.getDate() + val);
                        setFechaOCMCaducidad(d.toISOString().split('T')[0]);
                      }}
                      onFocus={(e) => e.target.select()}
                      style={{ ...tableInputStyle, height: '36px' }}
                      min="1"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Fecha de Caducidad
                    </label>
                    <input 
                      type="date"
                      value={fechaOCMCaducidad}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFechaOCMCaducidad(val);
                        const days = Math.round((new Date(val) - new Date(fechaOCMEmision)) / (24 * 60 * 60 * 1000));
                        setOcmPlazoCaducidad(isNaN(days) ? 0 : days);
                      }}
                      style={{ ...tableInputStyle, height: '36px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Transportista y Bancos */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '14px', textAlign: 'left' }}>
                <span style={{ fontSize: '11px', fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                  Transportista & Bancos
                </span>
                
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Sírvase a enviar por (Transportista)
                  </label>
                  <select
                    value={ocmCodtra}
                    onChange={(e) => setOcmCodtra(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#334155',
                      background: '#fff'
                    }}
                  >
                    {transportistsList.map((tra) => (
                      <option key={tra.codtra} value={tra.codtra}>
                        {tra.nomtra}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Nombre del Banco
                    </label>
                    <input 
                      type="text"
                      placeholder="Ej. BCP, BBVA..."
                      value={ocmNombco}
                      onChange={(e) => setOcmNombco(e.target.value.toUpperCase())}
                      style={{ ...tableInputStyle, height: '36px' }}
                      maxLength="15"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Nro de Cta. Cte.
                    </label>
                    <input 
                      type="text"
                      placeholder="Cta Corriente del proveedor"
                      value={ocmNrocta}
                      onChange={(e) => setOcmNrocta(e.target.value.replace(/[^0-9-]/g, ''))}
                      style={{ ...tableInputStyle, height: '36px' }}
                      maxLength="20"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 5: Control y Clasificación */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '14px', textAlign: 'left' }}>
                <span style={{ fontSize: '11px', fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                  Atención & Control
                </span>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Atención (Contacto)
                    </label>
                    <input 
                      type="text"
                      placeholder="Nombre del contacto..."
                      value={ocmAtte}
                      onChange={(e) => setOcmAtte(e.target.value)}
                      style={{ ...tableInputStyle, height: '36px' }}
                      maxLength="30"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                      Referencia / Cotización
                    </label>
                    <input 
                      type="text"
                      placeholder="Nro. Cotización..."
                      value={ocmRefe}
                      onChange={(e) => setOcmRefe(e.target.value)}
                      style={{ ...tableInputStyle, height: '36px' }}
                      maxLength="12"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Sub Centro de Costo
                  </label>
                  <select
                    value={ocmCodscc}
                    onChange={(e) => setOcmCodscc(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#334155',
                      background: '#fff'
                    }}
                  >
                    <option value="">-- Sin Sub Centro --</option>
                    {subCentersOfCostList.map((scc) => (
                      <option key={scc.codscc} value={scc.codscc}>
                        [{scc.codscc.trim()}] {scc.nomscc.trim()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sección 4: Observaciones */}
              <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>
                  Observación
                </label>
                <textarea 
                  value={ocmObservacion}
                  onChange={(e) => setOcmObservacion(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#334155',
                    minHeight: '60px',
                    maxHeight: '100px',
                    resize: 'vertical'
                  }}
                  maxLength="100"
                  placeholder="Detalles u observaciones de la compra..."
                />
              </div>

              {/* Resumen de totales */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                background: '#f8fafc', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                marginBottom: '20px',
                border: '1px solid #e2e8f0'
              }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>
                  Afecto: {formatCurrency(totals.subtotal)}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>
                  I.G.V.: {formatCurrency(totals.igv)}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 950, color: '#10b981' }}>
                  TOTAL OCM: {formatCurrency(totals.total)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsAdditionalDataModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Volver
                </button>
                <button
                  onClick={executeSaveOCM}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#10b981',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Continuar &gt;&gt;
                </button>
              </div>
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
  width: '100%'
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

const quickLookupCardStyle = {
  background: '#eff6ff',
  border: '1px solid #dbeafe',
  borderRadius: '12px',
  padding: '14px',
  marginTop: '10px',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  boxShadow: '0 2px 8px rgba(37,99,235,0.03)'
};

const quickLookupRegisterBtnStyle = {
  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  color: '#ffffff',
  border: 'none',
  borderRadius: '10px',
  padding: '10px 14px',
  fontSize: '12px',
  fontWeight: 900,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  marginTop: '6px',
  transition: 'all 0.2s ease',
  boxShadow: '0 4px 12px rgba(37,99,235,0.15)'
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
  padding: '4px 6px',
  background: '#f1f5f9',
  borderBottom: '1px solid #e2e8f0',
  color: '#475569',
  fontSize: '9px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const trStyle = {
  borderBottom: '1px solid #e2e8f0',
  background: '#fff'
};

const tdStyle = {
  padding: '3px 6px',
  fontSize: '11px',
  color: '#334155',
  verticalAlign: 'middle'
};

const tableInputStyle = {
  width: '100%',
  padding: '2px 4px',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '4px',
  fontSize: '11px',
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
  padding: '2px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background-color 0.2s'
};

const totalsWrapperStyle = {
  borderTop: '2px dashed #e2e8f0',
  paddingTop: '6px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginTop: '6px'
};

const totalRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '11px'
};

const registerBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '6px 12px',
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '11px',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(16,185,129,0.15)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  marginTop: '4px',
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
  padding: '6px 12px',
  background: 'transparent',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  color: '#64748b',
  fontSize: '11px',
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textAlign: 'center',
  marginTop: '4px'
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
