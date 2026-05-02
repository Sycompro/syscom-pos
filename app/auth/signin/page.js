'use client';

import { useState, useEffect, Suspense } from 'react';
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
    <div className="login-container">
      
      {/* ── PANEL IZQUIERDO: Branding (Solo PC) ── */}
      <div className="branding-panel">
        <div className="gradient-glow-1" />
        <div className="gradient-glow-2" />
        <div className="grid-overlay" />

        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '60px' }}>
            <div className="logo-box">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.5px', color: '#fff' }}>SyscomPro</div>
              <div style={{ fontSize: '11px', color: '#67e8f9', fontWeight: '800', letterSpacing: '0.25em', textTransform: 'uppercase', marginTop: '2px' }}>Cloud ERP Solution</div>
            </div>
          </div>

          <div style={{ maxWidth: '440px' }}>
            <h1 className="hero-title">
              El POS del <br />
              <span style={{ color: '#2dd4bf' }}>futuro</span> está aquí.
            </h1>
            <p className="hero-subtitle">
              Gestión inteligente de ventas, inventarios y sucursales en un solo lugar. Conectividad nativa y segura.
            </p>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 10 }}>
           <div className="security-badge">
             <div className="security-icon">
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
      <div className="form-panel">
        <div style={{ width: '100%', maxWidth: '480px' }}>
          
          <div style={{ marginBottom: '52px' }}>
            <div className="status-label">Acceso al Sistema</div>
            <h2 className="form-title">
              {step === 1 ? 'Hola, elige tu empresa' : 'Acceso a la sede'}
            </h2>
            <p className="form-subtitle">
              {step === 1 ? 'Selecciona la empresa para iniciar tu jornada.' : 'Ingresa tus credenciales para la sede.'}
            </p>
          </div>

          {step === 1 && (
            <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <label className="input-label">EMPRESA / SEDE</label>
                <div style={{ position: 'relative' }}>
                  <select 
                    value={selectedCompany?.id || ''}
                    onChange={(e) => {
                      const comp = companies.find(c => String(c.id) === String(e.target.value));
                      setSelectedCompany(comp);
                    }}
                    disabled={loadingCompanies}
                    className="custom-select"
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
                  <div className="select-arrow">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              {error && <div className="error-box">{error}</div>}

              <button type="submit" disabled={loadingCompanies || companies.length === 0} className="submit-btn">
                Continuar
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              
              <div className="active-company-box">
                <div>
                   <div className="active-label">Sede Activa</div>
                   <div className="active-name">{selectedCompany?.name}</div>
                </div>
                <button type="button" onClick={() => setStep(1)} className="change-btn">Cambiar</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <div className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <input 
                    type="text" 
                    required 
                    placeholder="Usuario de la sede"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="custom-input"
                  />
                </div>
                <div style={{ position: 'relative' }}>
                  <div className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  </div>
                  <input 
                    type="password" 
                    required 
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="custom-input"
                  />
                </div>
              </div>

              {error && <div className="error-box">{error}</div>}

              <button type="submit" disabled={isLoading} className="login-btn">
                {isLoading ? 'Verificando...' : 'Acceder al POS'}
              </button>
            </form>
          )}

          <div className="protected-footer">
            <div className="status-dot" />
            <div className="status-text">Conexión Protegida · Syscom Cloud</div>
          </div>

        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
        
        body { margin: 0; padding: 0; background: #fff; overflow-x: hidden; font-family: 'Outfit', sans-serif; }
        
        .login-container {
          display: flex;
          min-height: 100vh;
          width: 100vw;
          background: #fff;
        }

        .branding-panel {
          width: 42%;
          background: linear-gradient(165deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 60px;
          position: relative;
          color: #fff;
          box-sizing: border-box;
          overflow: hidden;
        }

        .form-panel {
          width: 58%;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px;
          box-sizing: border-box;
        }

        @media (max-width: 1024px) {
          .branding-panel { display: none !important; }
          .form-panel { width: 100% !important; padding: 40px 24px; }
        }

        .gradient-glow-1 { position: absolute; top: -10%; right: -10%; width: 500px; height: 500px; background: rgba(99, 102, 241, 0.15); border-radius: 50%; filter: blur(100px); }
        .gradient-glow-2 { position: absolute; bottom: -5%; left: -5%; width: 300px; height: 300px; background: rgba(20, 184, 166, 0.12); border-radius: 50%; filter: blur(80px); }
        .grid-overlay { position: absolute; inset: 0; opacity: 0.05; background-image: radial-gradient(#fff 1px, transparent 0); background-size: 30px 30px; }

        .logo-box { 
          width: 56px; height: 56px; 
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%); 
          border-radius: 20px; 
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 12px 30px rgba(59, 130, 246, 0.4);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .hero-title { font-size: 48px; font-weight: 900; line-height: 1.1; letter-spacing: -2px; margin-bottom: 28px; color: #fff; }
        .hero-subtitle { font-size: 17px; color: rgba(255,255,255,0.45); line-height: 1.6; font-weight: 500; }

        .security-badge { 
          padding: 24px; 
          background: rgba(255,255,255,0.03); 
          border-radius: 28px; 
          border: 1px solid rgba(255,255,255,0.06);
          backdrop-filter: blur(10px);
          display: flex; align-items: center; gap: 20px;
        }

        .security-icon { width: 48px; height: 48px; background: rgba(45, 212, 191, 0.1); border-radius: 14px; display: flex; align-items: center; justify-content: center; }

        .status-label { display: inline-block; padding: 6px 14px; background: #f1f5f9; border-radius: 10px; font-size: 11px; font-weight: 900; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px; }
        .form-title { font-size: 40px; font-weight: 900; color: #0f172a; letter-spacing: -1.5px; margin-bottom: 14px; }
        .form-subtitle { font-size: 16px; color: #64748b; font-weight: 500; }

        .input-label { font-size: 12px; font-weight: 800; color: #94a3b8; letter-spacing: 0.05em; }
        
        .custom-select {
          width: 100%;
          padding: 22px 28px;
          border-radius: 24px;
          border: 2px solid #e2e8f0;
          background: #f8fafc;
          color: #0f172a;
          font-size: 17px;
          font-weight: 700;
          appearance: none;
          outline: none;
          cursor: pointer;
          transition: all 0.3s;
        }
        .custom-select:focus { border-color: #3b82f6; background: #fff; }

        .select-arrow { position: absolute; right: 28px; top: 50%; transform: translateY(-50%); pointer-events: none; color: #3b82f6; }

        .submit-btn, .login-btn {
          width: 100%;
          padding: 22px;
          border-radius: 24px;
          background: #0f172a;
          color: #fff;
          border: none;
          font-size: 18px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
          transition: all 0.3s;
        }
        .submit-btn:hover, .login-btn:hover { transform: translateY(-2px); box-shadow: 0 25px 50px rgba(15, 23, 42, 0.3); }

        .login-btn { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); box-shadow: 0 20px 40px rgba(37, 99, 235, 0.2); }

        .active-company-box { background: #eff6ff; padding: 24px; border-radius: 28px; border: 2px solid #bae6fd; display: flex; justify-content: space-between; align-items: center; }
        .active-label { font-size: 10px; font-weight: 900; color: #0369a1; letter-spacing: 0.1em; text-transform: uppercase; }
        .active-name { font-size: 17px; font-weight: 800; color: #0c4a6e; }
        .change-btn { background: #fff; border: none; padding: 10px 18px; border-radius: 14px; color: #0ea5e9; font-weight: 800; font-size: 12px; cursor: pointer; box-shadow: 0 8px 20px rgba(0,0,0,0.05); }

        .custom-input { 
          width: 100%; 
          padding: 22px 24px 22px 64px; 
          border-radius: 24px; 
          border: 2.5px solid #f1f5f9; 
          background: #f8fafc; 
          color: #0f172a; 
          font-size: 16px; 
          font-weight: 700; 
          outline: none; 
          box-sizing: border-box;
          transition: all 0.3s;
        }
        .custom-input:focus { border-color: #3b82f6; background: #fff; }

        .input-icon { position: absolute; left: 24px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        
        .error-box { background: #fef2f2; color: #ef4444; padding: 18px 24px; border-radius: 20px; font-size: 14px; font-weight: 700; border: 1px solid #fee2e2; }

        .protected-footer { margin-top: 50px; display: flex; justify-content: center; align-items: center; gap: 10px; }
        .status-dot { width: 10px; height: 10px; background: #10b981; border-radius: 50%; }
        .status-text { font-size: 11px; font-weight: 800; color: #cbd5e1; letter-spacing: 0.2em; text-transform: uppercase; }

        input::placeholder { color: #94a3b8; }
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
