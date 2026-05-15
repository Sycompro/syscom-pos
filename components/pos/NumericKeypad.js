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
            <div 
                style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }} 
                onClick={onClose}
            >
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        width: '340px',
                        background: '#ffffff',
                        borderRadius: '24px',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
                        border: '1px solid #e2e8f0',
                        padding: '24px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '12px'
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
            </div>
        </AnimatePresence>
    );
}
