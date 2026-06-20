'use client';
import { useEffect, useState, useRef } from 'react';
import { X, Camera } from 'lucide-react';

export default function BarcodeScannerModal({ isOpen, onClose, onScanSuccess }) {
    const [scannerActive, setScannerActive] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const scannerRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        let html5QrcodeScanner;
        
        // Importar html5-qrcode dinámicamente solo en el cliente
        import('html5-qrcode').then((module) => {
            const { Html5Qrcode } = module;
            
            html5QrcodeScanner = new Html5Qrcode("scanner-reader");
            scannerRef.current = html5QrcodeScanner;

            const qrCodeSuccessCallback = (decodedText, decodedResult) => {
                // Emitir sonido simple si está permitido por el navegador
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)();
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.frequency.setValueAtTime(800, ctx.currentTime);
                    gain.gain.setValueAtTime(0.2, ctx.currentTime);
                    osc.start();
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                    osc.stop(ctx.currentTime + 0.1);
                } catch (e) {}

                onScanSuccess(decodedText);
                handleStopScanner();
            };

            const config = { 
                fps: 15, 
                qrbox: (width, height) => {
                    const min = Math.min(width, height);
                    // Caja rectangular optimizada para códigos de barra largos y QR
                    return { width: Math.round(min * 0.8), height: Math.round(min * 0.5) };
                },
                aspectRatio: 1.0
            };

            html5QrcodeScanner.start(
                { facingMode: "environment" },
                config,
                qrCodeSuccessCallback,
                (errorMessage) => {
                    // Ignorar mensajes de escaneo repetitivos sin éxito
                }
            )
            .then(() => {
                setScannerActive(true);
                setErrorMsg('');
            })
            .catch((err) => {
                console.error("Error al iniciar cámara:", err);
                setErrorMsg("No se pudo acceder a la cámara. Asegúrese de otorgar permisos.");
            });
        }).catch((err) => {
            console.error("Error al cargar html5-qrcode:", err);
            setErrorMsg("No se pudo cargar el módulo de escaneo.");
        });

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(e => console.error("Error al apagar cámara en cleanup:", e));
            }
        };
    }, [isOpen]);

    const handleStopScanner = () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop()
                .then(() => {
                    setScannerActive(false);
                    onClose();
                })
                .catch((err) => {
                    console.error("Error al detener cámara:", err);
                    onClose();
                });
        } else {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
        }}>
            <div style={{
                background: '#fff',
                width: '100%',
                maxWidth: '420px',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Cabecera del Modal */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    borderBottom: '1px solid #f1f5f9'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Camera size={20} style={{ color: '#3b82f6' }} />
                        <span style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', fontFamily: "'Outfit', sans-serif" }}>Escáner de Barra / QR</span>
                    </div>
                    <button
                        onClick={handleStopScanner}
                        style={{
                            border: 'none',
                            background: '#f1f5f9',
                            color: '#64748b',
                            cursor: 'pointer',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                        onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Contenedor del Lector de Cámara */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div 
                        id="scanner-reader" 
                        style={{ 
                            width: '100%', 
                            maxWidth: '320px', 
                            height: '320px', 
                            background: '#0f172a', 
                            borderRadius: '12px',
                            overflow: 'hidden'
                        }}
                    ></div>
                    
                    {errorMsg ? (
                        <p style={{ fontSize: '12px', color: '#ef4444', fontWeight: 700, textAlign: 'center', margin: 0 }}>
                            {errorMsg}
                        </p>
                    ) : (
                        <p style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textAlign: 'center', margin: 0, lineHeight: '1.4' }}>
                            Enfoque el código de barras o código QR en el recuadro para buscar el producto de forma automática.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
