'use client';
import { useState, useEffect } from 'react';
import { X, Receipt, Search, Printer, Calendar, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SalesHistoryModal({ isOpen, onClose, idApeCaj, onPrint }) {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [reprinting, setReprinting] = useState(null);

    useEffect(() => {
        if (isOpen && idApeCaj) {
            fetchSales();
        }
    }, [isOpen, idApeCaj]);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/sales/history?idApeCaj=${idApeCaj}`);
            const data = await res.json();
            setSales(data || []);
        } catch (e) {
            console.error('Error fetching history:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleReprint = async (sale) => {
        setReprinting(sale.ndocu);
        try {
            const res = await fetch(`/api/sales/details?cdocu=${sale.cdocu}&ndocu=${sale.ndocu}`);
            const data = await res.json();
            if (data.items) {
                onPrint({
                    documentNumber: data.ndocu,
                    docType: data.cdocu,
                    customer: { name: data.nomcli, ruc: data.ruccli },
                    items: data.items,
                    total: data.tota,
                    date: new Date(data.fecha).toLocaleString(),
                    salesperson: data.salesperson
                });
            }
        } catch (e) {
            console.error('Error reprinting:', e);
            alert('Error al obtener detalles de la venta');
        } finally {
            setReprinting(null);
        }
    };

    if (!isOpen) return null;

    const filteredSales = sales.filter(s => 
        s.ndocu.toLowerCase().includes(filter.toLowerCase()) || 
        s.nomcli.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div style={overlayStyle}>
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={modalStyle}>
                <div style={headerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={iconBoxStyle}><Receipt size={20} /></div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Historial de Ventas</h2>
                            <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Sesión de Caja #{idApeCaj}</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
                </div>

                <div style={searchBoxStyle}>
                    <Search size={18} style={{ color: '#94a3b8' }} />
                    <input 
                        type="text" 
                        placeholder="Buscar por Nro de documento o cliente..." 
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        style={searchInputStyle}
                    />
                </div>

                <div style={contentStyle}>
                    {loading ? (
                        <div style={centerStyle}>Cargando historial...</div>
                    ) : filteredSales.length === 0 ? (
                        <div style={centerStyle}>No hay ventas registradas en esta sesión.</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={tableHeaderStyle}>
                                <tr>
                                    <th style={thStyle}>Documento</th>
                                    <th style={thStyle}>Cliente</th>
                                    <th style={thStyle}>Hora</th>
                                    <th style={thStyle}>Total</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSales.map(sale => (
                                    <tr key={sale.ndocu} style={rowStyle}>
                                        <td style={tdStyle}>
                                            <span style={{ fontWeight: 800, color: '#1e293b' }}>{sale.ndocu}</span>
                                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{sale.cdocu === '01' ? 'FACTURA' : (sale.cdocu === '03' ? 'BOLETA' : 'NOTA')}</div>
                                        </td>
                                        <td style={tdStyle}>{sale.nomcli}</td>
                                        <td style={tdStyle}>{new Date(sale.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td style={{ ...tdStyle, fontWeight: 900, color: '#3b82f6' }}>S/ {sale.tota.toFixed(2)}</td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                            <button 
                                                onClick={() => handleReprint(sale)}
                                                disabled={reprinting === sale.ndocu}
                                                style={{ ...printBtnStyle, opacity: reprinting === sale.ndocu ? 0.5 : 1 }} 
                                                title="Reimprimir Ticket"
                                            >
                                                {reprinting === sale.ndocu ? <Loader2 style={{ animation: 'spin 1s linear infinite' }} size={16} /> : <Printer size={16} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' };
const modalStyle = { background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '900px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 100px rgba(0,0,0,0.3)' };
const headerStyle = { padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const iconBoxStyle = { width: '40px', height: '40px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' };
const closeBtnStyle = { background: '#f8fafc', border: 'none', color: '#94a3b8', borderRadius: '10px', padding: '8px', cursor: 'pointer' };
const searchBoxStyle = { padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f8fafc' };
const searchInputStyle = { flex: 1, border: 'none', outline: 'none', fontSize: '14px', fontWeight: 600, color: '#1e293b' };
const contentStyle = { flex: 1, overflowY: 'auto', padding: '0 24px' };
const tableHeaderStyle = { position: 'sticky', top: 0, background: '#fff', zIndex: 10 };
const thStyle = { textAlign: 'left', padding: '12px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #f1f5f9' };
const tdStyle = { padding: '16px 12px', fontSize: '13px', borderBottom: '1px solid #f8fafc' };
const rowStyle = { transition: 'background 0.2s', ':hover': { background: '#f8fafc' } };
const printBtnStyle = { background: '#f8fafc', border: 'none', color: '#64748b', borderRadius: '8px', padding: '8px', cursor: 'pointer' };
const centerStyle = { padding: '100px 0', textAlign: 'center', color: '#94a3b8', fontWeight: 600 };
