import { MessageCircle, CheckCircle2, Copy, Save, ShieldCheck, Activity, Loader2, RefreshCcw, History, AlertCircle, Wifi, WifiOff, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

import AlphanumericKeyboard from './AlphanumericKeyboard';

export default function WhatsappView({ useScreenKeyboards }) {
    const [settings, setSettings] = useState({ whatsapp_url: '', whatsapp_token: '' });
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSaved, setShowSaved] = useState(false);
    const [connStatus, setConnStatus] = useState('unknown'); // unknown, checking, online, offline
    const [testing, setTesting] = useState(false);
    const [activeInput, setActiveInput] = useState(null); // 'url' or 'token'
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        loadAll();
    }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [sRes, lRes] = await Promise.all([
                fetch('/api/settings/whatsapp'),
                fetch('/api/settings/whatsapp?type=logs')
            ]);
            const sData = await sRes.json();
            const lData = await lRes.json();
            
            setSettings({
                whatsapp_url: sData.whatsapp_url || '',
                whatsapp_token: sData.whatsapp_token || ''
            });
            setLogs(Array.isArray(lData) ? lData : []);
            if (sData.whatsapp_url && sData.whatsapp_token) checkConnection(sData.whatsapp_url, sData.whatsapp_token);
        } catch (e) {
            console.error('Error loading data:', e);
        } finally {
            setLoading(false);
        }
    };

    const checkConnection = async (url, token) => {
        if (!url || !token) return;
        setTesting(true);
        setConnStatus('checking');
        try {
            const res = await fetch('/api/whatsapp/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, token })
            });
            const data = await res.json();
            setConnStatus(data.online ? 'online' : 'offline');
        } catch (e) {
            setConnStatus('offline');
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/settings/whatsapp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            const data = await res.json();
            if (data.success) {
                setShowSaved(true);
                setTimeout(() => setShowSaved(false), 3000);
                checkConnection(settings.whatsapp_url, settings.whatsapp_token);
            } else alert('Error: ' + data.error);
        } catch (e) {
            alert('Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    // Estilos responsivos
    const cardStyle = {
        background: '#fff',
        borderRadius: isMobile ? '16px' : '24px',
        padding: isMobile ? '16px 20px' : '24px',
        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.02)',
        border: '1px solid #f1f5f9',
        height: '100%',
        boxSizing: 'border-box'
    };

    const iconBoxStyle = {
        width: isMobile ? '40px' : '48px',
        height: isMobile ? '40px' : '48px',
        background: '#eff6ff',
        color: '#3b82f6',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
    };

    const labelStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '10px',
        fontWeight: 800,
        color: '#94a3b8',
        letterSpacing: '0.05em',
        marginBottom: '8px'
    };

    const inputStyle = {
        width: '100%',
        padding: isMobile ? '12px 14px' : '14px 18px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        fontSize: isMobile ? '13px' : '14px',
        color: '#1e293b',
        outline: 'none',
        transition: 'all 0.3s',
        fontWeight: 600,
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
        boxSizing: 'border-box'
    };

    const saveBtnStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: '#0f172a',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        padding: isMobile ? '10px 16px' : '12px 20px',
        fontSize: isMobile ? '12px' : '13px',
        fontWeight: 800,
        cursor: 'pointer',
        transition: 'all 0.3s',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.1)',
        justifyContent: 'center',
        flex: isMobile ? 1 : 'none'
    };

    const refreshBtnStyle = {
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        color: '#64748b',
        borderRadius: '10px',
        padding: isMobile ? '10px' : '12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s',
        flexShrink: 0
    };

    const infoBoxStyle = {
        padding: isMobile ? '12px' : '16px',
        background: '#f0f9ff',
        borderRadius: '12px',
        border: '1px solid #e0f2fe',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        marginTop: '20px'
    };

    const thStyle = {
        textAlign: 'left',
        fontSize: '10px',
        fontWeight: 800,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        padding: isMobile ? '10px 8px' : '16px'
    };

    const tdStyle = {
        fontSize: isMobile ? '12px' : '13px',
        color: '#1e293b',
        padding: isMobile ? '10px 8px' : '16px'
    };

    const toastStyle = {
        position: 'fixed',
        top: '20px',
        left: '50%',
        background: '#0f172a',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '13px',
        fontWeight: 700,
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        zIndex: 2000,
        border: '1px solid rgba(255,255,255,0.1)'
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', width: '100%' }}>
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Loader2 className="animate-spin" size={32} style={{ color: '#3b82f6', margin: '0 auto' }} />
                <p style={{ fontWeight: 700, color: '#64748b', fontSize: '13px', marginTop: '12px' }}>Cargando panel de WhatsApp...</p>
            </div>
        </div>
    );

    return (
        <div style={{ padding: isMobile ? '12px 14px' : '24px 40px', maxWidth: '1400px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
            <AnimatePresence>
                {showSaved && (
                    <motion.div 
                        initial={{ opacity: 0, y: -50, x: '-50%' }}
                        animate={{ opacity: 1, y: 20, x: '-50%' }}
                        exit={{ opacity: 0, y: -50, x: '-50%' }}
                        style={toastStyle}
                    >
                        <CheckCircle2 size={16} /> ¡Configuración guardada y sincronizada!
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(420px, 1fr))', gap: isMobile ? '16px' : '24px', alignItems: 'start' }}>
                {/* Column 1: Config */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '20px' : '28px', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: isMobile ? '10px' : '16px', alignItems: 'center' }}>
                            <div style={iconBoxStyle}><Globe size={isMobile ? 20 : 22} /></div>
                            <div>
                                <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Conexión API</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: connStatus === 'online' ? '#10b981' : connStatus === 'offline' ? '#ef4444' : '#94a3b8' }}></div>
                                    <span style={{ fontSize: '10px', fontWeight: 700, color: connStatus === 'online' ? '#10b981' : connStatus === 'offline' ? '#ef4444' : '#64748b' }}>
                                        {connStatus === 'online' ? 'CONECTADO' : connStatus === 'offline' ? 'DESCONECTADO' : 'VERIFICANDO...'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
                            <button onClick={() => checkConnection(settings.whatsapp_url, settings.whatsapp_token)} disabled={testing} style={refreshBtnStyle}>
                                {testing ? <Loader2 size={16} className="animate-spin" /> : <Wifi size={16} />}
                            </button>
                            <button onClick={handleSave} disabled={saving} style={saveBtnStyle}>
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                <span>{saving ? 'Guardando...' : 'Guardar'}</span>
                            </button>
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}><Activity size={12} /> URL DEL SERVICIO</label>
                        <input 
                            type="text" 
                            value={settings.whatsapp_url}
                            onChange={e => setSettings({ ...settings, whatsapp_url: e.target.value })}
                            placeholder="https://qr-api-wps-production.up.railway.app"
                            style={inputStyle}
                            onFocus={() => useScreenKeyboards && setActiveInput('url')}
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={labelStyle}><ShieldCheck size={12} /> TOKEN DE ACCESO (API KEY)</label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="password" 
                                value={settings.whatsapp_token}
                                onChange={e => setSettings({ ...settings, whatsapp_token: e.target.value })}
                                placeholder="Token de seguridad..."
                                style={{ ...inputStyle, paddingRight: '44px' }}
                                onFocus={() => useScreenKeyboards && setActiveInput('token')}
                            />
                            <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                <ShieldCheck size={18} />
                            </div>
                        </div>
                    </div>

                    <AlphanumericKeyboard 
                        isOpen={activeInput !== null}
                        onClose={() => setActiveInput(null)}
                        value={activeInput === 'url' ? settings.whatsapp_url : settings.whatsapp_token}
                        onKeyPress={(key) => {
                            if (activeInput === 'url') setSettings(prev => ({ ...prev, whatsapp_url: prev.whatsapp_url + key }));
                            else setSettings(prev => ({ ...prev, whatsapp_token: prev.whatsapp_token + key }));
                        }}
                        onDelete={() => {
                            if (activeInput === 'url') setSettings(prev => ({ ...prev, whatsapp_url: prev.whatsapp_url.slice(0, -1) }));
                            else setSettings(prev => ({ ...prev, whatsapp_token: prev.whatsapp_token.slice(0, -1) }));
                        }}
                    />

                    <div style={infoBoxStyle}>
                        <AlertCircle size={18} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ fontSize: '11px', color: '#1e293b', margin: 0, lineHeight: '1.5' }}>
                            Esta configuración permite que el POS se comunique con el servidor de WhatsApp. <b>No comparta su Token</b> con personas ajenas a la administración.
                        </p>
                    </div>
                </motion.div>

                {/* Column 2: History */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '20px' : '24px' }}>
                        <div style={{ display: 'flex', gap: isMobile ? '10px' : '16px', alignItems: 'center' }}>
                            <div style={{ ...iconBoxStyle, background: '#f8fafc', color: '#64748b' }}><History size={isMobile ? 20 : 22} /></div>
                            <div>
                                <h2 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Historial de Envíos</h2>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Mensajes recientes procesados</p>
                            </div>
                        </div>
                        <button onClick={loadAll} style={{ ...refreshBtnStyle, background: '#fff', border: '1px solid #e2e8f0', padding: isMobile ? '8px' : '10px' }}>
                            <RefreshCcw size={16} />
                        </button>
                    </div>

                    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                    <th style={thStyle}>DESTINATARIO</th>
                                    <th style={thStyle}>ESTADO</th>
                                    <th style={thStyle}>FECHA Y HORA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" style={{ padding: '40px 10px', textAlign: 'center', color: '#94a3b8' }}>
                                            <div style={{ marginBottom: '8px', opacity: 0.5 }}><MessageCircle size={32} style={{ margin: '0 auto' }} /></div>
                                            <p style={{ fontWeight: 600, fontSize: '12px' }}>No hay envíos recientes</p>
                                        </td>
                                    </tr>
                                ) : logs.map(log => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ ...tdStyle, fontWeight: 700 }}>{log.phone}</td>
                                        <td style={tdStyle}>
                                            <div style={{ 
                                                padding: '4px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 900,
                                                background: log.status === 'EXITOSO' ? '#ecfdf5' : '#fef2f2',
                                                color: log.status === 'EXITOSO' ? '#10b981' : '#ef4444',
                                                display: 'inline-flex', alignItems: 'center', gap: '4px'
                                            }}>
                                                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: log.status === 'EXITOSO' ? '#10b981' : '#ef4444' }}></div>
                                                {log.status}
                                            </div>
                                        </td>
                                        <td style={{ ...tdStyle, color: '#64748b' }}>
                                            {new Date(log.created_at).toLocaleString('es-PE', { 
                                                timeZone: 'America/Lima',
                                                day: '2-digit', 
                                                month: '2-digit', 
                                                hour: '2-digit', 
                                                minute: '2-digit',
                                                hour12: false
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
