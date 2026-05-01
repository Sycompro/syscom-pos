'use client';

import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

function SignInContent() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch('/api/companies');
        const data = await res.json();
        if (Array.isArray(data)) {
          setCompanies(data);
          if (data.length > 0) setSelectedCompany(data[0]);
        }
      } catch (err) {
        console.error('Error fetching companies:', err);
      }
    };
    fetchCompanies();
  }, []);

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!selectedCompany) { setError('Por favor selecciona una empresa'); return; }
    setError('');
    setStep(2);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', {
        code: selectedCompany.code,
        username: username.trim(),
        password: password.trim(),
        redirect: false,
        callbackUrl: '/pos'
      });
      if (result?.error) {
        setError('Usuario o contraseña incorrectos');
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
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: '#f8fafc', margin: 0, padding: 0, overflow: 'hidden', fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}>
      
      {/* ── PANEL IZQUIERDO: Branding (Azul Profundo) ── */}
      <div style={{
        width: '45%',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '80px 60px',
        position: 'relative',
        color: '#fff',
        boxSizing: 'border-box'
      }}>
        {/* Elementos decorativos */}
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '-5%', width: '300px', height: '300px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '50%', filter: 'blur(60px)' }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '80px' }}>
            <div style={{ width: '60px', height: '60px', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>SyscomPro</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', letterSpacing: '0.2em', marginTop: '2px' }}>ERP CLOUD POS</div>
            </div>
          </div>

          <h1 style={{ fontSize: '56px', fontWeight: '900', lineHeight: '1.05', letterSpacing: '-2px', marginBottom: '32px' }}>
            Gestiona tu<br />
            <span style={{ color: '#38b2ac', background: 'linear-gradient(to right, #38b2ac, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>negocio</span> con<br />
            inteligencia.
          </h1>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', maxWidth: '400px' }}>
            La plataforma definitiva para el punto de venta moderno. Conexión nativa con tu sede central.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: '16px' }}>
           <div style={{ flex: 1, padding: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
             <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>SEGURIDAD</div>
             <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Cifrado SSL de punto a punto en cada venta.</div>
           </div>
           <div style={{ flex: 1, padding: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
             <div style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>MULTISEDE</div>
             <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Selección dinámica de sucursales en tiempo real.</div>
           </div>
        </div>
      </div>

      {/* ── PANEL DERECHO: Formulario (Blanco Limpio) ── */}
      <div style={{
        width: '55%',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        boxSizing: 'border-box'
      }}>
        <div style={{ width: '100%', maxWidth: '520px' }}>
          
          <div style={{ marginBottom: '48px' }}>
            <div style={{ fontSize: '12px', fontWeight: '900', color: '#94a3b8', letterSpacing: '0.2em', marginBottom: '16px', textTransform: 'uppercase' }}>Bienvenido de nuevo</div>
            <h2 style={{ fontSize: '42px', fontWeight: '900', color: '#0f172a', letterSpacing: '-1.5px', marginBottom: '12px' }}>
              {step === 1 ? 'Selecciona tu Empresa' : 'Credenciales'}
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', fontWeight: '500' }}>
              {step === 1 ? 'Elige la empresa de la lista oficial para continuar.' : `Ingresa tu acceso para ${selectedCompany?.name}`}
            </p>
          </div>

          {step === 1 && (
            <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '13px', fontWeight: '800', color: '#1e293b', letterSpacing: '0.05em' }}>EMPRESA / SEDE</label>
                <div style={{ position: 'relative' }}>
                  <select 
                    value={selectedCompany?.id || ''}
                    onChange={(e) => {
                      const comp = companies.find(c => c.id === parseInt(e.target.value));
                      setSelectedCompany(comp);
                    }}
                    style={{
                      width: '100%',
                      padding: '24px 28px',
                      borderRadius: '24px',
                      border: '2.5px solid #f1f5f9',
                      background: '#f8fafc',
                      color: '#0f172a',
                      fontSize: '18px',
                      fontWeight: '800',
                      appearance: 'none',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                    onBlur={(e) => e.target.style.borderColor = '#f1f5f9'}
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.id.toString().padStart(2, '0')} - {c.name}</option>
                    ))}
                  </select>
                  <div style={{ position: 'absolute', right: '28px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ background: '#fff1f2', color: '#e11d48', padding: '20px', borderRadius: '20px', fontSize: '14px', fontWeight: '800', border: '1px solid #ffe4e6' }}>
                  {error}
                </div>
              )}

              <button 
                type="submit"
                style={{
                  width: '100%',
                  padding: '24px',
                  borderRadius: '24px',
                  background: '#0f172a',
                  color: '#fff',
                  border: 'none',
                  fontSize: '20px',
                  fontWeight: '900',
                  cursor: 'pointer',
                  boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                Continuar
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Badge Seleccionado */}
              <div style={{ background: '#eff6ff', padding: '24px', borderRadius: '24px', border: '2px solid #dbeafe', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '900', color: '#3b82f6', letterSpacing: '0.1em' }}>EMPRESA SELECCIONADA</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#1e3a8a' }}>{selectedCompany?.name}</div>
                </div>
                <button type="button" onClick={() => setStep(1)} style={{ background: '#fff', border: 'none', padding: '8px 16px', borderRadius: '12px', color: '#3b82f6', fontWeight: '800', fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>Cambiar</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    required 
                    placeholder="Usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ width: '100%', padding: '22px 28px', borderRadius: '24px', border: '2.5px solid #f1f5f9', background: '#f8fafc', fontSize: '16px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    required 
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '22px 28px', borderRadius: '24px', border: '2.5px solid #f1f5f9', background: '#f8fafc', fontSize: '16px', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {error && (
                <div style={{ background: '#fff1f2', color: '#e11d48', padding: '20px', borderRadius: '20px', fontSize: '14px', fontWeight: '800', border: '1px solid #ffe4e6' }}>
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '24px',
                  borderRadius: '24px',
                  background: isLoading ? '#94a3b8' : '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  fontSize: '20px',
                  fontWeight: '900',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 20px 40px rgba(59, 130, 246, 0.25)',
                  transition: 'all 0.3s ease'
                }}
              >
                {isLoading ? 'Verificando...' : 'Entrar al POS'}
              </button>
            </form>
          )}

          <div style={{ marginTop: '60px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%' }} />
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#cbd5e1', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Conexión Protegida v3.0</div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        body { margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  );
}
