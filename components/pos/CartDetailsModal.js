'use client';
import { X, Trash2, ShoppingCart, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartDetailsModal({ isOpen, onClose, items, onUpdateQty, onRemove, onClear, total }) {
    if (!isOpen) return null;

    return (
        <div style={overlayStyle}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={modalStyle}
            >
                {/* Header */}
                <div style={headerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={iconBoxStyle}><ShoppingCart size={20} /></div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', margin: 0 }}>Detalle del Pedido</h2>
                            <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>{items.length} productos seleccionados</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={onClear} style={clearBtnStyle}>
                            <Trash2 size={16} /> Limpiar Todo
                        </button>
                        <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
                    </div>
                </div>

                {/* Items List */}
                <div style={listStyle}>
                    {items.length === 0 ? (
                        <div style={emptyStyle}>
                            <ShoppingCart size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                            <p>El carrito está vacío</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={tableHeaderStyle}>
                                    <th style={{ textAlign: 'left', padding: '12px' }}>Producto</th>
                                    <th style={{ textAlign: 'center', padding: '12px' }}>Cantidad</th>
                                    <th style={{ textAlign: 'right', padding: '12px' }}>Precio</th>
                                    <th style={{ textAlign: 'right', padding: '12px' }}>Subtotal</th>
                                    <th style={{ width: '40px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.id} style={rowStyle}>
                                        <td style={{ padding: '12px' }}>
                                            <p style={{ fontWeight: 800, color: '#1e293b', margin: 0 }}>{item.name}</p>
                                            <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0 }}>{item.id}</p>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <div style={qtyControlsStyle}>
                                                <button onClick={() => onUpdateQty(item.id, -1)} style={qtyBtnStyle}><Minus size={14} /></button>
                                                <span style={{ fontWeight: 800, width: '30px', textAlign: 'center' }}>{item.quantity}</span>
                                                <button onClick={() => onUpdateQty(item.id, 1)} style={qtyBtnStyle}><Plus size={14} /></button>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '12px', fontWeight: 600 }}>S/ {item.price.toFixed(2)}</td>
                                        <td style={{ textAlign: 'right', padding: '12px', fontWeight: 800, color: '#3b82f6' }}>S/ {(item.price * item.quantity).toFixed(2)}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button onClick={() => onRemove(item.id)} style={removeBtnStyle}><X size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div style={footerStyle}>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, margin: 0 }}>TOTAL A PAGAR</p>
                        <p style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', margin: 0 }}>S/ {total.toFixed(2)}</p>
                    </div>
                    <button onClick={onClose} style={continueBtnStyle}>Continuar con la venta</button>
                </div>
            </motion.div>
        </div>
    );
}

const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' };
const modalStyle = { background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 30px 100px rgba(0,0,0,0.4)' };
const headerStyle = { padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' };
const iconBoxStyle = { width: '40px', height: '40px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' };
const closeBtnStyle = { background: '#f8fafc', border: 'none', color: '#94a3b8', borderRadius: '10px', padding: '8px', cursor: 'pointer' };
const clearBtnStyle = { background: '#fff1f2', border: 'none', color: '#ef4444', borderRadius: '10px', padding: '8px 16px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' };
const listStyle = { flex: 1, overflowY: 'auto', padding: '0 24px' };
const tableHeaderStyle = { borderBottom: '2px solid #f1f5f9', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' };
const rowStyle = { borderBottom: '1px solid #f8fafc' };
const qtyControlsStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#f8fafc', borderRadius: '10px', padding: '4px', width: 'fit-content', margin: '0 auto' };
const qtyBtnStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' };
const removeBtnStyle = { background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px' };
const emptyStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', color: '#94a3b8', fontWeight: 700 };
const footerStyle = { padding: '24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const continueBtnStyle = { background: '#0f172a', color: '#fff', border: 'none', borderRadius: '16px', padding: '16px 32px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' };
