'use client';
import { LayoutGrid, ShoppingBag, Zap, Sparkles, History, Settings, LogOut } from 'lucide-react';

export default function Sidebar({ categories, selectedCategory, onSelectCategory, onSignOut }) {
    return (
        <aside style={{
            width: '68px',
            background: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '16px 0',
            gap: '4px',
            flexShrink: 0,
            zIndex: 40,
        }}>
            {/* Logo */}
            <div style={{
                width: '40px', height: '40px', background: '#3b82f6', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
            }}>
                <Zap size={18} style={{ color: '#fff', fill: '#fff' }} />
            </div>

            {/* Categorías */}
            <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', overflowY: 'auto' }}>
                {categories.map(cat => {
                    const Icon = cat.icon || LayoutGrid;
                    const isActive = selectedCategory === cat.id;
                    return (
                        <button key={cat.id} onClick={() => onSelectCategory(cat.id)} title={cat.name}
                            style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                                background: isActive ? '#3b82f6' : 'transparent',
                                color: isActive ? '#fff' : '#64748b',
                                border: 'none', cursor: 'pointer', transition: 'all 0.15s ease',
                                position: 'relative',
                            }}>
                            <Icon size={16} />
                            <span style={{ fontSize: '7px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                                {cat.name.length > 6 ? cat.name.slice(0, 5) : cat.name}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Bottom icons */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                {[History, Settings].map((Icon, i) => (
                    <button key={i} style={bottomBtnStyle}><Icon size={16} /></button>
                ))}
                <button onClick={onSignOut} style={{ ...bottomBtnStyle, color: '#f87171' }}>
                    <LogOut size={16} />
                </button>
            </div>
        </aside>
    );
}

const bottomBtnStyle = {
    width: '36px', height: '36px', borderRadius: '10px',
    background: 'transparent', border: 'none', color: '#475569',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
};
