'use client';
import { Package, Plus } from 'lucide-react';

export default function ProductCard({ product, onAdd }) {
    const inStock = product.stock > 0;
    
    return (
        <div
            onClick={() => onAdd(product)}
            style={{
                background: '#fff',
                borderRadius: '16px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                height: '170px',
                position: 'relative',
                transition: 'all 0.2s ease',
                overflow: 'hidden',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,130,246,0.12)';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {/* Icon + Name */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{
                    width: '36px',
                    height: '36px',
                    background: '#f1f5f9',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: '#94a3b8',
                }}>
                    <Package size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <p style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#1e293b',
                        lineHeight: '1.3',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        margin: 0,
                    }}>{product.name}</p>
                    <p style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#64748b',
                        marginTop: '2px',
                    }}>{product.userCode || product.code || product.id}</p>
                </div>
            </div>

            {/* Footer Area */}
            <div style={{
                marginTop: 'auto',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '10px',
            }}>
                {/* Stock info */}
                <div style={{ 
                    fontSize: '9px', 
                    fontWeight: 800, 
                    padding: '2px 8px', 
                    borderRadius: '6px',
                    display: 'inline-block',
                    marginBottom: '6px',
                    background: inStock ? '#f0fdf4' : '#fef2f2',
                    color: inStock ? '#16a34a' : '#dc2626',
                    border: inStock ? '1px solid #dcfce7' : '1px solid #fee2e2'
                }}>
                    {inStock ? `${Math.floor(product.stock)} disponibles` : 'Sin stock'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', marginRight: '4px' }}>S/</span>
                        {Number(product.price).toFixed(2)}
                    </div>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        background: '#eff6ff',
                        color: '#3b82f6',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}>
                        <Plus size={16} strokeWidth={3} />
                    </div>
                </div>
            </div>
        </div>
    );
}
