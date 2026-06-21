'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useSession, signOut } from 'next-auth/react';
import {
    Search, ShoppingCart, User, Plus, Minus, X, Check,
    ChevronRight, ChevronDown, Loader2, UserPlus, ShieldCheck, Trash2,
    LayoutGrid, Clock, Settings, LogOut, ShoppingBag, Zap, Sparkles, Package,
    Lock, Phone, Users, ArrowRight, Receipt, Percent, Calculator, 
    BellRing, Smartphone, RefreshCw, AlertCircle, Calendar, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize, Minimize, History, ScanBarcode, Building2, MapPin } from 'lucide-react';
import Image from 'next/image';

import Sidebar from '@/components/pos/Sidebar';
import ProductCard from '@/components/pos/ProductCard';
import CartItem from '@/components/pos/CartItem';
import QuickModal from '@/components/pos/QuickModal';
import PaymentSection from '@/components/pos/PaymentSection';
import SuccessModal from '@/components/pos/SuccessModal';
import CustomerManualModal from '@/components/pos/CustomerManualModal';
import CustomerErpModal from '@/components/pos/CustomerErpModal';
import CustomDatePicker from '@/components/pos/CustomDatePicker';
import CartDetailsModal from '@/components/pos/CartDetailsModal';
import SalesHistoryModal from '@/components/pos/SalesHistoryModal';
import CloseCashModal from '@/components/pos/CloseCashModal';
import MembershipsView from '@/components/pos/MembershipsView';
import WhatsappView from '@/components/pos/WhatsappView';
import CustomersView from '@/components/pos/CustomersView';
import PromotionsView from '@/components/pos/PromotionsView';
import GeneralCashView from '@/components/pos/GeneralCashView';
import ExpensesView from '@/components/pos/ExpensesView';
import PurchasesView from '@/components/pos/PurchasesView';
import ProductsView from '@/components/pos/ProductsView';
import SuppliersView from '@/components/pos/SuppliersView';
import DashboardView from '@/components/pos/DashboardView';
import SalesView from '@/components/pos/SalesView';
import SettingsView from '@/components/pos/SettingsView';
import CashExpenseModal from '@/components/pos/CashExpenseModal';
import NumericKeypad from '@/components/pos/NumericKeypad';
import CustomSelect from '@/components/pos/CustomSelect';
import AlphanumericKeyboard from '@/components/pos/AlphanumericKeyboard';
import BarcodeScannerModal from '@/components/pos/BarcodeScannerModal';

const Isotipo = () => (
    <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontWeight: 900,
        fontSize: '16px',
        fontFamily: "'Outfit', sans-serif",
        boxShadow: '0 3px 8px rgba(59, 130, 246, 0.2)',
        flexShrink: 0,
        userSelect: 'none'
    }}>
        S
    </div>
);

