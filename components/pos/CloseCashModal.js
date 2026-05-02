'use client';
import { useState, useEffect } from 'react';
import { X, Lock, Calculator, Banknote, CreditCard, Save, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CloseCashModal({ isOpen, onClose, idApeCaj, onConfirm }) {
    const [summary, setSummary] = useState({ cash: 0, card: 0, total: 0, count: 0 });
    const [loading, setLoading] = useState(true);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (isOpen && idApeCaj) {
            fetchSummary();
        }
    }, [isOpen, idApeCaj]);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/cash/summary?idApeCaj=${idApeCaj}`);
            const data = await res.json();
            setSummary(data);
        } catch (e) {
            console.error('Error fetching summary:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = async () => {
        if (!confirm('¿Estás seguro de cerrar la caja? Esta acción no se puede deshacer.')) return;
        setIsClosing(true);
        try {
            const res = await fetch('/api/cash/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idApeCaj })
            });
            if (res.ok) {
                onConfirm();
            }
        } catch (e) {
            alert('Error al cerrar caja');
        } finally {
            setIsClosing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={overlayStyle}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={modalStyle}>
                <div style={headerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={iconBoxStyle}><Lock size={20} /></div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Cierre de Caja</h2>
                            <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Finalizar jornada de trabajo</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
                </div>

                <div style={{ padding: '24px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>Calculando arqueo...</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={warningBoxStyle}>
                                <AlertCircle size={16} />
                                <span>Al cerrar caja se consolidarán todas las ventas y se bloquearán nuevas transacciones en esta sesión.</span>
                            </div>

                            <div style={statsGridStyle}>
                                <div style={statCardStyle}>
                                    <div style={{ ...statIconStyle, background: '#ecfdf5', color: '#10b981' }}><Banknote size={20} /></div>
                                    <div>
                                        <p style={statLabelStyle}>Efectivo (Ventas)</p>
                                        <p style={statValueStyle}>S/ {summary.cash.toFixed(2)}</p>
                                    </div>
                                </div>
                                <div style={statCardStyle}>
                                    <div style={{ ...statIconStyle, background: '#eff6ff', color: '#3b82f6' }}><CreditCard size={20} /></div>
                                    <div>
                                        <p style={statLabelStyle}>Tarjetas / Otros</p>
                                        <p style={statValueStyle}>S/ {summary.card.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            <div style={totalBoxStyle}>
                                <div>
                                    <p style={{ fontSize: '12px', fontWeight: 800, color: '#64748b', margin: 0 }}>TOTAL RECAUDADO ({summary.count} ventas)</p>
                                    <p style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: 0 }}>S/ {summary.total.toFixed(2)}</p>
                                </div>
                                <Calculator size={40} style={{ opacity: 0.1 }} />
                            </div>

                            <button 
                                onClick={handleClose} 
                                disabled={isClosing}
                                style={closeBtnActionStyle}
                            >
                                {isClosing ? 'Cerrando sesión...' : 'Confirmar Cierre de Caja'}
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' };
const modalStyle = { background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '480px', boxShadow: '0 30px 100px rgba(0,0,0,0.4)', overflow: 'hidden' };
const headerStyle = { padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const iconBoxStyle = { width: '40px', height: '40px', background: '#fef2f2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' };
const closeBtnStyle = { background: '#f8fafc', border: 'none', color: '#94a3b8', borderRadius: '10px', padding: '8px', cursor: 'pointer' };
const warningBoxStyle = { background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '12px', color: '#92400e', fontSize: '12px', fontWeight: 600, lineHeight: '1.4' };
const statsGridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' };
const statCardStyle = { padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', gap: '12px', alignItems: 'center' };
const statIconStyle = { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const statLabelStyle = { fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', margin: 0 };
const statValueStyle = { fontSize: '16px', fontWeight: 800, color: '#1e293b', margin: 0 };
const totalBoxStyle = { background: '#0f172a', padding: '24px', borderRadius: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const closeBtnActionStyle = { width: '100%', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '16px', padding: '18px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 25px rgba(239,68,68,0.3)', transition: 'all 0.2s' };
