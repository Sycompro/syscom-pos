'use client';
import { useState, useEffect } from 'react';
import { 
  Search, Plus, RefreshCw, Loader2, Edit2, X, Save, AlertCircle, Truck, Mail, Phone, MapPin 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SuppliersView() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');

  // Modal para Crear/Editar
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);
  
  // Datos del Formulario
  const [editingCodpro, setEditingCodpro] = useState(null); // Si es null, es modo Crear
  const [formNompro, setFormNompro] = useState('');
  const [formRucpro, setFormRucpro] = useState('');
  const [formDirpro, setFormDirpro] = useState('');
  const [formTelpro, setFormTelpro] = useState('');
  const [formEmail, setFormEmail] = useState('');

  const [windowWidth, setWindowWidth] = useState(1200);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // Cargar lista de proveedores
  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = searchTerm 
        ? `/api/suppliers/list?q=${encodeURIComponent(searchTerm)}` 
        : '/api/suppliers/list';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setSuppliers(data.suppliers || []);
      } else {
        throw new Error(data.error || 'Error al obtener proveedores');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [searchTerm]);

  // Abrir modal en modo crear
  const handleOpenCreateModal = () => {
    setEditingCodpro(null);
    setFormNompro('');
    setFormRucpro('');
    setFormDirpro('');
    setFormTelpro('');
    setFormEmail('');
    setModalError(null);
    setShowModal(true);
  };

  // Abrir modal en modo editar
  const handleOpenEditModal = (supplier) => {
    setEditingCodpro(supplier.codpro);
    setFormNompro(supplier.nompro);
    setFormRucpro(supplier.rucpro);
    setFormDirpro(supplier.dirpro);
    setFormTelpro(supplier.telpro);
    setFormEmail(supplier.email);
    setModalError(null);
    setShowModal(true);
  };

  // Enviar formulario (Crear o Editar)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setModalError(null);

    // Validaciones
    if (!formNompro.trim()) {
      setModalError("La Razón Social / Nombre es requerido.");
      return;
    }
    if (!formRucpro.trim()) {
      setModalError("El RUC o Documento es requerido.");
      return;
    }
    if (formRucpro.trim().length !== 11 && formRucpro.trim().length !== 8) {
      setModalError("El RUC debe tener 11 dígitos (o DNI de 8 dígitos).");
      return;
    }

    setModalLoading(true);
    try {
      const payload = {
        nompro: formNompro.trim(),
        rucpro: formRucpro.trim(),
        dirpro: formDirpro.trim(),
        telpro: formTelpro.trim(),
        email: formEmail.trim()
      };

      let res, data;

      if (editingCodpro) {
        // Modo Editar
        payload.codpro = editingCodpro;
        res = await fetch('/api/suppliers/update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Modo Crear
        res = await fetch('/api/suppliers/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      data = await res.json();
      if (data.success) {
        setShowModal(false);
        fetchSuppliers();
      } else {
        throw new Error(data.error || 'Fallo en la operación');
      }
    } catch (err) {
      console.error(err);
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      {/* Cabecera */}
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>Directorio de Proveedores</h2>
          <p style={subtitleStyle}>Administración y registro de proveedores en el maestro del ERP.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchSuppliers} style={refreshBtnStyle} disabled={loading} title="Actualizar lista">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleOpenCreateModal} style={addBtnStyle}>
            <Plus size={16} />
            <span>Nuevo Proveedor</span>
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div style={filtersContainerStyle}>
        <div style={searchWrapperStyle}>
          <Search size={16} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Buscar por Razón Social, RUC o Código..." 
            style={searchInputStyle}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Contenido Principal */}
      <div style={contentCardStyle}>
        {loading ? (
          <div style={loadingContainerStyle}>
            <Loader2 className="animate-spin" size={32} color="#3b82f6" />
            <p style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Cargando proveedores...</p>
          </div>
        ) : error ? (
          <div style={errorContainerStyle}>
            <p style={{ color: '#ef4444', fontWeight: 800 }}>Error al cargar datos</p>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 16px' }}>{error}</p>
            <button onClick={fetchSuppliers} style={retryBtnStyle}>Reintentar</button>
          </div>
        ) : suppliers.length === 0 ? (
          <div style={emptyContainerStyle}>
            <Truck size={48} color="#cbd5e1" />
            <p style={{ marginTop: '12px', fontWeight: 800, color: '#475569' }}>No se encontraron proveedores</p>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 16px' }}>No hay registros de proveedores en el ERP o no coinciden con la búsqueda.</p>
            <button onClick={handleOpenCreateModal} style={retryBtnStyle}>Agregar Primer Proveedor</button>
          </div>
        ) : (
          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Código ERP</th>
                  <th style={thStyle}>Razón Social</th>
                  <th style={thStyle}>RUC / Doc</th>
                  {!isMobile && <th style={thStyle}>Dirección</th>}
                  {!isMobile && <th style={thStyle}>Contacto</th>}
                  <th style={{ ...thStyle, textAlign: 'center', width: '80px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((sup, idx) => (
                  <tr key={idx} style={trStyle}>
                    <td style={{ ...tdStyle, fontWeight: 900, color: '#3b82f6' }}>
                      {sup.codpro}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: 850, color: '#0f172a' }}>{sup.nompro}</div>
                      {isMobile && (
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span>RUC: {sup.rucpro}</span>
                          {sup.dirpro && <span>Dir: {sup.dirpro}</span>}
                          {(sup.telpro || sup.email) && (
                            <span>{sup.telpro} {sup.email ? `• ${sup.email}` : ''}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700, color: '#475569' }}>
                      {sup.rucpro}
                    </td>
                    {!isMobile && (
                      <td style={{ ...tdStyle, color: '#475569', fontSize: '12px' }}>
                        {sup.dirpro ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={12} color="#64748b" style={{ flexShrink: 0 }} />
                            <span>{sup.dirpro}</span>
                          </div>
                        ) : '-'}
                      </td>
                    )}
                    {!isMobile && (
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px' }}>
                          {sup.telpro && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#334155', fontWeight: 600 }}>
                              <Phone size={11} color="#64748b" />
                              <span>{sup.telpro}</span>
                            </div>
                          )}
                          {sup.email && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}>
                              <Mail size={11} color="#94a3b8" />
                              <span>{sup.email}</span>
                            </div>
                          )}
                          {!sup.telpro && !sup.email && '-'}
                        </div>
                      </td>
                    )}
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button 
                        onClick={() => handleOpenEditModal(sup)}
                        style={editBtnStyle}
                        title="Editar proveedor"
                      >
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      <AnimatePresence>
        {showModal && (
          <div style={overlayStyle}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={modalStyle}
            >
              <div style={modalHeaderStyle}>
                <h3 style={modalTitleStyle}>
                  {editingCodpro ? `Editar Proveedor ERP: ${editingCodpro}` : 'Registrar Nuevo Proveedor'}
                </h3>
                <button onClick={() => setShowModal(false)} style={closeBtnStyle}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmitForm} style={formStyle}>
                {modalError && (
                  <div style={errorBannerStyle}>
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{modalError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* RUC */}
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>RUC / Documento Identidad</label>
                    <input 
                      type="text" 
                      placeholder="Ej. 20123456789 (11 dígitos)" 
                      value={formRucpro}
                      onChange={e => setFormRucpro(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={11}
                      required
                      style={inputStyle}
                    />
                  </div>

                  {/* Razón Social */}
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Razón Social o Nombre Completo</label>
                    <input 
                      type="text" 
                      placeholder="Nombre comercial o fiscal" 
                      value={formNompro}
                      onChange={e => setFormNompro(e.target.value)}
                      required
                      style={inputStyle}
                    />
                  </div>

                  {/* Dirección */}
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>Dirección Fiscal</label>
                    <input 
                      type="text" 
                      placeholder="Dirección del proveedor" 
                      value={formDirpro}
                      onChange={e => setFormDirpro(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  {/* Teléfono y Correo */}
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>Teléfono de Contacto</label>
                      <input 
                        type="text" 
                        placeholder="Ej. 987654321" 
                        value={formTelpro}
                        onChange={e => setFormTelpro(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div style={fieldGroupStyle}>
                      <label style={labelStyle}>Correo Electrónico</label>
                      <input 
                        type="email" 
                        placeholder="Ej. contacto@proveedor.com" 
                        value={formEmail}
                        onChange={e => setFormEmail(e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>

                <div style={modalFooterStyle}>
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    style={cancelBtnStyle}
                    disabled={modalLoading}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    style={modalLoading ? disabledSaveBtnStyle : saveBtnStyle}
                    disabled={modalLoading}
                  >
                    {modalLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        <span>Guardar Proveedor</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ESTILOS PORCELAIN / GLASSMORPHIC
const containerStyle = {
  padding: '24px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  background: '#f8fafc',
  overflowY: 'auto',
  width: '100%',
  maxWidth: '1400px',
  margin: '0 auto'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const titleStyle = {
  margin: 0,
  fontSize: '22px',
  fontWeight: 950,
  color: '#0f172a',
  letterSpacing: '-0.02em'
};

const subtitleStyle = {
  margin: '4px 0 0',
  color: '#64748b',
  fontSize: '11px',
  fontWeight: 500
};

const refreshBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '38px',
  height: '38px',
  borderRadius: '10px',
  background: '#fff',
  border: '1px solid #e2e8f0',
  color: '#475569',
  cursor: 'pointer',
  transition: 'all 0.2s',
  flexShrink: 0
};

const addBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 16px',
  borderRadius: '10px',
  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  color: '#fff',
  border: 'none',
  fontSize: '12px',
  fontWeight: 850,
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(15,23,42,0.1)',
  transition: 'all 0.2s'
};

const filtersContainerStyle = {
  display: 'flex',
  gap: '16px',
  alignItems: 'center'
};

const searchWrapperStyle = {
  flex: 1,
  maxWidth: '400px',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  background: '#fff',
  padding: '10px 14px',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
};

const searchInputStyle = {
  border: 'none',
  outline: 'none',
  width: '100%',
  fontSize: '12px',
  fontWeight: 650,
  color: '#1e293b',
  background: 'transparent'
};

const contentCardStyle = {
  flex: 1,
  background: '#fff',
  borderRadius: '20px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 20px -2px rgba(15,23,42,0.01)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  minHeight: '400px'
};

const loadingContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  padding: '50px'
};

const errorContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  padding: '50px',
  textAlign: 'center'
};

const retryBtnStyle = {
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '6px 12px',
  fontWeight: 700,
  fontSize: '12px',
  cursor: 'pointer'
};

const emptyContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  padding: '50px',
  textAlign: 'center'
};

const tableWrapperStyle = {
  width: '100%',
  overflowX: 'auto'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left'
};

const thStyle = {
  padding: '12px 16px',
  background: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
  color: '#475569',
  fontSize: '10px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const trStyle = {
  borderBottom: '1px solid #f1f5f9',
  transition: 'background-color 0.2s'
};

const tdStyle = {
  padding: '12px 16px',
  fontSize: '12px',
  color: '#334155',
  verticalAlign: 'middle'
};

const editBtnStyle = {
  border: '1px solid #e2e8f0',
  background: '#fff',
  color: '#475569',
  cursor: 'pointer',
  padding: '6px',
  borderRadius: '8px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s',
  boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
};

// Modal Styles
const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(15,23,42,0.3)',
  backdropFilter: 'blur(3px)',
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px'
};

const modalStyle = {
  background: '#ffffff',
  borderRadius: '20px',
  width: '100%',
  maxWidth: '500px',
  boxShadow: '0 20px 50px -12px rgba(15,23,42,0.12)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 20px',
  borderBottom: '1px solid #f1f5f9'
};

const modalTitleStyle = {
  margin: 0,
  fontSize: '14px',
  fontWeight: 900,
  color: '#1e293b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const closeBtnStyle = {
  border: 'none',
  background: 'transparent',
  color: '#64748b',
  cursor: 'pointer',
  padding: '4px',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const formStyle = {
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
};

const errorBannerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  background: '#fef2f2',
  border: '1px solid #fee2e2',
  color: '#b91c1c',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '11px',
  fontWeight: 750
};

const fieldGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
};

const labelStyle = {
  fontSize: '10px',
  fontWeight: 800,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const inputStyle = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '8px 12px',
  fontSize: '12px',
  color: '#334155',
  fontWeight: 650,
  outline: 'none',
  width: '100%'
};

const modalFooterStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  borderTop: '1px solid #f1f5f9',
  paddingTop: '16px',
  marginTop: '4px'
};

const cancelBtnStyle = {
  padding: '8px 16px',
  borderRadius: '8px',
  background: '#fff',
  border: '1px solid #e2e8f0',
  color: '#475569',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer'
};

const saveBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 16px',
  borderRadius: '8px',
  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  color: '#fff',
  border: 'none',
  fontSize: '12px',
  fontWeight: 850,
  cursor: 'pointer',
  boxShadow: '0 4px 10px rgba(37,99,235,0.15)'
};

const disabledSaveBtnStyle = {
  ...saveBtnStyle,
  background: '#cbd5e1',
  boxShadow: 'none',
  cursor: 'not-allowed'
};
