'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
  X, Loader2, Check, AlertCircle, Package, Plus, ChevronRight, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from './CustomSelect';

// ─── Mini-modal inline para crear clasificación al vuelo ─────────────────────
function InlineCreateForm({ type, label, familyId, subfamilyId, families, subfamilies, onCreated, onCancel }) {
  const [name, setName] = useState('');
  const [selFamily, setSelFamily] = useState(familyId || '');
  const [selSubfamily, setSelSubfamily] = useState(subfamilyId || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const needsFamily = type === 'subfamily' || type === 'group';
  const needsSubfamily = type === 'group';

  const filteredSubs = (subfamilies || []).filter(s => s.familyId === selFamily);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (needsFamily && !selFamily) { setError('Seleccione una Familia'); return; }
    if (needsSubfamily && !selSubfamily) { setError('Seleccione una Subfamilia'); return; }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        type,
        name: name.trim().toUpperCase(),
        familyId: selFamily || undefined,
        subfamilyId: selSubfamily || undefined
      };
      const res = await fetch('/api/products/create-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear');
      onCreated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      style={{ overflow: 'hidden' }}
    >
      <div style={inlineFormContainerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: 850, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={12} /> Crear {label}
          </span>
          <button type="button" onClick={onCancel} style={inlineCancelBtnStyle}>
            <X size={12} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Familia dependencia */}
          {needsFamily && (
            <div>
              <label style={inlineLabelStyle}>Familia de enlace *</label>
              <select
                required
                value={selFamily}
                onChange={e => { setSelFamily(e.target.value); setSelSubfamily(''); }}
                style={inlineInputStyle}
              >
                <option value="">Seleccione...</option>
                {(families || []).map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.id})</option>
                ))}
              </select>
            </div>
          )}

          {/* Subfamilia dependencia */}
          {needsSubfamily && (
            <div>
              <label style={inlineLabelStyle}>Subfamilia de enlace *</label>
              <select
                required
                disabled={!selFamily}
                value={selSubfamily}
                onChange={e => setSelSubfamily(e.target.value)}
                style={{ ...inlineInputStyle, opacity: !selFamily ? 0.5 : 1 }}
              >
                <option value="">{!selFamily ? 'Seleccione Familia primero...' : 'Seleccione...'}</option>
                {filteredSubs.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={inlineLabelStyle}>Nombre *</label>
            <input
              type="text"
              required
              placeholder="Ingrese en mayúsculas..."
              value={name}
              onChange={e => setName(e.target.value.toUpperCase())}
              style={inlineInputStyle}
              autoFocus
            />
          </div>

          {error && (
            <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={10} /> {error}
            </div>
          )}

          <button type="submit" disabled={saving} style={inlineSubmitBtnStyle}>
            {saving ? (
              <><Loader2 className="animate-spin" size={12} /> Guardando...</>
            ) : (
              <><Check size={12} /> Crear y Seleccionar</>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}


// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function ProductCreateModal({ isOpen, onClose, onSuccess }) {
  // Datos maestros cargados del ERP
  const [metadata, setMetadata] = useState({
    families: [],
    subfamilies: [],
    groups: [],
    brands: [],
    sizes: [],
    colors: []
  });
  
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [metadataError, setMetadataError] = useState(null);

  // Formulario de Producto
  const [formData, setFormData] = useState({
    descr: '',
    familyId: '',
    subfamilyId: '',
    codgru: '',
    codmar: '',
    pvns: '',
    codcolor_prod: '',
    talla: '',
    codf: '',
    umed: 'UND',
    tipoitm: '1',
    msto: true,
    aigv: true,
    membershipDays: ''
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Estados de formularios inline de creación al vuelo
  const [inlineCreate, setInlineCreate] = useState(null); // 'family' | 'subfamily' | 'group' | 'brand' | null

  // Cargar metadatos al abrir el modal
  const fetchMetadata = useCallback(async () => {
    setLoadingMetadata(true);
    setMetadataError(null);
    try {
      const res = await fetch('/api/products/metadata');
      if (!res.ok) throw new Error('Error al cargar clasificaciones del ERP');
      const data = await res.json();
      setMetadata({
        families: data.families || [],
        subfamilies: data.subfamilies || [],
        groups: data.groups || [],
        brands: data.brands || [],
        sizes: data.sizes || [],
        colors: data.colors || []
      });
    } catch (err) {
      console.error('[ProductCreateModal] Error:', err);
      setMetadataError(err.message);
    } finally {
      setLoadingMetadata(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchMetadata();
      setFormData({
        descr: '',
        familyId: '',
        subfamilyId: '',
        codgru: '',
        codmar: '',
        pvns: '',
        codcolor_prod: '',
        talla: '',
        codf: '',
        umed: 'UND',
        tipoitm: '1',
        msto: true,
        aigv: true,
        membershipDays: ''
      });
      setSaveError(null);
      setSaveSuccess(false);
      setInlineCreate(null);
    }
  }, [isOpen, fetchMetadata]);

  useEffect(() => {
    if (formData.tipoitm === '2') {
      setFormData(prev => ({
        ...prev,
        msto: false,
        umed: prev.umed === 'UND' ? 'SER' : prev.umed
      }));
    } else if (formData.tipoitm === '1') {
      setFormData(prev => ({
        ...prev,
        msto: true,
        umed: prev.umed === 'SER' ? 'UND' : prev.umed
      }));
    }
  }, [formData.tipoitm]);

  if (!isOpen) return null;

  // Filtrado en cascada
  const filteredSubfamilies = metadata.subfamilies.filter(
    sub => sub.familyId === formData.familyId
  );

  const filteredGroups = metadata.groups.filter(
    grp => grp.subfamilyId === formData.subfamilyId && grp.familyId === formData.familyId
  );

  // Manejar cambios en el formulario
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'familyId') {
        next.subfamilyId = '';
        next.codgru = '';
      }
      if (field === 'subfamilyId') {
        next.codgru = '';
      }
      return next;
    });
  };

  // Callback al crear clasificación al vuelo
  const handleInlineCreated = async (data, type) => {
    // Recargar metadata
    await fetchMetadata();
    
    // Auto-seleccionar lo creado
    if (type === 'family') {
      handleInputChange('familyId', data.id);
    } else if (type === 'subfamily') {
      handleInputChange('subfamilyId', data.id);
    } else if (type === 'group') {
      handleInputChange('codgru', data.id);
    } else if (type === 'brand') {
      handleInputChange('codmar', data.id);
    }
    setInlineCreate(null);
  };

  // Guardar Producto
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!formData.descr.trim() || !formData.subfamilyId || !formData.codmar || !formData.pvns) {
      setSaveError('Complete los campos obligatorios: Descripción, Subfamilia, Marca y Precio');
      return;
    }

    if (formData.tipoitm === '2' && formData.membershipDays) {
      const days = parseInt(formData.membershipDays, 10);
      if (isNaN(days) || days <= 0) {
        setSaveError('Los días de membresía deben ser un número entero mayor a 0');
        return;
      }
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const payload = {
        descr: formData.descr.trim(),
        codsub: formData.subfamilyId,
        codmar: formData.codmar,
        pvns: parseFloat(formData.pvns),
        codcolor_prod: formData.codcolor_prod || undefined,
        talla: formData.talla || undefined,
        codf: formData.codf || undefined,
        umed: formData.umed,
        tipoitm: parseInt(formData.tipoitm, 10),
        msto: formData.msto ? 'S' : 'N',
        aigv: formData.aigv ? 'S' : 'N',
        membershipDays: formData.tipoitm === '2' ? parseInt(formData.membershipDays || '0', 10) : 0
      };

      const res = await fetch('/api/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar el producto');

      setSaveSuccess(true);
      setTimeout(() => {
        onSuccess && onSuccess(data);
        onClose();
      }, 1500);

    } catch (err) {
      console.error('[Create Product Submit] Error:', err);
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ─── Opciones para los CustomSelect ──────────────────────────────────────
  const familyOptions = metadata.families.map(f => ({ value: f.id, label: `${f.name} (${f.id})` }));
  const subfamilyOptions = filteredSubfamilies.map(s => ({ value: s.id, label: `${s.name} (${s.id})` }));
  const groupOptions = filteredGroups.map(g => ({ value: g.id, label: `${g.name} (${g.id})` }));
  const brandOptions = metadata.brands.map(b => ({ value: b.id, label: b.name }));
  const sizeOptions = [{ value: '', label: 'Sin talla' }, ...metadata.sizes.map(s => ({ value: s.id, label: s.name }))];
  const colorOptions = [{ value: '', label: 'Sin color' }, ...metadata.colors.map(c => ({ value: c.id, label: c.name }))];
  const tipoOptions = [
    { value: '1', label: 'Mercadería (Producto Físico)' },
    { value: '2', label: 'Servicio / Plan de Gimnasio' }
  ];
  const umedOptions = [
    { value: 'UND', label: 'UND (Unidades)' },
    { value: 'SER', label: 'SER (Servicios)' },
    { value: 'GLB', label: 'GLB (Global)' }
  ];

  return (
    <div style={modalOverlayStyle}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        style={{
          ...modalContentStyle,
          width: '680px',
          maxWidth: '95vw',
          position: 'relative'
        }}
      >
        {/* ─── CABECERA ────────────────────────────────────────────────── */}
        <div style={modalHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={headerIconStyle}>
              <Package size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Nuevo Producto ERP</h3>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Crea un artículo respetando la estructura relacional de Navasoft.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={closeModalBtnStyle} disabled={saving}>
            <X size={16} />
          </button>
        </div>

        {/* ─── CUERPO ──────────────────────────────────────────────────── */}
        {loadingMetadata ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}>
            <Loader2 className="animate-spin" size={32} color="#3b82f6" />
            <p style={{ marginTop: '12px', fontSize: '13px', fontWeight: 650, color: '#64748b' }}>Cargando clasificaciones del ERP...</p>
          </div>
        ) : metadataError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', textAlign: 'center' }}>
            <AlertCircle size={32} color="#ef4444" />
            <p style={{ color: '#ef4444', fontWeight: 800, marginTop: '8px' }}>Error al cargar estructura del ERP</p>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 16px' }}>{metadataError}</p>
            <button type="button" onClick={fetchMetadata} style={retryBtnStyle}>Reintentar</button>
          </div>
        ) : (
          <form onSubmit={handleProductSubmit} style={formBodyStyle}>
            
            {/* ═══ SECCIÓN 1: INFORMACIÓN DEL ARTÍCULO ═══════════════════ */}
            <div style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <div style={{ ...sectionBadgeStyle, background: '#eff6ff', color: '#2563eb' }}>
                  <Package size={13} />
                </div>
                <span style={sectionTitleStyle}>Información del Artículo</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Descripción - Full width */}
                <div>
                  <label style={labelStyle}>Descripción / Nombre *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej: CAMISA CASUAL SLIM FIT OXFORD"
                    value={formData.descr}
                    onChange={e => handleInputChange('descr', e.target.value.toUpperCase())}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Categoría / Tipo */}
                  <div>
                    <label style={labelStyle}>Categoría / Tipo *</label>
                    <CustomSelect
                      value={formData.tipoitm}
                      onChange={e => handleInputChange('tipoitm', e.target.value)}
                      options={tipoOptions}
                      placeholder="Seleccione tipo..."
                    />
                  </div>

                  {/* UM Kardex */}
                  <div>
                    <label style={labelStyle}>UM Kardex (Medida) *</label>
                    <CustomSelect
                      value={formData.umed}
                      onChange={e => handleInputChange('umed', e.target.value)}
                      options={umedOptions}
                      placeholder="Seleccione UM..."
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Precio */}
                  <div>
                    <label style={labelStyle}>Precio de Venta (S/.) *</label>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={formData.pvns}
                      onChange={e => handleInputChange('pvns', e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  {/* Código de Barras */}
                  <div>
                    <label style={labelStyle}>Código de Barras / Físico</label>
                    <input 
                      type="text" 
                      placeholder="Opcional (Ej: 7751234567890)"
                      value={formData.codf}
                      onChange={e => handleInputChange('codf', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Checkboxes - toggles */}
                <div style={toggleRowStyle}>
                  <label style={toggleLabelStyle}>
                    <div style={{
                      ...toggleSwitchStyle,
                      background: formData.aigv ? '#3b82f6' : '#cbd5e1'
                    }} onClick={() => handleInputChange('aigv', !formData.aigv)}>
                      <div style={{
                        ...toggleKnobStyle,
                        transform: formData.aigv ? 'translateX(16px)' : 'translateX(2px)'
                      }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Afecto IGV (18%)</span>
                  </label>

                  <label style={{
                    ...toggleLabelStyle,
                    opacity: formData.tipoitm === '2' ? 0.4 : 1,
                    pointerEvents: formData.tipoitm === '2' ? 'none' : 'auto'
                  }}>
                    <div style={{
                      ...toggleSwitchStyle,
                      background: formData.msto ? '#3b82f6' : '#cbd5e1'
                    }} onClick={() => formData.tipoitm !== '2' && handleInputChange('msto', !formData.msto)}>
                      <div style={{
                        ...toggleKnobStyle,
                        transform: formData.msto ? 'translateX(16px)' : 'translateX(2px)'
                      }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Control de Stock</span>
                  </label>
                </div>

                {/* Días de Membresía - Condicional para Servicio */}
                <AnimatePresence>
                  {formData.tipoitm === '2' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '0 0 4px' }}>
                        <label style={labelStyle}>Días de Membresía / Vigencia</label>
                        <input
                          type="number"
                          placeholder="Ej: 30 (Dejar vacío o 0 si no es membresía)"
                          value={formData.membershipDays}
                          onChange={e => handleInputChange('membershipDays', e.target.value)}
                          style={inputStyle}
                        />
                        <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>
                          Si ingresa días, el sistema creará este artículo como una membresía activa del gimnasio.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ═══ SECCIÓN 2: CLASIFICACIÓN JERÁRQUICA ════════════════════ */}
            <div style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <div style={{ ...sectionBadgeStyle, background: '#fef3c7', color: '#d97706' }}>
                  <ChevronRight size={13} />
                </div>
                <span style={sectionTitleStyle}>Clasificación Jerárquica</span>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, marginLeft: 'auto' }}>Cascada ERP</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Familia */}
                <div>
                  <label style={labelStyle}>Familia *</label>
                  <CustomSelect
                    searchable
                    value={formData.familyId}
                    onChange={e => handleInputChange('familyId', e.target.value)}
                    options={familyOptions}
                    placeholder="Buscar y seleccionar Familia..."
                    onAdd={() => setInlineCreate(inlineCreate === 'family' ? null : 'family')}
                    addLabel="Crear nueva Familia"
                  />
                  <AnimatePresence>
                    {inlineCreate === 'family' && (
                      <InlineCreateForm
                        type="family"
                        label="Familia"
                        onCreated={(data) => handleInlineCreated(data, 'family')}
                        onCancel={() => setInlineCreate(null)}
                      />
                    )}
                  </AnimatePresence>
                </div>

                {/* Subfamilia */}
                <div>
                  <label style={labelStyle}>Subfamilia (Define Prefijo de Código) *</label>
                  <CustomSelect
                    searchable
                    disabled={!formData.familyId}
                    value={formData.subfamilyId}
                    onChange={e => handleInputChange('subfamilyId', e.target.value)}
                    options={subfamilyOptions}
                    placeholder={!formData.familyId ? 'Seleccione Familia primero...' : 'Buscar Subfamilia...'}
                    onAdd={formData.familyId ? () => setInlineCreate(inlineCreate === 'subfamily' ? null : 'subfamily') : undefined}
                    addLabel="Crear nueva Subfamilia"
                  />
                  <AnimatePresence>
                    {inlineCreate === 'subfamily' && (
                      <InlineCreateForm
                        type="subfamily"
                        label="Subfamilia"
                        familyId={formData.familyId}
                        families={metadata.families}
                        onCreated={(data) => handleInlineCreated(data, 'subfamily')}
                        onCancel={() => setInlineCreate(null)}
                      />
                    )}
                  </AnimatePresence>
                </div>

                {/* Grupo / Giro Tipo */}
                <div>
                  <label style={labelStyle}>Giro Tipo / Grupo</label>
                  <CustomSelect
                    searchable
                    disabled={!formData.subfamilyId}
                    value={formData.codgru}
                    onChange={e => handleInputChange('codgru', e.target.value)}
                    options={groupOptions}
                    placeholder={!formData.subfamilyId ? 'Seleccione Subfamilia primero...' : 'Buscar Grupo...'}
                    onAdd={formData.subfamilyId ? () => setInlineCreate(inlineCreate === 'group' ? null : 'group') : undefined}
                    addLabel="Crear nuevo Giro Tipo"
                  />
                  <AnimatePresence>
                    {inlineCreate === 'group' && (
                      <InlineCreateForm
                        type="group"
                        label="Giro Tipo / Grupo"
                        familyId={formData.familyId}
                        subfamilyId={formData.subfamilyId}
                        families={metadata.families}
                        subfamilies={metadata.subfamilies}
                        onCreated={(data) => handleInlineCreated(data, 'group')}
                        onCancel={() => setInlineCreate(null)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* ═══ SECCIÓN 3: ATRIBUTOS Y MARCA ══════════════════════════ */}
            <div style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <div style={{ ...sectionBadgeStyle, background: '#f0fdf4', color: '#16a34a' }}>
                  <Tag size={13} />
                </div>
                <span style={sectionTitleStyle}>Atributos y Marca</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Marca */}
                <div>
                  <label style={labelStyle}>Marca *</label>
                  <CustomSelect
                    searchable
                    value={formData.codmar}
                    onChange={e => handleInputChange('codmar', e.target.value)}
                    options={brandOptions}
                    placeholder="Buscar marca..."
                    onAdd={() => setInlineCreate(inlineCreate === 'brand' ? null : 'brand')}
                    addLabel="Crear nueva Marca"
                  />
                  <AnimatePresence>
                    {inlineCreate === 'brand' && (
                      <InlineCreateForm
                        type="brand"
                        label="Marca"
                        onCreated={(data) => handleInlineCreated(data, 'brand')}
                        onCancel={() => setInlineCreate(null)}
                      />
                    )}
                  </AnimatePresence>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Talla */}
                  <div>
                    <label style={labelStyle}>Talla / Medida</label>
                    <CustomSelect
                      searchable
                      value={formData.talla}
                      onChange={e => handleInputChange('talla', e.target.value)}
                      options={sizeOptions}
                      placeholder="Seleccionar talla..."
                    />
                  </div>

                  {/* Color */}
                  <div>
                    <label style={labelStyle}>Color / Variante</label>
                    <CustomSelect
                      searchable
                      value={formData.codcolor_prod}
                      onChange={e => handleInputChange('codcolor_prod', e.target.value)}
                      options={colorOptions}
                      placeholder="Seleccionar color..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ ALERTAS ════════════════════════════════════════════════ */}
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
                  <span>¡Artículo guardado y propagado multi-sede con éxito!</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ═══ ACCIONES ═══════════════════════════════════════════════ */}
            <div style={actionsBarStyle}>
              <button 
                type="button" 
                onClick={onClose} 
                style={cancelBtnStyle}
                disabled={saving}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                style={submitBtnStyle}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={14} style={{ marginRight: '6px' }} />
                    Guardando en ERP...
                  </>
                ) : (
                  <>
                    <Package size={14} style={{ marginRight: '6px' }} />
                    Crear Producto
                  </>
                )}
              </button>
            </div>
          </form>
        )}

      </motion.div>
    </div>
  );
}

