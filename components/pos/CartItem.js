'use client';
import { Minus, Plus, X } from 'lucide-react';

export default function CartItem({ item, onUpdateQty, onRemove }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#fff',
            borderRadius: '12px',
            border: '1px solid #f1f5f9',
            padding: '10px 12px',
            marginBottom: '6px',
        }}>
            {/* Qty */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                <button onClick={() => onUpdateQty(item.id, 1)} style={qtyBtnStyle}>
                    <Plus size={10} strokeWidth={3} />
                </button>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', width: '24px', textAlign: 'center' }}>{item.quantity}</span>
                <button onClick={() => onUpdateQty(item.id, -1)} style={qtyBtnStyle}>
                    <Minus size={10} strokeWidth={3} />
                </button>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#1e293b', lineHeight: 1.3, margin: 0,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.name}
                </p>
                <p style={{ fontSize: '10px', color: '#94a3b8', margin: '2px 0 0' }}>
                    S/ {Number(item.price).toFixed(2)} c/u
                </p>
            </div>

            {/* Subtotal + remove */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                    S/ {(item.price * item.quantity).toFixed(2)}
                </span>
                <button onClick={() => onRemove(item.id)} style={{
                    background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer',
                    padding: '2px', display: 'flex',
                }}>
                    <X size={13} />
                </button>
            </div>
        </div>
    );
}

const qtyBtnStyle = {
    width: '22px',
    height: '22px',
    borderRadius: '6px',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748b',
    padding: 0,
};
