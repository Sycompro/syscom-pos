'use client';
import { Delete, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useEffect } from 'react';

export default function NumericKeypad({ isOpen, onClose, onKeyPress, onDelete, value = '' }) {
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isOpen && containerRef.current && !containerRef.current.contains(e.target)) {
                // Prevenimos que se cierre si el click fue dentro del elemento padre que disparó el evento (opcional, pero útil)
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
                    pointerEvents: 'none' // Para que no bloquee clics fuera del teclado
                }}
            >
                <motion.div 
                    ref={containerRef}
                    initial={{ opacity: 0, scale: 0.9, y: 15, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.9, y: 15, filter: 'blur(10px)' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        pointerEvents: 'auto', // Reactivar eventos solo en el teclado
                        width: '260px', // Tamaño reducido
                        // ESTILO APPLE VISION PRO (Crystal/Glass)
                        background: 'rgba(255, 255, 255, 0.08)', // Cristal puro ultra-transparente
                        backdropFilter: 'blur(50px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(50px) saturate(200%)',
                        borderRadius: '32px',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.3), inset 0 2px 6px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        padding: '16px', // Menor padding
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px' // Menor separación
                    }}
                >
                    {/* Display Superior (Texto Flotante) */}
                    <div style={{
                        width: '100%',
                        textAlign: 'center',
                        minHeight: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        paddingBottom: '10px'
                    }}>
                        <span style={{ 
                            fontSize: '18px',
                            fontWeight: 800, 
                            color: '#1e293b', 
                            letterSpacing: '2px',
                            textShadow: '0 1px 2px rgba(255,255,255,0.8)'
                        }}>
                            {value || <span style={{ color: 'rgba(30,41,59,0.3)' }}>...</span>}
                        </span>
                    </div>

                    {/* Botones Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '10px' // Separación reducida
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
                                        height: '46px',
                                        // Botones cristalizados claros
                                        background: isDel ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.4)',
                                        border: '1px solid rgba(255, 255, 255, 0.5)',
                                        borderRadius: '50px',
                                        fontSize: '18px',
                                        fontWeight: 600,
                                        color: isDel ? '#ef4444' : '#1e293b',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02), inset 0 2px 4px rgba(255,255,255,0.5)',
                                        transition: 'all 0.15s ease-out',
                                        userSelect: 'none'
                                    }}
                                    onMouseDown={e => {
                                        e.currentTarget.style.transform = 'scale(0.85)';
                                        e.currentTarget.style.background = isDel ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.8)';
                                    }}
                                    onMouseUp={e => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.background = isDel ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.4)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.background = isDel ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.4)';
                                    }}
                                >
                                    {isDel ? <Delete size={20} strokeWidth={2} /> : key}
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
                            height: '42px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '50px',
                            fontSize: '14px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 4px rgba(59,130,246,0.1)',
                            transition: 'all 0.15s ease-out',
                            userSelect: 'none'
                        }}
                        onMouseDown={e => {
                            e.currentTarget.style.transform = 'scale(0.95)';
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
                        }}
                        onMouseUp={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                        }}
                    >
                        <Check size={16} strokeWidth={2.5} />
                        Aceptar
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
