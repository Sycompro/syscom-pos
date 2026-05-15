'use client';
import { Delete } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NumericKeypad({ isOpen, onClose, onKeyPress, onDelete }) {
    if (!isOpen) return null;

    const keys = [
        '1', '2', '3',
        '4', '5', '6',
        '7', '8', '9',
        '00', '0', 'DEL'
    ];

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: 0,
                    width: '280px', // un poco más ancho que el input
                    background: '#ffffff',
                    borderRadius: '16px',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
                    border: '1px solid #e2e8f0',
                    padding: '16px',
                    zIndex: 50,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '10px'
                }}
            >
                {keys.map((key) => (
                    <button
                        key={key}
                        onClick={(e) => {
                            e.preventDefault();
                            if (key === 'DEL') onDelete();
                            else onKeyPress(key);
                        }}
                        style={{
                            height: '56px',
                            background: key === 'DEL' ? '#fee2e2' : '#f8fafc',
                            border: '1px solid',
                            borderColor: key === 'DEL' ? '#fecaca' : '#f1f5f9',
                            borderRadius: '12px',
                            fontSize: '22px',
                            fontWeight: 800,
                            color: key === 'DEL' ? '#ef4444' : '#1e293b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.1s'
                        }}
                        onMouseDown={e => {
                            e.currentTarget.style.transform = 'scale(0.92)';
                            e.currentTarget.style.background = key === 'DEL' ? '#fca5a5' : '#e2e8f0';
                        }}
                        onMouseUp={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.background = key === 'DEL' ? '#fee2e2' : '#f8fafc';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.background = key === 'DEL' ? '#fee2e2' : '#f8fafc';
                        }}
                    >
                        {key === 'DEL' ? <Delete size={24} /> : key}
                    </button>
                ))}
                
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onClose();
                    }}
                    style={{
                        gridColumn: '1 / -1',
                        height: '44px',
                        background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
                        color: '#4f46e5',
                        border: '1px solid #c7d2fe',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    OCULTAR TECLADO
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
