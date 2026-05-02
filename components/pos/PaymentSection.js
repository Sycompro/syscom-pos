'use client';
import { Banknote, CreditCard, Smartphone, ArrowRight } from 'lucide-react';

export default function PaymentSection({ total, availableMethods, paymentMethod, selectedTar, onSetMethod, onFinalize, loading, cartEmpty }) {
    const subtotal = total / 1.18;
    const igv = total - subtotal;
    const ICONS = { 1: Banknote, 2: CreditCard, 3: Smartphone };

    return (
        <div style={{
            flexShrink: 0,
            background: '#fff',
            borderTop: '1px solid #e2e8f0',
            padding: '16px',
        }}>
            {/* Métodos */}
            {availableMethods.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                        Método de pago
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        {availableMethods.map(m => {
                            const Icon = ICONS[m.type] || Banknote;
                            const isActive = (m.id === 'EF' && paymentMethod === 1) || selectedTar === m.id;
                            return (
                                <button key={m.id} onClick={() => onSetMethod(m)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        padding: '10px 12px', borderRadius: '10px',
                                        border: isActive ? '2px solid #3b82f6' : '2px solid #f1f5f9',
                                        background: isActive ? '#3b82f6' : '#f8fafc',
                                        color: isActive ? '#fff' : '#64748b',
                                        fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                    }}>
                                    <Icon size={14} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Totales */}
            <div style={{
                background: '#f8fafc', borderRadius: '12px', padding: '14px',
                marginBottom: '12px', border: '1px solid #f1f5f9',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                    <span>Subtotal</span>
                    <span style={{ fontWeight: 700 }}>S/ {subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                    <span>IGV 18%</span>
                    <span style={{ fontWeight: 700 }}>S/ {igv.toFixed(2)}</span>
                </div>
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                    paddingTop: '8px', borderTop: '1px solid #e2e8f0',
                }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Total</span>
                    <span style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>S/ {total.toFixed(2)}</span>
                </div>
            </div>

            {/* Botón cobrar */}
            <button
                disabled={cartEmpty || loading}
                onClick={onFinalize}
                style={{
                    width: '100%',
                    background: cartEmpty || loading ? '#e2e8f0' : '#3b82f6',
                    color: cartEmpty || loading ? '#94a3b8' : '#fff',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '16px',
                    fontSize: '16px',
                    fontWeight: 800,
                    cursor: cartEmpty || loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: cartEmpty ? 'none' : '0 4px 14px rgba(59,130,246,0.3)',
                }}
            >
                {loading ? 'Procesando...' : <>Cobrar <ArrowRight size={18} /></>}
            </button>
        </div>
    );
}
