'use client';
import { useState, useEffect, useRef } from 'react';
import { 
    X, Lock, Calculator, Banknote, CreditCard, 
    Save, AlertCircle, Printer, FileText, 
    ShoppingBag, Hash, Receipt, User, Store, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function CloseCashModal({ isOpen, onClose, idApeCaj, onConfirm }) {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isClosing, setIsClosing] = useState(false);
    const reportRef = useRef();

    useEffect(() => {
        if (isOpen && idApeCaj) {
            fetchSummary();
        }
    }, [isOpen, idApeCaj]);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/cash/summary?idapecaj=${idApeCaj}`);
            const data = await res.json();
            if (data.success) {
                setSummary(data.summary);
            }
        } catch (e) {
            console.error('Error fetching summary:', e);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const content = reportRef.current.innerHTML;
        const win = window.open('', '_blank');
        win.document.write(`
            <html>
                <head>
                    <title>Reporte de Cierre - Sesión #${idApeCaj}</title>
                    <style>
                        body { font-family: 'Courier New', Courier, monospace; font-size: 12px; padding: 20px; width: 300px; }
                        .text-center { text-align: center; }
                        .bold { font-weight: bold; }
                        .divider { border-top: 1px dashed #000; margin: 10px 0; }
                        .flex { display: flex; justify-content: space-between; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { text-align: left; }
                        .section-title { font-weight: bold; text-transform: uppercase; margin-top: 15px; }
                    </style>
                </head>
                <body>${content}</body>
            </html>
        `);
        win.document.close();
        win.print();
    };

    const handleClose = async () => {
        if (!confirm('⚠️ CONFIRMACIÓN DE CIERRE: ¿Desea finalizar la jornada actual?\n\nSe generará el arqueo definitivo en Navasoft.')) return;
        
        setIsClosing(true);
        try {
            const totals = [];
            // Efectivo
            const cashVal = summary.payments.find(p => p.method === 'EFECTIVO')?.total || 0;
            totals.push({ selpago: 1, codtar: '', totnsis: cashVal, totnfis: cashVal });

            // Otros medios
            summary.payments.filter(p => p.method !== 'EFECTIVO').forEach(p => {
                totals.push({ selpago: 3, codtar: '01', totnsis: p.total, totnfis: p.total });
            });

            const res = await fetch('/api/cash/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idapecaj: idApeCaj, totals })
            });
            
            const data = await res.json();
            if (data.success) {
                onConfirm(summary);
            }
        } catch (e) {
            alert('Error al cerrar caja');
        } finally {
            setIsClosing(false);
        }
    };

    if (!isOpen) return null;

    const expectedCash = (summary?.opening || 0) + (summary?.payments.find(p => p.method === 'EFECTIVO')?.total || 0) - (summary?.expenses || 0);

    return (
        <div style={overlayStyle}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={modalStyle}>
                
                {/* HEADER DINÁMICO */}
                <div style={headerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={iconBoxStyle}><FileText size={20} /></div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>Reporte de Ventas (Z)</h2>
                            <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Arqueo Final de Sesión</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handlePrint} style={printBtnStyle}><Printer size={18} /></button>
                        <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
                    </div>
                </div>

                <div style={scrollAreaStyle}>
                    {loading ? (
                        <div style={loadingAreaStyle}><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Calculator size={30} /></motion.div></div>
                    ) : summary && (
                        <div ref={reportRef} style={reportContentStyle}>
                            
                            {/* ENCABEZADO EMPRESA */}
                            <div className="text-center" style={{ marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>{summary.header.company}</h3>
                                <p style={{ margin: 0, fontSize: '12px' }}>RUC: {summary.header.ruc}</p>
                                <p style={{ margin: 0, fontSize: '11px' }}>{summary.header.address}</p>
                                <div style={{ borderTop: '1px dashed #000', margin: '12px 0' }} />
                                <p style={{ margin: 0, fontWeight: 900 }}>REPORTE DE VENTAS (Z)</p>
                                <p style={{ margin: 0 }}>CAJA: {summary.header.pointOfSale}</p>
                            </div>

                            {/* SECCIÓN 1: DOCUMENTOS EMITIDOS */}
                            <div style={sectionStyle}>
                                <p style={sectionTitleStyle}>DOCS. EMITIDOS</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '11px', marginBottom: '4px' }}>
                                    <span>Tipo</span>
                                    <span>Cant.</span>
                                    <span>Rango</span>
                                    <span>Total</span>
                                </div>
                                {summary.documents.map((d, i) => (
                                    <div key={i} style={itemRowStyle}>
                                        <span style={{ width: '80px' }}>{d.docName.substring(0, 10)}</span>
                                        <span style={{ width: '30px', textAlign: 'center' }}>{d.quantity}</span>
                                        <span style={{ flex: 1, textAlign: 'center', fontSize: '10px' }}>{d.rangeStart.split('-')[1]}-{d.rangeEnd.split('-')[1]}</span>
                                        <span style={{ width: '60px', textAlign: 'right' }}>{d.total.toFixed(2)}</span>
                                    </div>
                                ))}
                                <div style={itemRowStyle}>
                                    <span>Anulados</span>
                                    <span>{summary.nullified.quantity}</span>
                                    <span style={{ flex: 1 }}></span>
                                    <span>{summary.nullified.total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* SECCIÓN 2: LIQUIDACIÓN VENTA */}
                            <div style={sectionStyle}>
                                <p style={sectionTitleStyle}>LIQUIDACION VTA</p>
                                {summary.liquidation.map((l, i) => (
                                    <div key={i} style={itemRowStyle}>
                                        <span>Vta. {l.condicion}</span>
                                        <span style={{ fontWeight: 900 }}>S/ {l.total.toFixed(2)}</span>
                                    </div>
                                ))}
                                <div style={{ ...itemRowStyle, borderTop: '1px solid #000', marginTop: '4px', paddingTop: '4px', fontWeight: 900 }}>
                                    <span>TOTAL VENTA</span>
                                    <span>S/ {summary.totalSales.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* SECCIÓN 3: POR COBRANZA (MEDIOS DE PAGO) */}
                            <div style={sectionStyle}>
                                <p style={sectionTitleStyle}>POR COBRANZA</p>
                                {summary.payments.map((p, i) => (
                                    <div key={i} style={itemRowStyle}>
                                        <span>{p.method.trim()}</span>
                                        <span>S/ {p.total.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* SECCIÓN 4: ARQUEO DE CAJA */}
                            <div style={sectionStyle}>
                                <p style={sectionTitleStyle}>ARQUEO EFECTIVO</p>
                                <div style={itemRowStyle}><span>Apertura</span><span>S/ {summary.opening.toFixed(2)}</span></div>
                                <div style={itemRowStyle}><span>Ventas Efectivo</span><span>S/ {(summary.payments.find(p => p.method === 'EFECTIVO')?.total || 0).toFixed(2)}</span></div>
                                <div style={itemRowStyle}><span>Egresos/Gastos</span><span>S/ {summary.expenses.toFixed(2)}</span></div>
                                <div style={{ ...itemRowStyle, background: '#f8fafc', padding: '8px', borderRadius: '8px', marginTop: '8px' }}>
                                    <span style={{ fontWeight: 900 }}>EFECTIVO EN CAJA</span>
                                    <span style={{ fontWeight: 900, color: '#2563eb' }}>S/ {expectedCash.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* SECCIÓN 5: VENTA POR LÍNEAS */}
                            <div style={sectionStyle}>
                                <p style={sectionTitleStyle}>VENTA POR LINEA</p>
                                {summary.lines.map((l, i) => (
                                    <div key={i} style={itemRowStyle}>
                                        <span style={{ fontSize: '10px' }}>{l.category.substring(0, 20)}</span>
                                        <span>{l.percentage.toFixed(1)}%</span>
                                        <span style={{ fontWeight: 700 }}>{l.total.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ textAlign: 'center', marginTop: '30px', borderTop: '1px dashed #cbd5e1', paddingTop: '20px' }}>
                                <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>Reporte generado por WEB POS</p>
                                <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>{new Date().toLocaleString()}</p>
                            </div>

                        </div>
                    )}
                </div>

                {/* FOOTER ACCIONES */}
                <div style={footerStyle}>
                    <button onClick={onClose} style={cancelBtnStyle}>Cerrar Vista</button>
                    <button 
                        onClick={handleClose} 
                        disabled={isClosing}
                        style={{ ...confirmBtnStyle, background: isClosing ? '#94a3b8' : '#ef4444' }}
                    >
                        {isClosing ? 'Cerrando...' : 'FINALIZAR Y CERRAR CAJA'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' };
const modalStyle = { background: '#fff', borderRadius: '28px', width: '100%', maxWidth: '440px', maxHeight: '90vh', boxShadow: '0 40px 100px rgba(0,0,0,0.5)', overflow: 'hidden', display: 'flex', flexDirection: 'column' };
const scrollAreaStyle = { overflowY: 'auto', flex: 1, padding: '20px' };
const headerStyle = { padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const iconBoxStyle = { width: '40px', height: '40px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' };
const closeBtnStyle = { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' };
const printBtnStyle = { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px', color: '#64748b', cursor: 'pointer' };

const reportContentStyle = { padding: '10px', color: '#000', fontFamily: 'monospace' };
const sectionStyle = { marginBottom: '24px' };
const sectionTitleStyle = { fontSize: '11px', fontWeight: 900, color: '#000', borderBottom: '1px solid #000', marginBottom: '8px', paddingBottom: '2px' };
const itemRowStyle = { display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' };

const footerStyle = { padding: '20px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px' };
const cancelBtnStyle = { flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px', fontWeight: 700, cursor: 'pointer' };
const confirmBtnStyle = { flex: 2, color: '#fff', border: 'none', borderRadius: '14px', padding: '12px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px rgba(239,68,68,0.3)' };
const loadingAreaStyle = { display: 'flex', justifyContent: 'center', padding: '60px', color: '#3b82f6' };
