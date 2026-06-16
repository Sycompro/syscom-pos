import { LayoutGrid, ShoppingBag, Zap, Sparkles, History, Settings, LogOut, Lock, Users, MessageCircle, Banknote, Maximize, Minimize } from 'lucide-react';

export default function Sidebar({ onSignOut, onOpenCloseCash, onOpenHistory, onOpenSettings, onToggleFullscreen, isFullscreen, activeTab, setActiveTab }) {
    return (
        <aside style={{
            width: '56px',
            background: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '12px 0',
            gap: '4px',
            flexShrink: 0,
            zIndex: 40,
        }}>
            {/* Logo */}
            <div style={{
                width: '32px', height: '32px', background: '#3b82f6', borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px',
            }}>
                <Zap size={15} style={{ color: '#fff', fill: '#fff' }} />
            </div>

            {/* Acciones principales - Menu Limpio */}
            <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div 
                    onClick={() => setActiveTab('pos')}
                    style={activeTab === 'pos' ? activeIconStyle : inactiveIconStyle}
                    title="Punto de Venta"
                >
                    <LayoutGrid size={18} />
                </div>
                
                <div 
                    onClick={() => setActiveTab('memberships')}
                    style={activeTab === 'memberships' ? activeIconStyle : inactiveIconStyle}
                    title="Gestión de Membresías"
                >
                    <Users size={18} />
                </div>

                <div 
                    onClick={() => setActiveTab('whatsapp')}
                    style={activeTab === 'whatsapp' ? activeIconStyle : inactiveIconStyle}
                    title="Configuración de WhatsApp"
                >
                    <MessageCircle size={18} />
                </div>
            </div>

            {/* Bottom icons */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                <button 
                    onClick={onToggleFullscreen} 
                    title={isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"} 
                    style={{ ...bottomBtnStyle, color: isFullscreen ? '#3b82f6' : '#475569', background: isFullscreen ? '#eff6ff' : 'transparent' }}
                >
                    {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
                </button>
                <button onClick={onOpenHistory} title="Historial de Ventas" style={bottomBtnStyle}><History size={15} /></button>
                <button onClick={() => setActiveTab('expenses')} title="Registrar Gasto" style={bottomBtnStyle}><Banknote size={15} /></button>
                <button onClick={onOpenCloseCash} title="Cerrar Caja" style={bottomBtnStyle}><Lock size={15} /></button>
                <button onClick={onOpenSettings} title="Ajustes" style={bottomBtnStyle}><Settings size={15} /></button>
                <button onClick={onSignOut} title="Salir" style={{ ...bottomBtnStyle, color: '#f87171' }}>
                    <LogOut size={15} />
                </button>
            </div>
        </aside>
    );
}

const bottomBtnStyle = {
    width: '30px', height: '30px', borderRadius: '8px',
    background: 'transparent', border: 'none', color: '#475569',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
};

const activeIconStyle = { 
    width: '40px', height: '40px', 
    background: 'rgba(59,130,246,0.15)', 
    borderRadius: '10px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    color: '#3b82f6', 
    border: '1px solid rgba(59,130,246,0.2)',
    cursor: 'pointer'
};

const inactiveIconStyle = {
    width: '40px', height: '40px',
    background: 'transparent',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
};
