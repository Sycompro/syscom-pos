'use client';
import { Delete, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

export default function NumericKeypad({ isOpen, onClose, onKeyPress, onDelete, value = '' }) {
    const [pos, setPos] = useState({ top: 'calc(100% + 8px)', left: 0, bottom: 'auto', right: 'auto' });
    const containerRef = useRef(null);

    // Calcular posición inteligente
    useEffect(() => {
        if (isOpen && containerRef.current) {
            const parent = containerRef.current.parentElement;
            if (parent) {
                const rect = parent.getBoundingClientRect();
                const windowH = window.innerHeight;
                const windowW = window.innerWidth;

                let newPos = { top: 'calc(100% + 8px)', left: 0, bottom: 'auto', right: 'auto' };

                if (rect.bottom + 400 > windowH) {
                    newPos.top = 'auto';
                    newPos.bottom = 'calc(100% + 8px)';
                }
                
                if (rect.left + 300 > windowW) {
                    newPos.left = 'auto';
                    newPos.right = 0;
                }

                setPos(newPos);
            }
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isOpen && containerRef.current) {
                const parent = containerRef.current.parentElement;
                if (!containerRef.current.contains(e.target) && parent && !parent.contains(e.target)) {
                    onClose();
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const keys = [
        '1', '2', '3',
        '4', '5', '6',
        '7', '8', '9',
        '.', '0', 'DEL'
    ];

    return (
        <AnimatePresence>
            <motion.div 
                ref={containerRef}
                initial={{ opacity: 0, scale: 0.9, y: pos.top !== 'auto' ? -15 : 15, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.9, y: pos.top !== 'auto' ? -15 : 15, filter: 'blur(10px)' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'absolute',
                    top: pos.top,
                    bottom: pos.bottom,
                    left: pos.left,
                    right: pos.right,
                    width: '300px',
                    // ESTILO APPLE VISION PRO (Spatial UI)
                    background: 'rgba(50, 50, 50, 0.45)', // Cristal oscuro translúcido
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    borderRadius: '36px',
                    boxShadow: '0 30px 60px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    zIndex: 9999
                }}
            >
                {/* Display Superior (Texto Flotante) */}
                <div style={{
                    width: '100%',
                    textAlign: 'center',
                    minHeight: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    paddingBottom: '12px'
                }}>
                    <span style={{ 
                        fontSize: '22px', 
                        fontWeight: 400, 
                        color: '#ffffff', 
                        letterSpacing: '2px',
                        textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                    }}>
                        {value || <span style={{ color: 'rgba(255,255,255,0.4)' }}>...</span>}
                    </span>
                </div>

                {/* Botones Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px'
                }}>
                    {keys.map((key) => {
                        const isDel = key === 'DEL';
                        return (
                            <button
                                key={key}
                                onClick={(e) => {
                                    e.preventDefault();
                                    if (isDel) onDelete();
                                    else onKeyPress(key);
                                }}
                                style={{
                                    height: '56px',
                                    // Botones semitransparentes como en VisionOS
                                    background: isDel ? 'rgba(255, 60, 60, 0.3)' : 'rgba(255, 255, 255, 0.15)',
                                    border: 'none',
                                    borderRadius: '50px', // Botones ovalados/circulares
                                    fontSize: '22px',
                                    fontWeight: 400, // Fuente limpia y no tan gruesa
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)',
                                    transition: 'all 0.15s ease-out',
                                    userSelect: 'none'
                                }}
                                onMouseDown={e => {
                                    e.currentTarget.style.transform = 'scale(0.85)';
                                    e.currentTarget.style.background = isDel ? 'rgba(255, 60, 60, 0.6)' : 'rgba(255, 255, 255, 0.4)';
                                }}
                                onMouseUp={e => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.background = isDel ? 'rgba(255, 60, 60, 0.3)' : 'rgba(255, 255, 255, 0.15)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.background = isDel ? 'rgba(255, 60, 60, 0.3)' : 'rgba(255, 255, 255, 0.15)';
                                }}
                            >
                                {isDel ? <Delete size={22} strokeWidth={2} /> : key}
                            </button>
                        );
                    })}
                </div>
                
                {/* Barra de acción inferior / Espaciador (Estilo Apple Space/Enter) */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onClose();
                    }}
                    style={{
                        width: '100%',
                        height: '48px',
                        background: 'rgba(255, 255, 255, 0.25)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '50px',
                        fontSize: '15px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3)',
                        transition: 'all 0.15s ease-out',
                        userSelect: 'none'
                    }}
                    onMouseDown={e => {
                        e.currentTarget.style.transform = 'scale(0.95)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                    }}
                    onMouseUp={e => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                    }}
                >
                    <Check size={18} strokeWidth={2.5} />
                    Aceptar
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
