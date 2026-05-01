'use client';

import { useState } from 'react';
import { Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleVerifyCode = (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('El código de empresa es obligatorio'); return; }
    setError('');
    setStep(2);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', {
        code: code.trim(),
        username: username.trim(),
        password: password.trim(),
        redirect: false,
        callbackUrl: '/pos'
      });
      if (result?.error) {
        setError('Código, usuario o contraseña incorrectos');
        setIsLoading(false);
      } else {
        router.push('/pos');
        router.refresh();
      }
    } catch {
      setError('Ocurrió un error de conexión');
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', fontFamily: "'Inter', 'Segoe UI', sans-serif", overflow: 'hidden' }}>

      {/* ── PANEL IZQUIERDO: Branding ── */}
      <div style={{
        width: '45%',
        background: 'linear-gradient(145deg, #1e3a5f 0%, #0f2744 40%, #0a1e36 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 52px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Círculos decorativos */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(99,179,237,0.08)' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(56,178,172,0.10)' }} />
        <div style={{ position: 'absolute', top: '40%', right: '10%', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(99,179,237,0.05)' }} />

        {/* Logo y nombre */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '52px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #38b2ac 0%, #319795 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(56,178,172,0.4)',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px', lineHeight: '1' }}>SyscomPro</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginTop: '3px', letterSpacing: '0.05em' }}>PUNTO DE VENTA</div>
            </div>
          </div>

          <h1 style={{ fontSize: '40px', fontWeight: '800', color: '#fff', lineHeight: '1.15', marginBottom: '20px', letterSpacing: '-1px' }}>
            Sistema de<br />
            <span style={{ color: '#38b2ac' }}>ventas</span> moderno<br />
            para tu negocio
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.7', maxWidth: '340px' }}>
            Gestiona tus ventas, productos e inventario desde cualquier dispositivo con conexión directa a tu sede.
          </p>
        </div>

        {/* Tarjetas de características */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          {[
            { icon: '⚡', label: 'Ventas rápidas', desc: 'Procesa en segundos' },
            { icon: '🔐', label: 'Multi-sede', desc: 'Conexión por código de empresa' },
            { icon: '📊', label: 'Reportes en vivo', desc: 'Histórico y resumen diario' },
          ].map((f) => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '14px 18px', borderRadius: '14px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: '10px',
            }}>
              <span style={{ fontSize: '22px' }}>{f.icon}</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>{f.label}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{f.desc}</div>
              </div>
            </div>
          ))}
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '24px', letterSpacing: '0.08em' }}>
            SYSCOM PRO VENTAS v2.0 · TODOS LOS DERECHOS RESERVADOS
          </p>
        </div>
      </div>

      {/* ── PANEL DERECHO: Formulario ── */}
      <div style={{
        width: '55%',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        position: 'relative',
      }}>
        {/* Sutiles formas de fondo */}
        <div style={{ position: 'absolute', top: '0', right: '0', width: '300px', height: '300px', background: 'linear-gradient(225deg, rgba(56,178,172,0.06) 0%, transparent 70%)', borderRadius: '0 0 0 100%' }} />
        <div style={{ position: 'absolute', bottom: '0', left: '0', width: '250px', height: '250px', background: 'linear-gradient(45deg, rgba(30,58,95,0.05) 0%, transparent 70%)', borderRadius: '0 100% 0 0' }} />

        <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 2 }}>

          {/* Indicador de pasos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px' }}>
            {[1, 2].map((s) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: step >= s ? 'linear-gradient(135deg, #1e3a5f, #0f2744)' : '#e2e8f0',
                  color: step >= s ? '#fff' : '#94a3b8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: '700',
                  boxShadow: step >= s ? '0 4px 12px rgba(30,58,95,0.3)' : 'none',
                  transition: 'all 0.3s ease',
                }}>
                  {step > s ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                  ) : s}
                </div>
                <span style={{ fontSize: '13px', fontWeight: '500', color: step >= s ? '#1e3a5f' : '#94a3b8', transition: 'all 0.3s' }}>
                  {s === 1 ? 'Empresa' : 'Acceso'}
                </span>
                {s < 2 && (
                  <div style={{ width: '48px', height: '2px', borderRadius: '2px', background: step >= 2 ? '#38b2ac' : '#e2e8f0', margin: '0 4px', transition: 'all 0.3s' }} />
                )}
              </div>
            ))}
          </div>

          {/* Título */}
          <div style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#0f2744', letterSpacing: '-0.8px', marginBottom: '8px', lineHeight: '1.2' }}>
              {step === 1 ? 'Código de empresa' : 'Credenciales de acceso'}
            </h2>
            <p style={{ fontSize: '15px', color: '#64748b' }}>
              {step === 1
                ? 'Ingresa el código único de tu empresa para continuar'
                : 'Ingresa tu usuario y contraseña de la sede'}
            </p>
          </div>

          {/* PASO 1: Código */}
          {step === 1 && (
            <form onSubmit={handleVerifyCode}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', letterSpacing: '0.02em' }}>
                  CÓDIGO DE EMPRESA
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="Ej: gimobile24"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    style={{
                      width: '100%', height: '56px', borderRadius: '14px',
                      border: error ? '2px solid #fc8181' : '2px solid #e2e8f0',
                      background: '#fff', color: '#0f2744',
                      fontSize: '15px', paddingLeft: '48px', paddingRight: '16px',
                      outline: 'none', boxSizing: 'border-box',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      transition: 'all 0.2s',
                      fontFamily: 'inherit',
                    }}
                    onFocus={(e) => { e.target.style.border = '2px solid #38b2ac'; e.target.style.boxShadow = '0 0 0 4px rgba(56,178,172,0.12)'; }}
                    onBlur={(e) => { e.target.style.border = error ? '2px solid #fc8181' : '2px solid #e2e8f0'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                  />
                </div>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '12px', marginBottom: '20px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  <span style={{ fontSize: '13px', color: '#c53030', fontWeight: '500' }}>{error}</span>
                </div>
              )}

              <button type="submit" style={{
                width: '100%', height: '56px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%)',
                color: '#fff', fontSize: '15px', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: '0 8px 24px rgba(15,39,68,0.28)',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(15,39,68,0.36)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,39,68,0.28)'; }}
              >
                Verificar empresa
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </form>
          )}

          {/* PASO 2: Credenciales */}
          {step === 2 && (
            <form onSubmit={handleLogin}>
              {/* Badge empresa */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 18px', borderRadius: '14px',
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                border: '1.5px solid #86efac',
                marginBottom: '24px',
              }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', letterSpacing: '0.08em', marginBottom: '2px' }}>EMPRESA VERIFICADA</div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#14532d' }}>{code}</div>
                </div>
                <button type="button" onClick={() => { setStep(1); setError(''); }}
                  style={{ fontSize: '12px', color: '#16a34a', background: 'rgba(22,163,74,0.12)', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px', fontWeight: '600', fontFamily: 'inherit' }}>
                  Cambiar
                </button>
              </div>

              {/* Usuario */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', letterSpacing: '0.02em' }}>USUARIO</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <input type="text" required autoFocus placeholder="Tu usuario" value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ width: '100%', height: '52px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#fff', color: '#0f2744', fontSize: '15px', paddingLeft: '48px', paddingRight: '16px', outline: 'none', boxSizing: 'border-box', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', fontFamily: 'inherit' }}
                    onFocus={(e) => { e.target.style.border = '2px solid #38b2ac'; e.target.style.boxShadow = '0 0 0 4px rgba(56,178,172,0.12)'; }}
                    onBlur={(e) => { e.target.style.border = '2px solid #e2e8f0'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px', letterSpacing: '0.02em' }}>CONTRASEÑA</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  </div>
                  <input type="password" required placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', height: '52px', borderRadius: '12px', border: '2px solid #e2e8f0', background: '#fff', color: '#0f2744', fontSize: '15px', paddingLeft: '48px', paddingRight: '16px', outline: 'none', boxSizing: 'border-box', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', fontFamily: 'inherit' }}
                    onFocus={(e) => { e.target.style.border = '2px solid #38b2ac'; e.target.style.boxShadow = '0 0 0 4px rgba(56,178,172,0.12)'; }}
                    onBlur={(e) => { e.target.style.border = '2px solid #e2e8f0'; e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                  />
                </div>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '12px', marginBottom: '20px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  <span style={{ fontSize: '13px', color: '#c53030', fontWeight: '500' }}>{error}</span>
                </div>
              )}

              <button type="submit" disabled={isLoading} style={{
                width: '100%', height: '56px', borderRadius: '14px', border: 'none',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                background: isLoading ? '#cbd5e1' : 'linear-gradient(135deg, #38b2ac 0%, #319795 100%)',
                color: '#fff', fontSize: '15px', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: isLoading ? 'none' : '0 8px 24px rgba(56,178,172,0.35)',
                transition: 'all 0.2s', fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(56,178,172,0.45)'; } }}
              onMouseLeave={(e) => { if (!isLoading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(56,178,172,0.35)'; } }}
              >
                {isLoading ? (
                  <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <>
                    Ingresar al POS
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer del formulario */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Conexión segura · SyscomPro ERP</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <svg style={{ animation: 'spin 1s linear infinite' }} width="40" height="40" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#38b2ac" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <p style={{ marginTop: '16px', color: '#64748b', fontSize: '14px' }}>Cargando...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
