'use client';
import { useState, useEffect } from 'react';
import { LayoutGrid, Zap, History, Settings, LogOut, Lock, Users, MessageCircle, Banknote, Maximize, Minimize, Contact, X, Tag, Package, TrendingUp, ShoppingBag, Truck, ChevronDown, ChevronUp } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function Sidebar({ 
    onSignOut, onOpenCloseCash, onOpenHistory, onOpenSettings, 
    onToggleFullscreen, isFullscreen, activeTab, setActiveTab,
    isMobileMode = false, onCloseMobileMenu 
}) {
    const { data: session } = useSession();
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
    const [supportsFullscreen, setSupportsFullscreen] = useState(false);

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
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'customers' || activeTab === 'birthdays' || activeTab === 'credits') {
            setIsCustomersExpanded(true);
        } else {
            setIsCustomersExpanded(false);
        }

        if (activeTab === 'expenses' || activeTab === 'general-cash') {
            setIsFinanceExpanded(true);
        } else {
            setIsFinanceExpanded(false);
        }

        if (activeTab === 'products' || activeTab === 'classifications' || activeTab === 'brands') {
            setIsProductsExpanded(true);
        } else {
            setIsProductsExpanded(false);
        }

        if (activeTab === 'purchases-ocm' || activeTab === 'purchases-gim' || activeTab === 'purchases-ccp') {
            setIsPurchasesExpanded(true);
        } else {
            setIsPurchasesExpanded(false);
        }
    }, [activeTab]);

    const asideStyle = {
        width: isExpanded ? '200px' : '56px',
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 0',
        gap: '4px',
        flexShrink: 0,
        zIndex: 40,
        transition: isMobileMode ? 'none' : 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isExpanded && !isMobileMode ? '4px 0 25px rgba(15, 23, 42, 0.08)' : 'none',
        overflow: 'hidden',
        height: isMobileMode ? '100%' : 'auto'
    };

    // Estilo del logo
    const logoContainerStyle = {
        width: isExpanded ? 'calc(100% - 16px)' : '32px',
        height: '32px',
        background: '#3b82f6',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isExpanded ? 'space-between' : 'center',
        padding: isExpanded ? '0 10px' : '0',
        marginBottom: '12px',
        gap: '8px',
        transition: 'all 0.2s ease-in-out',
    };

    const logoTextStyle = {
        color: '#fff',
        fontSize: '11px',
        fontWeight: 950,
        letterSpacing: '0.05em',
        opacity: isExpanded ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out',
        whiteSpace: 'nowrap',
    };

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
            padding: isExpanded ? '0 12px' : '0',
            color: isActive ? '#3b82f6' : '#475569',
            border: isActive ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
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
        fontSize: '11px',
        fontWeight: 800,
        opacity: isExpanded ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out',
        whiteSpace: 'nowrap',
        marginLeft: isExpanded ? '10px' : '0px',
    };

    if (isMobileMode) {
        const userName = session?.user?.name || "Syscom";
        const userEmail = session?.user?.email || "syscomecosistemadigital@gmail.com";
        const avatarLetter = userName.charAt(0).toUpperCase();

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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9', marginBottom: '12px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>Menú</span>
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
                                transition: 'all 0.2s'
                            }}
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Perfil del Usuario */}
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '12px', 
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                    borderRadius: '12px', 
                    padding: '12px', 
                    border: '1px solid #e2e8f0',
                    marginBottom: '16px',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#fff', 
                        fontWeight: 900, 
                        fontSize: '18px', 
                        boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)',
                        border: '2px solid #fff',
                        flexShrink: 0
                    }}>
                        {avatarLetter}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</span>
                        <span style={{ fontSize: '10px', color: '#64748b', wordBreak: 'break-all', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</span>
                    </div>
                </div>

                {/* NAVEGACIÓN SECTION */}
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', margin: '8px 4px 6px 4px', textTransform: 'uppercase' }}>
                    Navegación
                </div>

                {/* Punto de Venta */}
                <div 
                    onClick={() => setActiveTab('pos')}
                    style={getNavBtnStyle(activeTab === 'pos')}
                >
                    <LayoutGrid size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Punto de Venta</span>
                </div>

                {/* Dashboard */}
                <div 
                    onClick={() => setActiveTab('dashboard')}
                    style={getNavBtnStyle(activeTab === 'dashboard')}
                >
                    <TrendingUp size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Dashboard</span>
                </div>

                {/* Historial Ventas */}
                <div 
                    onClick={() => setActiveTab('sales')}
                    style={getNavBtnStyle(activeTab === 'sales')}
                >
                    <History size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Historial Ventas</span>
                </div>

                {/* Membresías */}
                <div 
                    onClick={() => setActiveTab('memberships')}
                    style={getNavBtnStyle(activeTab === 'memberships')}
                >
                    <Users size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Membresías</span>
                </div>

                {/* Promociones */}
                <div 
                    onClick={() => setActiveTab('promotions')}
                    style={getNavBtnStyle(activeTab === 'promotions')}
                >
                    <Tag size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Promociones</span>
                </div>

                {/* Productos (Expandible) */}
                <div 
                    onClick={() => setIsProductsExpanded(prev => !prev)}
                    style={getNavBtnStyle(activeTab === 'products' || activeTab === 'classifications' || activeTab === 'brands')}
                >
                    <Package size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Productos</span>
                    {isProductsExpanded ? <ChevronUp size={16} style={{ marginLeft: 'auto', color: '#64748b' }} /> : <ChevronDown size={16} style={{ marginLeft: 'auto', color: '#64748b' }} />}
                </div>

                {isProductsExpanded && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1.5px solid #e2e8f0', marginLeft: '26px', paddingLeft: '8px', boxSizing: 'border-box' }}>
                        <div onClick={() => setActiveTab('products')} style={{ width: '100%', height: '34px', background: activeTab === 'products' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'products' ? 800 : 600, color: activeTab === 'products' ? '#3b82f6' : '#64748b' }}>Catálogo</span>
                        </div>
                        <div onClick={() => setActiveTab('classifications')} style={{ width: '100%', height: '34px', background: activeTab === 'classifications' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'classifications' ? 800 : 600, color: activeTab === 'classifications' ? '#3b82f6' : '#64748b' }}>Clasificaciones</span>
                        </div>
                        <div onClick={() => setActiveTab('brands')} style={{ width: '100%', height: '34px', background: activeTab === 'brands' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'brands' ? 800 : 600, color: activeTab === 'brands' ? '#3b82f6' : '#64748b' }}>Marcas</span>
                        </div>
                    </div>
                )}

                {/* Clientes (Expandible) */}
                <div 
                    onClick={() => setIsCustomersExpanded(prev => !prev)}
                    style={getNavBtnStyle(activeTab === 'customers' || activeTab === 'birthdays' || activeTab === 'credits')}
                >
                    <Contact size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Clientes</span>
                    {isCustomersExpanded ? <ChevronUp size={16} style={{ marginLeft: 'auto', color: '#64748b' }} /> : <ChevronDown size={16} style={{ marginLeft: 'auto', color: '#64748b' }} />}
                </div>

                {isCustomersExpanded && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1.5px solid #e2e8f0', marginLeft: '26px', paddingLeft: '8px', boxSizing: 'border-box' }}>
                        <div onClick={() => setActiveTab('customers')} style={{ width: '100%', height: '34px', background: activeTab === 'customers' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'customers' ? 800 : 600, color: activeTab === 'customers' ? '#3b82f6' : '#64748b' }}>Gestión Clientes</span>
                        </div>
                        <div onClick={() => setActiveTab('birthdays')} style={{ width: '100%', height: '34px', background: activeTab === 'birthdays' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'birthdays' ? 800 : 600, color: activeTab === 'birthdays' ? '#3b82f6' : '#64748b' }}>Cumpleaños</span>
                        </div>
                        <div onClick={() => setActiveTab('credits')} style={{ width: '100%', height: '34px', background: activeTab === 'credits' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'credits' ? 800 : 600, color: activeTab === 'credits' ? '#3b82f6' : '#64748b' }}>Créditos</span>
                        </div>
                    </div>
                )}

                {/* Compras (Expandible) */}
                <div 
                    onClick={() => setIsPurchasesExpanded(prev => !prev)}
                    style={getNavBtnStyle(activeTab === 'purchases-ocm' || activeTab === 'purchases-gim' || activeTab === 'purchases-ccp')}
                >
                    <ShoppingBag size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Compras</span>
                    {isPurchasesExpanded ? <ChevronUp size={16} style={{ marginLeft: 'auto', color: '#64748b' }} /> : <ChevronDown size={16} style={{ marginLeft: 'auto', color: '#64748b' }} />}
                </div>

                {isPurchasesExpanded && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1.5px solid #e2e8f0', marginLeft: '26px', paddingLeft: '8px', boxSizing: 'border-box' }}>
                        <div onClick={() => setActiveTab('purchases-ocm')} style={{ width: '100%', height: '34px', background: activeTab === 'purchases-ocm' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'purchases-ocm' ? 800 : 600, color: activeTab === 'purchases-ocm' ? '#3b82f6' : '#64748b' }}>Orden de Compra</span>
                        </div>
                        <div onClick={() => setActiveTab('purchases-gim')} style={{ width: '100%', height: '34px', background: activeTab === 'purchases-gim' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'purchases-gim' ? 800 : 600, color: activeTab === 'purchases-gim' ? '#3b82f6' : '#64748b' }}>Ingreso Almacén (GIM)</span>
                        </div>
                        <div onClick={() => setActiveTab('purchases-ccp')} style={{ width: '100%', height: '34px', background: activeTab === 'purchases-ccp' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'purchases-ccp' ? 800 : 600, color: activeTab === 'purchases-ccp' ? '#3b82f6' : '#64748b' }}>Factura/Boletas</span>
                        </div>
                    </div>
                )}

                {/* Proveedores */}
                <div 
                    onClick={() => setActiveTab('suppliers')}
                    style={getNavBtnStyle(activeTab === 'suppliers')}
                >
                    <Truck size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Proveedores</span>
                </div>

                {/* Finanzas (Expandible) */}
                <div 
                    onClick={() => setIsFinanceExpanded(prev => !prev)}
                    style={getNavBtnStyle(activeTab === 'expenses' || activeTab === 'general-cash')}
                >
                    <Banknote size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Finanzas</span>
                    {isFinanceExpanded ? <ChevronUp size={16} style={{ marginLeft: 'auto', color: '#64748b' }} /> : <ChevronDown size={16} style={{ marginLeft: 'auto', color: '#64748b' }} />}
                </div>

                {isFinanceExpanded && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1.5px solid #e2e8f0', marginLeft: '26px', paddingLeft: '8px', boxSizing: 'border-box' }}>
                        <div onClick={() => setActiveTab('expenses')} style={{ width: '100%', height: '34px', background: activeTab === 'expenses' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'expenses' ? 800 : 600, color: activeTab === 'expenses' ? '#3b82f6' : '#64748b' }}>Egresos / Gastos</span>
                        </div>
                        <div onClick={() => setActiveTab('general-cash')} style={{ width: '100%', height: '34px', background: activeTab === 'general-cash' ? 'rgba(59,130,246,0.06)' : 'transparent', borderRadius: '6px', display: 'flex', alignItems: 'center', paddingLeft: '12px', cursor: 'pointer', transition: 'all 0.2s' }}>
                            <span style={{ fontSize: '11px', fontWeight: activeTab === 'general-cash' ? 800 : 600, color: activeTab === 'general-cash' ? '#3b82f6' : '#64748b' }}>Caja General</span>
                        </div>
                    </div>
                )}

                {/* CONFIGURACIÓN / MI CUENTA SECTION */}
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em', margin: '20px 4px 6px 4px', textTransform: 'uppercase' }}>
                    Mi Cuenta
                </div>

                {/* Config WhatsApp */}
                <div 
                    onClick={() => setActiveTab('whatsapp')}
                    style={getNavBtnStyle(activeTab === 'whatsapp')}
                >
                    <MessageCircle size={22} style={{ flexShrink: 0 }} />
                    <span style={labelTextStyle}>Config WhatsApp</span>
                </div>

                {/* Historial (Modal) */}
                <button 
                    onClick={onOpenHistory} 
                    style={{
                        ...getBottomBtnStyle(),
                        width: '100%',
                        height: '40px',
                        borderRadius: '10px',
                        padding: '0 12px',
                        gap: '12px',
                        color: activeTab === 'history' ? '#3b82f6' : '#475569',
                        fontSize: '11px',
                        fontWeight: 800
                    }}
                >
                    <History size={22} style={{ flexShrink: 0 }} />
                    <span>Historial Ventas</span>
                </button>

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

                {/* Ajustes */}
                <button 
                    onClick={onOpenSettings} 
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
                    <Settings size={22} style={{ flexShrink: 0 }} />
                    <span>Ajustes POS</span>
                </button>

                {/* Botón de Cerrar Sesión Estilo Cápsula */}
                <div style={{ marginTop: '24px', marginBottom: '16px', padding: '0 4px', width: '100%', boxSizing: 'border-box' }}>
                    <button 
                        onClick={onSignOut} 
                        style={{
                            width: '100%',
                            height: '44px',
                            borderRadius: '24px',
                            border: '1.5px solid #fca5a5',
                            background: '#ffffff',
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
            onMouseEnter={() => !isMobileMode && setIsExpandedInternal(true)}
            onMouseLeave={() => !isMobileMode && setIsExpandedInternal(false)}
            style={asideStyle}
        >
            {/* Logo */}
            <div style={logoContainerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'flex-start' : 'center', width: isExpanded ? 'auto' : '100%', gap: '8px', overflow: 'hidden' }}>
                    <Zap size={18} style={{ color: '#fff', fill: '#fff', flexShrink: 0 }} />
                    {isExpanded && <span style={logoTextStyle}>SYSCOM POS</span>}
                </div>
                {isMobileMode && onCloseMobileMenu && (
                    <button 
                        onClick={onCloseMobileMenu}
                        style={{ border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Acciones principales - Menu Limpio */}
            <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div 
                    onClick={() => setActiveTab('pos')}
                    style={getNavBtnStyle(activeTab === 'pos')}
                    title={isExpanded ? "" : "Punto de Venta"}
                >
                    <LayoutGrid size={22} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Punto de Venta</span>}
                </div>
                
                <div 
                    onClick={() => setActiveTab('dashboard')}
                    style={getNavBtnStyle(activeTab === 'dashboard')}
                    title={isExpanded ? "" : "Dashboard"}
                >
                    <TrendingUp size={22} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Dashboard</span>}
                </div>
                
                <div 
                    onClick={() => setActiveTab('sales')}
                    style={getNavBtnStyle(activeTab === 'sales')}
                    title={isExpanded ? "" : "Historial de Ventas"}
                >
                    <History size={22} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Historial Ventas</span>}
                </div>
                
                <div 
                    onClick={() => setActiveTab('memberships')}
                    style={getNavBtnStyle(activeTab === 'memberships')}
                    title={isExpanded ? "" : "Gestión de Membresías"}
                >
                    <Users size={22} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Membresías</span>}
                </div>

                <div 
                    onClick={() => setActiveTab('promotions')}
                    style={getNavBtnStyle(activeTab === 'promotions')}
                    title={isExpanded ? "" : "Promociones"}
                >
                    <Tag size={22} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Promociones</span>}
                </div>

                <div 
                    onClick={() => setIsProductsExpanded(prev => !prev)}
                    style={getNavBtnStyle(activeTab === 'products' || activeTab === 'classifications' || activeTab === 'brands')}
                    title={isExpanded ? "" : "Productos"}
                >
                    <Package size={22} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Productos</span>}
                </div>

                {isExpanded && isProductsExpanded && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                        {/* Subapartado 1: Catálogo */}
                        <div 
                            onClick={() => setActiveTab('products')}
                            style={{
                                width: 'calc(100% - 16px)',
                                height: '34px',
                                background: activeTab === 'products' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: '36px',
                                color: activeTab === 'products' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: '11px', 
                                fontWeight: activeTab === 'products' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Catálogo
                            </span>
                        </div>

                        {/* Subapartado 2: Clasificaciones */}
                        <div 
                            onClick={() => setActiveTab('classifications')}
                            style={{
                                width: 'calc(100% - 16px)',
                                height: '34px',
                                background: activeTab === 'classifications' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: '36px',
                                color: activeTab === 'classifications' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: '11px', 
                                fontWeight: activeTab === 'classifications' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Clasificaciones
                            </span>
                        </div>

                        {/* Subapartado 3: Marcas */}
                        <div 
                            onClick={() => setActiveTab('brands')}
                            style={{
                                width: 'calc(100% - 16px)',
                                height: '34px',
                                background: activeTab === 'brands' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: '36px',
                                color: activeTab === 'brands' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: '11px', 
                                fontWeight: activeTab === 'brands' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Marcas
                            </span>
                        </div>
                    </div>
                )}

                <div 
                    onClick={() => setActiveTab('customers')}
                    style={getNavBtnStyle(activeTab === 'customers' || activeTab === 'birthdays' || activeTab === 'credits')}
                    title={isExpanded ? "" : "Clientes"}
                >
                    <Contact size={22} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Clientes</span>}
                </div>
                
                {/* Subapartados de Clientes (Desplegables dinámicos y sin iconos) */}
                {isExpanded && isCustomersExpanded && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                        {/* Subapartado 1: Clientes */}
                        <div 
                            onClick={() => setActiveTab('customers')}
                            style={{
                                width: 'calc(100% - 16px)',
                                height: '34px',
                                background: activeTab === 'customers' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: '36px',
                                color: activeTab === 'customers' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: '11px', 
                                fontWeight: activeTab === 'customers' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Clientes
                            </span>
                        </div>

                        {/* Subapartado 2: Cumpleaños */}
                        <div 
                            onClick={() => setActiveTab('birthdays')}
                            style={{
                                width: 'calc(100% - 16px)',
                                height: '34px',
                                background: activeTab === 'birthdays' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: '36px',
                                color: activeTab === 'birthdays' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: '11px', 
                                fontWeight: activeTab === 'birthdays' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Cumpleaños
                            </span>
                        </div>

                        {/* Subapartado 3: Créditos */}
                        <div 
                            onClick={() => setActiveTab('credits')}
                            style={{
                                width: 'calc(100% - 16px)',
                                height: '34px',
                                background: activeTab === 'credits' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: '36px',
                                color: activeTab === 'credits' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: '11px', 
                                fontWeight: activeTab === 'credits' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Créditos
                            </span>
                        </div>
                    </div>
                )}

                <div 
                    onClick={() => setIsPurchasesExpanded(prev => !prev)}
                    style={getNavBtnStyle(activeTab === 'purchases-ocm' || activeTab === 'purchases-gim' || activeTab === 'purchases-ccp')}
                    title={isExpanded ? "" : "Compras"}
                >
                    <ShoppingBag size={22} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Compras</span>}
                </div>

                {isExpanded && isPurchasesExpanded && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                        {/* Subapartado 1: Orden de Compra */}
                        <div 
                            onClick={() => setActiveTab('purchases-ocm')}
                            style={{
                                width: 'calc(100% - 16px)',
                                height: '34px',
                                background: activeTab === 'purchases-ocm' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: '36px',
                                color: activeTab === 'purchases-ocm' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: '11px', 
                                fontWeight: activeTab === 'purchases-ocm' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Orden de Compra
                            </span>
                        </div>

                        {/* Subapartado 2: Nota de Ingreso */}
                        <div 
                            onClick={() => setActiveTab('purchases-gim')}
                            style={{
                                width: 'calc(100% - 16px)',
                                height: '34px',
                                background: activeTab === 'purchases-gim' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: '36px',
                                color: activeTab === 'purchases-gim' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: '11px', 
                                fontWeight: activeTab === 'purchases-gim' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Nota de Ingreso
                            </span>
                        </div>

                        {/* Subapartado 3: Facturas / Boletas */}
                        <div 
                            onClick={() => setActiveTab('purchases-ccp')}
                            style={{
                                width: 'calc(100% - 16px)',
                                height: '34px',
                                background: activeTab === 'purchases-ccp' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: '36px',
                                color: activeTab === 'purchases-ccp' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: '11px', 
                                fontWeight: activeTab === 'purchases-ccp' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Facturas / Boletas
                            </span>
                        </div>
                    </div>
                )}

                <div 
                    onClick={() => setActiveTab('suppliers')}
                    style={getNavBtnStyle(activeTab === 'suppliers')}
                    title={isExpanded ? "" : "Proveedores"}
                >
                    <Truck size={22} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Proveedores</span>}
                </div>

                <div 
                    onClick={() => setIsFinanceExpanded(prev => !prev)}
                    style={getNavBtnStyle(activeTab === 'expenses' || activeTab === 'general-cash')}
                    title={isExpanded ? "" : "Finanzas"}
                >
                    <Banknote size={22} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Finanzas</span>}
                </div>

                {/* Subapartados de Finanzas (Desplegables dinámicos y sin iconos) */}
                {isExpanded && isFinanceExpanded && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                        {/* Subapartado 1: Egresos */}
                        <div 
                            onClick={() => setActiveTab('expenses')}
                            style={{
                                width: 'calc(100% - 16px)',
                                height: '34px',
                                background: activeTab === 'expenses' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: '36px',
                                color: activeTab === 'expenses' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: '11px', 
                                fontWeight: activeTab === 'expenses' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Egresos
                            </span>
                        </div>

                        {/* Subapartado 2: Caja General */}
                        <div 
                            onClick={() => setActiveTab('general-cash')}
                            style={{
                                width: 'calc(100% - 16px)',
                                height: '34px',
                                background: activeTab === 'general-cash' ? 'rgba(59,130,246,0.1)' : 'transparent',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingLeft: '36px',
                                color: activeTab === 'general-cash' ? '#3b82f6' : '#64748b',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                marginTop: '-2px',
                                marginBottom: '2px'
                            }}
                        >
                            <span style={{ 
                                fontSize: '11px', 
                                fontWeight: activeTab === 'general-cash' ? 900 : 700, 
                                whiteSpace: 'nowrap' 
                            }}>
                                Caja General
                            </span>
                        </div>
                    </div>
                )}

                <div 
                    onClick={() => setActiveTab('whatsapp')}
                    style={getNavBtnStyle(activeTab === 'whatsapp')}
                    title={isExpanded ? "" : "Configuración de WhatsApp"}
                >
                    <MessageCircle size={22} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Config WhatsApp</span>}
                </div>
            </div>

            {/* Bottom icons */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                {supportsFullscreen && (
                    <button 
                        onClick={onToggleFullscreen} 
                        title={isExpanded ? "" : (isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa")} 
                        style={{ 
                            ...getBottomBtnStyle(isFullscreen ? '#3b82f6' : '#475569'), 
                            background: isFullscreen ? '#eff6ff' : 'transparent' 
                        }}
                    >
                        {isFullscreen ? <Minimize size={18} style={{ flexShrink: 0 }} /> : <Maximize size={18} style={{ flexShrink: 0 }} />}
                        {isExpanded && <span style={labelTextStyle}>{isFullscreen ? "Salir Completa" : "Pantalla Completa"}</span>}
                    </button>
                )}
                <button onClick={onOpenHistory} title={isExpanded ? "" : "Historial de Ventas"} style={getBottomBtnStyle()}>
                    <History size={18} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Historial</span>}
                </button>
                <button onClick={onOpenCloseCash} title={isExpanded ? "" : "Cerrar Caja"} style={getBottomBtnStyle()}>
                    <Lock size={18} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Cerrar Caja</span>}
                </button>
                <button onClick={onOpenSettings} title={isExpanded ? "" : "Ajustes"} style={getBottomBtnStyle()}>
                    <Settings size={18} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Ajustes</span>}
                </button>
                <button onClick={onSignOut} title={isExpanded ? "" : "Salir"} style={getBottomBtnStyle('#f87171')}>
                    <LogOut size={18} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Cerrar Sesión</span>}
                </button>
            </div>
        </aside>
    );
}
