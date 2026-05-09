'use client';
import { useState, useEffect } from 'react';
import { X, User, Phone, ShieldCheck, Save, Search, Loader2, MapPin, Calendar, CreditCard } from 'lucide-react';
import CustomDatePicker from './CustomDatePicker';

export default function CustomerErpModal({ isOpen, onClose, initialData, onSave }) {
    const [formData, setFormData] = useState({
        ruccli: '',
        nomcli: '',
        phone: '',
        birthdate: '',
        address: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ruccli: initialData.ruc || '',
                nomcli: initialData.name || '',
                phone: initialData.phone || '',
                birthdate: initialData.birthdate || '',
                address: initialData.address || ''
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!formData.nomcli) return alert('El nombre es obligatorio');
        setLoading(true);
        try {
            const res = await fetch('/api/customers/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await res.json();
            if (result.success) {
                onSave({ ...formData, code: result.codcli });
                onClose();
            } else {
                alert('Error al registrar: ' + result.error);
            }
        } catch (error) {
            alert('Error crítico de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                {/* Header Premium */}
                <div style={headerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={iconBoxStyle}>
                            <User size={24} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 style={titleStyle}>Ficha de Cliente</h2>
                            <p style={subtitleStyle}>Registro oficial en Navasoft ERP</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={closeBtnStyle}><X size={20} /></button>
                </div>

                {/* Body Organizado */}
                <div style={bodyStyle}>
                    
                    {/* Sección 1: Identidad */}
                    <div style={sectionStyle}>
                        <p style={sectionLabelStyle}>Información de Identidad</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px' }}>
                            <div style={fieldGroupStyle}>
                                <label style={labelStyle}>Documento</label>
                                <div style={inputWrapperStyle}>
                                    <CreditCard size={14} style={inputIconStyle} />
                                    <input type="text" value={formData.ruccli} readOnly style={readOnlyInputStyle} />
                                </div>
                            </div>
                            <div style={fieldGroupStyle}>
                                <label style={labelStyle}>Nombre o Razón Social</label>
                                <div style={inputWrapperStyle}>
                                    <Search size={14} style={inputIconStyle} />
                                    <input 
                                        type="text" 
                                        value={formData.nomcli} 
                                        onChange={e => setFormData({...formData, nomcli: e.target.value})} 
                                        style={inputStyle} 
                                        placeholder="Nombre completo..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección 2: Contacto y Personal */}
                    <div style={sectionStyle}>
                        <p style={sectionLabelStyle}>Datos de Contacto y Otros</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div style={fieldGroupStyle}>
                                <label style={labelStyle}>Celular</label>
                                <div style={inputWrapperStyle}>
                                    <Phone size={14} style={inputIconStyle} />
                                    <input 
                                        type="text" 
                                        placeholder="999 888 777" 
                                        value={formData.phone} 
                                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                                        style={inputStyle} 
                                    />
                                </div>
                            </div>
                            <div style={fieldGroupStyle}>
                                <label style={labelStyle}>F. Nacimiento</label>
                                <CustomDatePicker 
                                    value={formData.birthdate}
                                    onChange={(val) => setFormData({...formData, birthdate: val})}
                                    compact={true}
                                />
                            </div>
                        </div>
                        
                        <div style={fieldGroupStyle}>
                            <label style={labelStyle}>Dirección Domiciliaria / Fiscal</label>
                            <div style={inputWrapperStyle}>
                                <MapPin size={14} style={inputIconStyle} />
                                <input 
                                    type="text" 
                                    placeholder="Av. Las Magnolias 123..." 
                                    value={formData.address} 
                                    onChange={e => setFormData({...formData, address: e.target.value})} 
                                    style={inputStyle} 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer con Botones Proporcionales */}
                <div style={footerStyle}>
                    <button onClick={onClose} style={cancelBtnStyle}>Descartar</button>
                    <button onClick={handleSave} style={saveBtnStyle} disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} strokeWidth={2.5} />}
                        <span>{loading ? 'Procesando...' : 'Guardar y Seleccionar'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// Estilos Premium
const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(10px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' };
const modalStyle = { background: '#fff', borderRadius: '36px', width: '100%', maxWidth: '560px', boxShadow: '0 40px 100px rgba(0,0,0,0.4)', overflow: 'hidden', animation: 'modalAppear 0.3s ease-out' };
const headerStyle = { padding: '32px 32px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' };
const iconBoxStyle = { width: '56px', height: '56px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', boxShadow: '0 8px 16px rgba(59,130,246,0.1)' };
const titleStyle = { fontSize: '22px', fontWeight: 900, color: '#0f172a', margin: '0 0 4px', letterSpacing: '-0.02em' };
const subtitleStyle = { fontSize: '13px', color: '#64748b', margin: 0, fontWeight: 500 };
const closeBtnStyle = { background: '#f8fafc', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '10px', borderRadius: '14px', transition: 'all 0.2s' };

const bodyStyle = { padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' };
const sectionStyle = { display: 'flex', flexDirection: 'column', gap: '16px' };
const sectionLabelStyle = { fontSize: '11px', fontWeight: 900, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, opacity: 0.8 };

const fieldGroupStyle = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle = { fontSize: '11px', fontWeight: 700, color: '#64748b', marginLeft: '4px' };
const inputWrapperStyle = { position: 'relative' };
const inputIconStyle = { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' };
const inputStyle = { width: '100%', padding: '14px 16px 14px 44px', borderRadius: '16px', border: '2px solid #f1f5f9', fontSize: '14px', fontWeight: 700, color: '#1e293b', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box' };
const readOnlyInputStyle = { ...inputStyle, background: '#f8fafc', border: '2px dashed #e2e8f0', color: '#94a3b8' };

const footerStyle = { padding: '24px 32px 32px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px' };
const cancelBtnStyle = { background: 'none', border: 'none', color: '#94a3b8', fontSize: '15px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' };
const saveBtnStyle = { background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#fff', border: 'none', borderRadius: '18px', padding: '16px 32px', fontSize: '15px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 12px 24px rgba(37,99,235,0.3)', transition: 'all 0.2s' };
