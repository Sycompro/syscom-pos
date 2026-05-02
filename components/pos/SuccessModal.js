'use client';
import { CheckCircle2, Receipt, Printer, ArrowRight } from 'lucide-react';

export default function SuccessModal({ orderNumber, onReset, onPrint }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)', zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
        }}>
            <div style={{
                background: '#fff', borderRadius: '24px', padding: '48px',
                maxWidth: '420px', width: '100%', textAlign: 'center',
                boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                    background: 'linear-gradient(to right, #10b981, #3b82f6, #8b5cf6)' }} />

                <div style={{
                    width: '72px', height: '72px', background: '#ecfdf5', borderRadius: '20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px', color: '#10b981',
                }}>
                    <CheckCircle2 size={36} strokeWidth={1.5} />
                </div>

                <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', margin: '0 0 6px' }}>¡Venta Exitosa!</h2>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 28px' }}>Documento generado y enviado a SUNAT</p>

                <div style={{
                    background: '#f8fafc', borderRadius: '16px', padding: '24px',
                    marginBottom: '24px', border: '1px solid #f1f5f9',
                    position: 'relative',
                }}>
                    <p style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '8px' }}>
                        N° Documento
                    </p>
                    <p style={{ fontSize: '32px', fontWeight: 900, color: '#3b82f6', margin: 0 }}>{orderNumber}</p>
                    <Receipt size={18} style={{ position: 'absolute', top: '14px', right: '14px', color: '#cbd5e1' }} />
                </div>

                <button onClick={onReset} style={{
                    width: '100%', background: '#0f172a', color: '#fff', border: 'none',
                    borderRadius: '14px', padding: '16px', fontSize: '15px', fontWeight: 800,
                    cursor: 'pointer', marginBottom: '10px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                    Nueva Venta <ArrowRight size={16} />
                </button>
                <button onClick={onPrint} style={{
                    width: '100%', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0',
                    borderRadius: '12px', padding: '12px', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}>
                    <Printer size={14} /> Imprimir
                </button>
            </div>
        </div>
    );
}
