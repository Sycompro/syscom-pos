'use client';
import { Delete, Check, Space } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

export default function AlphanumericKeyboard({ isOpen, onClose, onKeyPress, onDelete, value = '' }) {
    const containerRef = useRef(null);
    const [isUpper, setIsUpper] = useState(true);
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

    const rows = [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ñ'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '-']
    ];

    const handleKey = (key) => {
        if (key === '') return;
        const finalKey = isUpper ? key.toUpperCase() : key.toLowerCase();
        onKeyPress(finalKey);
    };

    return (
        <AnimatePresence>
            <div 
                style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: isMobile ? 8 : 24,
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    padding: '8px'
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
                    initial={{ opacity: 0, y: 120, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: 120, filter: 'blur(10px)' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 280 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        pointerEvents: 'auto',
                        width: '100%',
                        maxWidth: '850px',
                        // DISEÑO PREMIUM CLARO (Porcelain Glass UI)
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(25px) saturate(190%)',
                        WebkitBackdropFilter: 'blur(25px) saturate(190%)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.8)',
                        // SOMBRAS PREMIUM MULTI-CAPA
                        boxShadow: `
                            0 4px 6px -1px rgba(15, 23, 42, 0.03),
                            0 10px 20px -3px rgba(15, 23, 42, 0.05),
                            0 25px 40px -10px rgba(15, 23, 42, 0.08),
                            inset 0 1px 0 rgba(255, 255, 255, 0.9)
                        `,
                        padding: isMobile ? '10px 10px 14px' : '16px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: isMobile ? '5px' : '7px',
                        boxSizing: 'border-box'
                    }}
                >
                    {/* Indicador superior estético */}
                    <div style={{
                        width: '32px',
                        height: '4px',
                        background: '#e2e8f0',
                        borderRadius: '2px',
                        alignSelf: 'center',
                        marginBottom: '4px',
                        opacity: 0.8
                    }} />

                    {/* Display */}
                    <div style={{
                        width: '100%',
                        textAlign: 'center',
                        paddingBottom: '8px',
                        borderBottom: '1px solid #f1f5f9',
                        marginBottom: '4px'
                    }}>
                        <span style={{ 
                            fontSize: isMobile ? '15px' : '18px',
                            fontWeight: 700, 
                            color: '#0f172a', 
                            letterSpacing: '0.5px'
                        }}>
                            {value || <span style={{ color: '#cbd5e1', fontWeight: 400 }}>Escribe aquí...</span>}
                        </span>
                    </div>

                    {/* Filas de letras */}
                    {rows.map((row, i) => (
                        <div key={i} style={{ display: 'flex', gap: isMobile ? '4px' : '6px', justifyContent: 'center' }}>
                            {row.map(key => {
                                const isDummy = key === '';
                                if (isDummy) return null;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => handleKey(key)}
                                        style={{
                                            ...getKeyStyle(isMobile),
                                            background: '#ffffff',
                                            border: '1px solid #e2e8f0',
                                            color: '#1e293b'
                                        }}
                                        // Efecto click PC
                                        onMouseDown={e => {
                                            e.currentTarget.style.transform = 'scale(0.9)';
                                            e.currentTarget.style.background = '#f1f5f9';
                                        }}
                                        onMouseUp={e => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.background = '#ffffff';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.background = '#ffffff';
                                        }}
                                        // Soporte táctil móvil
                                        onTouchStart={e => {
                                            e.currentTarget.style.transform = 'scale(0.9)';
                                            e.currentTarget.style.background = '#f1f5f9';
                                        }}
                                        onTouchEnd={e => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                            e.currentTarget.style.background = '#ffffff';
                                        }}
                                    >
                                        {isUpper ? key : key.toLowerCase()}
                                    </button>
                                );
                            })}
                        </div>
                    ))}

                    {/* Fila inferior (Controles especiales) */}
                    <div style={{ display: 'flex', gap: isMobile ? '4px' : '6px', justifyContent: 'center', marginTop: '4px' }}>
                        {/* MAYÚSCULAS */}
                        <button 
                            onClick={() => setIsUpper(!isUpper)}
                            style={{ 
                                ...getKeyStyle(isMobile), 
                                width: isMobile ? '50px' : '90px', 
                                fontSize: isMobile ? '10px' : '12px',
                                flex: 'initial',
                                background: isUpper ? 'rgba(59, 130, 246, 0.08)' : '#ffffff', 
                                border: isUpper ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid #e2e8f0',
                                color: isUpper ? '#2563eb' : '#475569',
                                fontWeight: 750
                            }}
                            onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)'; }}
                            onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                            onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.92)'; }}
                            onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                        >
                            {isUpper ? 'MAYÚS' : 'minús'}
                        </button>
                        
                        {/* ESPACIO */}
                        <button 
                            onClick={() => onKeyPress(' ')}
                            style={{ 
                                ...getKeyStyle(isMobile),
                                flex: 1.5,
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                color: '#475569'
                            }}
                            onMouseDown={e => {
                                e.currentTarget.style.transform = 'scale(0.95)';
                                e.currentTarget.style.background = '#f8fafc';
                            }}
                            onMouseUp={e => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.background = '#ffffff';
                            }}
                            onTouchStart={e => {
                                e.currentTarget.style.transform = 'scale(0.95)';
                                e.currentTarget.style.background = '#f8fafc';
                            }}
                            onTouchEnd={e => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.background = '#ffffff';
                            }}
                        >
                            <Space size={isMobile ? 18 : 20} />
                        </button>

                        {/* BORRAR (DEL) */}
                        <button 
                            onClick={onDelete}
                            style={{ 
                                ...getKeyStyle(isMobile), 
                                width: isMobile ? '50px' : '90px', 
                                flex: 'initial',
                                background: 'rgba(239, 68, 68, 0.07)', 
                                border: 'none',
                                color: '#ef4444'
                            }}
                            onMouseDown={e => {
                                e.currentTarget.style.transform = 'scale(0.92)';
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                            }}
                            onMouseUp={e => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.07)';
                            }}
                            onTouchStart={e => {
                                e.currentTarget.style.transform = 'scale(0.92)';
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                            }}
                            onTouchEnd={e => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.07)';
                            }}
                        >
                            <Delete size={isMobile ? 18 : 20} />
                        </button>

                        {/* ACEPTAR (CHECK) */}
                        <button 
                            onClick={onClose}
                            style={{ 
                                ...getKeyStyle(isMobile), 
                                width: isMobile ? '65px' : '110px', 
                                flex: 'initial',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
                                color: '#ffffff',
                                border: 'none',
                                boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)'
                            }}
                            onMouseDown={e => {
                                e.currentTarget.style.transform = 'scale(0.95)';
                                e.currentTarget.style.filter = 'brightness(0.95)';
                            }}
                            onMouseUp={e => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.filter = 'none';
                            }}
                            onTouchStart={e => {
                                e.currentTarget.style.transform = 'scale(0.95)';
                                e.currentTarget.style.filter = 'brightness(0.95)';
                            }}
                            onTouchEnd={e => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.filter = 'none';
                            }}
                        >
                            <Check size={isMobile ? 18 : 20} strokeWidth={2.5} />
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

// Generador de estilos de teclas reactivos
const getKeyStyle = (isMobile) => ({
    flex: 1,
    minWidth: isMobile ? '22px' : '40px',
    height: isMobile ? '42px' : '48px',
    borderRadius: isMobile ? '8px' : '12px',
    fontSize: isMobile ? '13px' : '16px',
    fontWeight: 650,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
    transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    userSelect: 'none',
    outline: 'none',
    WebkitTapHighlightColor: 'transparent'
});
