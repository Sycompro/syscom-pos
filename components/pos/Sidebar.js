'use client';
import { useState } from 'react';
import { LayoutGrid, Zap, History, Settings, LogOut, Lock, Users, MessageCircle, Banknote, Maximize, Minimize } from 'lucide-react';

export default function Sidebar({ onSignOut, onOpenCloseCash, onOpenHistory, onOpenSettings, onToggleFullscreen, isFullscreen, activeTab, setActiveTab }) {
    const [isExpanded, setIsExpanded] = useState(false);

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
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isExpanded ? '4px 0 25px rgba(15, 23, 42, 0.08)' : 'none',
        overflow: 'hidden',
    };

    // Estilo del logo
    const logoContainerStyle = {
        width: isExpanded ? 'calc(100% - 16px)' : '32px',
        height: '32px',
        background: '#3b82f6',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isExpanded ? 'flex-start' : 'center',
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

    return (
        <aside 
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
            style={asideStyle}
        >
            {/* Logo */}
            <div style={logoContainerStyle}>
                <Zap size={15} style={{ color: '#fff', fill: '#fff', flexShrink: 0 }} />
                {isExpanded && <span style={logoTextStyle}>SYSCOM POS</span>}
            </div>

            {/* Acciones principales - Menu Limpio */}
            <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div 
                    onClick={() => setActiveTab('pos')}
                    style={getNavBtnStyle(activeTab === 'pos')}
                    title={isExpanded ? "" : "Punto de Venta"}
                >
                    <LayoutGrid size={18} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Punto de Venta</span>}
                </div>
                
                <div 
                    onClick={() => setActiveTab('memberships')}
                    style={getNavBtnStyle(activeTab === 'memberships')}
                    title={isExpanded ? "" : "Gestión de Membresías"}
                >
                    <Users size={18} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Membresías</span>}
                </div>

                <div 
                    onClick={() => setActiveTab('whatsapp')}
                    style={getNavBtnStyle(activeTab === 'whatsapp')}
                    title={isExpanded ? "" : "Configuración de WhatsApp"}
                >
                    <MessageCircle size={18} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Config WhatsApp</span>}
                </div>
            </div>

            {/* Bottom icons */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                <button 
                    onClick={onToggleFullscreen} 
                    title={isExpanded ? "" : (isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa")} 
                    style={{ 
                        ...getBottomBtnStyle(isFullscreen ? '#3b82f6' : '#475569'), 
                        background: isFullscreen ? '#eff6ff' : 'transparent' 
                    }}
                >
                    {isFullscreen ? <Minimize size={15} style={{ flexShrink: 0 }} /> : <Maximize size={15} style={{ flexShrink: 0 }} />}
                    {isExpanded && <span style={labelTextStyle}>{isFullscreen ? "Salir Completa" : "Pantalla Completa"}</span>}
                </button>
                <button onClick={onOpenHistory} title={isExpanded ? "" : "Historial de Ventas"} style={getBottomBtnStyle()}>
                    <History size={15} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Historial</span>}
                </button>
                <button onClick={() => setActiveTab('expenses')} title={isExpanded ? "" : "Registrar Gasto"} style={getBottomBtnStyle()}>
                    <Banknote size={15} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Registrar Gasto</span>}
                </button>
                <button onClick={onOpenCloseCash} title={isExpanded ? "" : "Cerrar Caja"} style={getBottomBtnStyle()}>
                    <Lock size={15} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Cerrar Caja</span>}
                </button>
                <button onClick={onOpenSettings} title={isExpanded ? "" : "Ajustes"} style={getBottomBtnStyle()}>
                    <Settings size={15} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Ajustes</span>}
                </button>
                <button onClick={onSignOut} title={isExpanded ? "" : "Salir"} style={getBottomBtnStyle('#f87171')}>
                    <LogOut size={15} style={{ flexShrink: 0 }} />
                    {isExpanded && <span style={labelTextStyle}>Cerrar Sesión</span>}
                </button>
            </div>
        </aside>
    );
}