// ─── ESTILOS ────────────────────────────────────────────────────────────────

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(15, 23, 42, 0.5)',
  backdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px'
};

const modalContentStyle = {
  background: '#fff',
  borderRadius: '24px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '92vh',
  overflow: 'hidden'
};

const modalHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 24px 16px',
  borderBottom: '1px solid #f1f5f9',
  flexShrink: 0
};

const headerIconStyle = {
  width: '40px',
  height: '40px',
  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#2563eb'
};

const closeModalBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  background: '#f1f5f9',
  border: 'none',
  color: '#64748b',
  cursor: 'pointer',
  transition: 'all 0.15s'
};

const formBodyStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0',
  overflowY: 'auto',
  padding: '0'
};

const sectionStyle = {
  padding: '18px 24px',
  borderBottom: '1px solid #f1f5f9'
};

const sectionHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '14px'
};

const sectionBadgeStyle = {
  width: '26px',
  height: '26px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const sectionTitleStyle = {
  fontSize: '12px',
  fontWeight: 900,
  color: '#1e293b',
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
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
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1px solid #e2e8f0',
  fontSize: '13px',
  fontWeight: 650,
  color: '#1e293b',
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
  background: '#fff'
};

const toggleRowStyle = {
  display: 'flex',
  gap: '24px',
  padding: '6px 0',
  flexWrap: 'wrap'
};

const toggleLabelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  cursor: 'pointer',
  userSelect: 'none'
};

const toggleSwitchStyle = {
  width: '36px',
  height: '20px',
  borderRadius: '10px',
  position: 'relative',
  cursor: 'pointer',
  transition: 'background 0.25s ease',
  flexShrink: 0
};

const toggleKnobStyle = {
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  background: '#fff',
  position: 'absolute',
  top: '2px',
  transition: 'transform 0.25s ease',
  boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
};

const actionsBarStyle = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  padding: '16px 24px',
  borderTop: '1px solid #f1f5f9',
  flexShrink: 0,
  background: '#fafbfc'
};

const cancelBtnStyle = {
  padding: '10px 18px',
  borderRadius: '10px',
  background: '#f1f5f9',
  color: '#475569',
  border: 'none',
  fontSize: '12px',
  fontWeight: 800,
  cursor: 'pointer',
  transition: 'all 0.15s'
};

const submitBtnStyle = {
  padding: '10px 20px',
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
  boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
  transition: 'all 0.15s'
};

const successAlertStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 14px',
  margin: '0 24px',
  background: '#f0fdf4',
  border: '1px solid #bbf7d0',
  borderRadius: '10px',
  color: '#16a34a',
  fontSize: '12px',
  fontWeight: 700
};

const errorAlertStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '10px 14px',
  margin: '0 24px',
  background: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '10px',
  color: '#dc2626',
  fontSize: '12px',
  fontWeight: 700
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

// Estilos del InlineCreateForm
const inlineFormContainerStyle = {
  marginTop: '8px',
  padding: '14px',
  background: '#f8fafc',
  borderRadius: '12px',
  border: '1px solid #e2e8f0'
};

const inlineLabelStyle = {
  display: 'block',
  fontSize: '9px',
  fontWeight: 800,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '4px'
};

const inlineInputStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '12px',
  fontWeight: 650,
  color: '#1e293b',
  outline: 'none',
  boxSizing: 'border-box',
  background: '#fff'
};

const inlineCancelBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '22px',
  height: '22px',
  borderRadius: '6px',
  background: '#fff',
  border: '1px solid #e2e8f0',
  color: '#94a3b8',
  cursor: 'pointer'
};

const inlineSubmitBtnStyle = {
  width: '100%',
  padding: '8px',
  borderRadius: '8px',
  background: '#3b82f6',
  color: '#fff',
  border: 'none',
  fontSize: '11px',
  fontWeight: 800,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  marginTop: '4px'
};
