'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, Plus, UserPlus, ShoppingCart, Edit, MessageCircle, Mail, MapPin, Phone, Calendar, Loader2, Save, X, Users, User, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import WhatsAppMessageModal from './WhatsAppMessageModal';

export default function CustomersView({ activeTab = 'customers', onSelectCustomer, onOpenRegisterModal, onAlert, onQueueWhatsApp, companyName }) {
    const [customers, setCustomers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    // Estados para edición
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [editForm, setEditForm] = useState({ nomcli: '', celcli: '', email: '', direccion: '', fecnac: '' });
    const [saving, setSaving] = useState(false);
 
    // Estados para cumpleaños
    const [birthdays, setBirthdays] = useState([]);
    const [loadingBirthdays, setLoadingBirthdays] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    
    // Estados para envío de WhatsApp desde cumpleaños
    const [showWAModal, setShowWAModal] = useState(false);
    const [selectedMemberWA, setSelectedMemberWA] = useState(null);
    const [waForceCategory, setWaForceCategory] = useState(null);

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const fetchBirthdays = async () => {
        setLoadingBirthdays(true);
        try {
            const res = await fetch(`/api/memberships/birthdays?month=${selectedMonth}`);
            const data = await res.json();
            if (data.success) {
                setBirthdays(data.birthdays || []);
            }
        } catch (e) {
            console.error("Error al cargar cumpleaños:", e);
        } finally {
            setLoadingBirthdays(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'birthdays') {
            fetchBirthdays();
        }
    }, [activeTab, selectedMonth]);

    // Detección de responsividad móvil/tablet
    useEffect(() => {
        const checkSize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkSize();
        window.addEventListener('resize', checkSize);
        return () => window.removeEventListener('resize', checkSize);
    }, []);

    // Cargar clientes iniciales o realizar búsqueda con debounce
    useEffect(() => {
        const fetchCustomers = async () => {
            setLoading(true);
            try {
                const url = searchQuery.trim().length > 0 
                    ? `/api/customers?q=${encodeURIComponent(searchQuery)}`
                    : '/api/customers';
                const res = await fetch(url);
                const data = await res.json();
                if (data.success) {
                    setCustomers(data.data || []);
                } else {
                    setCustomers([]);
                }
            } catch (err) {
                console.error('Error fetching customers:', err);
                setCustomers([]);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchCustomers();
        }, 300); // Debounce de 300ms

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Manejar apertura de modal de edición
    const handleEditClick = (c) => {
        setEditingCustomer(c);
        setEditForm({
            nomcli: c.nomcli || '',
            celcli: c.celcli || '',
            email: c.email || '',
            direccion: c.dircli || '',
            fecnac: c.fecnac || ''
        });
    };

    // Manejar envío de edición
    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editForm.nomcli.trim()) return onAlert('Error', 'El nombre es obligatorio.', 'warning');
        
        setSaving(true);
        try {
            const res = await fetch('/api/customers/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingCustomer.codcli,
                    nomcli: editForm.nomcli,
                    celcli: editForm.celcli,
                    email: editForm.email,
                    direccion: editForm.direccion,
                    fecnac: editForm.fecnac
                })
            });
            const data = await res.json();
            if (data.success) {
                onAlert('Éxito', 'Cliente actualizado correctamente.', 'success');
                // Actualizar la lista local
                setCustomers(customers.map(c => c.codcli === editingCustomer.codcli ? {
                    ...c,
                    nomcli: editForm.nomcli.toUpperCase(),
                    celcli: editForm.celcli,
                    email: editForm.email,
                    dircli: editForm.direccion.toUpperCase(),
                    fecnac: editForm.fecnac
                } : c));
                if (activeTab === 'birthdays') {
                    fetchBirthdays();
                }
                setEditingCustomer(null);
            } else {
                onAlert('Error', data.error || 'No se pudo actualizar el cliente.', 'error');
            }
        } catch (err) {
            console.error('Error saving customer:', err);
            onAlert('Error', 'Ocurrió un error en el servidor.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Redirigir a chat de WhatsApp
    const openWhatsApp = (phone) => {
        if (!phone) return;
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        // Si no tiene código de país, anteponemos el de Perú (51)
        const formattedPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
        window.open(`https://wa.me/${formattedPhone}`, '_blank');
    };

    return (
        <div style={containerStyle}>
            {/* Header del Módulo */}
            <div style={headerContainerStyle}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <h2 style={titleStyle}>{activeTab === 'customers' ? 'Gestión de Clientes' : 'Cumpleaños'}</h2>
                    <p style={subtitleStyle}>
                        {activeTab === 'customers' 
                            ? 'Lista y filtros en tiempo real conectados con Navasoft ERP' 
                            : 'Socios que cumplen años este mes'}
                    </p>
                </div>



                {activeTab === 'customers' && (
                    <button onClick={onOpenRegisterModal} style={addBtnStyle}>
                        <Plus size={16} /> <span>Nuevo Cliente</span>
                    </button>
                )}
            </div>

            {activeTab === 'customers' ? (
                <>
                    {/* Barra de Filtros */}
                    <div style={searchBarContainerStyle}>
                        <Search size={16} style={{ color: '#94a3b8', marginRight: '8px' }} />
                        <input
                            type="text"
                            placeholder="Buscar por Nombre, DNI/RUC, Celular o Código..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={searchInputStyle}
                        />
                        {loading && <Loader2 className="animate-spin" size={16} style={{ color: '#3b82f6' }} />}
                    </div>

                    {/* Listado de Clientes */}
                    <div style={listContainerStyle} className="no-scrollbar">
                        {loading && customers.length === 0 ? (
                            <div style={centerStateStyle}>
                                <Loader2 className="animate-spin" size={32} style={{ color: '#3b82f6', marginBottom: '10px' }} />
                                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Cargando clientes...</span>
                            </div>
                        ) : customers.length === 0 ? (
                            <div style={centerStateStyle}>
                                <UserPlus size={32} style={{ color: '#94a3b8', marginBottom: '10px' }} />
                                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>No se encontraron clientes</span>
                                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', textAlign: 'center' }}>
                                    Prueba ingresando otro término de búsqueda o registra uno nuevo.
                                </p>
                            </div>
                        ) : isMobile ? (
                            // VISTA CELULARES (Tarjetas verticales independientes)
                            <div style={cardsGridStyle}>
                                {customers.map(c => (
                                    <div key={c.codcli} style={cardStyle}>
                                        <div style={cardHeaderStyle}>
                                            <span style={codeBadgeStyle}>{c.codcli}</span>
                                            <span style={docTextStyle}>DNI/RUC: {c.ruccli}</span>
                                        </div>
                                        <h3 style={cardNameStyle}>{c.nomcli}</h3>
                                        
                                        <div style={cardBodyStyle}>
                                            {c.celcli && (
                                                <div style={infoRowStyle}>
                                                    <Phone size={12} style={{ color: '#64748b', flexShrink: 0 }} />
                                                    <span style={infoTextStyle}>{c.celcli}</span>
                                                </div>
                                            )}
                                            {c.email && (
                                                <div style={infoRowStyle}>
                                                    <Mail size={12} style={{ color: '#64748b', flexShrink: 0 }} />
                                                    <span style={infoTextStyle}>{c.email}</span>
                                                </div>
                                            )}
                                            {c.dircli && (
                                                <div style={infoRowStyle}>
                                                    <MapPin size={12} style={{ color: '#64748b', flexShrink: 0 }} />
                                                    <span style={infoTextStyle}>{c.dircli}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div style={cardActionsStyle}>
                                            <button 
                                                onClick={() => onSelectCustomer(c)} 
                                                style={{ ...actionBtnStyle, background: '#3b82f6', color: '#fff' }}
                                                title="Asociar a la venta actual"
                                            >
                                                <ShoppingCart size={13} /> <span>Asociar</span>
                                            </button>
                                            <button 
                                                onClick={() => handleEditClick(c)} 
                                                style={{ ...actionBtnStyle, background: '#f1f5f9', color: '#475569' }}
                                                title="Editar cliente"
                                            >
                                                <Edit size={13} /> <span>Editar</span>
                                            </button>
                                            <button 
                                                onClick={() => openWhatsApp(c.celcli)} 
                                                style={{ ...actionBtnStyle, background: '#f0fdf4', color: '#16a34a' }}
                                                title="Enviar WhatsApp"
                                            >
                                                <MessageCircle size={13} /> <span>WhatsApp</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // VISTA TABLETS / PC (Tabla clásica compacta)
                            <div style={tableWrapperStyle}>
                                <table style={tableStyle}>
                                    <thead>
                                        <tr>
                                            <th style={{ ...thStyle, borderRadius: '12px 0 0 12px' }}>Código</th>
                                            <th style={thStyle}>Nombre / Razón Social</th>
                                            <th style={thStyle}>DNI / RUC</th>
                                            <th style={thStyle}>Celular</th>
                                            <th style={thStyle}>Email</th>
                                            <th style={thStyle}>Dirección</th>
                                            <th style={{ ...thStyle, borderRadius: '0 12px 12px 0', textAlign: 'center' }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customers.map(c => (
                                            <tr key={c.codcli} style={trBodyStyle}>
                                                <td style={tdStyle}><span style={codeBadgeStyle}>{c.codcli}</span></td>
                                                <td style={{ ...tdStyle, fontWeight: 750, color: '#0f172a' }}>{c.nomcli}</td>
                                                <td style={tdStyle}>{c.ruccli}</td>
                                                <td style={tdStyle}>{c.celcli || '-'}</td>
                                                <td style={tdStyle}>{c.email || '-'}</td>
                                                <td style={{ ...tdStyle, maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {c.dircli || '-'}
                                                </td>
                                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                        <button 
                                                            onClick={() => onSelectCustomer(c)} 
                                                            style={{ ...tableActionBtnStyle, background: '#eff6ff', color: '#2563eb' }}
                                                            title="Asociar cliente"
                                                        >
                                                            <ShoppingCart size={13} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleEditClick(c)} 
                                                            style={{ ...tableActionBtnStyle, background: '#f1f5f9', color: '#475569' }}
                                                            title="Editar cliente"
                                                        >
                                                            <Edit size={13} />
                                                        </button>
                                                        <button 
                                                            onClick={() => openWhatsApp(c.celcli)} 
                                                            style={{ ...tableActionBtnStyle, background: '#f0fdf4', color: '#16a34a' }}
                                                            title="WhatsApp directo"
                                                        >
                                                            <MessageCircle size={13} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* Vista de Cumpleaños */
                <div style={{ ...listContainerStyle, display: 'flex', flexDirection: 'column', gap: '12px' }} className="no-scrollbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', flexShrink: 0 }}>
                        <select 
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            style={monthSelectStyle}
                        >
                            {monthNames.map((m, i) => (
                                <option key={i+1} value={i+1}>{m}</option>
                            ))}
                        </select>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>
                            {birthdays.length} socios cumplen en {monthNames[selectedMonth-1]}
                        </span>
                    </div>

                    <div style={birthdayGridStyle}>
                        {loadingBirthdays ? (
                            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                <Loader2 className="animate-spin" size={24} style={{ color: '#3b82f6', margin: '0 auto 10px auto' }} />
                                <span>Consultando cumpleaños...</span>
                            </div>
                        ) : birthdays.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                No hay cumpleaños registrados para este mes.
                            </div>
                        ) : birthdays.map((b, i) => {
                            const isToday = b.birthDay === new Date().getDate() && b.birthMonth === (new Date().getMonth() + 1);
                            return (
                                <motion.div 
                                    key={b.codcli}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    style={{ 
                                        ...birthdayCardStyle,
                                        background: isToday ? '#fff1f2' : '#fff',
                                        borderColor: isToday ? '#fda4af' : '#f1f5f9'
                                    }}
                                >
                                    {/* Fecha Calendario */}
                                    <div style={{ ...calendarDateStyle, background: isToday ? '#f43f5e' : '#94a3b8' }}>
                                        <div style={{ fontSize: '18px', fontWeight: 900 }}>{b.birthDay}</div>
                                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
                                            {monthNames[b.birthMonth-1].substring(0,3)}
                                        </div>
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 800, fontSize: '13px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {b.nomcli}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#f43f5e' }}>{b.age} años</span>
                                            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#cbd5e1' }} />
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>{b.birthDay} de {monthNames[b.birthMonth-1].toLowerCase()}</span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Phone size={12} /> {b.phone || 'Sin teléfono'}
                                        </div>
                                        {isToday && (
                                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#f43f5e', fontSize: '11px', fontWeight: 800 }}>
                                                <RefreshCw size={12} className="animate-spin" /> ¡Cumpleaños hoy!
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <button 
                                            onClick={() => {
                                                setSelectedMemberWA({ id: b.codcli, name: b.nomcli, phone: b.phone });
                                                setWaForceCategory('cumpleanos');
                                                setShowWAModal(true);
                                            }}
                                            style={{ ...birthdayActionBtnStyle, background: isToday ? '#f43f5e' : '#f1f5f9', color: isToday ? '#fff' : '#64748b' }}
                                            title="Enviar felicitación por WhatsApp"
                                        >
                                            <MessageCircle size={16} />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                handleEditClick({
                                                    codcli: b.codcli,
                                                    nomcli: b.nomcli,
                                                    celcli: b.phone,
                                                    email: b.email || '',
                                                    dircli: b.address || '',
                                                    fecnac: b.fecnac ? b.fecnac.split('T')[0] : ''
                                                });
                                            }}
                                            style={{ ...birthdayActionBtnStyle, background: '#f8fafc', color: '#94a3b8' }}
                                            title="Editar datos"
                                        >
                                            <User size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MODAL DE EDICIÓN FLOTANTE */}
            {editingCustomer && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <div style={modalHeaderStyle}>
                            <h3 style={modalTitleStyle}>Editar Datos del Cliente</h3>
                            <button onClick={() => setEditingCustomer(null)} style={closeBtnStyle}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveEdit} style={modalFormStyle}>
                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Nombre / Razón Social</label>
                                <input 
                                    type="text" 
                                    value={editForm.nomcli} 
                                    onChange={(e) => setEditForm({ ...editForm, nomcli: e.target.value })} 
                                    style={formInputStyle}
                                    placeholder="Nombres completos"
                                    required 
                                />
                            </div>

                            <div style={formRowStyle}>
                                <div style={{ ...formGroupStyle, flex: 1 }}>
                                    <label style={labelStyle}>DNI / RUC</label>
                                    <input type="text" disabled value={editingCustomer.ruccli} style={{ ...formInputStyle, background: '#f1f5f9', color: '#64748b' }} />
                                </div>
                                <div style={{ ...formGroupStyle, flex: 1 }}>
                                    <label style={labelStyle}>Celular / Teléfono</label>
                                    <input 
                                        type="text" 
                                        value={editForm.celcli} 
                                        onChange={(e) => setEditForm({ ...editForm, celcli: e.target.value })} 
                                        style={formInputStyle} 
                                        placeholder="Ej: 999888777"
                                    />
                                </div>
                            </div>

                            <div style={formRowStyle}>
                                <div style={{ ...formGroupStyle, flex: 1 }}>
                                    <label style={labelStyle}>Correo Electrónico</label>
                                    <input 
                                        type="email" 
                                        value={editForm.email} 
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} 
                                        style={formInputStyle} 
                                        placeholder="Ej: cliente@correo.com"
                                    />
                                </div>
                                <div style={{ ...formGroupStyle, flex: 1 }}>
                                    <label style={labelStyle}>Fecha Nacimiento</label>
                                    <input 
                                        type="date" 
                                        value={editForm.fecnac} 
                                        onChange={(e) => setEditForm({ ...editForm, fecnac: e.target.value })} 
                                        style={formInputStyle} 
                                    />
                                </div>
                            </div>

                            <div style={formGroupStyle}>
                                <label style={labelStyle}>Dirección Domicilio / Fiscal</label>
                                <input 
                                    type="text" 
                                    value={editForm.direccion} 
                                    onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })} 
                                    style={formInputStyle} 
                                    placeholder="Dirección del cliente"
                                />
                            </div>

                            <div style={modalFooterStyle}>
                                <button type="button" onClick={() => setEditingCustomer(null)} style={cancelBtnStyle} disabled={saving}>
                                    Cancelar
                                </button>
                                <button type="submit" style={saveBtnStyle} disabled={saving}>
                                    {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                    <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DE WHATSAPP DESDE CUMPLEAÑOS */}
            <WhatsAppMessageModal 
                isOpen={showWAModal}
                onClose={() => setShowWAModal(false)}
                member={selectedMemberWA}
                companyName={companyName || 'Gym'}
                forceCategory={waForceCategory}
                onSend={(phone, msg) => {
                    if (onQueueWhatsApp) {
                        onQueueWhatsApp(phone, msg);
                        onAlert('Éxito', 'Mensaje enviado a la cola de WhatsApp', 'success');
                    } else {
                        // fallback direct send
                        const formatted = phone.startsWith('51') ? phone : `51${phone}`;
                        window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(msg)}`, '_blank');
                    }
                    setShowWAModal(false);
                }}
            />
        </div>
    );
}

// Estilos Premium Adaptables
const containerStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '16px',
    background: '#f8fafc',
    overflow: 'hidden'
};

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    flexShrink: 0,
    gap: '12px'
};

const titleStyle = {
    fontSize: '18px',
    fontWeight: 900,
    color: '#0f172a',
    margin: 0
};

const subtitleStyle = {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: 600,
    margin: '2px 0 0 0'
};

const addBtnStyle = {
    background: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '8px 14px',
    fontSize: '11px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(168, 85, 247, 0.25)',
    transition: 'all 0.2s',
};

const searchBarContainerStyle = {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '14px',
    flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
};

const searchInputStyle = {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '12px',
    color: '#1e293b',
    fontWeight: 600
};

const listContainerStyle = {
    flex: 1,
    overflowY: 'auto',
    borderRadius: '12px',
};

const centerStateStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '20px'
};

// Estilos de la tabla para PC/Tablets
const tableWrapperStyle = {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.01)'
};

const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '11px'
};

const trHeaderStyle = {
    background: '#f1f5f9',
    borderBottom: '1px solid #e2e8f0'
};

const thStyle = {
    padding: '10px 14px',
    fontWeight: 800,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
};

const trBodyStyle = {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background 0.15s'
};

const tdStyle = {
    padding: '10px 14px',
    color: '#334155',
    verticalAlign: 'middle'
};

const codeBadgeStyle = {
    background: '#eff6ff',
    color: '#2563eb',
    padding: '3px 6px',
    borderRadius: '6px',
    fontWeight: 800,
    fontSize: '10px'
};

const tableActionBtnStyle = {
    border: 'none',
    borderRadius: '8px',
    width: '26px',
    height: '26px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s'
};

// Estilos para tarjetas responsivas (Móvil)
const cardsGridStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
};

const cardStyle = {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '12px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.01)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
};

const cardHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
};

const docTextStyle = {
    fontSize: '10px',
    fontWeight: 800,
    color: '#64748b'
};

const cardNameStyle = {
    fontSize: '13px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '4px 0'
};

const cardBodyStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '8px',
    marginBottom: '4px'
};

const infoRowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
};

const infoTextStyle = {
    fontSize: '11px',
    color: '#475569',
    fontWeight: 500,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
};

const cardActionsStyle = {
    display: 'flex',
    gap: '8px',
    marginTop: '4px'
};

const actionBtnStyle = {
    flex: 1,
    border: 'none',
    borderRadius: '8px',
    padding: '8px',
    fontSize: '11px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer',
    transition: 'all 0.15s'
};

// Estilos del Modal Flotante (Edición)
const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '16px'
};

const modalContentStyle = {
    background: '#fff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
};

const modalHeaderStyle = {
    padding: '14px 16px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#f8fafc'
};

const modalTitleStyle = {
    fontSize: '14px',
    fontWeight: 900,
    color: '#0f172a',
    margin: 0
};

const closeBtnStyle = {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#64748b'
};

const modalFormStyle = {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
    maxHeight: '80vh'
};

const formGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
};

const formRowStyle = {
    display: 'flex',
    gap: '12px'
};

const labelStyle = {
    fontSize: '10px',
    fontWeight: 800,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
};

const formInputStyle = {
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '12px',
    color: '#1e293b',
    fontWeight: 600,
    outline: 'none',
    transition: 'border 0.15s',
};

const modalFooterStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '10px',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '12px'
};

const cancelBtnStyle = {
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '11px',
    fontWeight: 800,
    color: '#475569',
    background: 'transparent',
    cursor: 'pointer'
};

const saveBtnStyle = {
    background: 'linear-gradient(135deg, #4f46e5 0%, #a855f7 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 14px',
    fontSize: '11px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(168, 85, 247, 0.2)'
};

const headerContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    flexShrink: 0,
    gap: '12px'
};

const tabsWrapperStyle = { 
    display: 'flex', gap: '4px', background: '#f1f5f9', 
    padding: '4px', borderRadius: '12px'
};

const tabStyle = { 
    display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '9px', 
    border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: '700', 
    transition: 'all 0.2s', color: '#64748b'
};

const activeTabActiveStyle = { background: '#fff', color: '#0f172a', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };

const birthdayTabActiveStyle = { 
    background: '#f43f5e', 
    color: '#fff', boxShadow: '0 4px 6px -1px rgba(244,63,94,0.2)' 
};

const monthSelectStyle = {
    padding: '8px 12px', borderRadius: '10px', border: '1px solid #e2e8f0', 
    fontSize: '13px', fontWeight: '700', color: '#1e293b', background: '#fff',
    cursor: 'pointer'
};

const birthdayGridStyle = {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px'
};

const birthdayCardStyle = {
    padding: '12px', borderRadius: '16px', border: '1px solid #f1f5f9',
    display: 'flex', alignItems: 'center', gap: '12px', position: 'relative',
    background: '#fff'
};

const calendarDateStyle = {
    width: '48px', height: '54px', borderRadius: '12px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    color: '#fff', flexShrink: 0
};

const birthdayActionBtnStyle = {
    width: '36px', height: '36px', borderRadius: '10px', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    transition: 'all 0.2s'
};