export default function POSPage() {
    const { data: session } = useSession();
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearchKeyboard, setShowSearchKeyboard] = useState(false);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFinalizing, setIsFinalizing] = useState(false);
    const [activeTab, setActiveTab] = useState('pos'); // 'pos' o 'memberships'
    const [useScreenKeyboards, setUseScreenKeyboards] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // SISTEMA DE COLA DE WHATSAPP (ASÍNCRONO)
    const [waQueue, setWaQueue] = useState([]); // {id, phone, message, media_url, status, error}
    const [isProcessingWa, setIsProcessingWa] = useState(false);
    const [showWaAlerts, setShowWaAlerts] = useState(false);
    const [posLogo, setPosLogo] = useState('logocia01.jpg');
    const [companySettings, setCompanySettings] = useState(null);

    // Estados para cargar miembros en Promociones
    const [membersForPromotions, setMembersForPromotions] = useState([]);
    const [loadingMembersForPromotions, setLoadingMembersForPromotions] = useState(false);

    useEffect(() => {
        if (activeTab === 'promotions') {
            const fetchMembersForPromotions = async () => {
                setLoadingMembersForPromotions(true);
                try {
                    const res = await fetch('/api/memberships/list?q=&status=Todos&sede=');
                    const data = await res.json();
                    setMembersForPromotions(data.members || []);
                } catch (err) {
                    console.error('Error fetching members for promotions:', err);
                } finally {
                    setLoadingMembersForPromotions(false);
                }
            };
            fetchMembersForPromotions();
        }
    }, [activeTab]);

    useEffect(() => {
        if (companySettings?.company?.logo) {
            setPosLogo(companySettings.company.logo);
        } else if (session?.user?.company) {
            const dbCode = session.user.company.replace('BdNava', '').padStart(2, '0') || '01';
            setPosLogo(`logocia${dbCode}.jpg`);
        }
    }, [companySettings, session]);

    const loadKeyboardPreference = () => {
        const savedKbd = localStorage.getItem('pos_use_screen_keyboards');
        if (savedKbd !== null) {
            setUseScreenKeyboards(savedKbd === 'true');
        }
    };

    useEffect(() => {
        loadKeyboardPreference();

        const handleFullscreenChange = () => {
            const isFull = !!(
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
            );
            setIsFullscreen(isFull);
        };

        const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
        events.forEach(event => document.addEventListener(event, handleFullscreenChange));
        return () => {
            events.forEach(event => document.removeEventListener(event, handleFullscreenChange));
        };
    }, []);

    const toggleFullscreen = () => {
        const docEl = document.documentElement;
        const isFull = !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );

        if (!isFull) {
            const req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen || docEl.msRequestFullscreen;
            if (req) {
                req.call(docEl).catch(err => {
                    console.error(`Error al intentar modo pantalla completa: ${err.message}`);
                });
            }
        } else {
            const exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
            if (exit) {
                exit.call(document);
            }
        }
    };

    const addToWaQueue = (phone, message, media_url) => {
        const newMsg = {
            id: Date.now() + Math.random(),
            phone,
            message,
            media_url,
            status: 'PENDIENTE',
            createdAt: new Date()
        };
        setWaQueue(prev => [...prev, newMsg]);
    };

    // Procesador de Cola
    useEffect(() => {
        const processNext = async () => {
            const next = waQueue.find(m => m.status === 'PENDIENTE');
            if (!next || isProcessingWa) return;

            setIsProcessingWa(true);
            setWaQueue(prev => prev.map(m => m.id === next.id ? { ...m, status: 'ENVIANDO' } : m));

            try {
                const res = await fetch('/api/whatsapp/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        phone: next.phone, 
                        message: next.message, 
                        media_url: next.media_url 
                    })
                });
                const data = await res.json();
                
                if (data.success) {
                    setWaQueue(prev => prev.filter(m => m.id !== next.id));
                } else {
                    throw new Error(data.error || 'Fallo de entrega');
                }
            } catch (err) {
                setWaQueue(prev => prev.map(m => m.id === next.id ? { ...m, status: 'ERROR', error: err.message } : m));
            } finally {
                setIsProcessingWa(false);
            }
        };

        processNext();
    }, [waQueue, isProcessingWa]);
    const [cart, setCart] = useState([]);
    const [warehouse, setWarehouse] = useState(session?.sedeId || '01');
    const [idApeCaj, setIdApeCaj] = useState(null);
    const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info', value: '', showButtons: true, onConfirm: () => { } });
    const [isOpeningCash, setIsOpeningCash] = useState(false);
    const [openingAmount, setOpeningAmount] = useState('');
    const [showOpeningNumpad, setShowOpeningNumpad] = useState(false);
    
    const openOpeningNumpad = () => {
        if (useScreenKeyboards) setShowOpeningNumpad(true);
    };

    // Handlers para el teclado numérico de Apertura de Caja
    const handleOpeningNumpadKeyPress = (key) => {
        if (key === '.') {
            if (!openingAmount.includes('.')) setOpeningAmount(prev => prev + '.');
        } else {
            setOpeningAmount(prev => prev + key);
        }
    };

    const handleOpeningNumpadDelete = () => {
        setOpeningAmount(prev => prev.slice(0, -1));
    };
    const [docType, setDocType] = useState('65'); // Nota de Venta por defecto
    const [paymentMethod, setPaymentMethod] = useState(1);
    const [selectedTar, setSelectedTar] = useState('');
    const formatDate = (date) => {
        if (!date) return null;
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    };

    const [payments, setPayments] = useState([]);
    const [membershipStartDate, setMembershipStartDate] = useState(null);
    const [isRegularizing, setIsRegularizing] = useState(false);
    const [availableMethods, setAvailableMethods] = useState([]);
    const [customer, setCustomer] = useState({ name: 'CLIENTE VARIOS', ruc: '', code: 'C00000', phone: '', birthdate: '' });
    const [customerSearch, setCustomerSearch] = useState('');
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
    const [printData, setPrintData] = useState(null);
    const [cashReportData, setCashReportData] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [showManualModal, setShowManualModal] = useState(false);
    const [showCartModal, setShowCartModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showScannerModal, setShowScannerModal] = useState(false);
    const [showCloseModal, setShowCloseModal] = useState(false);
    const [showErpModal, setShowErpModal] = useState(false);
    const [erpModalData, setErpModalData] = useState(null);
    const [searchType, setSearchType] = useState('DNI'); // 'DNI', 'RUC' o 'CE'
    const [showCEKeyboard, setShowCEKeyboard] = useState(false);
    const [manualDoc, setManualDoc] = useState('');
    const [orderSuccess, setOrderSuccess] = useState(null);
    const [exchangeRate, setExchangeRate] = useState(1);
    const [mounted, setMounted] = useState(false);
    const [showNumpad, setShowNumpad] = useState(false);
    const [categories, setCategories] = useState([
        { id: 'all', name: 'Todos', icon: LayoutGrid }
    ]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [cartVisible, setCartVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [salespeople, setSalespeople] = useState([]);
    const [selectedSalesperson, setSelectedSalesperson] = useState('');
    const [lastMembershipInfo, setLastMembershipInfo] = useState(null);
    const [showMixed, setShowMixed] = useState(false);
    const [cashReceived, setCashReceived] = useState('');
    const [isMobileDevice, setIsMobileDevice] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showMobileCart, setShowMobileCart] = useState(false);
    const [inspectCashId, setInspectCashId] = useState(null);
    const [showInspectCashModal, setShowInspectCashModal] = useState(false);
    const [inspectCashReadOnly, setInspectCashReadOnly] = useState(true);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [expenseRefreshTrigger, setExpenseRefreshTrigger] = useState(0);

    useEffect(() => {
        setMounted(true);
        const checkSize = () => {
            const mobile = window.innerWidth < 1280;
            setIsMobile(mobile);
            if (!mobile) setCartVisible(true);
            setIsMobileDevice(window.innerWidth < 1024);
        };
        checkSize();
        window.addEventListener('resize', checkSize);

        Promise.all([
            fetch('/api/cash/active').then(r => r.json()).catch(() => ({})),
            fetch('/api/payment-methods').then(r => r.json()).catch(() => []),
            fetch('/api/products/categories').then(r => r.json()).catch(() => []),
            fetch('/api/salespeople').then(r => r.json()).catch(() => []),
            fetch('/api/company/settings').then(r => r.json()).catch(() => null),
        ]).then(([cashData, methodsData, catsData, salesData, settingsData]) => {
            if (cashData?.id) setIdApeCaj(cashData.id);
            if (cashData?.exchangeRate) setExchangeRate(cashData.exchangeRate);
            if (Array.isArray(methodsData)) setAvailableMethods(methodsData);
            if (settingsData) {
                setCompanySettings(settingsData);
                if (settingsData.pointOfSale?.code) setWarehouse(settingsData.pointOfSale.code);
            }
            if (Array.isArray(salesData)) {
                setSalespeople(salesData);
                const storageKey = session?.user?.id ? `selectedSalesperson_${session.user.company || ''}_${session.user.id}` : 'selectedSalesperson';
                const savedSalesperson = localStorage.getItem(storageKey);
                if (savedSalesperson && salesData.some(v => v.id === savedSalesperson)) {
                    setSelectedSalesperson(savedSalesperson);
                } else if (salesData.length > 0) {
                    setSelectedSalesperson(salesData[0].id);
                }
            }
            if (Array.isArray(catsData)) {
                setCategories([
                    { id: 'all', name: 'Todos', icon: LayoutGrid },
                    ...catsData.map(c => ({ id: c.id, name: c.name, icon: Package }))
                ]);
            }
        });

        if (session?.sedeId) setWarehouse(session.sedeId);

        return () => window.removeEventListener('resize', checkSize);
    }, [session]);

    useEffect(() => {
        if (selectedSalesperson && session?.user?.id) {
            const storageKey = `selectedSalesperson_${session.user.company || ''}_${session.user.id}`;
            localStorage.setItem(storageKey, selectedSalesperson);
        }
    }, [selectedSalesperson, session]);

    useEffect(() => {
        if (activeTab === 'pos') {
            const t = setTimeout(() => fetchProducts(), 250);
            return () => clearTimeout(t);
        }
    }, [searchTerm, selectedCategory, activeTab, warehouse]);

    // Generar QR para impresión cuando cambian los datos del ticket
    useEffect(() => {
        const generateQR = async () => {
            if (printData && printData.documentNumber) {
                try {
                    const rucEmisor = companySettings?.company?.ruc || "";
                    const [serie, correlativo] = printData.documentNumber.split('-');
                    const tipoDocCli = (printData.customer?.ruc?.length === 11) ? "6" : "1";

                    // Formato SUNAT: RUC Emisor | Tipo Doc | Serie | Correlativo | IGV | Total | Fecha | Tipo Doc Cli | RUC Cli | Hash |
                    const qrString = `${rucEmisor}|${printData.docType}|${serie}|${correlativo}|${Number(printData.igv || 0).toFixed(2)}|${Number(printData.total || 0).toFixed(2)}|${printData.date?.split(',')[0].split('/').reverse().join('-')}|${tipoDocCli}|${printData.customer?.ruc || '00000000'}|${printData.hash || ''}|`;

                    const url = await QRCode.toDataURL(qrString, { margin: 1, width: 200 });
                    setQrCodeUrl(url);
                } catch (err) {
                    console.error('Error generating QR for print:', err);
                }
            }
        };
        generateQR();
    }, [printData, companySettings]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const url = `/api/products/search?q=${encodeURIComponent(searchTerm)}&alm=${warehouse}&category=${selectedCategory}`;
            const res = await fetch(url);
            const data = await res.json();
            setProducts(Array.isArray(data) ? data : []);
        } catch { setProducts([]); }
        finally { setLoading(false); }
    };

    const executeCustomerSearch = async (val) => {
        if (!val || val.length < (searchType === 'CE' ? 5 : 8)) return;
        setIsSearchingCustomer(true);
        try {
            const res = await fetch(`/api/customers/search?q=${val}&docType=${searchType}`);
            const { data } = await res.json();
            if (data) {
                if (data.isNew && (data.source === 'EXTERNAL' || data.source === 'MANUAL_CE')) {
                    setErpModalData({
                        ruc: data.ruccli,
                        name: data.nomcli || '',
                        address: data.address || '',
                        phone: data.phone || '',
                        birthdate: data.birthdate || '',
                        docType: searchType
                    });
                    setShowErpModal(true);
                } else {
                    setCustomer({
                        name: data.nomcli,
                        ruc: data.ruccli || data.nrodni,
                        code: data.codcli,
                        address: data.address,
                        phone: data.phone || '',
                        birthdate: data.birthdate || '',
                        expirationDate: data.fecfinpres,
                        daysRemaining: data.daysRemaining,
                        isNew: data.isNew,
                        mcredi: data.mcredi
                    });
                }
            } else {
                setManualDoc(val);
                setCustomer({ name: 'NO ENCONTRADO', ruc: val, code: 'MANUAL', isNew: true, phone: '', birthdate: '' });
            }
        } catch (err) { console.error('Error searching customer', err); }
        finally { setIsSearchingCustomer(false); }
    };

    const handleCustomerSearch = async (e) => {
        let val = e.target.value;
        if (searchType === 'CE') {
            val = val.replace(/[^a-zA-Z0-9]/g, '');
        } else {
            val = val.replace(/[^0-9]/g, '');
        }
        setCustomerSearch(val);

        if (searchType === 'RUC' && val.length === 11) setDocType('01');

        const targetLength = searchType === 'DNI' ? 8 : (searchType === 'RUC' ? 11 : null);
        if (targetLength && val.length === targetLength) {
            await executeCustomerSearch(val);
        }
    };

    const handleNumpadKeyPress = (key) => {
        setCustomerSearch(prev => {
            const limit = searchType === 'DNI' ? 8 : 11;
            const newVal = (prev + key).slice(0, limit);
            if (newVal.length === limit) {
                setTimeout(() => setShowNumpad(false), 100);
            }
            if (newVal.length === limit) {
                setTimeout(() => {
                    executeCustomerSearch(newVal);
                }, 10);
            }
            return newVal;
        });
    };

    const handleNumpadDelete = () => {
        setCustomerSearch(prev => {
            const newVal = prev.slice(0, -1);
            return newVal;
        });
    };

    const handleScanSuccess = async (code) => {
        if (!code) return;
        try {
            const url = `/api/products/search?q=${encodeURIComponent(code)}&alm=${warehouse}`;
            const res = await fetch(url);
            const data = await res.json();
            
            if (Array.isArray(data) && data.length === 1) {
                const scannedProduct = data[0];
                addToCart(scannedProduct);
            } else {
                setSearchTerm(code);
            }
        } catch (err) {
            console.error("Error al buscar producto escaneado:", err);
            setSearchTerm(code);
        }
        setShowScannerModal(false);
    };

    const addToCart = (product) => {
        // Excepción para el ítem de descuento DS00
        if (product.userCode === 'DS00') {
            setCart(prev => {
                const ex = prev.find(i => i.id === product.id);
                if (ex) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
                return [...prev, { ...product, quantity: 1 }];
            });
            return;
        }

        if (product.stock <= 0) {
            showAlert('Sin Stock', `El producto ${product.name} no tiene stock disponible (Actual: ${product.stock}).`, 'warning');
            return;
        }

        setCart(prev => {
            const ex = prev.find(i => i.id === product.id);
            if (ex) {
                if (ex.quantity >= product.stock) {
                    showAlert('Límite de Stock', `No puedes agregar más de ${product.stock} unidades de este producto.`, 'warning');
                    return prev;
                }
                return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...product, quantity: 1 }];
        });
    };

    const updateQuantity = (id, value, isDelta = true) =>
        setCart(prev => prev.map(i => {
            if (i.id === id) {
                const newQty = isDelta ? i.quantity + value : value;
                if (isDelta && value > 0 && i.userCode !== 'DS00' && newQty > i.stock) {
                    showAlert('Límite de Stock', `Solo hay ${i.stock} unidades disponibles.`, 'warning');
                    return i;
                }
                return { ...i, quantity: Math.max(0, newQty) };
            }
            return i;
        }));

    const updatePrice = (id, newPrice) =>
        setCart(prev => prev.map(i => i.id === id ? { ...i, price: Math.max(0, newPrice) } : i));

    const applyGlobalDiscount = async () => {
        try {
            const res = await fetch('/api/products/discount-check');
            const data = await res.json();

            if (!data.exists) {
                showAlert('DS00 No Encontrado', 'El ítem de descuento (DS00) no existe en el ERP. Por favor créalo para poder aplicar descuentos.', 'warning');
                return;
            }

            const discountProd = data.product;

            setModal({
                show: true,
                title: 'Descuento Global (S/)',
                message: `Ingrese el monto total a descontar de la venta (Total actual: S/ ${total.toFixed(2)}):`,
                type: 'prompt',
                value: '0',
                onConfirm: (val) => {
                    const discountAmount = parseFloat(val);
                    if (!isNaN(discountAmount) && discountAmount > 0 && discountAmount < total) {
                        setCart(prev => {
                            // Buscar si ya existe un ítem de descuento
                            const existingIndex = prev.findIndex(i => i.userCode === 'DS00');
                            
                            if (existingIndex > -1) {
                                // Actualizar el descuento existente
                                const newCart = [...prev];
                                newCart[existingIndex] = {
                                    ...newCart[existingIndex],
                                    price: -discountAmount
                                };
                                return newCart;
                            } else {
                                // Agregar nuevo ítem de descuento
                                return [...prev, {
                                    ...discountProd,
                                    price: -discountAmount,
                                    quantity: 1,
                                    name: '** DESCUENTO **'
                                }];
                            }
                        });
                        showAlert('Descuento Aplicado', `Se ha aplicado un descuento de S/ ${discountAmount.toFixed(2)} al ticket.`, 'success');
                    } else if (discountAmount >= total) {
                        showAlert('Monto Inválido', 'El descuento no puede ser mayor o igual al total de la venta.', 'warning');
                    }
                    setModal(prev => ({ ...prev, show: false }));
                }
            });
        } catch (err) {
            console.error('Error in applyGlobalDiscount:', err);
            showAlert('Error', 'No se pudo verificar el ítem de descuento en el servidor.', 'error');
        }
    };

    const showAlert = (title, message, type = 'info', showButtons = true) => {
        setModal({ show: true, title, message, type, value: '', showButtons, onConfirm: () => setModal(prev => ({ ...prev, show: false })) });
    };

    const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

    const registerCustomer = () => setShowManualModal(true);

    const handleOpenCash = async () => {
        if (!openingAmount) return;
        setIsOpeningCash(true);
        try {
            const res = await fetch('/api/cash/open', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: parseFloat(openingAmount) })
            });
            const data = await res.json();
            if (data.success) {
                setIdApeCaj(data.id);
                // Mostrar alerta sin botones que se cierra sola en 1.5s
                showAlert('Caja Abierta', 'La sesión de caja se inició correctamente.', 'success', false);
                setTimeout(() => {
                    setModal(prev => ({ ...prev, show: false }));
                }, 1500);
            } else {
                showAlert('Error', 'No se pudo abrir la caja.', 'error');
            }
        } catch { showAlert('Error', 'Error de conexión con el servidor.', 'error'); }
        finally { setIsOpeningCash(false); }
    };

    const handlePrint = (data) => {
        // Si recibimos datos nuevos (desde historial), los guardamos
        // Si es un evento (desde el botón), usamos lo que ya está en printData
        if (data && data.customer) {
            setPrintData(data);
        }

        setCashReportData(null); // Asegurar que no se imprima el reporte de caja
        setTimeout(() => window.print(), 500);
    };

    const handlePrintCashReport = (report) => {
        setPrintData(null); // Asegurar que no se imprima una boleta
        setCashReportData(report);
        setTimeout(() => window.print(), 500);
    };

    const handleRenew = (member, plan) => {
        // 1. Limpiar carrito y añadir el plan seleccionado
        setCart([{ ...plan, quantity: 1 }]);

        // 2. Establecer el cliente de la membresía
        setCustomer({
            name: member.name,
            ruc: member.ruc || member.phone || '',
            code: member.id || member.codcli,
            phone: member.phone || '',
            isNew: false,
            mcredi: member.mcredi || 0
        });

        // 3. Cambiar a la pestaña POS y abrir el modal de pago
        setActiveTab('pos');
        setShowCartModal(true);
    };

    const handleFinalizeSale = async (paymentInfo = {}) => {
        if (isFinalizing) return;
        if (!cart.length || !idApeCaj) return;

        // Validación Fiscal: Factura requiere RUC
        if (docType === '01') {
            const ruc = customer.ruc?.trim() || '';
            if (customer.code === '000000' || ruc.length !== 11) {
                showAlert('RUC Obligatorio', 'Para emitir una Factura es necesario un cliente con RUC válido (11 dígitos). No se permite "Clientes Varios" ni DNI.', 'warning');
                return;
            }
        }

        setIsFinalizing(true);
        try {
            const { cashReceived, changeGiven, isMixed } = paymentInfo;
            const res = await fetch('/api/sales/finalize', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    docType, pointOfSale: '01',
                    isMixed,
                    codcli: customer.code === 'MANUAL' ? 'C00000' : customer.code,
                    nomcli: customer.name,
                    ruccli: customer.ruc,
                    phone: customer.phone,
                    birthdate: customer.birthdate,
                    items: cart,
                    idApeCaj,
                    payments: payments.length > 0 ? payments : [{
                        id: selectedTar || 'EF',
                        type: paymentMethod,
                        amount: total,
                        name: paymentMethod === 1 ? 'EFECTIVO' : (availableMethods.find(m => m.id === selectedTar)?.name || 'TARJETA')
                    }],
                    warehouse,
                    codven: selectedSalesperson,
                    exchangeRate,
                    cashReceived: cashReceived || total,
                    changeGiven: changeGiven || 0,
                    customStartDate: isRegularizing && membershipStartDate ? membershipStartDate : null
                })
            });
            const result = await res.json();
            if (result.success) {
                const newPrintData = {
                    documentNumber: result.ndocu,
                    docType,
                    customer: { name: customer.name, ruc: customer.ruc, phone: customer.phone },
                    items: [...cart],
                    total: result.total || total,
                    base: result.base,
                    igv: result.igv,
                    date: new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' }),
                    salesperson: selectedSalesperson
                };
                setPrintData(newPrintData);
                setLastMembershipInfo(result.membershipInfo);
                setOrderSuccess(result.ndocu);
                setCart([]);
                setShowMobileCart(false);
                setSearchTerm('');
                setCustomerSearch('');
                setCustomer({ name: 'CLIENTE VARIOS', ruc: '', code: 'C00000', phone: '', birthdate: '' });
                setPayments([]); // Limpiar pagos mixtos
                setMembershipStartDate(null);
                setIsRegularizing(false);
                setDocType('65'); // Volver a Nota por defecto
                setPaymentMethod(1); // Volver a Efectivo por defecto
                setSelectedTar(''); // Limpiar tarjeta seleccionada
                setShowMixed(false); // Regresar a Pago Simple
                setCashReceived(''); // Limpiar efectivo recibido
                setSearchType('DNI'); // Regresar a DNI por defecto
            } else {
                showAlert('Error', result.error || 'No se pudo procesar la venta.', 'error');
            }
        } catch (err) { showAlert('Error', 'Ocurrió un error crítico al procesar la venta.', 'error'); }
        finally { setIsFinalizing(false); }
    };

    const total = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);

    if (!mounted) return null;

    if (!idApeCaj) {
        return (
            <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', overflow: 'hidden' }}>
                {/* Decoración de fondo */}
                <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '400px', height: '400px', background: 'rgba(59, 130, 246, 0.05)', filter: 'blur(80px)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '400px', height: '400px', background: 'rgba(139, 92, 246, 0.05)', filter: 'blur(80px)', borderRadius: '50%' }} />

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: 'rgba(255, 255, 255, 1)',
                        borderRadius: '32px',
                        padding: '48px',
                        width: '100%',
                        maxWidth: '440px',
                        textAlign: 'center',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        zIndex: 10
                    }}
                >
                    <div style={{
                        width: '80px', height: '80px', background: '#f8fafc', borderRadius: '24px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 24px', color: '#3b82f6',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        <Lock size={40} strokeWidth={1.5} />
                    </div>

                    <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.02em' }}>
                        Apertura de Caja
                    </h1>
                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px', fontWeight: 500 }}>
                        Ingrese el monto inicial para comenzar la jornada
                    </p>

                    {/* Selector de Vendedor Predeterminado */}
                    <div style={{ textTransform: 'uppercase', textAlign: 'left', marginBottom: '20px' }}>
                        <label style={{ fontSize: '10px', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.05em', display: 'block', marginBottom: '8px', paddingLeft: '4px' }}>
                            Vendedor de Turno
                        </label>
                        <CustomSelect
                            value={selectedSalesperson}
                            onChange={e => setSelectedSalesperson(e.target.value)}
                            options={salespeople.map(v => ({ value: v.id, label: v.name.trim() }))}
                            placeholder="Seleccione un vendedor..."
                            icon={<User size={18} color="#64748b" />}
                            large={true}
                            style={{
                                border: '2px solid #f1f5f9',
                                borderRadius: '16px',
                                background: '#f8fafc',
                                height: '54px',
                                fontSize: '14px',
                                color: '#0f172a',
                                fontWeight: 700,
                            }}
                        />
                    </div>

                    <div style={{ position: 'relative', marginBottom: '24px' }}>
                        <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 800, fontSize: '18px' }}>
                            S/
                        </div>
                        <input
                            type="text"
                            inputMode="none"
                            value={openingAmount}
                            onChange={e => setOpeningAmount(e.target.value)}
                            onFocus={openOpeningNumpad}
                            style={{
                                width: '100%',
                                padding: '18px 20px 18px 45px',
                                borderRadius: '16px',
                                border: '2px solid #f1f5f9',
                                fontSize: '22px',
                                fontWeight: 800,
                                color: '#0f172a',
                                outline: 'none',
                                transition: 'all 0.2s',
                                background: '#f8fafc'
                            }}
                            placeholder="0.00"
                        />
                        <NumericKeypad 
                            isOpen={showOpeningNumpad}
                            onClose={() => setShowOpeningNumpad(false)}
                            onKeyPress={handleOpeningNumpadKeyPress}
                            onDelete={handleOpeningNumpadDelete}
                            value={openingAmount}
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleOpenCash}
                        disabled={isOpeningCash}
                        style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: '#fff',
                            padding: '18px',
                            borderRadius: '16px',
                            border: 'none',
                            fontSize: '16px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
                        }}
                    >
                        {isOpeningCash ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                Comenzar Jornada
                                <ArrowRight size={20} />
                            </>
                        )}
                    </motion.button>

                    <p style={{ marginTop: '32px', fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Dato.Click POS • Sistema Seguro
                    </p>
                </motion.div>
            </div>
        );
    }

    const renderCartContent = (isDrawerMode = false) => {
        return (
            <div style={{ width: isDrawerMode ? '100%' : '300px', height: '100%', background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: isDrawerMode ? 'none' : '-4px 0 20px rgba(15, 23, 42, 0.02)', zIndex: 10 }}>
                <div style={{ padding: '10px 16px', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isDrawerMode && (
                            <button 
                                onClick={() => setShowMobileCart(false)}
                                style={{ 
                                    background: '#f1f5f9', border: 'none', color: '#64748b', 
                                    borderRadius: '8px', padding: '6px', cursor: 'pointer', marginRight: '6px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <X size={20} />
                            </button>
                        )}
                        <div style={{ background: '#3b82f6', color: '#fff', borderRadius: '8px', padding: '6px' }}>
                            <ShoppingCart size={20} />
                        </div>
                        <h2 style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Ticket ({(cart || []).length})</h2>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                            disabled={cart.length === 0}
                            onClick={applyGlobalDiscount} 
                            style={{ 
                                background: '#f0fdf4', border: 'none', color: '#16a34a', borderRadius: '8px', padding: '6px', 
                                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                                opacity: cart.length === 0 ? 0.5 : 1
                            }} 
                            title="Descuento Global"
                        >
                            <Percent size={20} />
                        </button>
                        <button 
                            disabled={cart.length === 0}
                            onClick={() => setCart([])} 
                            style={{ 
                                background: '#fff1f2', border: 'none', color: '#ef4444', borderRadius: '8px', padding: '6px', 
                                cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                                opacity: cart.length === 0 ? 0.5 : 1
                            }} 
                            title="Vaciar Carrito"
                        >
                            <Trash2 size={20} />
                        </button>
                        <button onClick={() => setShowCartModal(true)} style={{ background: '#eff6ff', border: 'none', color: '#3b82f6', borderRadius: '8px', padding: '6px', cursor: 'pointer' }} title="Ver Categorías"><LayoutGrid size={20} /></button>
                    </div>
                </div>

                {/* OPCIÓN DE FECHA DE INICIO (REGULARIZACIÓN) */}
                <div style={{ 
                    padding: '8px 12px', 
                    background: isRegularizing ? '#fffbeb' : '#fff', 
                    borderBottom: 'none',
                    transition: 'all 0.3s'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyRules: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={18} color={isRegularizing ? '#d97706' : '#94a3b8'} />
                            <span style={{ fontSize: '10px', fontWeight: 800, color: isRegularizing ? '#92400e' : '#64748b' }}>
                                INICIO PERSONALIZADO
                            </span>
                        </div>
                        <div 
                            onClick={() => {
                                setIsRegularizing(!isRegularizing);
                                if (!membershipStartDate) setMembershipStartDate(formatDate(new Date()));
                            }}
                            style={{
                                width: '36px', height: '18px', borderRadius: '18px',
                                background: isRegularizing ? '#d97706' : '#e2e8f0',
                                padding: '2px', cursor: 'pointer', display: 'flex',
                                alignItems: 'center', justifyContent: isRegularizing ? 'flex-end' : 'flex-start'
                            }}
                        >
                            <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#fff' }} />
                        </div>
                    </div>
                    
                    {isRegularizing && (
                        <div style={{ marginTop: '10px' }}>
                            <p style={{ fontSize: '10px', color: '#b45309', marginBottom: '6px', fontWeight: 700 }}>
                                * La membresía iniciará el:
                            </p>
                            <CustomDatePicker 
                                value={membershipStartDate || formatDate(new Date())} 
                                onChange={setMembershipStartDate}
                                compact={true}
                            />
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                    {(cart || []).map(item => (
                        <CartItem
                            key={item.id}
                            item={item}
                            onUpdateQty={updateQuantity}
                            onRemove={removeFromCart}
                            onUpdatePrice={updatePrice}
                            useScreenKeyboards={useScreenKeyboards}
                        />
                    ))}
                </div>
                <PaymentSection 
                    total={total} 
                    availableMethods={availableMethods} 
                    payments={payments}
                    setPayments={setPayments}
                    onFinalize={handleFinalizeSale} 
                    loading={isFinalizing} 
                    cartEmpty={(cart || []).length === 0} 
                    onAlert={showAlert}
                    showMixed={showMixed}
                    setShowMixed={setShowMixed}
                    cashReceived={cashReceived}
                    setCashReceived={setCashReceived}
                    useScreenKeyboards={useScreenKeyboards}
                    selectedCustomer={customer}
                />
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', background: '#f1f5f9', overflow: 'hidden' }}>
            {/* Sidebar para PC / Tablet */}
            {!isMobileDevice && (
                <div style={{ width: '56px', height: '100%', flexShrink: 0, position: 'relative', zIndex: 9000 }}>
                    <Sidebar
                        onSignOut={() => signOut()}
                        onOpenCloseCash={() => setShowCloseModal(true)}
                        onOpenHistory={() => setShowHistoryModal(true)}
                        onToggleFullscreen={toggleFullscreen}
                        isFullscreen={isFullscreen}
                        activeTab={activeTab} 
                        setActiveTab={setActiveTab} 
                    />
                </div>
            )}

            {/* Sidebar flotante para celulares (Drawer) trasladado al final del layout */}

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Cabecera Global Móvil para celulares */}
                {isMobileDevice && (
                    <div style={{ 
                        background: '#131722', 
                        height: '56px', 
                        borderBottom: '1px solid #1e222d', 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '0 16px',
                        justifyContent: 'space-between',
                        flexShrink: 0
                    }}>
                        {activeTab === 'pos' ? (
                            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '23px', fontWeight: 900, letterSpacing: '-0.03em', userSelect: 'none', display: 'flex', alignItems: 'center' }}>
                                <span style={{ color: '#60a5fa' }}>Syscom</span>
                                <span style={{ color: '#f1f5f9' }}>.click</span>
                            </span>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 900, color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {activeTab === 'dashboard' ? 'Dashboard' : 
                                     activeTab === 'memberships' ? 'Membresías' : 
                                     activeTab === 'promotions' ? 'Promociones' : 
                                     activeTab === 'customers' ? 'Clientes' : 
                                     activeTab === 'birthdays' ? 'Cumpleaños' : 
                                     activeTab === 'credits' ? 'Gestión de Créditos' :
                                     activeTab === 'expenses' ? 'Egresos' :
                                     activeTab === 'purchases-ocm' ? 'Orden de Compra' :
                                     activeTab === 'purchases-gim' ? 'Nota de Ingreso' :
                                     activeTab === 'purchases-ccp' ? 'Facturas / Boletas' :
                                     activeTab === 'suppliers' ? 'Proveedores' :
                                     activeTab === 'general-cash' ? 'Caja General' :
                                     activeTab === 'settings' ? 'Ajustes POS' :
                                     activeTab === 'whatsapp' ? 'Config WhatsApp' : 
                                     activeTab === 'sales' ? 'Historial Ventas' : 
                                     activeTab === 'products' ? 'Catálogo Artículos' :
                                     activeTab === 'classifications' ? 'Clasificaciones' :
                                     activeTab === 'brands' ? 'Marcas ERP' : 'POS'}
                                </span>
                                <span style={{ fontSize: '9px', fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase' }}>
                                    {companySettings?.company?.commercialName || companySettings?.company?.name || 'Sede'}
                                </span>
                            </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                onClick={() => setShowHistoryModal(true)}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#f1f5f9',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '6px',
                                    borderRadius: '50%',
                                    transition: 'background 0.2s, transform 0.2s',
                                    outline: 'none'
                                }}
                                aria-label="Historial de Ventas"
                            >
                                <History size={22} />
                            </button>
                            <button
                                onClick={toggleFullscreen}
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#f1f5f9',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '6px',
                                    borderRadius: '50%',
                                    transition: 'background 0.2s, transform 0.2s',
                                    outline: 'none'
                                }}
                                aria-label="Pantalla completa"
                            >
                                {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
                            </button>
                            <button 
                                onClick={() => setShowMobileMenu(true)} 
                                style={{
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '6px',
                                    borderRadius: '50%',
                                    transition: 'transform 0.2s ease-in-out',
                                    outline: 'none'
                                }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                aria-label="Abrir menú"
                            >
                                <Isotipo />
                            </button>
                        </div>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {activeTab === 'pos' && (
                        <>
                            <motion.div
                            key="pos" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                            style={{ flex: 1, display: 'flex', overflow: 'hidden' }}
                        >
                            {/* AREA DE VENTAS */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc', overflow: 'hidden' }}>

                                {/* LÍNEA 1: DATOS DE LA EMPRESA / SEDE (NUEVA) */}
                                {!isMobileDevice && (
                                    <div style={{ 
                                        background: '#ffffff', 
                                        padding: '12px 20px', 
                                        minHeight: '70px', 
                                        borderBottom: '1px solid #e2e8f0', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            {/* Icono de Sede Estilizado */}
                                            <div style={{ 
                                                width: '42px', 
                                                height: '42px', 
                                                borderRadius: '12px', 
                                                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                color: '#2563eb',
                                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.08)',
                                                flexShrink: 0
                                            }}>
                                                <Building2 size={20} />
                                            </div>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                    {/* Nombre de la Sede */}
                                                    <h1 style={{ 
                                                        fontSize: '15px', 
                                                        fontWeight: 800, 
                                                        color: '#0f172a', 
                                                        margin: 0,
                                                        letterSpacing: '-0.02em',
                                                        lineHeight: '1.2'
                                                    }}>
                                                        {companySettings?.company?.legalName || companySettings?.company?.name || 'Cargando sede...'}
                                                    </h1>
                                                    
                                                    {/* Badge de RUC */}
                                                    {companySettings?.company?.ruc && (
                                                        <span style={{ 
                                                            background: '#f8fafc', 
                                                            color: '#475569', 
                                                            padding: '2px 10px', 
                                                            borderRadius: '20px', 
                                                            fontSize: '10px', 
                                                            fontWeight: 700,
                                                            letterSpacing: '0.02em',
                                                            border: '1px solid #e2e8f0'
                                                        }}>
                                                            R.U.C. {companySettings.company.ruc}
                                                        </span>
                                                    )}
                                                    
                                                    {/* Badge Sede Activa con LED Pulsante */}
                                                    <span style={{ 
                                                        display: 'inline-flex', 
                                                        alignItems: 'center', 
                                                        gap: '6px', 
                                                        background: '#f0fdf4', 
                                                        color: '#166534', 
                                                        padding: '2px 10px', 
                                                        borderRadius: '20px', 
                                                        fontSize: '10px', 
                                                        fontWeight: 800,
                                                        border: '1px solid #dcfce7'
                                                    }}>
                                                        <span className="ping-dot" style={{ 
                                                            width: '6px', 
                                                            height: '6px', 
                                                            borderRadius: '50%', 
                                                            background: '#22c55e', 
                                                            display: 'inline-block'
                                                        }}></span>
                                                        SEDE ACTIVA
                                                    </span>
                                                </div>
                                                
                                                {/* Dirección */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                                                    <MapPin size={12} style={{ color: '#94a3b8' }} />
                                                    <span style={{ fontSize: '11px', fontWeight: 550 }}>
                                                        {companySettings?.company?.address || 'Dirección no configurada'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        {/* MONITOR DE WHATSAPP */}
                                        {(waQueue.length > 0 || isProcessingWa) && (
                                            <div style={{ position: 'relative' }}>
                                                <motion.button 
                                                    animate={waQueue.some(m => m.status === 'ERROR') ? { scale: [1, 1.1, 1] } : {}}
                                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                                    onClick={() => setShowWaAlerts(!showWaAlerts)}
                                                    style={{
                                                        background: waQueue.some(m => m.status === 'ERROR') ? '#fef2f2' : '#f0f9ff',
                                                        border: `1px solid ${waQueue.some(m => m.status === 'ERROR') ? '#fecaca' : '#bae6fd'}`,
                                                        borderRadius: '10px', padding: '8px', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', gap: '8px', color: waQueue.some(m => m.status === 'ERROR') ? '#ef4444' : '#0ea5e9'
                                                    }}
                                                >
                                                    {isProcessingWa ? <RefreshCw size={14} className="animate-spin" /> : <Smartphone size={14} />}
                                                    <span style={{ fontSize: '11px', fontWeight: 900 }}>
                                                        {waQueue.filter(m => m.status === 'ERROR').length > 0 
                                                            ? `${waQueue.filter(m => m.status === 'ERROR').length} ERROR` 
                                                            : (isProcessingWa ? 'ENVIANDO...' : 'PENDIENTE')}
                                                    </span>
                                                </motion.button>

                                                <AnimatePresence>
                                                    {showWaAlerts && (
                                                        <motion.div 
                                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            style={{
                                                                position: 'absolute', top: '100%', right: 0, marginTop: '12px',
                                                                width: '320px', background: '#fff', borderRadius: '16px',
                                                                boxShadow: '0 20px 50px rgba(0,0,0,0.15)', zIndex: 1000,
                                                                border: '1px solid #f1f5f9', overflow: 'hidden'
                                                            }}
                                                        >
                                                            <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569' }}>COLA DE WHATSAPP</span>
                                                                <button onClick={() => setWaQueue([])} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}>Limpiar todo</button>
                                                            </div>
                                                            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                                                {waQueue.map(m => (
                                                                    <div key={m.id} style={{ padding: '12px', borderBottom: '1px solid #f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <div>
                                                                            <p style={{ margin: 0, fontSize: '11px', fontWeight: 700 }}>{m.phone}</p>
                                                                            <p style={{ margin: 0, fontSize: '10px', color: m.status === 'ERROR' ? '#ef4444' : '#64748b' }}>
                                                                                {m.status === 'ERROR' ? `Error: ${m.error}` : 'Enviando mensaje...'}
                                                                            </p>
                                                                        </div>
                                                                        {m.status === 'ERROR' && (
                                                                            <button 
                                                                                onClick={() => setWaQueue(prev => prev.map(msg => msg.id === m.id ? {...msg, status: 'PENDIENTE'} : msg))}
                                                                                style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '9px', fontWeight: 700, cursor: 'pointer' }}
                                                                            >
                                                                                Reintentar
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )}

                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>Tipo Cambio</p>
                                            <p style={{ fontSize: '11px', fontWeight: 900, color: '#3b82f6', margin: 0 }}>S/ {Number(exchangeRate || 1).toFixed(3)}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', margin: 0 }}>Terminal</p>
                                            <p style={{ fontSize: '11px', fontWeight: 900, color: '#1e293b', margin: 0 }}>{session?.user?.sedeId || '01'}</p>
                                        </div>
                                    </div>
                                </div>
                                )}

                                {/* LÍNEA 2: BARRA CLIENTE POS (PROFESIONAL) */}
                                <div style={{ background: '#ffffff', padding: isMobileDevice ? '10px 12px' : '8px 16px', borderBottom: 'none', display: 'flex', alignItems: 'center', gap: isMobileDevice ? '8px' : '12px' }}>

                                    {/* Selector de Tipo DNI/RUC/CE */}
                                    <div style={{ 
                                        display: 'flex', 
                                        background: '#f1f5f9', 
                                        borderRadius: isMobileDevice ? '20px' : '8px', 
                                        padding: '2px', 
                                        gap: '2px', 
                                        border: 'none' 
                                    }}>
                                        {['DNI', 'RUC', 'CE'].map(type => {
                                            const isSelected = searchType === type;
                                            let activeBg = isMobileDevice ? '#3b82f6' : '#eff6ff';
                                            let activeColor = isMobileDevice ? '#ffffff' : '#3b82f6';
                                            let activeBorder = 'none';

                                            return (
                                                <button
                                                    key={type}
                                                    onClick={() => {
                                                        setSearchType(type);
                                                        setCustomerSearch('');
                                                        setCustomer({ name: 'CLIENTE VARIOS', ruc: '', code: 'C00000', phone: '', birthdate: '' });
                                                        setShowNumpad(false);
                                                        setShowCEKeyboard(false);
                                                    }}
                                                    style={{
                                                        padding: isMobileDevice ? '7px 12px' : '4px 8px',
                                                        borderRadius: isMobileDevice ? '20px' : '6px',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: isMobileDevice ? '12px' : '10px',
                                                        fontWeight: isMobileDevice ? 900 : 800,
                                                        background: isSelected ? activeBg : '#ffffff',
                                                        color: isSelected ? activeColor : '#64748b',
                                                        boxShadow: isSelected ? (isMobileDevice ? '0 4px 10px rgba(96, 165, 250, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)') : 'none',
                                                        transition: 'all 0.25s ease'
                                                    }}
                                                >
                                                    {type}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div style={{ flex: isMobileDevice ? 1 : 'none', width: isMobileDevice ? 'auto' : '160px', position: 'relative' }}>
                                        <input
                                            type="text"
                                            inputMode="none" // Evita el teclado nativo en tablets
                                            placeholder={searchType === 'DNI' ? "8 dígitos..." : searchType === 'RUC' ? "11 dígitos..." : "CE..."}
                                            value={customerSearch}
                                            onFocus={() => {
                                                if (useScreenKeyboards) {
                                                    if (searchType === 'CE') {
                                                        setShowCEKeyboard(true);
                                                    } else {
                                                        setShowNumpad(true);
                                                    }
                                                }
                                            }}
                                            onChange={handleCustomerSearch}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    executeCustomerSearch(customerSearch);
                                                }
                                            }}
                                            maxLength={searchType === 'DNI' ? 8 : 11}
                                            style={{ 
                                                width: '100%', 
                                                paddingLeft: '14px', 
                                                paddingRight: isMobileDevice ? (customerSearch ? '32px' : '10px') : '10px', 
                                                paddingTop: isMobileDevice ? '10px' : '8px', 
                                                paddingBottom: isMobileDevice ? '10px' : '8px', 
                                                background: '#f1f5f9', 
                                                border: 'none', 
                                                borderRadius: isMobileDevice ? '24px' : '10px', 
                                                fontSize: isMobileDevice ? '13px' : '12px', 
                                                fontWeight: 700, 
                                                color: '#1e293b',
                                                outline: 'none' 
                                            }}
                                        />
                                        {isSearchingCustomer && <Loader2 style={{ position: 'absolute', right: '8px', top: '30%', animation: 'spin 1s linear infinite', color: '#3b82f6' }} size={16} />}
                                        
                                        {isMobileDevice && customerSearch && (
                                            <button
                                                onClick={() => {
                                                    setCustomerSearch('');
                                                    setCustomer({ name: 'CLIENTE VARIOS', ruc: '', code: 'C00000', phone: '', birthdate: '' });
                                                }}
                                                style={{
                                                    position: 'absolute',
                                                    right: isSearchingCustomer ? '30px' : '10px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    padding: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    zIndex: 10
                                                }}
                                                title="Limpiar Cliente"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}

                                        {searchType === 'CE' ? (
                                            <AlphanumericKeyboard 
                                                isOpen={showCEKeyboard}
                                                onClose={() => {
                                                    setShowCEKeyboard(false);
                                                    if (customerSearch.length >= 5) {
                                                        executeCustomerSearch(customerSearch);
                                                    }
                                                }}
                                                onKeyPress={(key) => {
                                                    setCustomerSearch(prev => {
                                                        const limit = 11;
                                                        return (prev + key).toUpperCase().slice(0, limit);
                                                    });
                                                }}
                                                onDelete={() => setCustomerSearch(prev => prev.slice(0, -1))}
                                                value={customerSearch}
                                            />
                                        ) : (
                                            <NumericKeypad 
                                                isOpen={showNumpad} 
                                                onClose={() => setShowNumpad(false)} 
                                                onKeyPress={handleNumpadKeyPress} 
                                                onDelete={handleNumpadDelete} 
                                                value={customerSearch}
                                            />
                                        )}
                                    </div>
                                    {!isMobileDevice && (
                                        <button
                                            onClick={() => {
                                                setCustomerSearch('');
                                                setCustomer({ name: 'CLIENTE VARIOS', ruc: '', code: 'C00000', phone: '', birthdate: '' });
                                            }}
                                            style={{ background: '#fff1f2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            title="Limpiar Cliente"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                    {!isMobileDevice && (
                                        <button
                                            onClick={() => setShowHistoryModal(true)}
                                            style={{ 
                                                background: '#f1f5f9', 
                                                color: '#0d1b3e', 
                                                border: 'none', 
                                                borderRadius: '6px', 
                                                padding: '8px', 
                                                cursor: 'pointer', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                transition: 'all 0.2s'
                                            }}
                                            title="Historial de Ventas"
                                        >
                                            <History size={18} />
                                        </button>
                                    )}

                                    {!isMobileDevice && (
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', borderLeft: 'none', paddingLeft: '16px' }}>
                                            <div style={{ flex: 1, minWidth: '150px' }}>
                                                <p style={{ fontSize: '8px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '2px' }}>Cliente</p>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <p style={{ fontSize: '11px', fontWeight: 800, color: '#1e293b', margin: 0 }}>{customer.name}</p>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        {customer.expirationDate && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, color: customer.daysRemaining > 0 ? '#10b981' : '#ef4444' }}>
                                                                <Clock size={12} />
                                                                Vence: {new Date(customer.expirationDate).toLocaleDateString()} ({customer.daysRemaining}d)
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Resumen del cliente en móvil */}
                                {isMobileDevice && (
                                    <div style={{ padding: '6px 16px', background: '#ffffff', borderBottom: 'none', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Cliente:</span>
                                        <span style={{ fontSize: '13px', fontWeight: 900, color: '#1e293b' }}>{customer.name}</span>
                                        {customer.expirationDate && (
                                            <span style={{ fontSize: '10px', fontWeight: 700, color: customer.daysRemaining > 0 ? '#10b981' : '#ef4444', marginLeft: 'auto' }}>
                                                Vence: {new Date(customer.expirationDate).toLocaleDateString()} ({customer.daysRemaining}d)
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* BARRA SUPERIOR POS (AHORA SEGUNDO) */}
                                <div style={{
                                      background: '#ffffff', 
                                      padding: isMobileDevice ? '10px 12px' : '8px 16px', 
                                      borderBottom: 'none', 
                                      display: 'flex', 
                                      flexDirection: isMobileDevice ? 'column' : 'row',
                                      alignItems: isMobileDevice ? 'stretch' : 'center', 
                                      gap: isMobileDevice ? '8px' : '12px' 
                                  }}>
                                      {/* En móviles, la fila de botones (Vendedor + Comprobantes) va primero */}
                                      {isMobileDevice && (
                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                              {/* Selector de Vendedor */}
                                              <div style={{ 
                                                  position: 'relative', width: '36px', height: '36px', borderRadius: isMobileDevice ? '50%' : '10px', 
                                                  border: 'none', 
                                                  background: selectedSalesperson ? '#eff6ff' : '#f1f5f9', 
                                                  color: selectedSalesperson ? '#3b82f6' : '#64748b', 
                                                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                                  boxShadow: selectedSalesperson ? '0 2px 6px rgba(79, 70, 229, 0.1)' : 'none',
                                                  flexShrink: 0
                                              }} title="Seleccionar Vendedor">
                                                  <User size={18} />
                                                  <select
                                                      value={selectedSalesperson}
                                                      onChange={(e) => setSelectedSalesperson(e.target.value)}
                                                      style={{
                                                          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                                          opacity: 0, cursor: 'pointer', zIndex: 10
                                                      }}
                                                  >
                                                      {salespeople.map(v => (
                                                          <option key={v.id} value={v.id}>
                                                              {v.name.trim()}
                                                          </option>
                                                      ))}
                                                  </select>
                                              </div>
 
                                              {/* Selector de Boleta/Factura/Nota */}
                                              <div style={{ display: 'flex', gap: '6px', flex: 1, justifyContent: 'flex-end' }}>
                                                  {['03', '01', '65'].map(t => {
                                                      const isSelected = docType === t;
                                                      let activeBg = '#dbeafe'; // Boleta: Celeste pastel con cuerpo
                                                      let activeColor = '#1e40af';
                                                      
                                                      if (t === '01') { // Factura: Verde menta pastel con cuerpo
                                                          activeBg = '#d1fae5';
                                                          activeColor = '#065f46';
                                                      } else if (t === '65') { // Nota: Naranja melón pastel con cuerpo
                                                          activeBg = '#ffedd5';
                                                          activeColor = '#9a3412';
                                                      }
 
                                                      return (
                                                          <button
                                                              key={t}
                                                              onClick={() => setDocType(t)}
                                                              style={{
                                                                  flex: 1,
                                                                  height: isMobileDevice ? '38px' : '36px',
                                                                  borderRadius: isMobileDevice ? '20px' : '10px',
                                                                  border: 'none',
                                                                  cursor: 'pointer',
                                                                  fontSize: '11px',
                                                                  fontWeight: 900,
                                                                  background: isSelected ? activeBg : '#f1f5f9',
                                                                  color: isSelected ? activeColor : '#64748b',
                                                                  transition: 'all 0.25s ease'
                                                              }}
                                                          >
                                                              {t === '03' ? 'Boleta' : t === '01' ? 'Factura' : 'Nota'}
                                                          </button>
                                                      );
                                                  })}
                                              </div>
                                          </div>
                                      )}
 
                                      {/* El Buscador de Productos */}
                                      <div style={{ flex: 1, position: 'relative' }}>
                                          <Search size={isMobileDevice ? 18 : 18} style={{ position: 'absolute', left: isMobileDevice ? '14px' : '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                                          <input 
                                              type="text" 
                                              inputMode="none"
                                              placeholder="Busca productos..." 
                                              value={searchTerm} 
                                              onChange={e => setSearchTerm(e.target.value)} 
                                              onFocus={() => useScreenKeyboards && setShowSearchKeyboard(true)}
                                              style={{ 
                                                  width: '100%', 
                                                  padding: isMobileDevice ? '12px 44px 12px 40px' : '9px 40px 9px 36px', 
                                                  borderRadius: isMobileDevice ? '28px' : '24px', 
                                                  border: 'none', 
                                                  outline: 'none', 
                                                  fontSize: isMobileDevice ? '15px' : '13px',
                                                  fontWeight: isMobileDevice ? 700 : 500,
                                                  background: '#f1f5f9',
                                                  color: '#1e293b'
                                              }} 
                                          />
                                         <button
                                             onClick={() => setShowScannerModal(true)}
                                             style={{
                                                 position: 'absolute',
                                                 right: isMobileDevice ? '14px' : '12px',
                                                 top: '50%',
                                                 transform: 'translateY(-50%)',
                                                 border: 'none',
                                                 background: 'none',
                                                 cursor: 'pointer',
                                                 display: 'flex',
                                                 alignItems: 'center',
                                                 justifyContent: 'center',
                                                 color: '#3b82f6',
                                                 padding: '4px',
                                                 borderRadius: '50%',
                                                 transition: 'all 0.2s'
                                             }}
                                             title="Escanear Código de Barras / QR"
                                             onMouseEnter={e => e.currentTarget.style.color = '#1d4ed8'}
                                             onMouseLeave={e => e.currentTarget.style.color = '#3b82f6'}
                                         >
                                             <ScanBarcode size={isMobileDevice ? 22 : 18} />
                                         </button>
                                         <AlphanumericKeyboard 
                                             isOpen={showSearchKeyboard}
                                             onClose={() => setShowSearchKeyboard(false)}
                                             onKeyPress={(key) => setSearchTerm(prev => prev + key)}
                                             onDelete={() => setSearchTerm(prev => prev.slice(0, -1))}
                                             value={searchTerm}
                                         />
                                     </div>

                                     {/* En escritorio, el vendedor y comprobantes van en la misma fila */}
                                     {!isMobileDevice && (
                                         <>
                                             <div style={{ minWidth: '180px' }}>
                                                 <CustomSelect
                                                     value={selectedSalesperson}
                                                     onChange={e => setSelectedSalesperson(e.target.value)}
                                                     options={salespeople.map(v => ({ value: v.id, label: `VENDEDOR: ${v.name.trim()}` }))}
                                                     placeholder="Seleccionar Vendedor"
                                                 />
                                             </div>

                                             <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '6px', padding: '2px', gap: '2px', border: 'none' }}>
                                                 {['03', '01', '65'].map(t => {
                                                     const isSelected = docType === t;
                                                     let activeBg = '#dbeafe'; 
                                                     let activeColor = '#1e40af';
                                                     
                                                     if (t === '01') { 
                                                         activeBg = '#d1fae5';
                                                         activeColor = '#065f46';
                                                     } else if (t === '65') { 
                                                         activeBg = '#ffedd5';
                                                         activeColor = '#9a3412';
                                                     }

                                                     return (
                                                         <button
                                                             key={t}
                                                             onClick={() => setDocType(t)}
                                                             style={{
                                                                 padding: '4px 8px',
                                                                 borderRadius: '4px',
                                                                 border: 'none',
                                                                 cursor: 'pointer',
                                                                 fontSize: '10px',
                                                                 fontWeight: 700,
                                                                 background: isSelected ? activeBg : '#fff',
                                                                 color: isSelected ? activeColor : '#64748b',
                                                                 transition: 'all 0.25s ease'
                                                             }}
                                                         >
                                                             {t === '03' ? 'Boleta' : t === '01' ? 'Factura' : 'Nota'}
                                                         </button>
                                                     );
                                                 })}
                                             </div>
                                         </>
                                     )}
                                </div>

                                {/* BARRA DE CATEGORÍAS RESTAURADA (AHORA TERCERO) */}
                                <div style={{ flexShrink: 0, background: '#ffffff', padding: isMobileDevice ? '6px 12px' : '6px 16px', borderBottom: 'none', display: 'flex', gap: '6px', overflowX: 'auto', whiteSpace: 'nowrap' }} className="no-scrollbar">
                                    {categories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat.id)}
                                            style={{
                                                padding: isMobileDevice ? '6px 14px' : '6px 12px', 
                                                borderRadius: isMobileDevice ? '20px' : '8px', 
                                                fontSize: '11px', 
                                                fontWeight: 800, 
                                                border: 'none', 
                                                cursor: 'pointer',
                                                background: selectedCategory === cat.id ? '#3b82f6' : '#f1f5f9',
                                                color: selectedCategory === cat.id ? '#ffffff' : '#64748b',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>

                                {/* GRID PRODUCTOS */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                                     {loading ? <p style={{ fontSize: '12px', padding: '10px', color: '#64748b' }}>Cargando...</p> : (products || []).map(p => <ProductCard key={p.id} product={p} onAdd={() => addToCart(p)} isMobileDevice={isMobileDevice} />)}
                                </div>
                            </div>

                            {/* CARRITO POS (SÓLO EN DESKTOP) */}
                            {!isMobileDevice && renderCartContent(false)}
                        </motion.div>

                        {/* BOTÓN FLOTANTE (FAB) Y DRAWER PARA CELULARES */}
                        {isMobileDevice && (
                            <>
                                {/* Botón Flotante */}
                                <AnimatePresence>
                                    {!showMobileCart && !showMobileMenu && (
                                        <motion.button
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0, opacity: 0 }}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setShowMobileCart(true)}
                                            style={{
                                                position: 'fixed',
                                                bottom: '24px',
                                                right: '24px',
                                                background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '50px',
                                                padding: '12px 20px',
                                                boxShadow: '0 10px 25px rgba(59, 130, 246, 0.35), 0 4px 10px rgba(0,0,0,0.15)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                zIndex: 900,
                                                fontWeight: 'bold',
                                                fontSize: '14px'
                                            }}
                                        >
                                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                <ShoppingCart size={18} />
                                                {cart.length > 0 && (
                                                    <span style={{
                                                        position: 'absolute',
                                                        top: '-8px',
                                                        right: '-8px',
                                                        background: '#ef4444',
                                                        color: '#fff',
                                                        borderRadius: '50%',
                                                        width: '18px',
                                                        height: '18px',
                                                        fontSize: '10px',
                                                        fontWeight: 900,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        border: '2px solid #3b82f6',
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                    }}>
                                                        {cart.length}
                                                    </span>
                                                )}
                                            </div>
                                            <span>S/ {Number(total || 0).toFixed(2)}</span>
                                        </motion.button>
                                    )}
                                </AnimatePresence>

                                {/* Drawer Deslizante */}
                                <AnimatePresence>
                                    {showMobileCart && (
                                        <div 
                                            onClick={() => setShowMobileCart(false)}
                                            style={{
                                                position: 'fixed',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                background: 'rgba(15, 23, 42, 0.5)',
                                                backdropFilter: 'blur(4px)',
                                                zIndex: 1000,
                                                display: 'flex',
                                                justifyContent: 'flex-end'
                                            }}
                                        >
                                            <motion.div
                                                initial={{ x: '100%' }}
                                                animate={{ x: 0 }}
                                                exit={{ x: '100%' }}
                                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{
                                                    width: '90%',
                                                    maxWidth: '450px',
                                                    height: '100%',
                                                    background: '#fff',
                                                    boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
                                                    display: 'flex',
                                                    flexDirection: 'column'
                                                }}
                                            >
                                                {renderCartContent(true)}
                                            </motion.div>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </>
                        )}
                    </>
                )}

                    {activeTab === 'memberships' && (
                        <motion.div
                            key="memberships" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
                        >
                            <MembershipsView 
                                onRenew={handleRenew} 
                                onQueueWhatsApp={addToWaQueue}
                                companyName={companySettings?.company?.commercialName || companySettings?.company?.name}
                                useScreenKeyboards={useScreenKeyboards}
                                idApeCaj={idApeCaj}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'promotions' && (
                        <motion.div
                            key="promotions" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            style={{ flex: 1, display: 'flex', overflow: isMobileDevice ? 'auto' : 'hidden' }}
                        >
                            {loadingMembersForPromotions ? (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#64748b', fontSize: '12px', fontWeight: 600 }}>
                                    <Loader2 className="animate-spin" size={24} style={{ color: '#3b82f6', marginRight: '8px' }} />
                                    Cargando socios para promociones...
                                </div>
                            ) : (
                                <PromotionsView 
                                    members={membersForPromotions}
                                    onSendBulk={addToWaQueue}
                                    companyName={companySettings?.company?.commercialName || companySettings?.company?.name || 'Sede'}
                                    onNotify={showAlert}
                                    useScreenKeyboards={useScreenKeyboards}
                                />
                            )}
                        </motion.div>
                    )}

                    {(activeTab === 'customers' || activeTab === 'birthdays' || activeTab === 'credits') && (
                        <motion.div
                            key="customers" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            style={{ flex: 1, display: 'flex', overflow: 'hidden' }}
                        >
                            <CustomersView 
                                activeTab={activeTab}
                                idApeCaj={idApeCaj}
                                onSelectCustomer={(client) => {
                                    setCustomer({
                                        name: client.nomcli,
                                        ruc: client.ruccli,
                                        code: client.codcli,
                                        address: client.dircli,
                                        phone: client.celcli,
                                        birthdate: client.fecnac,
                                        expirationDate: client.fecfinpres,
                                        isNew: false
                                    });
                                    setActiveTab('pos');
                                }}
                                onOpenRegisterModal={() => setShowManualModal(true)}
                                onAlert={showAlert}
                                onQueueWhatsApp={addToWaQueue}
                                companyName={companySettings?.company?.commercialName || companySettings?.company?.name}
                                useScreenKeyboards={useScreenKeyboards}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'whatsapp' && (
                        <motion.div
                            key="whatsapp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            style={{ flex: 1, display: 'flex', overflow: isMobileDevice ? 'auto' : 'hidden' }}
                        >
                            <WhatsappView useScreenKeyboards={useScreenKeyboards} />
                        </motion.div>
                    )}

                    {activeTab === 'settings' && (
                        <motion.div
                            key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            style={{ flex: 1, display: 'flex', overflow: isMobileDevice ? 'auto' : 'hidden' }}
                        >
                            <SettingsView 
                                db={session?.user?.company} 
                                onSaved={loadKeyboardPreference} 
                            />
                        </motion.div>
                    )}

                    {activeTab === 'general-cash' && (
                        <motion.div
                            key="general-cash" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            style={{ flex: 1, display: 'flex', overflow: isMobileDevice ? 'auto' : 'hidden' }}
                        >
                            <GeneralCashView 
                                onInspectCash={(id, isClosed) => {
                                    setInspectCashId(id);
                                    setInspectCashReadOnly(isClosed);
                                    setShowInspectCashModal(true);
                                }}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'expenses' && (
                        <motion.div
                            key="expenses" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            style={{ flex: 1, display: 'flex', overflow: isMobileDevice ? 'auto' : 'hidden' }}
                        >
                            <ExpensesView 
                                key={expenseRefreshTrigger}
                                onAddExpense={() => setShowExpenseModal(true)}
                            />
                        </motion.div>
                    )}

                    {(activeTab === 'purchases-ocm' || activeTab === 'purchases-gim' || activeTab === 'purchases-ccp') && (
                        <motion.div
                            key="purchases" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            style={{ flex: 1, display: 'flex', overflow: isMobileDevice ? 'auto' : 'hidden' }}
                        >
                            <PurchasesView 
                                idApeCaj={idApeCaj}
                                onPurchaseSuccess={() => {
                                    console.log("Compra registrada exitosamente.");
                                }}
                                currentTab={
                                    activeTab === 'purchases-ocm' ? 'ocm' :
                                    activeTab === 'purchases-gim' ? 'gim' : 'ccp'
                                }
                            />
                        </motion.div>
                    )}

                    {activeTab === 'suppliers' && (
                        <motion.div
                            key="suppliers" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            style={{ flex: 1, display: 'flex', overflow: isMobileDevice ? 'auto' : 'hidden' }}
                        >
                            <SuppliersView />
                        </motion.div>
                    )}

                    {(activeTab === 'products' || activeTab === 'classifications' || activeTab === 'brands') && (
                        <motion.div
                            key="products" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            style={{ flex: 1, display: 'flex', overflow: isMobileDevice ? 'auto' : 'hidden' }}
                        >
                            <ProductsView currentTab={
                                activeTab === 'classifications' ? 'classifications' :
                                activeTab === 'brands' ? 'brands' : 'catalog'
                            } />
                        </motion.div>
                    )}

                    {activeTab === 'dashboard' && (
                        <motion.div
                            key="dashboard" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}
                        >
                            <DashboardView />
                        </motion.div>
                    )}

                    {activeTab === 'sales' && (
                        <motion.div
                            key="sales" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            style={{ flex: 1, display: 'flex', overflow: 'hidden' }}
                        >
                            <SalesView 
                                onPrint={handlePrint}
                                onQueueWhatsApp={addToWaQueue}
                                useScreenKeyboards={useScreenKeyboards}
                                company={session?.user?.company}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modales */}
            {orderSuccess && (
                <SuccessModal
                    orderNumber={orderSuccess}
                    onReset={() => {
                        setOrderSuccess(null);
                        setPrintData(null);
                        setPayments([]);
                        setShowMixed(false);
                        setCashReceived('');
                        setSearchType('DNI');
                    }}
                    onPrint={handlePrint}
                    customerPhone={printData?.customer?.phone}
                    total={printData?.total}
                    docType={docType}
                    company={session?.user?.company}
                    businessType={companySettings?.company?.businessType}
                    membershipInfo={lastMembershipInfo}
                    onQueueWhatsApp={addToWaQueue}
                    useScreenKeyboards={useScreenKeyboards}
                />
            )}
            <CustomerManualModal 
                isOpen={showManualModal} 
                onClose={() => setShowManualModal(false)} 
                initialDoc={manualDoc} 
                onCustomerCreated={(c) => { setCustomer(c); setCustomerSearch(c.ruc); setShowManualModal(false); }} 
                useScreenKeyboards={useScreenKeyboards}
            />
            <CartDetailsModal
                isOpen={showCartModal}
                onClose={() => setShowCartModal(false)}
                items={cart}
                total={total}
                onUpdateQty={updateQuantity}
                onRemove={removeFromCart}
                onClear={() => setCart([])}
            />
            <SalesHistoryModal
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
                idApeCaj={idApeCaj}
                onPrint={handlePrint}
                company={session?.user?.company}
                onQueueWhatsApp={addToWaQueue}
                useScreenKeyboards={useScreenKeyboards}
            />
            <CloseCashModal
                isOpen={showCloseModal}
                onClose={() => setShowCloseModal(false)}
                idApeCaj={idApeCaj}
                onConfirm={(report) => {
                    handlePrintCashReport(report);
                    setTimeout(() => signOut(), 5000); // Dar más tiempo a imprimir antes de salir
                }}
            />
            <CloseCashModal
                isOpen={showInspectCashModal}
                onClose={() => {
                    setShowInspectCashModal(false);
                    setInspectCashId(null);
                }}
                idApeCaj={inspectCashId}
                readOnly={inspectCashReadOnly}
                onConfirm={() => {
                    setShowInspectCashModal(false);
                    setInspectCashId(null);
                }}
            />

            <CashExpenseModal
                isOpen={showExpenseModal}
                onClose={() => setShowExpenseModal(false)}
                onSaved={() => {
                    setShowExpenseModal(false);
                    setExpenseRefreshTrigger(prev => prev + 1);
                }}
                idapecaj={idApeCaj}
                codpto={session?.user?.company?.codpto || '01'}
                useScreenKeyboards={useScreenKeyboards}
            />
            <BarcodeScannerModal
                isOpen={showScannerModal}
                onClose={() => setShowScannerModal(false)}
                onScanSuccess={handleScanSuccess}
            />



            {/* COMPONENTE DE IMPRESIÓN PROFESIONAL (REPLICA EXACTA) */}
            <div id="ticket-print" className="no-screen">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .no-screen { display: none; }
                    @media print {
                        @page { margin: 0; size: 80mm auto; }
                        body { visibility: hidden; background: #fff; margin: 0; padding: 0; }
                        .no-screen { 
                            display: block !important; 
                            visibility: visible !important; 
                            position: absolute; 
                            left: 0; 
                            top: 0; 
                            width: 80mm; 
                            padding: 4mm;
                            background: #fff;
                            font-family: 'Courier New', Courier, monospace;
                            font-size: 11px;
                            color: #000;
                        }
                        .no-screen * { visibility: visible !important; }
                        .text-center { textAlign: center; }
                        .text-right { textAlign: right; }
                        .bold { fontWeight: bold; }
                        .mb-1 { marginBottom: 4px; }
                        .mb-2 { marginBottom: 8px; }
                        .border-top { borderTop: 1px solid #000; paddingTop: 4px; }
                        .border-bottom { borderBottom: 1px solid #000; paddingBottom: 4px; }
                    }
                `}} />
                {printData ? (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{companySettings?.company?.name || ''}</div>
                            <div style={{ margin: '4px 0' }}>
                                <img src={posLogo.startsWith('data:image') || posLogo.startsWith('http') ? posLogo : `/logos/${posLogo}`} width="120" alt="Logo" style={{ display: 'block', margin: '0 auto', maxHeight: '50px', objectFit: 'contain' }} />
                            </div>
                            <div>R.U.C.: {companySettings?.company?.ruc || ''}</div>
                            <div style={{ fontSize: '10px' }}>{companySettings?.company?.address || ''}</div>
                            <div>Telf: {companySettings?.company?.phone || ''}</div>
                        </div>

                        <div style={{ textAlign: 'center', margin: '12px 0', borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '8px 0' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                                {printData.docType === '01' ? 'FACTURA ELECTRONICA' : (printData.docType === '03' ? 'BOLETA DE VENTA' : 'NOTA DE VENTA')}
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '13px' }}>Nº {printData.documentNumber}</div>
                        </div>

                        <div style={{ marginBottom: '8px' }}>
                            <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>FECHA</span>: {printData.date?.split(',')[0]}</div>
                            {printData.docType === 'Nota' && <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>HORA</span>: {new Date().toLocaleTimeString('es-PE', { timeZone: 'America/Lima' })}</div>}
                            <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>VENDEDOR</span>: {printData.salesperson || 'ADMINISTRADOR'}</div>
                            <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>COND.VTA</span>: EFECTIVO</div>
                            {printData.docType === '01' && <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>DOC. IDE.</span>: R.U.C. {printData.customer?.ruc}</div>}
                            <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>{printData.docType === 'Nota' ? 'SEÑOR' : 'CLIENTE'}</span>: {printData.customer?.name || 'VENTA CONTADO'}</div>
                            {printData.docType === 'Nota' && <div style={{ display: 'flex' }}><span style={{ width: '80px' }}>DIREC.</span>: {printData.customer?.address || ''}</div>}
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '1px solid #000', borderBottom: '1px solid #000' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', padding: '4px 0' }}>CANT.</th>
                                    <th style={{ textAlign: 'left', padding: '4px 0' }}>DESCRIPCIÓN</th>
                                    <th style={{ textAlign: 'right', padding: '4px 0' }}>TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(printData.items || []).map((item, idx) => (
                                    <tr key={idx}>
                                        <td style={{ verticalAlign: 'top', padding: '4px 0' }}>{item.quantity}</td>
                                        <td style={{ padding: '4px 0' }}>{item.name}</td>
                                        <td style={{ textAlign: 'right', verticalAlign: 'top', padding: '4px 0' }}>{Number(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {printData.docType !== 'Nota' ? (
                            <div style={{ marginTop: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <div style={{ width: '120px' }}>Total Gravado</div>
                                    <div style={{ width: '40px' }}>S/:</div>
                                    <div style={{ width: '60px', textAlign: 'right' }}>{Number(printData.base || 0).toFixed(2)}</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <div style={{ width: '120px' }}>Total Inafecto</div>
                                    <div style={{ width: '40px' }}>S/:</div>
                                    <div style={{ width: '60px', textAlign: 'right' }}>0.00</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <div style={{ width: '120px' }}>Exonerado</div>
                                    <div style={{ width: '40px' }}>S/:</div>
                                    <div style={{ width: '60px', textAlign: 'right' }}>0.00</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <div style={{ width: '120px' }}>I.G.V.</div>
                                    <div style={{ width: '40px' }}>S/:</div>
                                    <div style={{ width: '60px', textAlign: 'right' }}>{Number(printData.igv || 0).toFixed(2)}</div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', fontWeight: 'bold', fontSize: '13px', marginTop: '4px' }}>
                                    <div style={{ width: '120px' }}>TOTAL</div>
                                    <div style={{ width: '40px' }}>S/:</div>
                                    <div style={{ width: '60px', textAlign: 'right' }}>{Number(printData.total || 0).toFixed(2)}</div>
                                </div>
                                <div style={{ marginTop: '10px', fontSize: '10px', fontWeight: 'bold' }}>
                                    SON: {Number(printData.total || 0).toFixed(2)} SOLES
                                </div>
                                <div style={{ borderTop: '1px solid #000', marginTop: '8px', paddingTop: '8px', fontSize: '10px' }}>
                                    <div>STATUS: &lt;REIMPRESION&gt;</div>
                                    <div>FECHA IMPRESION: {new Date().toLocaleString('es-PE', { timeZone: 'America/Lima' })}</div>
                                </div>
                                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                                    {qrCodeUrl ? (
                                        <img src={qrCodeUrl} style={{ width: '100px', height: '100px', margin: '0 auto', display: 'block' }} alt="QR Documento" />
                                    ) : (
                                        <div style={{ width: '80px', height: '80px', border: '1px solid #000', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px' }}>Generando QR...</div>
                                    )}
                                    <div style={{ fontSize: '9px', marginTop: '5px' }}>
                                        Representación impresa de {printData.docType === '01' ? 'Factura Electrónica' : 'Boleta De Venta Electrónica'}<br />
                                        Podrá ser consultada en https://www.prolineapp.pe
                                    </div>
                                    <div style={{ fontSize: '9px', marginTop: '5px' }}>Autorizado por resolución Nº287-2017/SUNAT</div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ marginTop: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', borderTop: '1px solid #000', paddingTop: '8px' }}>
                                    <span>TOTAL</span>
                                    <span>S/: {Number(printData.total).toFixed(2)}</span>
                                </div>
                                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                                    ¡ Gracias por su preferencia !
                                </div>
                            </div>
                        )}
                    </div>
                ) : cashReportData ? (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{companySettings?.company?.name || ''}</div>
                            <div style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '8px' }}>REPORTE DE ARQUEO / CIERRE</div>
                            <div style={{ fontSize: '11px' }}>ID SESIÓN: {idApeCaj}</div>
                        </div>

                        <div style={{ borderTop: '1px solid #000', borderBottom: '1px solid #000', padding: '8px 0', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>CAJERO:</span>
                                <span>{session?.user?.name || 'ADMIN'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>FECHA:</span>
                                <span>{new Date().toLocaleDateString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>HORA CIERRE:</span>
                                <span>{new Date().toLocaleTimeString()}</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                <span>MONTO INICIAL:</span>
                                <span>S/ {Number(cashReportData.opening).toFixed(2)}</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontWeight: 'bold', borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '4px' }}>VENTAS POR MÉTODO</div>
                            {cashReportData.salesBreakdown?.map((s, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{s.method?.toUpperCase().includes('EFECTIVO') ? 'EFECTIVO' : 
                                           (s.codtar?.trim() === '07' || s.method?.toUpperCase().includes('YAPE') ? 'YAPE' : 
                                           (s.codtar?.trim() === '06' || s.method?.toUpperCase().includes('PLIN') ? 'PLIN' : 'TARJETA'))}:</span>
                                    <span>S/ {Number(s.total || 0).toFixed(2)}</span>
                                </div>
                            ))}
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginTop: '4px', borderTop: '1px solid #000' }}>
                                <span>TOTAL VENTAS:</span>
                                <span>S/ {Number(cashReportData.totalSales).toFixed(2)}</span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontWeight: 'bold', borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '4px' }}>EGRESOS / GASTOS</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>TOTAL GASTOS:</span>
                                <span>S/ {Number(cashReportData.expenses).toFixed(2)}</span>
                            </div>
                        </div>

                        <div style={{ borderTop: '2px solid #000', paddingTop: '8px', marginTop: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px' }}>
                                <span>EFECTIVO EN CAJA:</span>
                                <span>S/ {Number(cashReportData.expectedFinal).toFixed(2)}</span>
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '40px' }}>
                            <div style={{ borderTop: '1px solid #000', width: '150px', margin: '0 auto' }}></div>
                            <div style={{ fontSize: '10px', marginTop: '4px' }}>FIRMA CAJERO</div>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>Preparando ticket...</div>
                )}
            </div>

            {/* Overlay de Carga durante Finalización de Venta (Rediseñado para ser espacioso y bonito) */}
            <AnimatePresence>
                {isFinalizing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md transition-all"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            style={{
                                background: '#fff',
                                padding: '80px',
                                borderRadius: '48px',
                                boxShadow: '0 40px 80px -15px rgba(0,0,0,0.35)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '40px',
                                maxWidth: '520px',
                                width: '90%',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            <div style={{ position: 'relative' }}>
                                <div className="w-28 h-28 rounded-full border-[8px] border-orange-50 border-t-orange-500 animate-spin shadow-inner" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-10 h-10 text-orange-400" />
                                </div>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ fontSize: '36px', fontWeight: 900, color: '#0f172a', marginBottom: '16px', letterSpacing: '-0.03em', lineHeight: 1 }}>
                                    Procesando Venta
                                </h3>
                                <p style={{ fontSize: '20px', color: '#64748b', fontWeight: 500, lineHeight: '1.6' }}>
                                    Sincronizando información con <br />
                                    <span style={{ color: '#f97316', fontWeight: 900, fontSize: '22px' }}>Navasoft ERP</span>
                                </p>

                                <div style={{ marginTop: '40px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{
                                                y: [0, -15, 0],
                                                opacity: [0.3, 1, 0.3],
                                                scale: [1, 1.2, 1]
                                            }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 1.2,
                                                delay: i * 0.15,
                                                ease: "circOut"
                                            }}
                                            style={{
                                                width: '14px',
                                                height: '14px',
                                                background: '#f97316',
                                                borderRadius: '50%',
                                                boxShadow: '0 0 20px rgba(249,115,22,0.5)'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <QuickModal
                show={modal.show}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                showButtons={modal.showButtons}
                inputValue={modal.value}
                onInputChange={(val) => setModal(prev => ({ ...prev, value: val }))}
                onClose={() => setModal(prev => ({ ...prev, show: false }))}
                onConfirm={() => modal.onConfirm(modal.value)}
            />
            <CustomerErpModal
                isOpen={showErpModal}
                onClose={() => setShowErpModal(false)}
                initialData={erpModalData}
                onSave={(newCli) => {
                    setCustomer({
                        name: newCli.nomcli,
                        ruc: newCli.ruccli,
                        code: newCli.code,
                        phone: newCli.phone,
                        birthdate: newCli.birthdate,
                        isNew: false,
                        mcredi: newCli.mcredi || 0
                    });
                    setCustomerSearch(newCli.ruccli);
                }}
            />

            {/* Sidebar flotante para celulares (Drawer) */}
            <AnimatePresence>
                {isMobileDevice && showMobileMenu && (
                    <div 
                        onClick={() => setShowMobileMenu(false)}
                        style={{ 
                            position: 'fixed', 
                            top: 0, 
                            left: 0, 
                            right: 0, 
                            bottom: 0, 
                            background: 'rgba(15, 23, 42, 0.4)', 
                            backdropFilter: 'blur(3px)',
                            zIndex: 9500, 
                            display: 'flex',
                            justifyContent: 'flex-end'
                        }}
                    >
                        <motion.div 
                            initial={{ x: 280 }}
                            animate={{ x: 0 }}
                            exit={{ x: 280 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            onClick={(e) => e.stopPropagation()} 
                            style={{ 
                                width: '280px', 
                                height: '100%', 
                                display: 'flex', 
                                flexDirection: 'column',
                                boxShadow: '-10px 0 30px rgba(0,0,0,0.15)'
                            }}
                        >
                            <Sidebar
                                onSignOut={() => signOut()}
                                onOpenCloseCash={() => { setShowCloseModal(true); setShowMobileMenu(false); }}
                                onOpenHistory={() => { setShowHistoryModal(true); setShowMobileMenu(false); }}
                                onToggleFullscreen={toggleFullscreen}
                                isFullscreen={isFullscreen}
                                activeTab={activeTab} 
                                setActiveTab={(tab) => {
                                    setActiveTab(tab);
                                    setShowMobileMenu(false); // Cerrar automáticamente en móvil al navegar
                                }} 
                                isMobileMode={true}
                                onCloseMobileMenu={() => setShowMobileMenu(false)}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
