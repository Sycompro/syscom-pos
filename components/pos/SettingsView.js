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
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getTabButtonStyle = (tabName) => {
        const isActive = currentTab === tabName;
        return {
            flex: isMobile ? '0 0 auto' : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: isMobile ? '8px 12px' : '12px 16px',
            borderRadius: '8px',
            fontSize: isMobile ? '12px' : '13px',
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
        { id: 'logocia01.jpg', name: 'Logo 01' },
        { id: 'logocia02.jpg', name: 'Logo 02' },
        { id: 'logocia03.jpg', name: 'Logo 03' },
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

    // Estilos responsivos locales
    const labelStyle = { display: 'block', fontSize: '10px', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '8px' };
    const infoTextStyle = { fontSize: isMobile ? '11px' : '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', lineHeight: 1.4 };
    const gridStyle = { display: 'flex', flexDirection: 'column', gap: '12px' };
    
    const getOptionCardStyle = (type) => {
        const isActive = businessType === type;
        return {
            display: 'flex', 
            alignItems: 'center', 
            gap: isMobile ? '12px' : '20px', 
            padding: isMobile ? '14px' : '18px 20px', 
            borderRadius: '16px',
            border: '2px solid',
            borderColor: isActive ? '#3b82f6' : '#f1f5f9',
            background: isActive ? '#eff6ff' : '#f8fafc',
            cursor: 'pointer', 
            transition: 'all 0.2s ease', 
            position: 'relative'
        };
    };

    const getIconWrapperStyle = (type) => {
        const isActive = businessType === type;
        return {
            width: isMobile ? '40px' : '48px', 
            height: isMobile ? '40px' : '48px', 
            borderRadius: '12px', 
            display: 'flex',
            alignItems: 'center', 
            justifyContent: 'center', 
            transition: 'all 0.2s ease',
            background: isActive ? '#3b82f6' : '#e2e8f0', 
            color: isActive ? '#fff' : '#64748b',
            flexShrink: 0
        };
    };

    const optionTitleStyle = { margin: 0, fontSize: isMobile ? '13px' : '15px', fontWeight: 800, color: '#1e293b' };
    const optionDescStyle = { margin: '2px 0 0', fontSize: isMobile ? '11px' : '12px', color: '#64748b', lineHeight: '1.4' };
    const checkCircleStyle = {
        position: 'absolute', top: '10px', right: '10px', background: '#3b82f6',
        color: '#fff', borderRadius: '50%', width: '18px', height: '18px',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    };

    return (
        <div style={{ padding: isMobile ? '12px 14px' : '24px 40px', maxWidth: '1000px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            {/* Cabecera superior integrada */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '16px' : '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: isMobile ? '10px' : '14px', alignItems: 'center' }}>
                    <div style={{ width: isMobile ? '36px' : '44px', height: isMobile ? '36px' : '44px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Settings size={isMobile ? 20 : 22} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: isMobile ? '18px' : '22px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Ajustes POS</h1>
                        {!isMobile && <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>Comportamiento general e identidad visual del sistema</p>}
                    </div>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={loading} 
                    style={{
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: isMobile ? '10px 16px' : '12px 20px',
                        fontWeight: 800,
                        fontSize: isMobile ? '12px' : '13px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                        width: isMobile ? '100%' : 'auto',
                        justifyContent: 'center'
                    }}
                >
                    {loading ? (
                        <Loader2 className="animate-spin" size={14} />
                    ) : (
                        <Save size={14} />
                    )}
                    <span>{saved ? '¡Guardado!' : 'Guardar Ajustes'}</span>
                </button>
            </div>

            {/* Contenido principal en Tarjeta Premium */}
            <div style={{
                background: '#ffffff',
                borderRadius: isMobile ? '16px' : '20px',
                padding: isMobile ? '16px' : '24px',
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.02)',
                border: '1px solid #f1f5f9'
            }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}>
                        <Loader2 className="animate-spin" size={32} color="#3b82f6" />
                        <p style={{ marginTop: '12px', fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Cargando...</p>
                    </div>
                ) : (
                    <>
                        {/* Selector de Pestañas */}
                        <div style={{
                            display: 'flex',
                            gap: '4px',
                            background: '#f1f5f9',
                            padding: '4px',
                            borderRadius: '10px',
                            marginBottom: '20px',
                            border: '1px solid #e2e8f0',
                            flexShrink: 0,
                            overflowX: 'auto',
                            whiteSpace: 'nowrap'
                        }} className="no-scrollbar">
                            <button 
                                type="button"
                                onClick={() => setCurrentTab('business')} 
                                style={getTabButtonStyle('business')}
                            >
                                <Briefcase size={14} />
                                <span>Rubro y Negocio</span>
                            </button>
                            <button 
                                type="button"
                                onClick={() => setCurrentTab('interface')} 
                                style={getTabButtonStyle('interface')}
                            >
                                <Keyboard size={14} />
                                <span>Interfaz</span>
                            </button>
                            <button 
                                type="button"
                                onClick={() => setCurrentTab('brand')} 
                                style={getTabButtonStyle('brand')}
                            >
                                <Palette size={14} />
                                <span>Marca y Logo</span>
                            </button>
                        </div>

                        {/* Contenido de la Pestaña */}
                        <div style={{ minHeight: '180px', marginTop: '4px' }}>
                            <AnimatePresence mode="wait">
                                {currentTab === 'business' && (
                                    <motion.div
                                        key="business"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <label style={labelStyle}>RUBRO DEL NEGOCIO</label>
                                        <p style={infoTextStyle}>
                                            <Info size={13} style={{ flexShrink: 0 }} /> Determina las reglas de negocio y las alertas específicas que se envían por WhatsApp.
                                        </p>

                                        <div style={gridStyle}>
                                            <div 
                                                onClick={() => setBusinessType('gym')}
                                                style={getOptionCardStyle('gym')}
                                            >
                                                <div style={getIconWrapperStyle('gym')}>
                                                    <Dumbbell size={isMobile ? 20 : 22} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={optionTitleStyle}>Gimnasio / Fit</h3>
                                                    <p style={optionDescStyle}>Habilita el control de vigencia, días de membresía y alertas automáticas de vencimiento.</p>
                                                </div>
                                                {businessType === 'gym' && <div style={checkCircleStyle}><Check size={12} /></div>}
                                            </div>

                                            <div 
                                                onClick={() => setBusinessType('universal')}
                                                style={getOptionCardStyle('universal')}
                                            >
                                                <div style={getIconWrapperStyle('universal')}>
                                                    <Store size={isMobile ? 20 : 22} />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={optionTitleStyle}>Universal / Comercial</h3>
                                                    <p style={optionDescStyle}>Mensajes estándar de agradecimiento de compra sin gestión ni vigencia de membresías.</p>
                                                </div>
                                                {businessType === 'universal' && <div style={checkCircleStyle}><Check size={12} /></div>}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {currentTab === 'interface' && (
                                    <motion.div
                                        key="interface"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <label style={labelStyle}>INTERFAZ Y TECLADO</label>
                                        <p style={infoTextStyle}>
                                            <Info size={13} style={{ flexShrink: 0 }} /> Activa o desactiva los teclados virtuales en pantalla para la aplicación.
                                        </p>

                                        <div style={{ 
                                            background: '#f8fafc', padding: isMobile ? '16px' : '20px', borderRadius: '16px', 
                                            border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' 
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                                                <div style={{ flex: 1, minWidth: '200px' }}>
                                                    <h4 style={{ margin: 0, fontSize: isMobile ? '13px' : '14px', fontWeight: 800, color: '#1e293b' }}>
                                                        Usar Teclados en Pantalla
                                                    </h4>
                                                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                                                        Ideal para pantallas táctiles y tablets. Desactívalo si utilizas una computadora con teclado físico.
                                                    </p>
                                                </div>
                                                <div 
                                                    onClick={() => setUseScreenKeyboards(!useScreenKeyboards)}
                                                    style={{
                                                        width: '46px', height: '24px', borderRadius: '20px',
                                                        background: useScreenKeyboards ? '#3b82f6' : '#cbd5e1',
                                                        padding: '3px', cursor: 'pointer', transition: 'all 0.3s ease',
                                                        display: 'flex', alignItems: 'center',
                                                        justifyContent: useScreenKeyboards ? 'flex-end' : 'flex-start',
                                                        boxSizing: 'border-box',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {currentTab === 'brand' && (
                                    <motion.div
                                        key="brand"
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -5 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <label style={labelStyle}>IDENTIDAD DE MARCA</label>
                                        <p style={infoTextStyle}>
                                            <Info size={13} style={{ flexShrink: 0 }} /> Personaliza el nombre comercial y logotipo de los comprobantes impresos y en PDF.
                                        </p>

                                        <div style={{ 
                                            background: '#f8fafc', padding: isMobile ? '16px' : '20px', borderRadius: '16px', 
                                            border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px',
                                            marginBottom: '20px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                                                <div style={{ flex: 1, minWidth: '200px' }}>
                                                    <h4 style={{ margin: 0, fontSize: isMobile ? '13px' : '14px', fontWeight: 800, color: '#1e293b' }}>
                                                        Usar Nombre Personalizado
                                                    </h4>
                                                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                                                        Activa esta opción para definir un nombre comercial personalizado en lugar del nombre legal del RUC.
                                                    </p>
                                                </div>
                                                <div 
                                                    onClick={() => setUseCustomName(!useCustomName)}
                                                    style={{
                                                        width: '46px', height: '24px', borderRadius: '20px',
                                                        background: useCustomName ? '#10b981' : '#cbd5e1',
                                                        padding: '3px', cursor: 'pointer', transition: 'all 0.3s ease',
                                                        display: 'flex', alignItems: 'center',
                                                        justifyContent: useCustomName ? 'flex-end' : 'flex-start',
                                                        boxSizing: 'border-box',
                                                        flexShrink: 0
                                                    }}
                                                >
                                                    <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
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
                                                            placeholder="Nombre comercial de tu negocio..."
                                                            value={customName}
                                                            onChange={(e) => setCustomName(e.target.value)}
                                                            style={{
                                                                width: '100%', padding: '10px 14px', borderRadius: '8px',
                                                                border: '2px solid #3b82f6', outline: 'none',
                                                                fontSize: '13px', fontWeight: 600, color: '#1e293b',
                                                                boxSizing: 'border-box', marginTop: '8px'
                                                            }}
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <label style={labelStyle}>LOGO DE COMPROBANTE</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', marginTop: '8px' }}>
                                            {/* Botón de Subir Personalizado */}
                                            <label style={{
                                                padding: '12px', border: '2px dashed #cbd5e1', borderRadius: '16px',
                                                cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                                                background: '#f8fafc', display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', justifyContent: 'center', minHeight: '80px',
                                                boxSizing: 'border-box'
                                            }}>
                                                <input 
                                                    type="file" 
                                                    accept="image/png, image/jpeg" 
                                                    onChange={handleLogoUpload} 
                                                    style={{ display: 'none' }} 
                                                />
                                                <UploadCloud size={24} style={{ color: '#94a3b8', marginBottom: '6px' }} />
                                                <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b' }}>Subir Logo</span>
                                            </label>

                                            {/* Mostrar logo personalizado si está en base64 */}
                                            {posLogo && posLogo.startsWith('data:image') && (
                                                <div style={{
                                                    padding: '12px', border: '2px solid', borderRadius: '16px',
                                                    cursor: 'pointer', textAlign: 'center',
                                                    borderColor: '#3b82f6', background: '#eff6ff',
                                                    boxSizing: 'border-box', minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
                                                }}>
                                                    <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                                                        <img src={posLogo} alt="Mi Logo" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                                    </div>
                                                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#3b82f6' }}>Mi Logo (Activo)</span>
                                                </div>
                                            )}

                                            {availableLogos.map(logo => {
                                                const isActive = posLogo === logo.id;
                                                return (
                                                    <div 
                                                        key={logo.id}
                                                        onClick={() => setPosLogo(logo.id)}
                                                        style={{
                                                            padding: '12px', border: '2px solid', borderRadius: '16px',
                                                            cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                                                            borderColor: isActive ? '#3b82f6' : '#f1f5f9',
                                                            background: isActive ? '#eff6ff' : '#fff',
                                                            boxSizing: 'border-box',
                                                            minHeight: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
                                                        }}
                                                    >
                                                        <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6px' }}>
                                                            <img src={`/logos/${logo.id}`} alt={logo.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                                        </div>
                                                        <span style={{ fontSize: '10px', fontWeight: 800, color: isActive ? '#3b82f6' : '#64748b' }}>{logo.name}</span>
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

