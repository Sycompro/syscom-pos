'use client';
import { useState, useEffect } from 'react';
import { 
  FolderPlus, FolderOpen, Layers, Tag, Search, Plus, 
  Loader2, Check, AlertCircle, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClassificationsManager({ mode = 'classifications' }) {
  const [activeCategory, setActiveCategory] = useState(mode === 'brands' ? 'brand' : 'family'); // 'family' | 'subfamily' | 'group' | 'brand'

  useEffect(() => {
    setActiveCategory(mode === 'brands' ? 'brand' : 'family');
  }, [mode]);
  
  // Datos cargados
  const [data, setData] = useState({
    families: [],
    subfamilies: [],
    groups: [],
    brands: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Formulario de Creación
  const [formName, setFormName] = useState('');
  const [selectedFamilyId, setSelectedFamilyId] = useState('');
  const [selectedSubfamilyId, setSelectedSubfamilyId] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Buscador de lista existente
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMetadata = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/products/metadata');
      if (!res.ok) throw new Error('No se pudo obtener la información del ERP');
      const json = await res.json();
      setData({
        families: json.families || [],
        subfamilies: json.subfamilies || [],
        groups: json.groups || [],
        brands: json.brands || []
      });
    } catch (err) {
      console.error('[ClassificationsManager] Fetch Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Reset de formularios cuando cambia de categoría
  useEffect(() => {
    setFormName('');
    setSelectedFamilyId('');
    setSelectedSubfamilyId('');
    setSaveError(null);
    setSaveSuccess(false);
    setSearchTerm('');
  }, [activeCategory]);

  // Filtrado en cascada para el formulario de Grupo
  const subfamiliesForSelectedFamily = data.subfamilies.filter(
    sub => sub.familyId === selectedFamilyId
  );

  // Crear la clasificación
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    // Validar requerimientos dependientes
    if (activeCategory === 'subfamily' && !selectedFamilyId) {
      setSaveError('Debe seleccionar una Familia para enlazar la Subfamilia');
      return;
    }
    if (activeCategory === 'group' && (!selectedFamilyId || !selectedSubfamilyId)) {
      setSaveError('Debe seleccionar Familia y Subfamilia para enlazar el Giro Tipo / Grupo');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const payload = {
        type: activeCategory,
        name: formName.trim(),
        familyId: selectedFamilyId || undefined,
        subfamilyId: selectedSubfamilyId || undefined
      };

      const res = await fetch('/api/products/create-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Error al guardar la clasificación');

      setSaveSuccess(true);
      setFormName('');
      
      // Volver a cargar la metadata actualizada
      await fetchMetadata();
      
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);

    } catch (err) {
      console.error('[ClassificationsManager] Save Error:', err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Obtener lista a mostrar según la pestaña activa y término de búsqueda
  const getFilteredList = () => {
    let list = [];
    if (activeCategory === 'family') list = data.families;
    else if (activeCategory === 'subfamily') {
      // Cruzamos con el nombre de la familia para una vista detallada
      list = data.subfamilies.map(sub => {
        const fam = data.families.find(f => f.id === sub.familyId);
        return { ...sub, parentName: fam ? fam.name : 'Desconocido' };
      });
    } else if (activeCategory === 'group') {
      // Cruzamos con subfamilia y familia
      list = data.groups.map(grp => {
        const sub = data.subfamilies.find(s => s.id === grp.subfamilyId);
        const fam = data.families.find(f => f.id === grp.familyId);
        return {
          ...grp,
          parentName: `${fam ? fam.name : 'ND'} > ${sub ? sub.name : 'ND'}`
        };
      });
    } else if (activeCategory === 'brand') list = data.brands;

    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(item => 
      item.name.toLowerCase().includes(term) || 
      item.id.toLowerCase().includes(term) ||
      (item.parentName && item.parentName.toLowerCase().includes(term))
    );
  };

  const filteredList = getFilteredList();

  return (
    <div style={containerStyle}>
      {/* Tabs superiores premium */}
      {mode !== 'brands' && (
        <div style={tabsHeaderStyle}>
          <button 
            type="button"
            onClick={() => setActiveCategory('family')}
            style={{ ...tabBtnStyle, ...((activeCategory === 'family') ? activeTabStyle : {}) }}
          >
            <FolderPlus size={16} />
            <span>Familias</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveCategory('subfamily')}
            style={{ ...tabBtnStyle, ...((activeCategory === 'subfamily') ? activeTabStyle : {}) }}
          >
            <FolderOpen size={16} />
            <span>Subfamilias</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveCategory('group')}
            style={{ ...tabBtnStyle, ...((activeCategory === 'group') ? activeTabStyle : {}) }}
          >
            <Layers size={16} />
            <span>Giros Tipos (Grupos)</span>
          </button>
        </div>
      )}

      {loading && data.families.length === 0 ? (
        <div style={loadingContainerStyle}>
          <Loader2 className="animate-spin" size={32} color="#3b82f6" />
          <p style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Cargando estructura maestro del ERP...</p>
        </div>
      ) : error ? (
        <div style={errorContainerStyle}>
          <AlertCircle size={32} color="#ef4444" />
          <p style={{ color: '#ef4444', fontWeight: 800, marginTop: '8px' }}>Error al conectar con el ERP</p>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 16px' }}>{error}</p>
          <button type="button" onClick={fetchMetadata} style={retryBtnStyle}>Reintentar</button>
        </div>
      ) : (
        <div style={workspaceStyle}>
          
          {/* COLUMNA IZQUIERDA: Formulario */}
          <div style={formCardStyle}>
            <h3 style={sectionTitleStyle}>
              {activeCategory === 'family' && 'Registrar Nueva Familia'}
              {activeCategory === 'subfamily' && 'Registrar Nueva Subfamilia'}
              {activeCategory === 'group' && 'Registrar Nuevo Giro Tipo (Grupo)'}
              {activeCategory === 'brand' && 'Registrar Nueva Marca'}
            </h3>
            <p style={sectionSubtitleStyle}>El sistema asignará automáticamente el código correlativo contable del ERP.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              
              {/* Dependencia Familia (para Subfamilia y Grupo) */}
              {(activeCategory === 'subfamily' || activeCategory === 'group') && (
                <div>
                  <label style={labelStyle}>Familia de Enlace *</label>
                  <select
                    required
                    value={selectedFamilyId}
                    onChange={e => {
                      setSelectedFamilyId(e.target.value);
                      setSelectedSubfamilyId(''); // Reset subfamilia al cambiar familia
                    }}
                    style={inputStyle}
                  >
                    <option value="">Seleccione Familia...</option>
                    {data.families.map(fam => (
                      <option key={fam.id} value={fam.id}>{fam.name} ({fam.id})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Dependencia Subfamilia (para Grupo) */}
              {activeCategory === 'group' && (
                <div>
                  <label style={labelStyle}>Subfamilia de Enlace *</label>
                  <select
                    required
                    disabled={!selectedFamilyId}
                    value={selectedSubfamilyId}
                    onChange={e => setSelectedSubfamilyId(e.target.value)}
                    style={{ 
                      ...inputStyle,
                      background: !selectedFamilyId ? '#f8fafc' : '#fff',
                      cursor: !selectedFamilyId ? 'not-allowed' : 'default'
                    }}
                  >
                    <option value="">
                      {!selectedFamilyId ? 'Seleccione Familia primero...' : 'Seleccione Subfamilia...'}
                    </option>
                    {subfamiliesForSelectedFamily.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.id})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Campo Nombre descriptivo */}
              <div>
                <label style={labelStyle}>Nombre descriptivo *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ingrese el nombre en mayúsculas..."
                  value={formName}
                  onChange={e => setFormName(e.target.value.toUpperCase())}
                  style={inputStyle}
                />
              </div>

              {/* Alertas */}
              <AnimatePresence>
                {saveError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    style={errorAlertStyle}
                  >
                    <AlertCircle size={14} style={{ marginRight: '8px', flexShrink: 0 }} />
                    <span>{saveError}</span>
                  </motion.div>
                )}

                {saveSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    style={successAlertStyle}
                  >
                    <Check size={14} style={{ marginRight: '8px', flexShrink: 0 }} />
                    <span>¡Creado exitosamente en la BD del ERP!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit" 
                disabled={saving}
                style={submitBtnStyle}
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={14} style={{ marginRight: '6px' }} />
                    Registrando en ERP...
                  </>
                ) : (
                  <>
                    <Plus size={14} style={{ marginRight: '6px' }} />
                    Registrar Clasificación
                  </>
                )}
              </button>

            </form>
          </div>

          {/* COLUMNA DERECHA: Listado y Buscador */}
          <div style={listCardStyle}>
            <div style={listHeaderStyle}>
              <div>
                <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Listado Existente</h3>
                <p style={{ ...sectionSubtitleStyle, margin: '2px 0 0' }}>Total: {filteredList.length} registros cargados.</p>
              </div>
              <button type="button" onClick={fetchMetadata} style={refreshBtnStyle} disabled={loading} title="Actualizar lista">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Buscador */}
            <div style={searchWrapperStyle}>
              <Search size={14} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Buscar por código o nombre..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={searchInputStyle}
              />
            </div>

            {/* Listado con scroll */}
            <div style={listScrollStyle}>
              {filteredList.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', color: '#94a3b8' }}>
                  <Layers size={32} />
                  <p style={{ fontSize: '12px', marginTop: '8px', fontWeight: 600 }}>No hay coincidencias en el ERP</p>
                </div>
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Código</th>
                      <th style={thStyle}>Nombre / Descripción</th>
                      {((activeCategory === 'subfamily' || activeCategory === 'group')) && (
                        <th style={thStyle}>Pertenece a</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map(item => (
                      <tr key={item.id} style={trStyle}>
                        <td style={tdCodeStyle}>{item.id}</td>
                        <td style={tdNameStyle}>{item.name}</td>
                        {((activeCategory === 'subfamily' || activeCategory === 'group')) && (
                          <td style={tdParentStyle}>{item.parentName}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// Estilos locales de Porcelain UI
const containerStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  animation: 'fadeIn 0.3s ease-out'
};

const tabsHeaderStyle = {
  display: 'flex',
  gap: '6px',
  background: '#f1f5f9',
  padding: '4px',
  borderRadius: '14px',
  border: '1px solid #e2e8f0',
  width: 'fit-content'
};

const tabBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  borderRadius: '10px',
  border: 'none',
  background: 'transparent',
  color: '#64748b',
  fontWeight: 650,
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s'
};

const activeTabStyle = {
  background: '#fff',
  color: '#0f172a',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  fontWeight: 850
};

const workspaceStyle = {
  display: 'grid',
  gridTemplateColumns: '320px 1fr',
  gap: '16px',
  alignItems: 'start',
  flex: 1
};

const formCardStyle = {
  background: '#fff',
  borderRadius: '20px',
  border: '1px solid #e2e8f0',
  padding: '20px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)'
};

const listCardStyle = {
  background: '#fff',
  borderRadius: '20px',
  border: '1px solid #e2e8f0',
  padding: '20px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01)',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  maxHeight: 'calc(100vh - 200px)'
};

const listHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const sectionTitleStyle = {
  margin: 0,
  fontSize: '14px',
  fontWeight: 900,
  color: '#0f172a',
  letterSpacing: '-0.01em'
};

const sectionSubtitleStyle = {
  margin: '4px 0 0',
  fontSize: '11px',
  color: '#64748b',
  fontWeight: 600
};

const labelStyle = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 800,
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '6px'
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid #e2e8f0',
  fontSize: '13px',
  fontWeight: 650,
  color: '#1e293b',
  outline: 'none',
  transition: 'border-color 0.2s'
};

const submitBtnStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: '10px',
  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  color: '#fff',
  border: 'none',
  fontSize: '12px',
  fontWeight: 850,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 10px rgba(15,23,42,0.1)',
  marginTop: '8px'
};

const searchWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: '#f8fafc',
  padding: '8px 12px',
  borderRadius: '10px',
  border: '1px solid #e2e8f0'
};

const searchInputStyle = {
  border: 'none',
  background: 'transparent',
  outline: 'none',
  width: '100%',
  fontSize: '12px',
  fontWeight: 650,
  color: '#1e293b'
};

const listScrollStyle = {
  overflowY: 'auto',
  flex: 1,
  border: '1px solid #f1f5f9',
  borderRadius: '12px'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left'
};

const thStyle = {
  padding: '10px 14px',
  background: '#f8fafc',
  borderBottom: '1px solid #e2e8f0',
  color: '#64748b',
  fontSize: '10px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const trStyle = {
  borderBottom: '1px solid #f1f5f9'
};

const tdCodeStyle = {
  padding: '10px 14px',
  fontSize: '12px',
  fontWeight: 700,
  color: '#64748b',
  width: '90px'
};

const tdNameStyle = {
  padding: '10px 14px',
  fontSize: '12px',
  fontWeight: 800,
  color: '#1e293b'
};

const tdParentStyle = {
  padding: '10px 14px',
  fontSize: '11px',
  fontWeight: 600,
  color: '#64748b'
};

const loadingContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  padding: '50px',
  background: '#fff',
  borderRadius: '20px',
  border: '1px solid #e2e8f0'
};

const errorContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  padding: '50px',
  textAlign: 'center',
  background: '#fff',
  borderRadius: '20px',
  border: '1px solid #e2e8f0'
};

const retryBtnStyle = {
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  padding: '8px 16px',
  fontWeight: 700,
  fontSize: '13px',
  cursor: 'pointer',
  marginTop: '12px'
};

const refreshBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  background: '#fff',
  border: '1px solid #e2e8f0',
  color: '#475569',
  cursor: 'pointer',
  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  transition: 'all 0.2s',
  flexShrink: 0
};

const successAlertStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 12px',
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '10px',
  color: '#16a34a',
  fontSize: '11px',
  fontWeight: 700
};

const errorAlertStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 12px',
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '10px',
  color: '#dc2626',
  fontSize: '11px',
  fontWeight: 700
};
