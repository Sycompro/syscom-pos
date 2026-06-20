'use client';
import { Package, Plus } from 'lucide-react';

export default function ProductCard({ product, onAdd, isMobileDevice }) {
    const inStock = product.stock > 0;
    const isDark = false;

    const cardBg = isDark ? '#1e222d' : '#fff';
    const cardBorder = isDark ? '1px solid #2d323f' : '1px solid #e2e8f0';
    const textColor = isDark ? '#f1f5f9' : '#1e293b';
    const codeColor = isDark ? '#94a3b8' : '#64748b';
    const iconBg = isDark ? '#2d323f' : '#f1f5f9';
    const iconColor = isDark ? '#94a3b8' : '#94a3b8';
    const priceColor = isDark ? '#f1f5f9' : '#0f172a';
    const stockBg = inStock ? (isDark ? '#143a28' : '#f0fdf4') : (isDark ? '#641e16' : '#fef2f2');
    const stockColor = inStock ? (isDark ? '#58d68d' : '#16a34a') : (isDark ? '#ec7063' : '#dc2626');
    const stockBorder = inStock ? (isDark ? '1px solid #196f3d' : '1px solid #dcfce7') : (isDark ? '1px solid #922b21' : '1px solid #fee2e2');
    const addBg = isDark ? '#2d323f' : 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)';
    const addColor = isDark ? '#60a5fa' : '#3b82f6';
    const addShadow = isDark ? 'none' : '0 2px 6px rgba(59, 130, 246, 0.15)';
    
    return (
        <div
            onClick={() => onAdd(product)}
            style={{
                background: cardBg,
                borderRadius: '12px',
                border: cardBorder,
                padding: '10px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                height: '145px',
                position: 'relative',
                transition: 'all 0.2s ease',
                overflow: 'hidden',
                boxShadow: isDark ? '0 4px 6px rgba(0, 0, 0, 0.15)' : '0 2px 10px rgba(0,0,0,0.02)'
            }}
            onMouseEnter={e => {
                if (isDark) return;
                e.currentTarget.style.borderColor = '#8b5cf6';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(139, 92, 246, 0.15)';
                e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={e => {
                if (isDark) return;
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {/* Icon + Name */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <div style={{
                    width: '28px',
                    height: '28px',
                    background: iconBg,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: iconColor,
                }}>
                    <Package size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <p style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: textColor,
                        lineHeight: '1.3',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        margin: 0,
                    }}>{product.name}</p>
                    <p style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        color: codeColor,
                        marginTop: '2px',
                    }}>{product.userCode || product.code || product.id}</p>
                </div>
            </div>

            {/* Footer Area */}
            <div style={{
                marginTop: 'auto',
                borderTop: isDark ? '1px solid #2d323f' : '1px solid #f1f5f9',
                paddingTop: '6px',
            }}>
                {/* Stock info */}
                <div style={{ 
                    fontSize: '8px', 
                    fontWeight: 800, 
                    padding: '1px 6px', 
                    borderRadius: '6px',
                    display: 'inline-block',
                    marginBottom: '4px',
                    background: stockBg,
                    color: stockColor,
                    border: stockBorder
                }}>
                    {inStock ? `${Math.floor(product.stock)} disponibles` : 'Sin stock'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: priceColor }}>
                        <span style={{ fontSize: '10px', color: codeColor, marginRight: '4px' }}>S/</span>
                        {Number(product.price).toFixed(2)}
                    </div>
                    <div style={{
                        width: '26px',
                        height: '26px',
                        background: addBg,
                        color: addColor,
                        borderRadius: '6px',
                        boxShadow: addShadow,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}>
                        <Plus size={12} strokeWidth={3} />
                    </div>
                </div>
            </div>
        </div>
    );
}
