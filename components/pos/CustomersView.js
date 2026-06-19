'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, Plus, UserPlus, ShoppingCart, Edit, MessageCircle, Mail, MapPin, Phone, Calendar, Loader2, Save, X, Users, User, RefreshCw, Clock, CreditCard, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WhatsAppMessageModal from './WhatsAppMessageModal';

export default function CustomersView({ activeTab = 'customers', onSelectCustomer, onOpenRegisterModal, onAlert, onQueueWhatsApp, companyName, idApeCaj }) {
    const [customers, setCustomers] = useState([]);
    
    // Estados para crédito y cobros
    const [selectedCreditCustomer, setSelectedCreditCustomer] = useState(null);
    const [creditData, setCreditData] = useState(null);
    const [loadingCredit, setLoadingCredit] = useState(false);
    const [isEditingCredit, setIsEditingCredit] = useState(false);
    const [newCreditLimit, setNewCreditLimit] = useState('');
    const [amortizingInvoice, setAmortizingInvoice] = useState(null);
    const [collectAmount, setCollectAmount] = useState('');
    const [collectMethod, setCollectMethod] = useState('Efectivo');
    const [isSubmittingCollection, setIsSubmittingCollection] = useState(false);

    const fetchCreditStatus = async (codcli) => {
        setLoadingCredit(true);
        setCreditData(null);
        try {
            const res = await fetch(`/api/customers/credit-status?codcli=${codcli}`);
            const data = await res.json();
            if (data.success) {
                setCreditData(data.data);
            }
        } catch (e) {
            console.error('Error fetching credit status:', e);
        } finally {
            setLoadingCredit(false);
        }
    };

    const handleSaveCreditLimit = async (codcli) => {
        if (!newCreditLimit || isNaN(parseFloat(newCreditLimit))) return;
        try {
            const res = await fetch('/api/customers/update-credit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codcli, limit: parseFloat(newCreditLimit) })
            });
            const data = await res.json();
            if (data.success) {
                onAlert('Éxito', 'Límite de crédito actualizado en el ERP.', 'success');
                setIsEditingCredit(false);
                fetchCreditStatus(codcli);
            }
        } catch (e) {
            console.error('Error saving credit limit:', e);
        }
    };

    const handleCollectDebt = async (codcli) => {
        if (!amortizingInvoice || !collectAmount) return;
        if (!idApeCaj) {
            onAlert('Error', 'Debe tener una caja abierta para registrar cobros.', 'error');
            return;
        }
        setIsSubmittingCollection(true);
        try {
            const res = await fetch('/api/sales/collect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    codcli,
                    cdocu_ref: amortizingInvoice.cdocu,
                    ndocu_ref: amortizingInvoice.ndocu,
                    amount: parseFloat(collectAmount),
                    paymentMethod: collectMethod, // Envía 'Efectivo' o 'Tarjeta'
                    idApeCaj
                })
            });
            const data = await res.json();
            if (data.success) {
                onAlert('Éxito', `Cobro registrado. Nro Recibo: ${data.receiptNumber}`, 'success');
                setAmortizingInvoice(null);
                fetchCreditStatus(codcli);
            } else {
                onAlert('Error', data.error || 'Error al procesar el cobro.', 'error');
            }
        } catch (e) {
            console.error('Error in handleCollectDebt:', e);
            onAlert('Error', 'Fallo al procesar el cobro.', 'error');
        } finally {
            setIsSubmittingCollection(false);
        }
    };
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

    const [creditFilter, setCreditFilter] = useState('credit'); // 'credit', 'debt', 'all'

    const sendPaymentReminder = (c) => {
        if (!c.celcli) return;
        const message = `Hola ${c.nomcli}, te saludamos de ${companyName || 'nuestra empresa'}. Te recordamos que cuentas con una deuda de S/ ${c.deuda.toFixed(2)} pendiente de pago. Tu límite de crédito disponible es S/ ${c.disponible.toFixed(2)}. Quedamos atentos para registrar tu abono. ¡Muchas gracias!`;
        if (onQueueWhatsApp) {
            onQueueWhatsApp(c.celcli, message);
            onAlert('Éxito', 'Recordatorio de pago enviado a la cola de WhatsApp', 'success');
        } else {
            const cleanPhone = c.celcli.replace(/[^0-9]/g, '');
            const formattedPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;
            window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
        }
    };

    // Cargar clientes iniciales o realizar búsqueda con debounce
    useEffect(() => {
        const fetchCustomers = async () => {
            setLoading(true);
            try {
                let url = '/api/customers?';
                const params = new URLSearchParams();
                if (searchQuery.trim().length > 0) {
                    params.append('q', searchQuery);
                }
                if (activeTab === 'credits') {
                    params.append('filter', creditFilter);
                }
                url += params.toString();

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
    }, [searchQuery, creditFilter, activeTab]);

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
                    <h2 style={titleStyle}>
                        {activeTab === 'customers' ? 'Gestión de Clientes' : 
                         activeTab === 'credits' ? 'Gestión de Créditos' : 'Cumpleaños'}
                    </h2>
                    <p style={subtitleStyle}>
                        {activeTab === 'customers' ? 'Lista y filtros en tiempo real conectados con Navasoft ERP' : 
                         activeTab === 'credits' ? 'Control de límites de crédito y saldos deudores de clientes' : 'Socios que cumplen años este mes'}
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
                                                onClick={() => {
                                                    setSelectedCreditCustomer(c);
                                                    fetchCreditStatus(c.codcli);
                                                }} 
                                                style={{ ...actionBtnStyle, background: '#eff6ff', color: '#2563eb' }}
                                                title="Ver Línea de Crédito"
                                            >
                                                <Clock size={13} /> <span>Crédito</span>
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
                                                            onClick={() => {
                                                                setSelectedCreditCustomer(c);
                                                                fetchCreditStatus(c.codcli);
                                                            }} 
                                                            style={{ ...tableActionBtnStyle, background: '#e0f2fe', color: '#0369a1' }}
                                                            title="Ver Línea de Crédito"
                                                        >
                                                            <Clock size={13} />
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
            ) : activeTab === 'credits' ? (
                <div style={{ ...listContainerStyle, display: 'flex', flexDirection: 'column', gap: '12px' }} className="no-scrollbar">
                    {/* Tarjetas KPI */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '4px', flexShrink: 0 }}>
                        <div style={{ flex: 1, minWidth: '140px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', border: '1px solid #bfdbfe', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 4px 12px rgba(59,130,246,0.05)' }}>
                            <span style={{ fontSize: '9px', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Límite Autorizado</span>
                            <span style={{ fontSize: '20px', fontWeight: 900, color: '#1e40af' }}>S/ {customers.reduce((sum, c) => sum + (c.mcredi || 0), 0).toFixed(2)}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: '140px', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: '1px solid #fca5a5', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 4px 12px rgba(239,68,68,0.05)' }}>
                            <span style={{ fontSize: '9px', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deuda Total (Socio)</span>
                            <span style={{ fontSize: '20px', fontWeight: 900, color: '#991b1b' }}>S/ {customers.reduce((sum, c) => sum + (c.deuda || 0), 0).toFixed(2)}</span>
                        </div>
                        <div style={{ flex: 1, minWidth: '140px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 4px 12px rgba(34,197,94,0.05)' }}>
                            <span style={{ fontSize: '9px', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Crédito Disponible</span>
                            <span style={{ fontSize: '20px', fontWeight: 900, color: '#166534' }}>S/ {customers.reduce((sum, c) => sum + (c.disponible || 0), 0).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Filtros de Crédito y Barra de Búsqueda */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
                        <div style={{ ...searchBarContainerStyle, flex: 1, marginBottom: 0 }}>
                            <Search size={16} style={{ color: '#94a3b8', marginRight: '8px' }} />
                            <input
                                type="text"
                                placeholder="Buscar cliente por Nombre o Documento..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={searchInputStyle}
                            />
                            {loading && <Loader2 className="animate-spin" size={16} style={{ color: '#3b82f6' }} />}
                        </div>
                        
                        <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '10px', padding: '3px', gap: '2px', border: '1px solid #cbd5e1' }}>
                            {[
                                { id: 'credit', label: 'Autorizados' },
                                { id: 'debt', label: 'Con Deuda' },
                                { id: 'all', label: 'Todos' }
                            ].map(filterOpt => (
                                <button
                                    key={filterOpt.id}
                                    onClick={() => setCreditFilter(filterOpt.id)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: creditFilter === filterOpt.id ? '#fff' : 'transparent',
                                        color: creditFilter === filterOpt.id ? '#0f172a' : '#64748b',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        boxShadow: creditFilter === filterOpt.id ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                                    }}
                                >
                                    {filterOpt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Grilla / Listado */}
                    {loading && customers.length === 0 ? (
                        <div style={centerStateStyle}>
                            <Loader2 className="animate-spin" size={32} style={{ color: '#3b82f6', marginBottom: '10px' }} />
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Cargando datos de crédito...</span>
                        </div>
                    ) : customers.length === 0 ? (
                        <div style={centerStateStyle}>
                            <CreditCard size={32} style={{ color: '#94a3b8', marginBottom: '10px' }} />
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>No se encontraron registros de crédito</span>
                        </div>
                    ) : isMobile ? (
                        // Vista Móvil
                        <div style={cardsGridStyle}>
                            {customers.map(c => (
                                <div key={c.codcli} style={cardStyle}>
                                    <div style={cardHeaderStyle}>
                                        <span style={codeBadgeStyle}>{c.codcli}</span>
                                        <span style={docTextStyle}>DNI/RUC: {c.ruccli}</span>
                                    </div>
                                    <h3 style={cardNameStyle}>{c.nomcli}</h3>
                                    
                                    <div style={{ ...cardBodyStyle, borderBottom: 'none', marginBottom: 0, gap: '6px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                            <span style={{ color: '#64748b', fontWeight: 600 }}>Límite de Crédito:</span>
                                            <span style={{ color: '#0f172a', fontWeight: 800 }}>S/ {c.mcredi.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                            <span style={{ color: '#64748b', fontWeight: 600 }}>Deuda Actual:</span>
                                            <span style={{ color: c.deuda > 0 ? '#ef4444' : '#0f172a', fontWeight: 800 }}>S/ {c.deuda.toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                            <span style={{ color: '#64748b', fontWeight: 600 }}>Disponible:</span>
                                            <span style={{ color: c.disponible > 0 ? '#10b981' : '#64748b', fontWeight: 800 }}>S/ {c.disponible.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div style={{ ...cardActionsStyle, borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '4px' }}>
                                        <button 
                                            onClick={() => {
                                                setSelectedCreditCustomer(c);
                                                fetchCreditStatus(c.codcli);
                                            }} 
                                            style={{ ...actionBtnStyle, background: '#eff6ff', color: '#2563eb' }}
                                            title="Ver Estado de Cuenta / Cobrar"
                                        >
                                            <Clock size={13} /> <span>Cobrar</span>
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setSelectedCreditCustomer(c);
                                                fetchCreditStatus(c.codcli);
                                                setTimeout(() => {
                                                    setIsEditingCredit(true);
                                                    setNewCreditLimit(c.mcredi.toString());
                                                }, 500);
                                            }} 
                                            style={{ ...actionBtnStyle, background: '#f1f5f9', color: '#475569' }}
                                            title="Editar Límite"
                                        >
                                            <Edit size={13} /> <span>Límite</span>
                                        </button>
                                        {c.deuda > 0 && (
                                            <button 
                                                onClick={() => sendPaymentReminder(c)} 
                                                style={{ ...actionBtnStyle, background: '#f0fdf4', color: '#16a34a' }}
                                                title="Enviar Recordatorio por WhatsApp"
                                            >
                                                <MessageCircle size={13} /> <span>Cobrar WA</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        // Vista Desktop
                        <div style={tableWrapperStyle}>
                            <table style={tableStyle}>
                                <thead>
                                    <tr>
                                        <th style={{ ...thStyle, borderRadius: '12px 0 0 12px' }}>Código</th>
                                        <th style={thStyle}>Nombre / Razón Social</th>
                                        <th style={thStyle}>DNI / RUC</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Límite Autorizado</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Deuda Total</th>
                                        <th style={{ ...thStyle, textAlign: 'right' }}>Crédito Disponible</th>
                                        <th style={{ ...thStyle, borderRadius: '0 12px 12px 0', textAlign: 'center' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.map(c => (
                                        <tr key={c.codcli} style={trBodyStyle}>
                                            <td style={tdStyle}><span style={codeBadgeStyle}>{c.codcli}</span></td>
                                            <td style={{ ...tdStyle, fontWeight: 750, color: '#0f172a' }}>{c.nomcli}</td>
                                            <td style={tdStyle}>{c.ruccli}</td>
                                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800 }}>S/ {c.mcredi.toFixed(2)}</td>
                                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: c.deuda > 0 ? '#ef4444' : '#334155' }}>S/ {c.deuda.toFixed(2)}</td>
                                            <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 800, color: c.disponible > 0 ? '#10b981' : '#64748b' }}>S/ {c.disponible.toFixed(2)}</td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedCreditCustomer(c);
                                                            fetchCreditStatus(c.codcli);
                                                        }} 
                                                        style={{ ...tableActionBtnStyle, background: '#eff6ff', color: '#2563eb' }}
                                                        title="Ver Cuenta Corriente / Cobrar"
                                                    >
                                                        <Clock size={13} />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedCreditCustomer(c);
                                                            fetchCreditStatus(c.codcli);
                                                            setIsEditingCredit(true);
                                                            setNewCreditLimit(c.mcredi.toString());
                                                        }} 
                                                        style={{ ...tableActionBtnStyle, background: '#f1f5f9', color: '#475569' }}
                                                        title="Editar Límite de Crédito"
                                                    >
                                                        <Edit size={13} />
                                                    </button>
                                                    {c.deuda > 0 && (
                                                        <button 
                                                            onClick={() => sendPaymentReminder(c)} 
                                                            style={{ ...tableActionBtnStyle, background: '#f0fdf4', color: '#16a34a' }}
                                                            title="Enviar Recordatorio por WhatsApp"
                                                        >
                                                            <MessageCircle size={13} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
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

            {/* MODAL DE LÍNEA DE CRÉDITO DEL CLIENTE */}
            <AnimatePresence>
                {selectedCreditCustomer && (
                    <div style={modalOverlayStyle} onClick={() => { setSelectedCreditCustomer(null); setCreditData(null); setIsEditingCredit(false); }}>
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.95, opacity: 0 }}
                            style={{ 
                                background: '#fff', 
                                padding: '24px', 
                                borderRadius: '20px', 
                                width: '90%', 
                                maxWidth: '500px', 
                                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.15)',
                                border: '1px solid #f1f5f9',
                                position: 'relative',
                                zIndex: 1000,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Clock size={18} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Línea de Crédito</h3>
                                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Cliente: {selectedCreditCustomer.nomcli} ({selectedCreditCustomer.codcli})</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { setSelectedCreditCustomer(null); setCreditData(null); setIsEditingCredit(false); }} 
                                    style={{ background: '#f8fafc', border: 'none', color: '#94a3b8', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {loadingCredit && !creditData ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                                    <Loader2 className="animate-spin" size={24} style={{ color: '#3b82f6', margin: '0 auto 10px auto' }} />
                                    <span>Consultando cuenta corriente en el ERP...</span>
                                </div>
                            ) : !creditData ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444', fontSize: '12px' }}>
                                    Error al cargar la información del crédito.
                                </div>
                            ) : creditData.limit === 0 && !isEditingCredit ? (
                                <div style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'center', 
                                    padding: '24px', 
                                    background: '#f8fafc', 
                                    borderRadius: '16px', 
                                    border: '1px dashed #cbd5e1',
                                    textAlign: 'center',
                                    gap: '12px'
                                }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                        <Lock size={20} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#334155' }}>Línea de Crédito Inactiva</div>
                                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Este cliente no tiene una línea de crédito autorizada en el ERP.</div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setNewCreditLimit('200');
                                            setIsEditingCredit(true);
                                        }}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '10px',
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                            color: '#fff',
                                            border: 'none',
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                                        }}
                                    >
                                        Activar Línea de Crédito
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                        <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                            <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Límite</span>
                                            {isEditingCredit ? (
                                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '4px' }}>
                                                    <input 
                                                        type="number"
                                                        style={{ width: '60px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}
                                                        value={newCreditLimit}
                                                        onChange={(e) => setNewCreditLimit(e.target.value)}
                                                    />
                                                    <button 
                                                        onClick={() => handleSaveCreditLimit(selectedCreditCustomer.codcli)}
                                                        style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 6px', cursor: 'pointer', fontSize: '9px', fontWeight: 800 }}
                                                    >
                                                        Sí
                                                    </button>
                                                    <button 
                                                        onClick={() => setIsEditingCredit(false)}
                                                        style={{ background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '6px', padding: '4px', cursor: 'pointer' }}
                                                    >
                                                        <X size={10} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#1e293b' }}>S/ {creditData.limit.toFixed(2)}</span>
                                                    <button 
                                                        onClick={() => {
                                                            setNewCreditLimit(creditData.limit.toString());
                                                            setIsEditingCredit(true);
                                                        }}
                                                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                                                        title="Editar límite"
                                                    >
                                                        <Edit size={10} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                            <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Deuda</span>
                                            <div style={{ fontSize: '13px', fontWeight: 900, color: creditData.debt > 0 ? '#ef4444' : '#1e293b', marginTop: '2px' }}>
                                                S/ {creditData.debt.toFixed(2)}
                                            </div>
                                        </div>
                                        <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                            <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Disponible</span>
                                            <div style={{ fontSize: '13px', fontWeight: 900, color: creditData.available > 0 ? '#10b981' : '#ef4444', marginTop: '2px' }}>
                                                S/ {creditData.available.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                                            Comprobantes Pendientes
                                        </div>
                                        
                                        {creditData.pendingInvoices.length === 0 ? (
                                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
                                                No hay facturas o boletas pendientes de pago.
                                            </div>
                                        ) : (
                                            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflowY: 'auto', maxHeight: '180px' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
                                                    <thead>
                                                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                                            <th style={{ padding: '6px 10px', fontWeight: 700, color: '#475569' }}>Fecha / Vence</th>
                                                            <th style={{ padding: '6px 10px', fontWeight: 700, color: '#475569' }}>Documento</th>
                                                            <th style={{ padding: '6px 10px', fontWeight: 700, color: '#ef4444', textAlign: 'right' }}>Saldo</th>
                                                            <th style={{ padding: '6px 10px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Acción</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {creditData.pendingInvoices.map((inv, idx) => (
                                                            <tr key={idx} style={{ borderBottom: idx < creditData.pendingInvoices.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                                                <td style={{ padding: '8px 10px', color: '#64748b' }}>
                                                                    {inv.fecha.split('-').reverse().join('/')}
                                                                    <div style={{ fontSize: '8px', color: '#94a3b8' }}>Vence: {inv.fven.split('-').reverse().join('/')}</div>
                                                                </td>
                                                                <td style={{ padding: '8px 10px', fontWeight: 700, color: '#334155' }}>
                                                                    {inv.cdocu === '01' ? 'Factura' : inv.cdocu === '03' ? 'Boleta' : 'Nota'}
                                                                    <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 600 }}>{inv.ndocu}</div>
                                                                </td>
                                                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#ef4444' }}>
                                                                    S/ {inv.saldo.toFixed(2)}
                                                                </td>
                                                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                                                    <button
                                                                        onClick={() => {
                                                                            setAmortizingInvoice({ ...inv, codcli: selectedCreditCustomer.codcli });
                                                                            setCollectAmount(inv.saldo.toString());
                                                                            setCollectMethod('Efectivo');
                                                                        }}
                                                                        style={{
                                                                            background: '#ecfdf5',
                                                                            color: '#10b981',
                                                                            border: 'none',
                                                                            borderRadius: '6px',
                                                                            padding: '4px 8px',
                                                                            fontSize: '10px',
                                                                            fontWeight: 800,
                                                                            cursor: 'pointer',
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '2px'
                                                                        }}
                                                                    >
                                                                        <CreditCard size={10} /> Cobrar
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MODAL DE COBRO / AMORTIZACIÓN DENTRO DE CLIENTES */}
            <AnimatePresence>
                {amortizingInvoice && (
                    <div style={{ ...modalOverlayStyle, zIndex: 1100 }}>
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            exit={{ scale: 0.95, opacity: 0 }}
                            style={{ 
                                background: '#fff', 
                                padding: '24px', 
                                borderRadius: '20px', 
                                width: '90%', 
                                maxWidth: '360px', 
                                boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.15)',
                                border: '1px solid #f1f5f9',
                                position: 'relative'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CreditCard size={16} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0 }}>Registrar Pago</h3>
                                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>{amortizingInvoice.cdocu}-{amortizingInvoice.ndocu}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setAmortizingInvoice(null)} 
                                    style={{ background: '#f8fafc', border: 'none', color: '#94a3b8', borderRadius: '8px', padding: '4px', cursor: 'pointer' }}
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div>
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                        Deuda pendiente
                                    </span>
                                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#ef4444' }}>
                                        S/ {amortizingInvoice.saldo.toFixed(2)}
                                    </div>
                                </div>

                                <div>
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                        Monto a Amortizar
                                    </span>
                                    <input 
                                        type="number" 
                                        style={{ 
                                            width: '100%', 
                                            padding: '8px 12px', 
                                            borderRadius: '8px', 
                                            border: '1px solid #e2e8f0', 
                                            fontSize: '13px', 
                                            fontWeight: 700,
                                            color: '#1e293b',
                                            outline: 'none'
                                        }}
                                        value={collectAmount}
                                        onChange={(e) => setCollectAmount(e.target.value)}
                                        max={amortizingInvoice.saldo}
                                        min={0.1}
                                        step="0.01"
                                    />
                                </div>

                                <div>
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                                        Método de Pago
                                    </span>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {['Efectivo', 'Tarjeta'].map((method) => (
                                            <button
                                                key={method}
                                                type="button"
                                                onClick={() => setCollectMethod(method)}
                                                style={{
                                                    flex: 1,
                                                    padding: '8px',
                                                    borderRadius: '8px',
                                                    border: '1px solid',
                                                    borderColor: collectMethod === method ? '#3b82f6' : '#e2e8f0',
                                                    background: collectMethod === method ? '#eff6ff' : '#fff',
                                                    color: collectMethod === method ? '#3b82f6' : '#475569',
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {method}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    disabled={isSubmittingCollection || !collectAmount || parseFloat(collectAmount) <= 0 || parseFloat(collectAmount) > amortizingInvoice.saldo}
                                    onClick={() => handleCollectDebt(amortizingInvoice.codcli)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '10px',
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: '#fff',
                                        border: 'none',
                                        fontSize: '12px',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        marginTop: '6px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px',
                                        opacity: (isSubmittingCollection || !collectAmount || parseFloat(collectAmount) <= 0 || parseFloat(collectAmount) > amortizingInvoice.saldo) ? 0.6 : 1
                                    }}
                                >
                                    {isSubmittingCollection ? 'Procesando...' : 'Confirmar Cobro'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
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
