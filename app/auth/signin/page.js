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
        setError('Acceso denegado: Usuario o clave incorrectos');
        setIsLoading(false);
      } else {
        router.push('/pos');
        router.refresh();
      }
    } catch {
      setError('Error de comunicación con el servidor');
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      width: '100vw', 
      background: '#ffffff', 
      margin: 0, 
      padding: 0, 
      overflow: 'hidden', 
      fontFamily: "'Outfit', 'Inter', sans-serif" 
    }}>
      
      {/* ── PANEL IZQUIERDO: Branding Dinámico ── */}
      <div style={{
        width: '42%',
        background: 'linear-gradient(165deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '60px',
        position: 'relative',
        color: '#fff',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '500px', height: '500px', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '50%', filter: 'blur(100px)' }} />
        <div style={{ position: 'absolute', bottom: '-5%', left: '-5%', width: '300px', height: '300px', background: 'rgba(20, 184, 166, 0.12)', borderRadius: '50%', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '30px 30px' }} />

        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '60px' }}>
            <div style={{ 
              width: '56px', height: '56px', 
              background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', 
              borderRadius: '20px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 30px rgba(59, 130, 246, 0.4)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px', color: '#fff' }}>SyscomPro</div>
              <div style={{ fontSize: '11px', color: '#67e8f9', fontWeight: '800', letterSpacing: '0.25em', textTransform: 'uppercase', marginTop: '2px' }}>Cloud ERP Solution</div>
            </div>
          </div>

          <div style={{ maxWidth: '440px' }}>
            <h1 style={{ fontSize: '48px', fontWeight: '900', lineHeight: '1.1', letterSpacing: '-2px', marginBottom: '28px', color: '#fff' }}>
              El POS del <br />
              <span style={{ color: '#2dd4bf' }}>futuro</span> está aquí.
            </h1>
            <p style={{ fontSize: '17px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6', fontWeight: '500' }}>
              Gestión inteligente de ventas, inventarios y sucursales en un solo lugar. Conectividad nativa y segura.
            </p>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 10 }}>
           <div style={{ 
             padding: '24px', 
             background: 'rgba(255,255,255,0.03)', 
             borderRadius: '28px', 
             border: '1px solid rgba(255,255,255,0.06)',
             backdropFilter: 'blur(10px)',
             display: 'flex',
             alignItems: 'center',
             gap: '20px'
           }}>
             <div style={{ width: '48px', height: '48px', background: 'rgba(45, 212, 191, 0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
             </div>
             <div>
               <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>Conexión Encriptada</div>
               <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Túnel de datos activo y protegido.</div>
             </div>
           </div>
        </div>
      </div>

      {/* ── PANEL DERECHO: Formulario ── */}
      <div style={{
        width: '58%',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        boxSizing: 'border-box'
      }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          
          <div style={{ marginBottom: '52px' }}>
            <div style={{ display: 'inline-block', padding: '6px 14px', background: '#f1f5f9', borderRadius: '10px', fontSize: '11px', fontWeight: '900', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '24px' }}>Acceso al Sistema</div>
            <h2 style={{ fontSize: '40px', fontWeight: '900', color: '#0f172a', letterSpacing: '-1.5px', marginBottom: '14px' }}>
              {step === 1 ? 'Hola, elige tu sede' : 'Casi terminamos'}
            </h2>
            <p style={{ fontSize: '16px', color: '#64748b', fontWeight: '500' }}>
              {step === 1 ? 'Selecciona la empresa para iniciar tu jornada.' : 'Ingresa tus credenciales de acceso.'}
            </p>
          </div>

          {step === 1 && (
            <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '800', color: '#94a3b8', letterSpacing: '0.05em' }}>EMPRESA / SEDE</label>
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
                      padding: '22px 28px',
                      borderRadius: '24px',
                      border: '2px solid #e2e8f0',
                      background: '#f8fafc',
                      color: '#0f172a', // Texto oscuro explícito
                      fontSize: '17px',
                      fontWeight: '700',
                      appearance: 'none',
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                  >
                    {loadingCompanies ? (
                      <option>Cargando empresas...</option>
                    ) : companies.length === 0 ? (
                      <option>Sin empresas disponibles</option>
                    ) : (
                      companies.map(c => (
                        <option key={c.id} value={c.id} style={{ color: '#0f172a' }}>{c.name}</option>
                      ))
                    )}
                  </select>
                  <div style={{ position: 'absolute', right: '28px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#3b82f6' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', color: '#ef4444', padding: '18px 24px', borderRadius: '20px', fontSize: '14px', fontWeight: '700', border: '1px solid #fee2e2' }}>
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={loadingCompanies || companies.length === 0}
                style={{
                  width: '100%',
                  padding: '22px',
                  borderRadius: '24px',
                  background: '#0f172a',
                  color: '#fff',
                  border: 'none',
                  fontSize: '18px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 20px 40px rgba(15, 23, 42, 0.2)',
                  transition: 'all 0.3s'
                }}
              >
                Continuar
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              
              <div style={{ background: '#eff6ff', padding: '24px', borderRadius: '28px', border: '2px solid #bae6fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                   <div style={{ fontSize: '10px', fontWeight: '900', color: '#0369a1', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Sede Activa</div>
                   <div style={{ fontSize: '17px', fontWeight: '800', color: '#0c4a6e' }}>{selectedCompany?.name}</div>
                </div>
                <button type="button" onClick={() => setStep(1)} style={{ background: '#fff', border: 'none', padding: '10px 18px', borderRadius: '14px', color: '#0ea5e9', fontWeight: '800', fontSize: '12px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}>Cambiar</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <input 
                    type="text" 
                    required 
                    placeholder="Usuario de la sede"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '22px 24px 22px 64px', 
                      borderRadius: '24px', 
                      border: '2.5px solid #f1f5f9', 
                      background: '#f8fafc', 
                      color: '#0f172a', // TEXTO OSCURO OBLIGATORIO
                      fontSize: '16px', 
                      fontWeight: '700', 
                      outline: 'none', 
                      boxSizing: 'border-box',
                      transition: 'all 0.3s'
                    }}
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  </div>
                  <input 
                    type="password" 
                    required 
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '22px 24px 22px 64px', 
                      borderRadius: '24px', 
                      border: '2.5px solid #f1f5f9', 
                      background: '#f8fafc', 
                      color: '#0f172a', // TEXTO OSCURO OBLIGATORIO
                      fontSize: '16px', 
                      fontWeight: '700', 
                      outline: 'none', 
                      boxSizing: 'border-box',
                      transition: 'all 0.3s'
                    }}
                  />
                </div>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', color: '#ef4444', padding: '18px 24px', borderRadius: '20px', fontSize: '14px', fontWeight: '700', border: '1px solid #fee2e2' }}>
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '22px',
                  borderRadius: '24px',
                  background: isLoading ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: '#fff',
                  border: 'none',
                  fontSize: '18px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 20px 40px rgba(37, 99, 235, 0.2)',
                  transition: 'all 0.3s'
                }}
              >
                {isLoading ? 'Verificando...' : 'Acceder al POS'}
              </button>
            </form>
          )}

          <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%' }} />
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#cbd5e1', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Conexión Protegida · Syscom Cloud</div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        body { margin: 0; padding: 0; background: #fff; }
        input::placeholder { color: #94a3b8; }
        input:focus { border-color: #3b82f6 !important; background: #fff !important; }
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
