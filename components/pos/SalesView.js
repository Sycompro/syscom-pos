'use client';
import { useState, useEffect } from 'react';
import { 
  Receipt, Search, Printer, Calendar, Loader2, MessageCircle, 
  CheckCircle2, Banknote, CreditCard, UserCircle, AlertCircle, 
  ChevronRight, Trash2, SlidersHorizontal, ArrowRight, TrendingUp, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';

export default function SalesView({ onPrint, onQueueWhatsApp, useScreenKeyboards, company }) {
  const [sales, setSales] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [motivosAnulacion, setMotivosAnulacion] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [selectedSede, setSelectedSede] = useState('all');
  const [selectedComprobante, setSelectedComprobante] = useState('all');
  const [selectedVendedor, setSelectedVendedor] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modales
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saleItems, setSaleItems] = useState([]);
  const [reprinting, setReprinting] = useState(null);

  // WhatsApp
  const [whatsappSale, setWhatsappSale] = useState(null);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [sendingWa, setSendingWa] = useState(false);
  const [showWaSuccess, setShowWaSuccess] = useState(false);

  // Anulación
  const [annulSale, setAnnulSale] = useState(null);
  const [selectedMotivoAnu, setSelectedMotivoAnu] = useState('');
  const [processingAnnul, setProcessingAnnul] = useState(false);

  const [windowWidth, setWindowWidth] = useState(1280);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileView = windowWidth < 768;

  // Estilos de KPIs adaptables a móviles
  const cardStyle = isMobileView ? {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#ffffff',
    borderRadius: '12px',
    padding: '8px 12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
    border: '1px solid #f1f5f9',
    width: '100%',
    boxSizing: 'border-box'
  } : kpiCardStyle;

  const iconStyle = isMobileView ? {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  } : iconContainerStyle;

  const labelKpiStyle = isMobileView ? {
    fontSize: '9px',
    fontWeight: 800,
    color: '#94a3b8',
    textTransform: 'uppercase',
    display: 'block',
    lineHeight: '1.2'
  } : kpiLabelStyle;

  const valueKpiStyle = isMobileView ? {
    fontSize: '12px',
    fontWeight: 900,
    color: '#0f172a',
    display: 'block',
    marginTop: '2px',
    lineHeight: '1.2'
  } : kpiValueStyle;

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchSales();
  }, [startDate, endDate, selectedSede, selectedComprobante, selectedVendedor]);

  const fetchInitialData = async () => {
    try {
      // Cargar vendedores
      const venRes = await fetch('/api/salespeople');
      const venData = await venRes.json();
      setVendedores(Array.isArray(venData) ? venData : []);
    } catch (e) {
      console.error('Error fetching initial data:', e);
    }
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const url = `/api/sales/list?startDate=${startDate}&endDate=${endDate}&sedeId=${selectedSede}&docType=${selectedComprobante}&sellerId=${selectedVendedor}&search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      
      setSales(Array.isArray(data.sales) ? data.sales : []);
      if (Array.isArray(data.sedes)) setSedes(data.sedes);
      if (Array.isArray(data.motivosAnulacion)) {
        setMotivosAnulacion(data.motivosAnulacion);
        if (data.motivosAnulacion.length > 0) {
          // Seleccionar motivo por defecto '04' (Error de Usuario) si existe, sino el primero
          const defMotivo = data.motivosAnulacion.find(m => m.id === '04') || data.motivosAnulacion[0];
          setSelectedMotivoAnu(defMotivo.id);
        }
      }
    } catch (e) {
      console.error('Error fetching sales:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchClick = () => {
    fetchSales();
  };

  const handleOpenDetail = async (sale) => {
    setSelectedSaleDetail(sale);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/sales/details?cdocu=${sale.cdocu}&ndocu=${sale.ndocu}`);
      const data = await res.json();
      setSaleItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      console.error('Error fetching details:', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleReprint = async (sale) => {
    setReprinting(sale.ndocu);
    try {
      const res = await fetch(`/api/sales/details?cdocu=${sale.cdocu}&ndocu=${sale.ndocu}`);
      const data = await res.json();
      if (data.items) {
        onPrint({
          documentNumber: data.ndocu,
          docType: data.cdocu,
          customer: { name: data.nomcli, ruc: data.ruccli },
          items: data.items,
          total: data.total,
          base: data.base,
          igv: data.igv,
          date: new Date(data.fecha).toLocaleString(),
          salesperson: data.salesperson
        });
      }
    } catch (e) {
      console.error('Error reprinting:', e);
    } finally {
      setReprinting(null);
    }
  };

  const openWaModal = (sale) => {
    setWhatsappSale(sale);
    // Intentar sacar teléfono del cliente
    setWhatsappPhone(sale.phone || '');
  };

  const handleSendWhatsApp = async () => {
    if (!whatsappPhone || whatsappPhone.length < 9) return alert('Por favor ingresa un celular válido');
    
    const activeDb = company || localStorage.getItem('selected_company') || 'BdNava03';
    const logo = localStorage.getItem(`pos_logo_${activeDb}`) || `logocia${activeDb.replace('BdNava', '').padStart(2, '0')}.jpg`;
    const pdfUrl = `${window.location.origin}/api/sales/pdf?logo=${logo}&ndocu=${whatsappSale.ndocu}&cdocu=${whatsappSale.cdocu}&db=${activeDb}&ext=.pdf`;
    
    const msg = `*¡Gracias por tu compra!* 🤝\n\n` +
                `📄 *Detalles del pedido:*\n` +
                ` • *Documento:* ${whatsappSale.cdocu === '01' ? 'Factura' : (whatsappSale.cdocu === '03' ? 'Boleta' : 'Nota')} ${whatsappSale.ndocu}\n` +
                ` • *Total:* S/ ${Number(whatsappSale.tota).toFixed(2)}\n\n` +
                `Puedes descargar tu comprobante digital aquí: ${pdfUrl}\n\n` +
                `¡Que tengas un excelente día!`;

    if (onQueueWhatsApp) {
      onQueueWhatsApp(whatsappPhone, msg, pdfUrl);
      setShowWaSuccess(true);
      setTimeout(() => {
        setShowWaSuccess(false);
        setWhatsappSale(null);
      }, 1000);
    } else {
      setSendingWa(true);
      try {
        await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: whatsappPhone, message: msg, media_url: pdfUrl })
        });
        setSendingWa(false);
        setShowWaSuccess(true);
        setTimeout(() => {
          setShowWaSuccess(false);
          setWhatsappSale(null);
        }, 1500);
      } catch (e) {
        setSendingWa(false);
        alert('Error al enviar WhatsApp');
      }
    }
  };

  const handleAnnulSale = async () => {
    if (!selectedMotivoAnu) return alert('Por favor selecciona un motivo');
    setProcessingAnnul(true);
    try {
      const res = await fetch('/api/sales/annul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cdocu: annulSale.cdocu,
          ndocu: annulSale.ndocu,
          codanu: selectedMotivoAnu
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Venta anulada con éxito en el ERP y revertido el stock.');
        setAnnulSale(null);
        fetchSales(); // Recargar listado
      } else {
        alert('Error al anular: ' + data.error);
      }
    } catch (e) {
      alert('Error de conexión al anular');
    } finally {
      setProcessingAnnul(false);
    }
  };

  // KPIs calculados
  const activeSales = sales.filter(s => s.status === 'ACTIVO');
  const canceledSales = sales.filter(s => s.status === 'ANULADO');
  const totalFacturado = activeSales.reduce((acc, s) => acc + s.tota, 0);
  const totalAnulado = canceledSales.reduce((acc, s) => acc + s.tota, 0);
  const qtyTransacciones = activeSales.length;
  const ticketPromedio = qtyTransacciones > 0 ? (totalFacturado / qtyTransacciones) : 0;

  return (
    <div style={containerStyle} className="container-responsive">
      <style dangerouslySetInnerHTML={{__html: `
        .filter-grid-responsive {
          display: grid !important;
          grid-template-columns: repeat(7, 1fr) !important;
          gap: 12px !important;
        }
        .search-col-responsive {
          grid-column: span 2 !important;
        }
        @media (max-width: 1280px) {
          .filter-grid-responsive {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
        @media (max-width: 1024px) {
          .kpi-grid-responsive {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
        }
        @media (max-width: 768px) {
          .hide-mobile {
            display: none !important;
          }
          .filter-grid-responsive {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .container-responsive {
            padding: 12px !important;
            gap: 12px !important;
          }
          .kpi-grid-responsive {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          .search-col-responsive {
            grid-column: span 2 !important;
          }
        }
        @media (max-width: 480px) {
          .kpi-grid-responsive {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          .filter-grid-responsive {
            grid-template-columns: 1fr !important;
          }
          .search-col-responsive {
            grid-column: span 1 !important;
          }
        }
      `}} />

      {/* 1. KPIs SUPERIORES (Estilo Premium Porcelain Glass) */}
      <div style={kpiGridStyle} className="kpi-grid-responsive">
        <div style={cardStyle}>
          <div style={{ ...iconStyle, color: '#10b981', background: '#e6fbf3' }}>
            <TrendingUp size={isMobileView ? 14 : 20} />
          </div>
          <div>
            <span style={labelKpiStyle}>Total Facturado</span>
            <span style={valueKpiStyle}>S/ {totalFacturado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ ...iconStyle, color: '#3b82f6', background: '#eff6ff' }}>
            <Receipt size={isMobileView ? 14 : 20} />
          </div>
          <div>
            <span style={labelKpiStyle}>Transacciones</span>
            <span style={valueKpiStyle}>{qtyTransacciones} {isMobileView ? 'emit.' : 'emitidas'}</span>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ ...iconStyle, color: '#8b5cf6', background: '#f5f3ff' }}>
            <TrendingUp size={isMobileView ? 14 : 20} />
          </div>
          <div>
            <span style={labelKpiStyle}>Ticket Promedio</span>
            <span style={valueKpiStyle}>S/ {ticketPromedio.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ ...iconStyle, color: '#ef4444', background: '#fdf2f2' }}>
            <AlertCircle size={isMobileView ? 14 : 20} />
          </div>
          <div>
            <span style={labelKpiStyle}>Monto Anulado</span>
            <span style={valueKpiStyle}>S/ {totalAnulado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* 2. PANEL DE FILTROS RESPONSIVO */}
      <div style={filterPanelStyle}>
        {isMobileView ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ ...inputWrapperStyle, flex: 1 }}>
                <Search size={13} style={iconInputStyle} />
                <input 
                  type="text" 
                  placeholder="Nº documento o cliente..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearchClick()}
                  style={{ ...inputStyle, paddingRight: '70px' }} 
                />
                <button onClick={handleSearchClick} style={{ ...searchBtnStyle, position: 'absolute', right: '4px', top: '4px', bottom: '4px', height: 'auto', margin: 0, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Buscar</button>
              </div>
              <button 
                type="button"
                onClick={() => setShowMobileFilters(!showMobileFilters)} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '33px', 
                  height: '33px', 
                  borderRadius: '10px', 
                  border: '1px solid #e2e8f0', 
                  background: showMobileFilters ? '#f1f5f9' : '#fff',
                  color: showMobileFilters ? '#3b82f6' : '#64748b',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title="Filtros Avanzados"
              >
                <SlidersHorizontal size={14} />
              </button>
            </div>

            <AnimatePresence>
              {showMobileFilters && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }} 
                  style={{ overflow: showMobileFilters ? 'visible' : 'hidden' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', marginTop: '4px' }}>
                    {/* Fechas */}
                    <div style={filterColStyle}>
                      <label style={labelStyle}>Desde</label>
                      <CustomDatePicker value={startDate} onChange={val => setStartDate(val)} />
                    </div>
                    <div style={filterColStyle}>
                      <label style={labelStyle}>Hasta</label>
                      <CustomDatePicker value={endDate} onChange={val => setEndDate(val)} />
                    </div>

                    {/* Sede */}
                    <div style={{ ...filterColStyle, gridColumn: 'span 2' }}>
                      <label style={labelStyle}>Sede</label>
                      <CustomSelect 
                        value={selectedSede} 
                        onChange={e => setSelectedSede(e.target.value)} 
                        options={[
                          { value: 'all', label: 'CONSOLIDADO (TODAS)' },
                          ...sedes.map(s => ({ value: s.id, label: s.name }))
                        ]} 
                        placeholder="Sede..."
                      />
                    </div>

                    {/* Comprobante */}
                    <div style={filterColStyle}>
                      <label style={labelStyle}>Comprobante</label>
                      <CustomSelect 
                        value={selectedComprobante} 
                        onChange={e => setSelectedComprobante(e.target.value)} 
                        options={[
                          { value: 'all', label: 'TODOS' },
                          { value: '03', label: 'BOLETA DE VENTA' },
                          { value: '01', label: 'FACTURA ELECTRONICA' },
                          { value: '65', label: 'NOTA DE VENTA' }
                        ]} 
                        placeholder="Comprobante..."
                      />
                    </div>

                    {/* Vendedor */}
                    <div style={filterColStyle}>
                      <label style={labelStyle}>Vendedor</label>
                      <CustomSelect 
                        value={selectedVendedor} 
                        onChange={e => setSelectedVendedor(e.target.value)} 
                        options={[
                          { value: 'all', label: 'TODOS LOS VENDEDORES' },
                          ...vendedores.map(v => ({ value: v.id, label: v.name.trim() }))
                        ]} 
                        placeholder="Vendedor..."
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b', marginBottom: '8px' }}>
              <SlidersHorizontal size={14} />
              <span style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtros de Búsqueda</span>
            </div>
            <div className="filter-grid-responsive" style={{ display: 'grid', gap: '12px' }}>
              {/* Rango de Fechas */}
              <div style={filterColStyle}>
                <label style={labelStyle}>Desde</label>
                <CustomDatePicker value={startDate} onChange={val => setStartDate(val)} />
              </div>
              <div style={filterColStyle}>
                <label style={labelStyle}>Hasta</label>
                <CustomDatePicker value={endDate} onChange={val => setEndDate(val)} />
              </div>

              {/* Sede */}
              <div style={filterColStyle}>
                <label style={labelStyle}>Sede</label>
                <CustomSelect 
                  value={selectedSede} 
                  onChange={e => setSelectedSede(e.target.value)} 
                  options={[
                    { value: 'all', label: 'CONSOLIDADO (TODAS)' },
                    ...sedes.map(s => ({ value: s.id, label: s.name }))
                  ]} 
                  placeholder="Sede..."
                />
              </div>

              {/* Comprobante */}
              <div style={filterColStyle}>
                <label style={labelStyle}>Comprobante</label>
                <CustomSelect 
                  value={selectedComprobante} 
                  onChange={e => setSelectedComprobante(e.target.value)} 
                  options={[
                    { value: 'all', label: 'TODOS' },
                    { value: '03', label: 'BOLETA DE VENTA' },
                    { value: '01', label: 'FACTURA ELECTRONICA' },
                    { value: '65', label: 'NOTA DE VENTA' }
                  ]} 
                  placeholder="Comprobante..."
                />
              </div>

              {/* Vendedor */}
              <div style={filterColStyle}>
                <label style={labelStyle}>Vendedor</label>
                <CustomSelect 
                  value={selectedVendedor} 
                  onChange={e => setSelectedVendedor(e.target.value)} 
                  options={[
                    { value: 'all', label: 'TODOS LOS VENDEDORES' },
                    ...vendedores.map(v => ({ value: v.id, label: v.name.trim() }))
                  ]} 
                  placeholder="Vendedor..."
                />
              </div>

              {/* Búsqueda por Texto */}
              <div style={filterColStyle} className="search-col-responsive">
                <label style={labelStyle}>Buscador Rápido</label>
                <div style={inputWrapperStyle}>
                  <Search size={13} style={iconInputStyle} />
                  <input 
                    type="text" 
                    placeholder="Nº documento o nombre del cliente..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchClick()}
                    style={inputStyle} 
                  />
                  <button onClick={handleSearchClick} style={searchBtnStyle}>Buscar</button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. TABLA DE RESULTADOS */}
      <div style={tableContainerStyle}>
        {loading ? (
          <div style={loadingContainerStyle}>
            <Loader2 className="animate-spin" size={24} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Cargando registros del ERP...</span>
          </div>
        ) : sales.length === 0 ? (
          <div style={noDataStyle}>
            <AlertCircle size={32} style={{ color: '#94a3b8', marginBottom: '10px' }} />
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 700 }}>No se encontraron ventas para los filtros seleccionados.</span>
          </div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr style={thRowStyle}>
                <th style={thStyle}>COMPROBANTE</th>
                <th style={thStyle}>CLIENTE</th>
                <th style={thStyle} className="hide-mobile">SEDE</th>
                <th style={thStyle} className="hide-mobile">VENDEDOR</th>
                <th style={thStyle} className="hide-mobile">FECHA / HORA</th>
                <th style={{ ...thStyle, textAlign: 'right' }} className="hide-mobile">PAGO</th>
                <th style={thStyle}>SUNAT</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>TOTAL</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(sale => (
                <tr key={sale.ndocu} style={trStyle}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={docNumStyle}>{sale.ndocu}</span>
                        <span style={docTypeStyle}>{sale.cdocu === '01' ? 'FACTURA' : (sale.cdocu === '03' ? 'BOLETA' : 'NOTA')}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={sale.status === 'ANULADO' ? statusAnuladoStyle : statusActivoStyle}>
                          {sale.status}
                        </span>
                        {(sale.cdocu === '01' || sale.cdocu === '03') && (
                          <span style={{
                            fontSize: '7px',
                            fontWeight: 900,
                            color: sale.sunatColor,
                            background: sale.sunatColor === '#10b981' ? '#e6fbf3' : (sale.sunatColor === '#ef4444' ? '#fdf2f2' : '#fffbeb'),
                            padding: '1px 4px',
                            borderRadius: '3px',
                            textTransform: 'uppercase',
                            width: 'fit-content',
                            textAlign: 'center'
                          }}>
                            {sale.sunatStatus.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={clientNameStyle}>{sale.nomcli.trim()}</span>
                      <span style={clientDocStyle}>{sale.ruccli ? `DOC: ${sale.ruccli.trim()}` : 'SIN DOCUMENTO'}</span>
                    </div>
                  </td>
                  <td style={tdStyle} className="hide-mobile">
                    <span style={badgeSedeStyle}>{sale.sedeName || `Sede ${sale.Codpto}`}</span>
                  </td>
                  <td style={tdStyle} className="hide-mobile">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#475569', fontWeight: 600 }}>
                      <UserCircle size={12} style={{ color: '#64748b' }} />
                      <span>{sale.sellerName ? sale.sellerName.split(' ')[0] : (sale.codven || 'V0001')}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color: '#475569' }} className="hide-mobile">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700 }}>{sale.fecha_real || new Date(sale.fecha).toLocaleDateString()}</span>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>{sale.hora_real}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' }} className="hide-mobile">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                      {sale.paymentType === 'EFECTIVO' ? (
                        <Banknote size={12} style={{ color: '#10b981' }} />
                      ) : sale.paymentType === 'MIXTO' ? (
                        <span style={{ fontSize: '9px', fontWeight: 800, color: '#f59e0b', background: '#fffbeb', padding: '1px 4px', borderRadius: '4px' }}>M</span>
                      ) : (
                        <CreditCard size={12} style={{ color: '#3b82f6' }} />
                      )}
                      <span style={{ fontWeight: 700 }}>{sale.paymentType}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: '8px',
                      fontWeight: 900,
                      color: sale.sunatColor,
                      background: sale.sunatColor === '#10b981' ? '#e6fbf3' : (sale.sunatColor === '#ef4444' ? '#fdf2f2' : '#fffbeb'),
                      padding: '2px 6px',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}>
                      {sale.sunatStatus}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 900, color: '#3b82f6', fontSize: '12px' }}>
                    S/ {sale.tota.toFixed(2)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                      <button onClick={() => handleOpenDetail(sale)} style={actionBtnDetail} title="Ver items">
                        <ChevronRight size={13} />
                      </button>
                      <button onClick={() => openWaModal(sale)} style={actionBtnWa} title="Enviar por WhatsApp">
                        <MessageCircle size={13} />
                      </button>
                      <button onClick={() => handleReprint(sale)} disabled={reprinting === sale.ndocu} style={actionBtnPrint} title="Reimprimir">
                        {reprinting === sale.ndocu ? <Loader2 className="animate-spin" size={13} /> : <Printer size={13} />}
                      </button>
                      {sale.status === 'ACTIVO' && (
                        <button onClick={() => setAnnulSale(sale)} style={actionBtnAnnul} title="Anular venta">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL 1: DETALLE DE COMPRA */}
      <AnimatePresence>
        {selectedSaleDetail && (
          <div style={overlayStyle}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} style={modalStyle}>
              <div style={modalHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={iconBoxStyle}><Receipt size={18} /></div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900 }}>Detalle de Venta</h3>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b' }}>{selectedSaleDetail.ndocu} ({selectedSaleDetail.cdocu === '01' ? 'Factura' : selectedSaleDetail.cdocu === '03' ? 'Boleta' : 'Nota'})</span>
                  </div>
                </div>
                <button onClick={() => setSelectedSaleDetail(null)} style={closeBtnStyle}><X size={16} /></button>
              </div>
              <div style={{ padding: '20px', overflowY: 'auto', maxHeight: '50vh' }}>
                {loadingDetail ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}><Loader2 className="animate-spin" /></div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                        <th style={{ ...thStyle, padding: '8px 4px' }}>Descripción del Artículo</th>
                        <th style={{ ...thStyle, padding: '8px 4px', textAlign: 'center' }}>Cant.</th>
                        <th style={{ ...thStyle, padding: '8px 4px', textAlign: 'right' }}>P. Unit</th>
                        <th style={{ ...thStyle, padding: '8px 4px', textAlign: 'right' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {saleItems.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ ...tdStyle, padding: '8px 4px', fontWeight: 700 }}>{item.name}</td>
                          <td style={{ ...tdStyle, padding: '8px 4px', textAlign: 'center', fontWeight: 800 }}>{Number(item.quantity).toFixed(0)}</td>
                          <td style={{ ...tdStyle, padding: '8px 4px', textAlign: 'right' }}>S/ {Number(item.price).toFixed(2)}</td>
                          <td style={{ ...tdStyle, padding: '8px 4px', textAlign: 'right', fontWeight: 800, color: '#3b82f6' }}>S/ {(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div style={modalFooterStyle}>
                <div style={{ marginRight: 'auto', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>VENDEDOR</span>
                  <span style={{ fontSize: '12px', color: '#1e293b', fontWeight: 800 }}>{selectedSaleDetail.sellerName || selectedSaleDetail.codven}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, display: 'block' }}>TOTAL GENERAL</span>
                  <span style={{ fontSize: '18px', fontWeight: 950, color: '#10b981' }}>S/ {selectedSaleDetail.tota.toFixed(2)}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: CONFIRMACIÓN DE ANULACIÓN */}
      <AnimatePresence>
        {annulSale && (
          <div style={overlayStyle}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ ...modalStyle, maxWidth: '400px', overflow: 'visible' }}>
              <div style={modalHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                  <AlertCircle size={18} />
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900 }}>¿Anular Comprobante?</h3>
                </div>
                <button onClick={() => setAnnulSale(null)} style={closeBtnStyle}><X size={16} /></button>
              </div>
              <div style={{ padding: '20px' }}>
                <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 16px', lineHeight: 1.5 }}>
                  Esta acción registrará la anulación física del documento <strong>{annulSale.ndocu}</strong> en el ERP Navasoft, revertirá el stock de los productos vendidos a los almacenes y cancelará las cuentas por cobrar asociadas.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Motivo de la Anulación</label>
                  <CustomSelect 
                    value={selectedMotivoAnu} 
                    onChange={e => setSelectedMotivoAnu(e.target.value)} 
                    options={motivosAnulacion.map(m => ({ value: m.id, label: `[${m.id}] ${m.name}` }))}
                    placeholder="Seleccionar motivo..."
                  />
                </div>
              </div>
              <div style={{ ...modalFooterStyle, gap: '12px', padding: '16px 20px', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
                <button onClick={() => setAnnulSale(null)} style={cancelBtnStyle} disabled={processingAnnul}>Descartar</button>
                <button onClick={handleAnnulSale} disabled={processingAnnul} style={annulBtnStyle}>
                  {processingAnnul ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                  <span>{processingAnnul ? 'Anulando...' : 'Confirmar Anulación'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: ENVIAR WHATSAPP */}
      <AnimatePresence>
        {whatsappSale && (
          <div style={overlayStyle}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} style={{ ...modalStyle, maxWidth: '300px' }}>
              <div style={modalHeaderStyle}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900 }}>Compartir Ticket</h3>
                <button onClick={() => setWhatsappSale(null)} style={closeBtnStyle}><X size={16} /></button>
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Celular del Cliente</label>
                  <input 
                    type="text" 
                    placeholder="Ej. 999888777" 
                    value={whatsappPhone}
                    onChange={e => setWhatsappPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    style={selectStyle}
                  />
                </div>
              </div>
              <div style={{ ...modalFooterStyle, padding: '12px 20px' }}>
                <button onClick={handleSendWhatsApp} disabled={sendingWa} style={miniSendBtnStyle}>
                  {sendingWa ? <Loader2 className="animate-spin" size={14} /> : <MessageCircle size={14} />}
                  <span>{sendingWa ? 'Enviando...' : 'Enviar por WhatsApp'}</span>
                </button>
              </div>
              <AnimatePresence>
                {showWaSuccess && (
                  <div style={toastWaStyle}>
                    <CheckCircle2 size={12} /> ¡Añadido a la cola de WhatsApp!
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Estilos Porcelain Glass UI
const containerStyle = { display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', height: '100%', overflowY: 'auto', width: '100%', maxWidth: '1400px', margin: '0 auto' };

const kpiGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' };
const kpiCardStyle = { display: 'flex', alignItems: 'center', gap: '16px', background: '#ffffff', borderRadius: '18px', padding: '16px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' };
const iconContainerStyle = { width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const kpiLabelStyle = { fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '2px' };
const kpiValueStyle = { fontSize: '16px', fontWeight: 950, color: '#0f172a' };

const filterPanelStyle = { background: '#ffffff', borderRadius: '20px', padding: '18px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' };
const filterGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px' };
const filterColStyle = { display: 'flex', flexDirection: 'column', gap: '4px' };
const labelStyle = { fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginLeft: '4px' };
const inputWrapperStyle = { position: 'relative', display: 'flex', alignItems: 'center' };
const iconInputStyle = { position: 'absolute', left: '10px', color: '#94a3b8' };
const inputStyle = { width: '100%', padding: '8px 10px 8px 30px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 700, color: '#1e293b', outline: 'none' };
const selectStyle = { width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 700, color: '#1e293b', outline: 'none', background: '#fff', height: '33px' };
const searchBtnStyle = { marginLeft: '8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', padding: '8px 14px', fontSize: '11px', fontWeight: 800, cursor: 'pointer', transition: 'background 0.2s' };

const tableContainerStyle = { background: '#ffffff', borderRadius: '24px', padding: '10px 20px 20px', boxShadow: '0 4px 25px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', overflowX: 'auto', flex: 1, minHeight: '300px' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thRowStyle = { borderBottom: '2px solid #f1f5f9' };
const thStyle = { textAlign: 'left', padding: '12px 10px', fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' };
const trStyle = { borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' };
const tdStyle = { padding: '12px 10px', fontSize: '11px' };

const docNumStyle = { fontSize: '11px', fontWeight: 800, color: '#0f172a' };
const docTypeStyle = { fontSize: '9px', fontWeight: 800, color: '#94a3b8' };
const statusActivoStyle = { fontSize: '8px', fontWeight: 900, color: '#10b981', background: '#e6fbf3', padding: '1px 6px', borderRadius: '4px' };
const statusAnuladoStyle = { fontSize: '8px', fontWeight: 900, color: '#ef4444', background: '#fdf2f2', padding: '1px 6px', borderRadius: '4px' };
const clientNameStyle = { fontSize: '11px', fontWeight: 700, color: '#1e293b' };
const clientDocStyle = { fontSize: '9px', fontWeight: 600, color: '#94a3b8' };
const badgeSedeStyle = { fontSize: '9px', fontWeight: 800, color: '#3b82f6', background: '#eff6ff', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' };

const actionBtnDetail = { border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const actionBtnWa = { border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const actionBtnPrint = { border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const actionBtnAnnul = { border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', background: '#fdf2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' };

const loadingContainerStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '100px 0' };
const noDataStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' };

const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' };
const modalStyle = { background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 70px rgba(15,23,42,0.18)', border: '1px solid #f1f5f9' };
const modalHeaderStyle = { padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const iconBoxStyle = { width: '36px', height: '36px', background: '#eff6ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' };
const closeBtnStyle = { background: '#f8fafc', border: 'none', color: '#94a3b8', borderRadius: '8px', padding: '6px', cursor: 'pointer' };
const modalFooterStyle = { padding: '16px 20px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' };

const cancelBtnStyle = { background: 'none', border: 'none', color: '#64748b', fontSize: '12px', fontWeight: 800, cursor: 'pointer', transition: 'color 0.2s', padding: '8px 16px' };
const annulBtnStyle = { background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 20px', fontSize: '12px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(239,68,68,0.2)' };
const miniSendBtnStyle = { width: '100%', padding: '10px', borderRadius: '12px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px' };
const toastWaStyle = { position: 'absolute', bottom: '15px', left: '50%', transform: 'translateX(-50%)', background: '#10b981', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', zIndex: 100 };
