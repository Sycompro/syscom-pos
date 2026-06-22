'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export default function QuickModal({ 
    show, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    type = 'info', // 'info', 'success', 'warning', 'error', 'prompt'
    inputValue,
    onInputChange,
    placeholder = 'Ingrese valor...',
    showButtons = true
}) {
    if (!show) return null;

    const icons = {
        info: <Info className="text-blue-500" size={32} />,
        success: <CheckCircle2 className="text-emerald-500" size={32} />,
        warning: <AlertCircle className="text-amber-500" size={32} />,
        error: <AlertCircle className="text-rose-500" size={32} />,
        prompt: <Info className="text-indigo-500" size={32} />
    };

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                background: 'rgba(15, 23, 42, 0.6)',
                backdropFilter: 'blur(8px)'
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    style={{
                        background: '#fff',
                        borderRadius: '24px',
                        padding: '32px',
                        width: '100%',
                        maxWidth: '400px',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        position: 'relative',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                >
                    <button 
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: '#f8fafc',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '8px',
                            cursor: 'pointer',
                            color: '#64748b'
                        }}
                    >
                        <X size={18} />
                    </button>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
                        <div style={{ 
                            background: '#f8fafc', 
                            padding: '16px', 
                            borderRadius: '20px',
                            marginBottom: '8px'
                        }}>
                            {icons[type]}
                        </div>

                        <div style={{ width: '100%' }}>
                            <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
                                {title}
                            </h3>
                            <p style={{ fontSize: '14px', color: '#64748b', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                                {message}
                            </p>
                        </div>

                        {type === 'prompt' && (
                            <div style={{ width: '100%', marginTop: '8px' }}>
                                <input 
                                    autoFocus
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => onInputChange(e.target.value)}
                                    placeholder={placeholder}
                                    onKeyDown={(e) => e.key === 'Enter' && onConfirm()}
                                    style={{
                                        width: '100%',
                                        padding: '14px 18px',
                                        borderRadius: '14px',
                                        border: '2px solid #e2e8f0',
                                        fontSize: '16px',
                                        fontWeight: 700,
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                        textAlign: 'center'
                                    }}
                                    onFocus={(e) => {
                                        e.target.select();
                                        e.target.style.borderColor = '#6366f1';
                                    }}
                                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                                />
                            </div>
                        )}

                        {showButtons && (
                            <div style={{ 
                                display: 'flex', 
                                gap: '12px', 
                                width: '100%', 
                                marginTop: '12px' 
                            }}>
                                <button 
                                    onClick={onClose}
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        borderRadius: '14px',
                                        border: 'none',
                                        background: '#f1f5f9',
                                        color: '#64748b',
                                        fontSize: '14px',
                                        fontWeight: 800,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={onConfirm}
                                    style={{
                                        flex: 2,
                                        padding: '14px',
                                        borderRadius: '14px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                        color: '#fff',
                                        fontSize: '14px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)'
                                    }}
                                >
                                    Confirmar
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
