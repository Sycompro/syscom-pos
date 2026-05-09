'use client';
import { Minus, Plus, X } from 'lucide-react';

export default function CartItem({ item, onUpdateQty, onRemove, onUpdatePrice }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#fff',
            borderRadius: '16px',
            border: '1px solid #eef2ff',
            padding: '12px',
            marginBottom: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
            transition: 'all 0.2s'
        }}>
            {/* Control de Cantidad */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                <button onClick={() => onUpdateQty(item.id, 1)} style={qtyBtnStyle} title="Aumentar">
                    <Plus size={10} strokeWidth={3} />
                </button>
                <input 
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onUpdateQty(item.id, parseInt(e.target.value) - item.quantity)}
                    onFocus={(e) => e.target.select()}
                    style={{ 
                        fontSize: '15px', fontWeight: 900, color: '#4f46e5', 
                        width: '32px', textAlign: 'center', border: 'none', 
                        background: 'transparent', outline: 'none' 
                    }}
                />
                <button onClick={() => onUpdateQty(item.id, -1)} style={qtyBtnStyle} title="Disminuir">
                    <Minus size={10} strokeWidth={3} />
                </button>
            </div>

            {/* Info del Producto */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ 
                    fontSize: '12px', fontWeight: 700, color: '#1e293b', lineHeight: 1.3, margin: 0,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' 
                }}>
                    {item.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>S/</span>
                    <input 
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => onUpdatePrice(item.id, parseFloat(e.target.value))}
                        onFocus={(e) => e.target.select()}
                        style={{ 
                            fontSize: '11px', fontWeight: 700, color: '#64748b', 
                            width: '60px', border: 'none', borderBottom: '1px dashed #cbd5e1',
                            background: 'transparent', outline: 'none', padding: '0 2px'
                        }}
                    />
                </div>
            </div>

            {/* Subtotal y Eliminar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
                <span style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
                    S/ {(item.price * item.quantity).toFixed(2)}
                </span>
                <button 
                    onClick={() => onRemove(item.id)} 
                    style={{
                        background: '#fef2f2', border: 'none', color: '#ef4444', 
                        cursor: 'pointer', borderRadius: '8px', padding: '6px', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
                    title="Quitar de la lista"
                >
                    <X size={14} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
}

const qtyBtnStyle = {
    width: '24px',
    height: '24px',
    borderRadius: '8px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748b',
    padding: 0,
    transition: 'all 0.2s'
};
