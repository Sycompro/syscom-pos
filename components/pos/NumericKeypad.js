'use client';
import { Delete, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

export default function NumericKeypad({ isOpen, onClose, onKeyPress, onDelete, value = '' }) {
    const containerRef = useRef(null);
    const [windowWidth, setWindowWidth] = useState(1280);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setWindowWidth(window.innerWidth);
            const handleResize = () => setWindowWidth(window.innerWidth);
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isOpen && containerRef.current && !containerRef.current.contains(e.target)) {
                const parent = containerRef.current.parentElement;
                if (!parent || (parent && !parent.contains(e.target))) {
                    onClose();
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const isMobile = windowWidth < 768;

    const keys = [
        '1', '2', '3',
        '4', '5', '6',
        '7', '8', '9',
        '.', '0', 'DEL'
    ];

    return (
        <AnimatePresence>
            <div 
                style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    padding: '16px'
                }}
            >
                {/* Backdrop sutil */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        pointerEvents: 'auto',
                        zIndex: -1
                    }}
                    onClick={onClose}
                />

                <motion.div 
                    ref={containerRef}
                    initial={{ opacity: 0, scale: 0.92, y: 20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.92, y: 20, filter: 'blur(10px)' }}
                    transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        pointerEvents: 'auto',
                        width: '100%',
                        maxWidth: isMobile ? '330px' : '290px',
                        // DISEÑO PREMIUM CLARO (Porcelain Glass UI)
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px) saturate(190%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(190%)',
                        borderRadius: '28px',
                        border: '1px solid rgba(255, 255, 255, 0.8)',
                        // SOMBRAS SUAVES Y ELEGANTES MULTI-CAPA
                        boxShadow: `
                            0 4px 6px -1px rgba(15, 23, 42, 0.03), 
                            0 10px 20px -3px rgba(15, 23, 42, 0.05),
                            0 20px 30px -8px rgba(15, 23, 42, 0.08),
                            0 30px 60px -15px rgba(15, 23, 42, 0.12),
                            inset 0 1px 0 rgba(255, 255, 255, 0.9)
                        `,
                        padding: isMobile ? '24px' : '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: isMobile ? '16px' : '14px',
                        boxSizing: 'border-box'
                    }}
                >
                    {/* Indicador superior estético (estilo iOS) */}
                    <div style={{
                        width: '36px',
                        height: '4px',
                        background: '#e2e8f0',
                        borderRadius: '2px',
                        alignSelf: 'center',
                        marginBottom: '-4px',
                        opacity: 0.8
                    }} />

                    {/* Display de Visualización */}
                    <div style={{
                        width: '100%',
                        textAlign: 'center',
                        minHeight: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottom: '1px solid #f1f5f9',
                        paddingBottom: '12px'
                    }}>
                        <span style={{ 
                            fontSize: isMobile ? '24px' : '22px',
                            fontWeight: 750, 
                            color: '#0f172a', 
                            letterSpacing: '1px'
                        }}>
                            {value || <span style={{ color: '#cbd5e1', fontWeight: 400 }}>...</span>}
                        </span>
                    </div>
 
                    {/* Teclas numéricas */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: isMobile ? '14px' : '12px'
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
                                        height: isMobile ? '58px' : '52px',
                                        background: isDel ? 'rgba(239, 68, 68, 0.07)' : '#ffffff',
                                        border: isDel ? 'none' : '1px solid #f1f5f9',
                                        borderRadius: '16px',
                                        fontSize: isMobile ? '22px' : '20px',
                                        fontWeight: 650,
                                        color: isDel ? '#ef4444' : '#1e293b',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: isDel ? 'none' : '0 2px 4px rgba(15, 23, 42, 0.02)',
                                        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                                        userSelect: 'none',
                                        outline: 'none',
                                        WebkitTapHighlightColor: 'transparent'
                                    }}
                                    // Eventos de animación de clic para PC
                                    onMouseDown={e => {
                                        e.currentTarget.style.transform = 'scale(0.92)';
                                        e.currentTarget.style.background = isDel ? 'rgba(239, 68, 68, 0.15)' : '#f8fafc';
                                    }}
                                    onMouseUp={e => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.background = isDel ? 'rgba(239, 68, 68, 0.07)' : '#ffffff';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.background = isDel ? 'rgba(239, 68, 68, 0.07)' : '#ffffff';
                                    }}
                                    // Soporte Táctil Inmediato para Móviles
                                    onTouchStart={e => {
                                        e.currentTarget.style.transform = 'scale(0.92)';
                                        e.currentTarget.style.background = isDel ? 'rgba(239, 68, 68, 0.15)' : '#f8fafc';
                                    }}
                                    onTouchEnd={e => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.background = isDel ? 'rgba(239, 68, 68, 0.07)' : '#ffffff';
                                    }}
                                >
                                    {isDel ? <Delete size={isMobile ? 24 : 22} strokeWidth={2.2} /> : key}
                                </button>
                            );
                        })}
                    </div>
                    
                    {/* Botón Aceptar */}
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onClose();
                        }}
                        style={{
                            width: '100%',
                            height: isMobile ? '52px' : '46px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '16px',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                            userSelect: 'none',
                            outline: 'none',
                            WebkitTapHighlightColor: 'transparent'
                        }}
                        onMouseDown={e => {
                            e.currentTarget.style.transform = 'scale(0.97)';
                            e.currentTarget.style.filter = 'brightness(0.95)';
                        }}
                        onMouseUp={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.filter = 'none';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.filter = 'none';
                        }}
                        onTouchStart={e => {
                            e.currentTarget.style.transform = 'scale(0.97)';
                            e.currentTarget.style.filter = 'brightness(0.95)';
                        }}
                        onTouchEnd={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.filter = 'none';
                        }}
                    >
                        <Check size={isMobile ? 20 : 18} strokeWidth={2.5} />
                        Aceptar
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
