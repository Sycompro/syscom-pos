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
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const res = await fetch('/api/companies');
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setCompanies(data);
          setSelectedCompany(data[0]);
        } else {
          setCompanies([]);
        }
      } catch (err) {
        console.error('Error fetching companies:', err);
      } finally {
        setLoadingCompanies(false);
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
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: '#f8fafc', margin: 0, padding: 0, overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* ── PANEL IZQUIERDO ── */}
      <div style={{
        width: '40%',
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px',
        position: 'relative',
        color: '#fff',
        boxSizing: 'border-box'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
            <div style={{ width: '48px', height: '48px', background: '#3b82f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            </div>
            <span style={{ fontSize: '20px', fontWeight: '800' }}>SyscomPro POS</span>
          </div>

          <h1 style={{ fontSize: '38px', fontWeight: '800', lineHeight: '1.2', marginBottom: '24px' }}>
            Tu negocio,<br />
            en tus manos.
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6', maxWidth: '300px' }}>
            Plataforma optimizada para tablets y gestión de ventas multisede.
          </p>
        </div>
      </div>

      {/* ── PANEL DERECHO ── */}
      <div style={{
        width: '60%',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        boxSizing: 'border-box'
      }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          
          <div style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
              {step === 1 ? 'Iniciar Acceso' : 'Credenciales'}
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              {step === 1 ? 'Selecciona la empresa para comenzar.' : `Acceso para ${selectedCompany?.name}`}
            </p>
          </div>

          {step === 1 && (
            <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>EMPRESA / SEDE</label>
                <div style={{ position: 'relative' }}>
                  <select 
                    value={selectedCompany?.id || ''}
                    onChange={(e) => {
                      const comp = companies.find(c => c.id === parseInt(e.target.value));
                      setSelectedCompany(comp);
                    }}
                    disabled={loadingCompanies}
                    style={{
                      width: '100%',
                      padding: '18px 20px',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      color: '#0f172a',
                      fontSize: '16px',
                      fontWeight: '600',
                      appearance: 'none',
                      outline: 'none',
                    }}
                  >
                    {loadingCompanies ? (
                      <option>Cargando empresas...</option>
                    ) : companies.length === 0 ? (
                      <option>No se encontraron empresas</option>
                    ) : (
                      companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))
                    )}
                  </select>
                  <div style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#94a3b8' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: '600' }}>{error}</div>
              )}

              <button 
                type="submit"
                disabled={loadingCompanies || companies.length === 0}
                style={{
                  width: '100%',
                  padding: '18px',
                  borderRadius: '16px',
                  background: '#0f172a',
                  color: '#fff',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  opacity: (loadingCompanies || companies.length === 0) ? 0.5 : 1
                }}
              >
                Continuar
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{selectedCompany?.name}</span>
                <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#3b82f6', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>Cambiar</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input 
                  type="text" 
                  required 
                  placeholder="Usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ width: '100%', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '15px', fontWeight: '600', boxSizing: 'border-box' }}
                />
                <input 
                  type="password" 
                  required 
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '15px', fontWeight: '600', boxSizing: 'border-box' }}
                />
              </div>

              {error && (
                <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: '600' }}>{error}</div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '18px',
                  borderRadius: '16px',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {isLoading ? 'Verificando...' : 'Entrar al POS'}
              </button>
            </form>
          )}
        </div>
      </div>
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
