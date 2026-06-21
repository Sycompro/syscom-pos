'use client';
import { useState, useEffect } from 'react';
import { LayoutGrid, Zap, History, Settings, LogOut, Lock, Users, MessageCircle, Banknote, Maximize, Minimize, Contact, X, Tag, Package, TrendingUp, ShoppingBag, Truck, ChevronDown, ChevronUp, Menu } from 'lucide-react';
import { useSession } from 'next-auth/react';

const Isotipo = ({ isTablet = false }) => (
    <div style={{
        width: isTablet ? '28px' : '32px',
        height: isTablet ? '28px' : '32px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontWeight: 900,
        fontSize: isTablet ? '14px' : '16px',
        fontFamily: "'Outfit', sans-serif",
        boxShadow: '0 3px 8px rgba(59, 130, 246, 0.2)',
        flexShrink: 0,
        userSelect: 'none'
    }}>
        S
    </div>
);

export default function Sidebar({ 
    onSignOut, onOpenCloseCash, onOpenHistory, onOpenSettings, 
    onToggleFullscreen, isFullscreen, activeTab, setActiveTab,
    isMobileMode = false, onCloseMobileMenu 
}) {
    const { data: session } = useSession();
    const [windowWidth, setWindowWidth] = useState(1280);
    const [isExpandedInternal, setIsExpandedInternal] = useState(false);
    const [isCustomersExpanded, setIsCustomersExpanded] = useState(
        activeTab === 'customers' || activeTab === 'birthdays' || activeTab === 'credits'
    );
    const [isFinanceExpanded, setIsFinanceExpanded] = useState(
        activeTab === 'expenses' || activeTab === 'general-cash'
    );
    const [isProductsExpanded, setIsProductsExpanded] = useState(
        activeTab === 'products' || activeTab === 'classifications' || activeTab === 'brands'
    );
    const [isPurchasesExpanded, setIsPurchasesExpanded] = useState(
        activeTab === 'purchases-ocm' || activeTab === 'purchases-gim' || activeTab === 'purchases-ccp'
    );
    const [isSettingsExpanded, setIsSettingsExpanded] = useState(
        activeTab === 'settings' || activeTab === 'whatsapp'
    );
    const [supportsFullscreen, setSupportsFullscreen] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setWindowWidth(window.innerWidth);
            const handleResize = () => setWindowWidth(window.innerWidth);
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    const isTablet = !isMobileMode && windowWidth < 1280;
    const iconSize = isTablet ? 18 : 22;
    const [hasHoverSupport, setHasHoverSupport] = useState(true);

    const isExpanded = isMobileMode ? true : isExpandedInternal;


    useEffect(() => {
        if (typeof window !== 'undefined') {
            const supported = !!(
                document.documentElement.requestFullscreen ||
                document.documentElement.webkitRequestFullscreen ||
                document.documentElement.mozRequestFullScreen ||
                document.documentElement.msRequestFullscreen
            );
            setSupportsFullscreen(supported);

            // Detectar soporte de hover físico real (mouse)
            const hoverSupport = window.matchMedia('(hover: hover)').matches;
            setHasHoverSupport(hoverSupport);
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || isMobileMode) return;

        const handleClickOutside = (event) => {
            const sidebarElement = document.getElementById('sidebar-container');
            if (isExpandedInternal && sidebarElement && !sidebarElement.contains(event.target)) {
                setIsExpandedInternal(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isExpandedInternal, isMobileMode]);

    const handleAsideClick = (e) => {
        if (!isMobileMode && !isExpandedInternal) {
            setIsExpandedInternal(true);
            e.stopPropagation();
            e.preventDefault();
        }
    };

    const toggleProducts = () => {
        setIsProductsExpanded(prev => {
            const next = !prev;
            if (next) {
                setIsCustomersExpanded(false);
                setIsPurchasesExpanded(false);
                setIsFinanceExpanded(false);
                setIsSettingsExpanded(false);
            }
            return next;
        });
    };

    const toggleCustomers = () => {
        setIsCustomersExpanded(prev => {
            const next = !prev;
            if (next) {
                setIsProductsExpanded(false);
                setIsPurchasesExpanded(false);
                setIsFinanceExpanded(false);
                setIsSettingsExpanded(false);
            }
            return next;
        });
    };

    const togglePurchases = () => {
        setIsPurchasesExpanded(prev => {
            const next = !prev;
            if (next) {
                setIsProductsExpanded(false);
                setIsCustomersExpanded(false);
                setIsFinanceExpanded(false);
                setIsSettingsExpanded(false);
            }
            return next;
        });
    };

    const toggleFinance = () => {
        setIsFinanceExpanded(prev => {
            const next = !prev;
            if (next) {
                setIsProductsExpanded(false);
                setIsCustomersExpanded(false);
                setIsPurchasesExpanded(false);
                setIsSettingsExpanded(false);
            }
            return next;
        });
    };

    const toggleSettings = () => {
        setIsSettingsExpanded(prev => {
            const next = !prev;
            if (next) {
                setIsProductsExpanded(false);
                setIsCustomersExpanded(false);
                setIsPurchasesExpanded(false);
                setIsFinanceExpanded(false);
            }
            return next;
        });
    };

    const handleTabSelect = (tab) => {
        setActiveTab(tab);
        setIsCustomersExpanded(false);
        setIsFinanceExpanded(false);
        setIsProductsExpanded(false);
        setIsPurchasesExpanded(false);
        setIsSettingsExpanded(false);
        if (!isMobileMode) {
            setIsExpandedInternal(false);
        }
        if (isMobileMode && onCloseMobileMenu) {
            onCloseMobileMenu();
        }
    };

    const asideStyle = {
        position: !isMobileMode ? 'absolute' : 'relative',
        top: !isMobileMode ? '12px' : '0',
        left: !isMobileMode ? '12px' : '0',
        bottom: !isMobileMode ? '12px' : '0',
        height: !isMobileMode ? 'calc(100% - 24px)' : '100%',
        width: isExpanded ? (isTablet ? '180px' : '220px') : (isMobileMode ? '100%' : '52px'),
        background: '#ffffff',
        border: !isMobileMode ? '1px solid #e2e8f0' : 'none',
        borderRadius: !isMobileMode ? '20px' : '0px',
        boxShadow: !isMobileMode 
            ? (isExpanded ? '0 20px 40px -10px rgba(15, 23, 42, 0.12)' : '0 4px 12px rgba(15, 23, 42, 0.03)') 
            : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 0 12px 0',
        gap: '4px',
        flexShrink: 0,
        zIndex: 100,
        transition: isMobileMode ? 'none' : 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowX: 'hidden',
        overflowY: 'auto',
        boxSizing: 'border-box'
    };

    // Estilo de logo eliminado según feedback del usuario

    // Estilos de los botones del menú central
    const getNavBtnStyle = (isActive) => {
        return {
            width: isExpanded ? 'calc(100% - 16px)' : '40px',
            height: '40px',
            background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            padding: isExpanded ? (isTablet ? '0 8px' : '0 12px') : '0',
            color: isActive ? '#3b82f6' : '#475569',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
        };
    };

    // Estilos de los botones inferiores
    const getBottomBtnStyle = (customColor) => {
        return {
            width: isExpanded ? 'calc(100% - 16px)' : '30px',
            height: '30px',
            borderRadius: '8px',
            background: 'transparent',
            border: 'none',
            color: customColor || '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isExpanded ? 'flex-start' : 'center',
            padding: isExpanded ? '0 8px' : '0',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            gap: isExpanded ? '10px' : '0',
        };
    };

    const labelTextStyle = {
        fontSize: isTablet ? '10px' : '11px',
        fontWeight: 800,
        opacity: isExpanded ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out',
        whiteSpace: 'nowrap',
        marginLeft: isExpanded ? (isTablet ? '8px' : '10px') : '0px',
    };    if (isMobileMode) {
        return (
            <aside style={{
                width: '100%',
                height: '100%',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                padding: '16px 12px',
                overflowY: 'auto',
                boxSizing: 'border-box',
                gap: '4px'
            }} className="no-scrollbar">
                {/* Cabecera del Menú */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingBottom: '12px', borderBottom: 'none', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Isotipo />
                        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '18px', fontWeight: 900, letterSpacing: '-0.03em', userSelect: 'none' }}>
                            <span style={{ color: '#3b82f6' }}>Syscom</span>
                            <span style={{ color: '#0f172a' }}>.click</span>
                        </span>
                    </div>
                    {onCloseMobileMenu && (
                        <button 
                            onClick={onCloseMobileMenu}
                            style={{ 
                                border: 'none', 
                                background: '#f1f5f9', 
                                color: '#64748b', 
                                cursor: 'pointer', 
                                width: '32px', 
                                height: '32px', 
                                borderRadius: '50%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = '#fee2e2';
                                e.currentTarget.style.color = '#ef4444';
                                e.currentTarget.style.transform = 'rotate(90deg) scale(1.05)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = '#f1f5f9';
                                e.currentTarget.style.color = '#64748b';
                                e.currentTarget.style.transform = 'rotate(0) scale(1)';
                            }}
                            onMouseDown={e => {
                                e.currentTarget.style.transform = 'rotate(90deg) scale(0.95)';
                            }}
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* NAVEGACIÓN SECTION */}
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', margin: '8px 4px 6px 4px', textTransform: 'uppercase' }}>
                    Navegación
                </div>

                {/* Punto de Venta */}
                <div 
                    onClick={() => handleTabSelect('pos')}
                    style={getNavBtnStyle(activeTab === 'pos')}
                >
                    <LayoutGrid size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Punto de Venta</span>
                </div>

                {/* Dashboard */}
                <div 
                    onClick={() => handleTabSelect('dashboard')}
                    style={getNavBtnStyle(activeTab === 'dashboard')}
                >
                    <TrendingUp size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Dashboard</span>
                </div>

                {/* Historial Ventas */}
                <div 
                    onClick={() => handleTabSelect('sales')}
                    style={getNavBtnStyle(activeTab === 'sales')}
                >
                    <History size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Historial Ventas</span>
                </div>

                {/* Membresías */}
                <div 
                    onClick={() => handleTabSelect('memberships')}
                    style={getNavBtnStyle(activeTab === 'memberships')}
                >
                    <Users size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Membresías</span>
                </div>

                {/* Promociones */}
                <div 
                    onClick={() => handleTabSelect('promotions')}
                    style={getNavBtnStyle(activeTab === 'promotions')}
                >
                    <Tag size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Promociones</span>
                </div>

                {/* Productos (Expandible) */}
                <div 
                    onClick={toggleProducts}
                    style={getNavBtnStyle(activeTab === 'products' || activeTab === 'classifications' || activeTab === 'brands')}
                >
                    <Package size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Productos</span>
                    {isProductsExpanded ? <ChevronUp size={16} style={{ marginLeft: 'auto', color: '#64748b' }} /> : <ChevronDown size={16} style={{ marginLeft: 'auto', color: '#64748b' }} />}
                </div>

                {isProductsExpanded && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: 'none', marginLeft: '26px', paddingLeft: '8px', boxSizing: 'border-box' }}>
                        <div onClick={() => handleTabSelect('products')} style={{ width: '100%', height: '34px', background: activeTab === 'products' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'products' ? 800 : 600, color: activeTab === 'products' ? '#3b82f6' : '#64748b' }}>Catálogo</span>
                        </div>
                        <div onClick={() => handleTabSelect('classifications')} style={{ width: '100%', height: '34px', background: activeTab === 'classifications' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'classifications' ? 800 : 600, color: activeTab === 'classifications' ? '#3b82f6' : '#64748b' }}>Clasificaciones</span>
                        </div>
                        <div onClick={() => handleTabSelect('brands')} style={{ width: '100%', height: '34px', background: activeTab === 'brands' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'brands' ? 800 : 600, color: activeTab === 'brands' ? '#3b82f6' : '#64748b' }}>Marcas</span>
                        </div>
                    </div>
                )}

                {/* Clientes (Expandible) */}
                <div 
                    onClick={toggleCustomers}
                    style={getNavBtnStyle(activeTab === 'customers' || activeTab === 'birthdays' || activeTab === 'credits')}
                >
                    <Contact size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Clientes</span>
                    {isCustomersExpanded ? <ChevronUp size={16} style={{ marginLeft: 'auto', color: '#64748b' }} /> : <ChevronDown size={16} style={{ marginLeft: 'auto', color: '#64748b' }} />}
                </div>

                {isCustomersExpanded && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: 'none', marginLeft: '26px', paddingLeft: '8px', boxSizing: 'border-box' }}>
                        <div onClick={() => handleTabSelect('customers')} style={{ width: '100%', height: '34px', background: activeTab === 'customers' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'customers' ? 800 : 600, color: activeTab === 'customers' ? '#3b82f6' : '#64748b' }}>Gestión Clientes</span>
                        </div>
                        <div onClick={() => handleTabSelect('birthdays')} style={{ width: '100%', height: '34px', background: activeTab === 'birthdays' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'birthdays' ? 800 : 600, color: activeTab === 'birthdays' ? '#3b82f6' : '#64748b' }}>Cumpleaños</span>
                        </div>
                        <div onClick={() => handleTabSelect('credits')} style={{ width: '100%', height: '34px', background: activeTab === 'credits' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'credits' ? 800 : 600, color: activeTab === 'credits' ? '#3b82f6' : '#64748b' }}>Créditos</span>
                        </div>
                    </div>
                )}

                {/* Compras (Expandible) */}
                <div 
                    onClick={togglePurchases}
                    style={getNavBtnStyle(activeTab === 'purchases-ocm' || activeTab === 'purchases-gim' || activeTab === 'purchases-ccp')}
                >
                    <ShoppingBag size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Compras</span>
                    {isPurchasesExpanded ? <ChevronUp size={16} style={{ marginLeft: 'auto', color: '#64748b' }} /> : <ChevronDown size={16} style={{ marginLeft: 'auto', color: '#64748b' }} />}
                </div>

                {isPurchasesExpanded && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: 'none', marginLeft: '26px', paddingLeft: '8px', boxSizing: 'border-box' }}>
                        <div onClick={() => handleTabSelect('purchases-ocm')} style={{ width: '100%', height: '34px', background: activeTab === 'purchases-ocm' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'purchases-ocm' ? 800 : 600, color: activeTab === 'purchases-ocm' ? '#3b82f6' : '#64748b' }}>Orden de Compra</span>
                        </div>
                        <div onClick={() => handleTabSelect('purchases-gim')} style={{ width: '100%', height: '34px', background: activeTab === 'purchases-gim' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'purchases-gim' ? 800 : 600, color: activeTab === 'purchases-gim' ? '#3b82f6' : '#64748b' }}>Ingreso Almacén (GIM)</span>
                        </div>
                        <div onClick={() => handleTabSelect('purchases-ccp')} style={{ width: '100%', height: '34px', background: activeTab === 'purchases-ccp' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'purchases-ccp' ? 800 : 600, color: activeTab === 'purchases-ccp' ? '#3b82f6' : '#64748b' }}>Factura/Boletas</span>
                        </div>
                    </div>
                )}

                {/* Proveedores */}
                <div 
                    onClick={() => handleTabSelect('suppliers')}
                    style={getNavBtnStyle(activeTab === 'suppliers')}
                >
                    <Truck size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Proveedores</span>
                </div>

                {/* Finanzas (Expandible) */}
                <div 
                    onClick={toggleFinance}
                    style={getNavBtnStyle(activeTab === 'expenses' || activeTab === 'general-cash')}
                >
                    <Banknote size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Finanzas</span>
                    {isFinanceExpanded ? <ChevronUp size={16} style={{ marginLeft: 'auto', color: '#64748b' }} /> : <ChevronDown size={16} style={{ marginLeft: 'auto', color: '#64748b' }} />}
                </div>

                {isFinanceExpanded && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: 'none', marginLeft: '26px', paddingLeft: '8px', boxSizing: 'border-box' }}>
                        <div onClick={() => handleTabSelect('expenses')} style={{ width: '100%', height: '34px', background: activeTab === 'expenses' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'expenses' ? 800 : 600, color: activeTab === 'expenses' ? '#3b82f6' : '#64748b' }}>Egresos / Gastos</span>
                        </div>
                        <div onClick={() => handleTabSelect('general-cash')} style={{ width: '100%', height: '34px', background: activeTab === 'general-cash' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'general-cash' ? 800 : 600, color: activeTab === 'general-cash' ? '#3b82f6' : '#64748b' }}>Caja General</span>
                        </div>
                    </div>
                )}

                {/* MI CUENTA / CONFIGURACIÓN SECTION */}
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', margin: '20px 4px 6px 4px', textTransform: 'uppercase' }}>
                    Mi Cuenta
                </div>

                {/* Configuración (Expandible) */}
                <div 
                    onClick={toggleSettings}
                    style={getNavBtnStyle(activeTab === 'settings' || activeTab === 'whatsapp')}
                >
                    <Settings size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Configuración</span>
                    {isSettingsExpanded ? <ChevronUp size={16} style={{ marginLeft: 'auto', color: '#64748b' }} /> : <ChevronDown size={16} style={{ marginLeft: 'auto', color: '#64748b' }} />}
                </div>

                {isSettingsExpanded && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: 'none', marginLeft: '26px', paddingLeft: '8px', boxSizing: 'border-box' }}>
                        <div onClick={() => handleTabSelect('settings')} style={{ width: '100%', height: '34px', background: activeTab === 'settings' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'settings' ? 800 : 600, color: activeTab === 'settings' ? '#3b82f6' : '#64748b' }}>Ajustes POS</span>
                        </div>
                        <div onClick={() => handleTabSelect('whatsapp')} style={{ width: '100%', height: '34px', background: activeTab === 'whatsapp' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'whatsapp' ? 800 : 600, color: activeTab === 'whatsapp' ? '#3b82f6' : '#64748b' }}>Config WhatsApp</span>
                        </div>
                    </div>
                )}

                {/* Cerrar Caja */}
                <button 
                    onClick={onOpenCloseCash} 
                    style={{
                        ...getBottomBtnStyle(),
                        width: '100%',
                        height: '40px',
                        borderRadius: '10px',
                        padding: '0 12px',
                        gap: '12px',
                        fontSize: '11px',
                        fontWeight: 800
                    }}
                >
                    <Lock size={22} style={{ flexShrink: 0 }} />
                    <span>Cerrar Caja</span>
                </button>

                {/* Botón de Cerrar Sesión Estilo Cápsula */}
                <div style={{ marginTop: '24px', marginBottom: '16px', padding: '0 4px', width: '100%', boxSizing: 'border-box' }}>
                    <button 
                        onClick={onSignOut} 
                        style={{
                            width: '100%',
                            height: '44px',
                            borderRadius: '24px',
                            border: 'none',
                            background: '#fee2e2',
                            color: '#ef4444',
                            fontWeight: 900,
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 6px rgba(239, 68, 68, 0.05)'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = '#fef2f2';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = '#ffffff';
                        }}
                    >
                        <LogOut size={18} style={{ flexShrink: 0 }} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        );
    }

    return (
        <aside 
            id="sidebar-container"
            onMouseEnter={() => {
                if (hasHoverSupport) {
                    setIsExpandedInternal(true);
                }
            }}
            onMouseLeave={() => {
                if (hasHoverSupport) {
                    setIsExpandedInternal(false);
                }
            }}
            onClick={handleAsideClick}
            style={{
                ...asideStyle,
                overflowY: 'hidden'
            }}
            className="no-scrollbar"
        >
            {/* Botón de cerrar para menú móvil */}
            {isMobileMode && onCloseMobileMenu && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', padding: '4px 12px 8px 12px' }}>
                    <button 
                        onClick={onCloseMobileMenu}
                        style={{ border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Cabecera del Sidebar con Marca y Botón de Toggle */}
            <div style={{ 
                padding: isExpanded ? (isTablet ? '4px 8px 6px 8px' : '4px 12px 8px 12px') : '4px 0 8px 0', 
                width: '100%', 
                boxSizing: 'border-box', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                minHeight: '56px'
            }}>
                {isExpanded ? (
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: '100%'
                    }}>
                        <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: isTablet ? '15px' : '18px', fontWeight: 900, letterSpacing: '-0.03em', userSelect: 'none', display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: '#3b82f6' }}>Syscom</span>
                            <span style={{ color: '#0f172a' }}>.click</span>
                        </span>
                    </div>
                ) : (
                    <div 
                        onClick={() => setIsExpandedInternal(true)}
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            transition: 'all 0.2s ease-in-out',
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                    >
                        <Isotipo isTablet={isTablet} />
                    </div>
                )}
            </div>



            {/* Acciones principales - Menu Limpio */}
            <div 
                style={{ 
                    flex: 1, 
                    width: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '8px',
                    overflowY: 'auto',
                    paddingBottom: '20px'
                }} 
                className="no-scrollbar"
            >
                {/* NAVEGACIÓN SECTION */}
                {isExpanded && (
                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', margin: isTablet ? '8px 8px 6px 8px' : '8px 12px 6px 12px', textTransform: 'uppercase', width: isTablet ? 'calc(100% - 16px)' : 'calc(100% - 24px)', textAlign: 'left' }}>
                        Navegación
                    </div>
                )}

                <div 
                    onClick={() => handleTabSelect('pos')}
                    style={getNavBtnStyle(activeTab === 'pos')}
                    title={isExpanded ? "" : "Punto de Venta"}
                >
                    <LayoutGrid size={iconSize} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Punto de Venta</span>}
                </div>
                
                <div 
                    onClick={() => handleTabSelect('dashboard')}
                    style={getNavBtnStyle(activeTab === 'dashboard')}
                    title={isExpanded ? "" : "Dashboard"}
                >
                    <TrendingUp size={iconSize} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Dashboard</span>}
                </div>
                
                <div 
                    onClick={() => handleTabSelect('sales')}
                    style={getNavBtnStyle(activeTab === 'sales')}
                    title={isExpanded ? "" : "Historial Ventas"}
                >
                    <History size={iconSize} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Historial Ventas</span>}
                </div>
                

                <div 
                    onClick={() => handleTabSelect('memberships')}
                    style={getNavBtnStyle(activeTab === 'memberships')}
                    title={isExpanded ? "" : "Gestión de Membresías"}
                >
                    <Users size={iconSize} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Membresías</span>}
                </div>

                <div 
                    onClick={() => handleTabSelect('promotions')}
                    style={getNavBtnStyle(activeTab === 'promotions')}
                    title={isExpanded ? "" : "Promociones"}
                >
                    <Tag size={iconSize} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Promociones</span>}
                </div>

                <div 
                    onClick={toggleProducts}
                    style={getNavBtnStyle(activeTab === 'products' || activeTab === 'classifications' || activeTab === 'brands')}
                >
                    <Package size={iconSize} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Productos</span>}
                    {isExpanded && (isProductsExpanded ? <ChevronUp size={isTablet ? 14 : 16} style={{ marginLeft: 'auto', color: '#64748b' }} /> : <ChevronDown size={isTablet ? 14 : 16} style={{ marginLeft: 'auto', color: '#64748b' }} />)}
                </div>

                {isExpanded && isProductsExpanded && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: 'none', marginLeft: isTablet ? '12px' : '26px', paddingLeft: isTablet ? '4px' : '8px', paddingRight: isTablet ? '8px' : '16px', boxSizing: 'border-box' }}>
                        {/* Subapartado 1: Catálogo */}
                        <div 
                            onClick={() => handleTabSelect('products')}
                            style={{
                                width: '100%',
                                height: '34px',
                                background: activeTab === 'products' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: isTablet ? '8px' : '12px',
                                color: activeTab === 'products' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: isTablet ? '10px' : '11px', 
                                fontWeight: activeTab === 'products' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Catálogo
                            </span>
                        </div>

                        {/* Subapartado 2: Clasificaciones */}
                        <div 
                            onClick={() => handleTabSelect('classifications')}
                            style={{
                                width: '100%',
                                height: '34px',
                                background: activeTab === 'classifications' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: isTablet ? '8px' : '12px',
                                color: activeTab === 'classifications' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: isTablet ? '10px' : '11px', 
                                fontWeight: activeTab === 'classifications' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Clasificaciones
                            </span>
                        </div>

                        {/* Subapartado 3: Marcas */}
                        <div 
                            onClick={() => handleTabSelect('brands')}
                            style={{
                                width: '100%',
                                height: '34px',
                                background: activeTab === 'brands' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: isTablet ? '8px' : '12px',
                                color: activeTab === 'brands' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: isTablet ? '10px' : '11px', 
                                fontWeight: activeTab === 'brands' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Marcas
                            </span>
                        </div>
                    </div>
                )}

                <div 
                    onClick={toggleCustomers}
                    style={getNavBtnStyle(activeTab === 'customers' || activeTab === 'birthdays' || activeTab === 'credits')}
                >
                    <Contact size={iconSize} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Clientes</span>}
                    {isExpanded && (isCustomersExpanded ? <ChevronUp size={isTablet ? 14 : 16} style={{ marginLeft: 'auto', color: '#64748b' }} /> : <ChevronDown size={isTablet ? 14 : 16} style={{ marginLeft: 'auto', color: '#64748b' }} />)}
                </div>
                
                {/* Subapartados de Clientes (Desplegables dinámicos y sin iconos) */}
                {isExpanded && isCustomersExpanded && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: 'none', marginLeft: isTablet ? '12px' : '26px', paddingLeft: isTablet ? '4px' : '8px', paddingRight: isTablet ? '8px' : '16px', boxSizing: 'border-box' }}>
                        {/* Subapartado 1: Clientes */}
                        <div 
                            onClick={() => handleTabSelect('customers')}
                            style={{
                                width: '100%',
                                height: '34px',
                                background: activeTab === 'customers' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: isTablet ? '8px' : '12px',
                                color: activeTab === 'customers' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: isTablet ? '10px' : '11px', 
                                fontWeight: activeTab === 'customers' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Clientes
                            </span>
                        </div>

                        {/* Subapartado 2: Cumpleaños */}
                        <div 
                            onClick={() => handleTabSelect('birthdays')}
                            style={{
                                width: '100%',
                                height: '34px',
                                background: activeTab === 'birthdays' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: isTablet ? '8px' : '12px',
                                color: activeTab === 'birthdays' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: isTablet ? '10px' : '11px', 
                                fontWeight: activeTab === 'birthdays' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Cumpleaños
                            </span>
                        </div>

                        {/* Subapartado 3: Créditos */}
                        <div 
                            onClick={() => handleTabSelect('credits')}
                            style={{
                                width: '100%',
                                height: '34px',
                                background: activeTab === 'credits' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: isTablet ? '8px' : '12px',
                                color: activeTab === 'credits' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: isTablet ? '10px' : '11px', 
                                fontWeight: activeTab === 'credits' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Créditos
                            </span>
                        </div>
                    </div>
                )}

                <div 
                    onClick={togglePurchases}
                    style={getNavBtnStyle(activeTab === 'purchases-ocm' || activeTab === 'purchases-gim' || activeTab === 'purchases-ccp')}
                >
                    <ShoppingBag size={iconSize} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Compras</span>}
                    {isExpanded && (isPurchasesExpanded ? <ChevronUp size={isTablet ? 14 : 16} style={{ marginLeft: 'auto', color: '#64748b' }} /> : <ChevronDown size={isTablet ? 14 : 16} style={{ marginLeft: 'auto', color: '#64748b' }} />)}
                </div>

                {isExpanded && isPurchasesExpanded && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: 'none', marginLeft: isTablet ? '12px' : '26px', paddingLeft: isTablet ? '4px' : '8px', paddingRight: isTablet ? '8px' : '16px', boxSizing: 'border-box' }}>
                        {/* Subapartado 1: Orden de Compra */}
                        <div 
                            onClick={() => handleTabSelect('purchases-ocm')}
                            style={{
                                width: '100%',
                                height: '34px',
                                background: activeTab === 'purchases-ocm' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: isTablet ? '8px' : '12px',
                                color: activeTab === 'purchases-ocm' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: isTablet ? '10px' : '11px', 
                                fontWeight: activeTab === 'purchases-ocm' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Orden de Compra
                            </span>
                        </div>

                        {/* Subapartado 2: Nota de Ingreso */}
                        <div 
                            onClick={() => handleTabSelect('purchases-gim')}
                            style={{
                                width: '100%',
                                height: '34px',
                                background: activeTab === 'purchases-gim' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: isTablet ? '8px' : '12px',
                                color: activeTab === 'purchases-gim' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: isTablet ? '10px' : '11px', 
                                fontWeight: activeTab === 'purchases-gim' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Nota de Ingreso
                            </span>
                        </div>

                        {/* Subapartado 3: Facturas / Boletas */}
                        <div 
                            onClick={() => handleTabSelect('purchases-ccp')}
                            style={{
                                width: '100%',
                                height: '34px',
                                background: activeTab === 'purchases-ccp' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: isTablet ? '8px' : '12px',
                                color: activeTab === 'purchases-ccp' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: isTablet ? '10px' : '11px', 
                                fontWeight: activeTab === 'purchases-ccp' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Facturas / Boletas
                            </span>
                        </div>
                    </div>
                )}

                <div 
                    onClick={() => handleTabSelect('suppliers')}
                    style={getNavBtnStyle(activeTab === 'suppliers')}
                    title={isExpanded ? "" : "Proveedores"}
                >
                    <Truck size={iconSize} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Proveedores</span>}
                </div>

                <div 
                    onClick={toggleFinance}
                    style={getNavBtnStyle(activeTab === 'expenses' || activeTab === 'general-cash')}
                >
                    <Banknote size={iconSize} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Finanzas</span>}
                    {isExpanded && (isFinanceExpanded ? <ChevronUp size={isTablet ? 14 : 16} style={{ marginLeft: 'auto', color: '#64748b' }} /> : <ChevronDown size={isTablet ? 14 : 16} style={{ marginLeft: 'auto', color: '#64748b' }} />)}
                </div>

                {/* Subapartados de Finanzas (Desplegables dinámicos y sin iconos) */}
                {isExpanded && isFinanceExpanded && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: 'none', marginLeft: isTablet ? '12px' : '26px', paddingLeft: isTablet ? '4px' : '8px', paddingRight: isTablet ? '8px' : '16px', boxSizing: 'border-box' }}>
                        {/* Subapartado 1: Egresos */}
                        <div 
                            onClick={() => handleTabSelect('expenses')}
                            style={{
                                width: '100%',
                                height: '34px',
                                background: activeTab === 'expenses' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: isTablet ? '8px' : '12px',
                                color: activeTab === 'expenses' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: isTablet ? '10px' : '11px', 
                                fontWeight: activeTab === 'expenses' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Egresos
                            </span>
                        </div>

                        {/* Subapartado 2: Caja General */}
                        <div 
                            onClick={() => handleTabSelect('general-cash')}
                            style={{
                                width: '100%',
                                height: '34px',
                                background: activeTab === 'general-cash' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: isTablet ? '8px' : '12px',
                                color: activeTab === 'general-cash' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: isTablet ? '10px' : '11px', 
                                fontWeight: activeTab === 'general-cash' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Caja General
                            </span>
                        </div>
                    </div>
                )}

                {/* CONFIGURACIÓN / MI CUENTA SECTION */}
                {isExpanded && (
                    <div style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', margin: isTablet ? '20px 8px 6px 8px' : '20px 12px 6px 12px', textTransform: 'uppercase', width: isTablet ? 'calc(100% - 16px)' : 'calc(100% - 24px)', textAlign: 'left' }}>
                        Mi Cuenta
                    </div>
                )}

                {/* Configuración (Expandible) */}
                <div 
                    onClick={toggleSettings}
                    style={getNavBtnStyle(activeTab === 'settings' || activeTab === 'whatsapp')}
                    title={isExpanded ? "" : "Configuración"}
                >
                    <Settings size={iconSize} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Configuración</span>}
                    {isExpanded && (isSettingsExpanded ? <ChevronUp size={isTablet ? 14 : 16} style={{ marginLeft: 'auto', color: '#64748b' }} /> : <ChevronDown size={isTablet ? 14 : 16} style={{ marginLeft: 'auto', color: '#64748b' }} />)}
                </div>

                {isExpanded && isSettingsExpanded && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: 'none', marginLeft: isTablet ? '12px' : '26px', paddingLeft: isTablet ? '4px' : '8px', paddingRight: isTablet ? '8px' : '16px', boxSizing: 'border-box' }}>
                        <div 
                            onClick={() => handleTabSelect('settings')}
                            style={{
                                width: '100%',
                                height: '34px',
                                background: activeTab === 'settings' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: isTablet ? '8px' : '12px',
                                color: activeTab === 'settings' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ fontSize: isTablet ? '10px' : '11px', fontWeight: activeTab === 'settings' ? 900 : 700, whiteSpace: 'nowrap' }}>Ajustes POS</span>
                        </div>
                        <div 
                            onClick={() => handleTabSelect('whatsapp')}
                            style={{
                                width: '100%',
                                height: '34px',
                                background: activeTab === 'whatsapp' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: isTablet ? '8px' : '12px',
                                color: activeTab === 'whatsapp' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ fontSize: isTablet ? '10px' : '11px', fontWeight: activeTab === 'whatsapp' ? 900 : 700, whiteSpace: 'nowrap' }}>Config WhatsApp</span>
                        </div>
                    </div>
                )}

                {supportsFullscreen && (
                    <button 
                        onClick={onToggleFullscreen} 
                        style={getNavBtnStyle(activeTab === 'fullscreen')}
                        title={isExpanded ? "" : (isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa")}
                    >
                        {isFullscreen ? <Minimize size={iconSize} style={{ flexShrink: 0 }} /> : <Maximize size={iconSize} style={{ flexShrink: 0 }} />}
                        {isExpanded && <span style={labelTextStyle}>{isFullscreen ? "Salir Completa" : "Pantalla Completa"}</span>}
                    </button>
                )}

                <button 
                    onClick={onOpenCloseCash} 
                    style={getNavBtnStyle(false)}
                    title={isExpanded ? "" : "Cerrar Caja"}
                >
                    <Lock size={iconSize} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Cerrar Caja</span>}
                </button>

                {/* Botón de Cerrar Sesión Estilo Cápsula */}
                <div style={{ marginTop: '20px', marginBottom: '16px', padding: isExpanded ? (isTablet ? '0 8px' : '0 12px') : '0', width: '100%', display: 'flex', justifyContent: 'center', boxSizing: 'border-box' }}>
                    <button 
                        onClick={onSignOut} 
                        title={isExpanded ? "" : "Cerrar Sesión"}
                        style={{
                            width: isExpanded ? '100%' : '40px',
                            height: '44px',
                            borderRadius: isExpanded ? '24px' : '10px',
                            border: 'none',
                            background: '#fee2e2',
                            color: '#ef4444',
                            fontWeight: 900,
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: isExpanded ? (isTablet ? '6px' : '8px') : '0',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 6px rgba(239, 68, 68, 0.05)'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = '#fef2f2';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = '#fee2e2';
                        }}
                    >
                        <LogOut size={isTablet ? 16 : 18} style={{ flexShrink: 0 }} />
                        {isExpanded && <span>Cerrar Sesión</span>}
                    </button>
                </div>
            </div>
        </aside>
    );
}
