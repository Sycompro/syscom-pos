'use client';
 
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Store, Check, Info, UploadCloud, Loader2, Keyboard, Palette, Briefcase, Settings, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
 
export default function SettingsView({ db, onSaved }) {
    const [businessType, setBusinessType] = useState('gym'); // 'gym' o 'universal'
    const [posLogo, setPosLogo] = useState('');
    const [customName, setCustomName] = useState('');
    const [useCustomName, setUseCustomName] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [whatsappUrl, setWhatsappUrl] = useState('');
    const [whatsappToken, setWhatsappToken] = useState('');
    const [useScreenKeyboards, setUseScreenKeyboards] = useState(true);
    const [currentTab, setCurrentTab] = useState('business'); // 'business' | 'interface' | 'brand'
 
    const getTabButtonStyle = (tabName) => {
        const isActive = currentTab === tabName;
        return {
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: isActive ? 850 : 650,
            color: isActive ? '#3b82f6' : '#64748b',
            background: isActive ? '#ffffff' : 'transparent',
            border: 'none',
            boxShadow: isActive ? '0 4px 10px rgba(15, 23, 42, 0.05)' : 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out'
        };
    };
 
    const availableLogos = [
        { id: 'logocia01.jpg', name: 'Logo Empresa 01' },
        { id: 'logocia02.jpg', name: 'Logo Empresa 02' },
        { id: 'logocia03.jpg', name: 'Logo Empresa 03' },
    ];
 
    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/company/settings');
                const data = await res.json();
                if (data.company) {
                    setCustomName(data.company.customName || '');
                    setUseCustomName(data.company.useCustomName || false);
                    setPosLogo(data.company.logo || '');
                    setBusinessType(data.company.businessType || 'gym');
                    if (data.whatsapp) {
                        setWhatsappUrl(data.whatsapp.url || '');
                        setWhatsappToken(data.whatsapp.token || '');
                    }
                }
            } catch (e) {
                console.error("Error al cargar configuraciones:", e);
            } finally {
                setLoading(false);
            }
        };
 
        // Cargar preferencia de teclado desde localStorage (per-device)
        const savedKbd = localStorage.getItem('pos_use_screen_keyboards');
        if (savedKbd !== null) {
            setUseScreenKeyboards(savedKbd === 'true');
        }
 
        fetchSettings();
    }, [db]);
 
    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 500 * 1024) {
            alert('El archivo es muy pesado. Por favor sube una imagen de menos de 500KB.');
            return;
        }
 
        const reader = new FileReader();
        reader.onloadend = () => {
            setPosLogo(reader.result);
        };
        reader.readAsDataURL(file);
    };
 
    const handleSave = async () => {
        try {
            // Guardar todo en SQL Server a través del API
            await fetch('/api/company/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    customName, 
                    useCustomName,
                    companyLogoUrl: posLogo,
                    businessType,
                    whatsappUrl,
                    whatsappToken
                })
            });
 
            // Guardar preferencia de teclado localmente
            localStorage.setItem('pos_use_screen_keyboards', useScreenKeyboards);
 
            if (onSaved) onSaved();
            setSaved(true);
            setTimeout(() => {
                setSaved(false);
            }, 2000);
        } catch (e) {
            alert("Error al guardar la configuración");
        }
    };
 
    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', width: '100%', minHeight: '100vh', boxSizing: 'border-box' }}>
            {/* Cabecera superior integrada */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                        <Settings size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Configuración del POS</h1>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>Ajusta el comportamiento general y la identidad visual de tu sistema</p>
                    </div>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={loading} 
                    style={{
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 24px',
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: 'pointer',
                        boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                    }}
                >
                    {loading ? (
                        <Loader2 className="animate-spin" size={16} />
                    ) : (
                        <Save size={16} />
                    )}
                    <span>{saved ? '¡Configuración Guardada!' : 'Guardar Ajustes'}</span>
                </button>
            </div>
 
            {/* Contenido principal en Tarjeta Premium */}
            <div style={{
                background: '#ffffff',
                borderRadius: '24px',
                padding: '32px',
                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.03), 0 8px 10px -6px rgba(15, 23, 42, 0.03)',
                border: '1px solid #f1f5f9'
            }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0' }}>
                        <Loader2 className="animate-spin" size={40} color="#3b82f6" />
                        <p style={{ marginTop: '16px', fontSize: '14px', fontWeight: 700, color: '#64748b' }}>Cargando configuraciones...</p>
                    </div>
                ) : (
                    <>
                        {/* Selector de Pestañas */}
                        <div style={tabsContainerStyle}>
                            <button 
                                type="button"
                                onClick={() => setCurrentTab('business')} 
                                style={getTabButtonStyle('business')}
                            >
                                <Briefcase size={16} />
                                <span>Rubro y Negocio</span>
                            </button>
                            <button 
                                type="button"
                                onClick={() => setCurrentTab('interface')} 
                                style={getTabButtonStyle('interface')}
                            >
                                <Keyboard size={16} />
                                <span>Interfaz</span>
                            </button>
                            <button 
                                type="button"
                                onClick={() => setCurrentTab('brand')} 
                                style={getTabButtonStyle('brand')}
                            >
                                <Palette size={16} />
                                <span>Marca y Logo</span>
                            </button>
                        </div>
 
                        {/* Contenido de la Pestaña */}
                        <div style={{ minHeight: '300px', marginTop: '12px' }}>
                            <AnimatePresence mode="wait">
                                {currentTab === 'business' && (
                                    <motion.div
                                        key="business"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <label style={labelStyle}>RUBRO DEL NEGOCIO</label>
                                        <p style={infoTextStyle}>
                                            <Info size={14} /> Determina las reglas de negocio y las alertas específicas que se envían por WhatsApp.
                                        </p>
 
                                        <div style={gridStyle}>
                                            <div 
                                                onClick={() => setBusinessType('gym')}
                                                style={{
                                                    ...optionCardStyle,
                                                    borderColor: businessType === 'gym' ? '#3b82f6' : '#f1f5f9',
                                                    background: businessType === 'gym' ? '#eff6ff' : '#f8fafc'
                                                }}
                                            >
                                                <div style={{ ...iconWrapperStyle, background: businessType === 'gym' ? '#3b82f6' : '#e2e8f0', color: businessType === 'gym' ? '#fff' : '#64748b' }}>
                                                    <Dumbbell size={24} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={optionTitleStyle}>Gimnasio / Fit</h3>
                                                    <p style={optionDescStyle}>Habilita el control de vigencia, días de membresía y alertas automáticas de vencimiento en mensajes.</p>
                                                </div>
                                                {businessType === 'gym' && <div style={checkCircleStyle}><Check size={14} /></div>}
                                            </div>
 
                                            <div 
                                                onClick={() => setBusinessType('universal')}
                                                style={{
                                                    ...optionCardStyle,
                                                    borderColor: businessType === 'universal' ? '#3b82f6' : '#f1f5f9',
                                                    background: businessType === 'universal' ? '#eff6ff' : '#f8fafc'
                                                }}
                                            >
                                                <div style={{ ...iconWrapperStyle, background: businessType === 'universal' ? '#3b82f6' : '#e2e8f0', color: businessType === 'universal' ? '#fff' : '#64748b' }}>
                                                    <Store size={24} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={optionTitleStyle}>Universal / Comercial</h3>
                                                    <p style={optionDescStyle}>Mensajes estándar de agradecimiento de compra sin gestión ni vigencia de membresías.</p>
                                                </div>
                                                {businessType === 'universal' && <div style={checkCircleStyle}><Check size={14} /></div>}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
 
                                {currentTab === 'interface' && (
                                    <motion.div
                                        key="interface"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <label style={labelStyle}>INTERFAZ Y TECLADO</label>
                                        <p style={infoTextStyle}>
                                            <Info size={14} /> Activa o desactiva los teclados virtuales en pantalla para la aplicación.
                                        </p>
 
                                        <div style={{ 
                                            background: '#f8fafc', padding: '24px', borderRadius: '20px', 
                                            border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' 
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>
                                                        Usar Teclados en Pantalla
                                                    </h4>
                                                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                                                        Ideal para pantallas táctiles y tablets. Desactívalo si utilizas una computadora con teclado físico.
                                                    </p>
                                                </div>
                                                <div 
                                                    onClick={() => setUseScreenKeyboards(!useScreenKeyboards)}
                                                    style={{
                                                        width: '52px', height: '28px', borderRadius: '24px',
                                                        background: useScreenKeyboards ? '#3b82f6' : '#cbd5e1',
                                                        padding: '4px', cursor: 'pointer', transition: 'all 0.3s ease',
                                                        display: 'flex', alignItems: 'center',
                                                        justifyContent: useScreenKeyboards ? 'flex-end' : 'flex-start',
                                                        boxSizing: 'border-box'
                                                    }}
                                                >
                                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
 
                                {currentTab === 'brand' && (
                                    <motion.div
                                        key="brand"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <label style={labelStyle}>IDENTIDAD DE MARCA</label>
                                        <p style={infoTextStyle}>
                                            <Info size={14} /> Personaliza el nombre comercial y logotipo de los comprobantes impresos y en PDF.
                                        </p>
 
                                        <div style={{ 
                                            background: '#f8fafc', padding: '24px', borderRadius: '20px', 
                                            border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px',
                                            marginBottom: '24px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1e293b' }}>
                                                        Usar Nombre Personalizado
                                                    </h4>
                                                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                                                        Activa esta opción para definir un nombre comercial personalizado en lugar del nombre legal del RUC.
                                                    </p>
                                                </div>
                                                <div 
                                                    onClick={() => setUseCustomName(!useCustomName)}
                                                    style={{
                                                        width: '52px', height: '28px', borderRadius: '24px',
                                                        background: useCustomName ? '#10b981' : '#cbd5e1',
                                                        padding: '4px', cursor: 'pointer', transition: 'all 0.3s ease',
                                                        display: 'flex', alignItems: 'center',
                                                        justifyContent: useCustomName ? 'flex-end' : 'flex-start',
                                                        boxSizing: 'border-box'
                                                    }}
                                                >
                                                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                                                </div>
                                            </div>
 
                                            <AnimatePresence>
                                                {useCustomName && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        style={{ overflow: 'hidden' }}
                                                    >
                                                        <input 
                                                            type="text"
                                                            placeholder="Escribe el nombre comercial de tu negocio aquí..."
                                                            value={customName}
                                                            onChange={(e) => setCustomName(e.target.value)}
                                                            style={{
                                                                width: '100%', padding: '14px 18px', borderRadius: '12px',
                                                                border: '2px solid #3b82f6', outline: 'none',
                                                                fontSize: '14px', fontWeight: 600, color: '#1e293b',
                                                                boxSizing: 'border-box', marginTop: '12px'
                                                            }}
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
 
                                        <label style={labelStyle}>LOGO DE COMPROBANTE</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px', marginTop: '8px' }}>
                                            {/* Botón de Subir Personalizado */}
                                            <label style={{
                                                padding: '16px', border: '2px dashed #cbd5e1', borderRadius: '20px',
                                                cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                                                background: '#f8fafc', display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', justifyContent: 'center', minHeight: '100px',
                                                boxSizing: 'border-box'
                                            }}>
                                                <input 
                                                    type="file" 
                                                    accept="image/png, image/jpeg" 
                                                    onChange={handleLogoUpload} 
                                                    style={{ display: 'none' }} 
                                                />
                                                <UploadCloud size={28} style={{ color: '#94a3b8', marginBottom: '8px' }} />
                                                <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b' }}>Subir Logo</span>
                                            </label>
 
                                            {/* Mostrar logo personalizado si está en base64 */}
                                            {posLogo && posLogo.startsWith('data:image') && (
                                                <div style={{
                                                    padding: '16px', border: '2px solid', borderRadius: '20px',
                                                    cursor: 'pointer', textAlign: 'center',
                                                    borderColor: '#3b82f6', background: '#eff6ff',
                                                    boxSizing: 'border-box'
                                                }}>
                                                    <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                                                        <img src={posLogo} alt="Mi Logo" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                                    </div>
                                                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#3b82f6' }}>Mi Logo (Actual)</span>
                                                </div>
                                            )}
 
                                            {availableLogos.map(logo => {
                                                const isActive = posLogo === logo.id;
                                                return (
                                                    <div 
                                                        key={logo.id}
                                                        onClick={() => setPosLogo(logo.id)}
                                                        style={{
                                                            padding: '16px', border: '2px solid', borderRadius: '20px',
                                                            cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                                                            borderColor: isActive ? '#3b82f6' : '#f1f5f9',
                                                            background: isActive ? '#eff6ff' : '#fff',
                                                            boxSizing: 'border-box'
                                                        }}
                                                    >
                                                        <div style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                                                            <img src={`/logos/${logo.id}`} alt={logo.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                                        </div>
                                                        <span style={{ fontSize: '11px', fontWeight: 800, color: isActive ? '#3b82f6' : '#64748b' }}>{logo.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
 
// Estilos
const tabsContainerStyle = {
    display: 'flex',
    gap: '8px',
    background: '#f1f5f9',
    padding: '6px',
    borderRadius: '14px',
    marginBottom: '28px',
    border: '1px solid #e2e8f0',
    flexShrink: 0
};
 
const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '8px' };
const infoTextStyle = { fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px' };
 
const gridStyle = { display: 'flex', flexDirection: 'column', gap: '16px' };
 
const optionCardStyle = {
    display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', borderRadius: '20px',
    border: '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative'
};
 
const iconWrapperStyle = {
    width: '56px', height: '56px', borderRadius: '16px', display: 'flex',
    alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease'
};
 
const optionTitleStyle = { margin: 0, fontSize: '16px', fontWeight: 800, color: '#1e293b' };
const optionDescStyle = { margin: '4px 0 0', fontSize: '13px', color: '#64748b', lineHeight: '1.4' };
 
const checkCircleStyle = {
    position: 'absolute', top: '12px', right: '12px', background: '#3b82f6',
    color: '#fff', borderRadius: '50%', width: '22px', height: '22px',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
};
