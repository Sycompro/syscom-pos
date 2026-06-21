'use client';
import { useState, useEffect } from 'react';
import { 
  Calendar, TrendingUp, Loader2, AlertCircle, Building2, 
  Users, DollarSign, Receipt, Percent, Award, Clock, ArrowUpRight,
  CreditCard, FileText, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import CustomSelect from './CustomSelect';

export default function DashboardView() {
  const { data: session } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatLocalDate(new Date());

  // Estados de Filtros
  const [selectedSede, setSelectedSede] = useState('all');
  const [selectedSeller, setSelectedSeller] = useState('all');
  const [selectedDocType, setSelectedDocType] = useState('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all');
  const [datePreset, setDatePreset] = useState('month'); // 'day', 'month', 'year', 'custom'

  // Listas de datos para los filtros
  const [sellers, setSellers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  // Estados para selectores detallados
  const [filterYear, setFilterYear] = useState(() => new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(() => new Date().getMonth() + 1);
  const [filterDay, setFilterDay] = useState(todayStr);
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    return formatLocalDate(startOfMonth);
  });
  const [endDate, setEndDate] = useState(todayStr);

  const [windowWidth, setWindowWidth] = useState(1280);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileView = windowWidth < 768;

  // Pre-poblar la sede del usuario logueado
  useEffect(() => {
    if (session?.user?.sedeId && selectedSede === 'all') {
      setSelectedSede(session.user.sedeId);
    }
  }, [session]);

  // Cargar vendedores y métodos de pago al montar
  useEffect(() => {
    fetch('/api/salespeople')
      .then(res => res.json())
      .then(d => {
        if (Array.isArray(d)) setSellers(d);
      })
      .catch(err => console.error('Error fetching salespeople:', err));

    fetch('/api/payment-methods')
      .then(res => res.json())
      .then(d => {
        if (Array.isArray(d)) setPaymentMethods(d);
      })
      .catch(err => console.error('Error fetching payment methods:', err));
  }, []);

  // Lógica de presets de fecha y actualizaciones de inputs específicos
  useEffect(() => {
    if (datePreset === 'day') {
      setStartDate(filterDay);
      setEndDate(filterDay);
    } else if (datePreset === 'month') {
      const year = parseInt(filterYear);
      const month = parseInt(filterMonth);
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);
      setStartDate(formatLocalDate(startOfMonth));
      setEndDate(formatLocalDate(endOfMonth));
    } else if (datePreset === 'year') {
      const year = parseInt(filterYear);
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31);
      setStartDate(formatLocalDate(startOfYear));
      setEndDate(formatLocalDate(endOfYear));
    }
  }, [datePreset, filterYear, filterMonth, filterDay]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        sedeId: selectedSede,
        sellerId: selectedSeller,
        docType: selectedDocType,
        paymentMethod: selectedPaymentMethod
      });
      const res = await fetch(`/api/sales/dashboard?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Fallo al obtener métricas de ventas');
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        throw new Error(json.error || 'Error desconocido');
      }
    } catch (err) {
      console.error('[DashboardView] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate, selectedSede, selectedSeller, selectedDocType, selectedPaymentMethod]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount || 0);
  };

  // --- LÓGICA DE DIBUJO DE GRÁFICO SVG ---
  const renderSVGChart = (timeData) => {
    if (!timeData || timeData.length === 0) return null;

    const width = 800;
    const height = 220;
    const paddingLeft = 60;
    const paddingRight = 30;
    const paddingTop = 20;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Calcular valores máximos y mínimos
    const maxAmount = Math.max(...timeData.map(d => d.amount), 500); // Mínimo 500 para escala
    
    // Generar coordenadas X e Y
    const points = timeData.map((d, index) => {
      const x = paddingLeft + (index / Math.max(timeData.length - 1, 1)) * chartWidth;
      const y = paddingTop + chartHeight - (d.amount / maxAmount) * chartHeight;
      return { x, y, label: d.label, amount: d.amount };
    });

    // Crear la ruta de la curva (lineal o suave)
    let pathD = "";
    let areaD = "";

    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      areaD = `M ${points[0].x} ${paddingTop + chartHeight} L ${points[0].x} ${points[0].y}`;
      
      for (let i = 1; i < points.length; i++) {
        pathD += ` L ${points[i].x} ${points[i].y}`;
        areaD += ` L ${points[i].x} ${points[i].y}`;
      }
      
      areaD += ` L ${points[points.length - 1].x} ${paddingTop + chartHeight} Z`;
    }

    // Calcular etiquetas de escala Y (5 valores)
    const yScaleValues = Array.from({ length: 4 }).map((_, i) => (maxAmount * (i / 3)));

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ minWidth: '600px' }}>
          {/* Defs para Gradientes */}
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>

          {/* Líneas horizontales de guía (Grid) */}
          {yScaleValues.map((val, idx) => {
            const y = paddingTop + chartHeight - (val / maxAmount) * chartHeight;
            return (
              <g key={idx}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
                <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">
                  S/ {Math.round(val)}
                </text>
              </g>
            );
          })}

          {/* El Área rellena */}
          {areaD && <path d={areaD} fill="url(#chartGradient)" />}

          {/* La Línea de la curva */}
          {pathD && <path d={pathD} fill="none" stroke="url(#lineGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Puntos interactivos con Tooltip y Monto */}
          {points.map((pt, idx) => {
            const showAmountLabel = pt.amount > 0;
            return (
              <g key={idx} className="group">
                <circle 
                  cx={pt.x} 
                  cy={pt.y} 
                  r="4" 
                  fill="#fff" 
                  stroke="#2563eb" 
                  strokeWidth="2.5" 
                  style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                />
                
                {showAmountLabel && (
                  <text 
                    x={pt.x} 
                    y={pt.y - 10} 
                    textAnchor="middle" 
                    fontSize="8" 
                    fill="#1e293b" 
                    fontWeight="850"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    paintOrder="stroke"
                    style={{ pointerEvents: 'none' }}
                  >
                    S/ {Math.round(pt.amount)}
                  </text>
                )}
                
                {/* Tooltip flotante en SVG */}
                <title>{`${pt.label}: S/ ${pt.amount.toFixed(2)}`}</title>
              </g>
            );
          })}

          {/* Etiquetas Eje X */}
          {points.map((pt, idx) => {
            // Mostrar solo algunas etiquetas en el Eje X si hay demasiadas para no amontonar
            const showLabel = points.length < 15 || idx % Math.ceil(points.length / 8) === 0 || idx === points.length - 1;
            if (!showLabel) return null;

            return (
              <text key={idx} x={pt.x} y={paddingTop + chartHeight + 18} textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="700">
                {pt.label.length > 5 ? pt.label.substring(5) : pt.label}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  if (!mounted) {
    return (
      <div style={containerStyle}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '300px',
          width: '100%'
        }}>
          <Loader2 className="animate-spin" size={36} color="#3b82f6" />
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Cabecera adaptada */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        width: '100%',
        flexShrink: 0
      }}>
        <div>
          <h2 style={titleStyle}>Panel de Control y Ventas</h2>
          <p style={subtitleStyle}>Métricas de facturación, transacciones consolidadas y rendimiento comercial.</p>
        </div>

        {/* Barra de Filtros Porcelain */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          width: '100%'
        }}>
          {/* Selector de Sede */}
          <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
            <CustomSelect
              value={selectedSede}
              onChange={e => setSelectedSede(e.target.value)}
              options={[
                { value: 'all', label: 'Consolidado (Todas las Sedes)' },
                // Inyectar la sede de la sesión si no está en la base de datos por estado
                ...(session?.user?.sedeId && !data?.sedes?.some(s => s.id === session.user.sedeId) ? [{ value: session.user.sedeId, label: session.user.sedeName || `Sede ${session.user.sedeId}` }] : []),
                ...(data?.sedes?.map(s => ({ value: s.id, label: s.name })) || [])
              ]}
              icon={<Building2 size={14} color="#64748b" />}
              placeholder="Sedes..."
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                background: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                height: '35px',
                fontSize: '12px',
                color: '#334155',
                fontWeight: 800,
                width: '100%'
              }}
            />
          </div>

          {/* Selector de Vendedor */}
          <div style={{ flex: '1 1 160px', minWidth: '120px' }}>
            <CustomSelect
              value={selectedSeller}
              onChange={e => setSelectedSeller(e.target.value)}
              options={[
                { value: 'all', label: 'Todos los Vendedores' },
                ...sellers.map(v => ({ value: v.id, label: v.name }))
              ]}
              icon={<User size={14} color="#64748b" />}
              placeholder="Vendedor..."
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                background: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                height: '35px',
                fontSize: '12px',
                color: '#334155',
                fontWeight: 800,
                width: '100%'
              }}
            />
          </div>

          {/* Selector de Tipo de Documento */}
          <div style={{ flex: '1 1 160px', minWidth: '120px' }}>
            <CustomSelect
              value={selectedDocType}
              onChange={e => setSelectedDocType(e.target.value)}
              options={[
                { value: 'all', label: 'Todos los Documentos' },
                { value: '03', label: 'Boletas de Venta' },
                { value: '01', label: 'Facturas' },
                { value: '65', label: 'Notas de Venta' }
              ]}
              icon={<FileText size={14} color="#64748b" />}
              placeholder="Documento..."
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                background: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                height: '35px',
                fontSize: '12px',
                color: '#334155',
                fontWeight: 800,
                width: '100%'
              }}
            />
          </div>

          {/* Selector de Forma de Pago */}
          <div style={{ flex: '1 1 180px', minWidth: '130px' }}>
            <CustomSelect
              value={selectedPaymentMethod}
              onChange={e => setSelectedPaymentMethod(e.target.value)}
              options={[
                { value: 'all', label: 'Todas las Formas de Pago' },
                { value: 'EF', label: 'Efectivo' },
                ...paymentMethods.map(m => ({ value: m.id, label: m.name }))
              ]}
              icon={<CreditCard size={14} color="#64748b" />}
              placeholder="Forma de pago..."
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                background: '#fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                height: '35px',
                fontSize: '12px',
                color: '#334155',
                fontWeight: 800,
                width: '100%'
              }}
            />
          </div>

          {/* Presets de Fecha */}
          <div style={{
            ...presetsWrapperStyle,
            flex: '1 1 280px',
            minWidth: '240px',
            justifyContent: 'space-around'
          }}>
            <button 
              onClick={() => setDatePreset('day')}
              style={datePreset === 'day' ? activePresetBtnStyle : presetBtnStyle}
            >
              Por Día
            </button>
            <button 
              onClick={() => setDatePreset('month')}
              style={datePreset === 'month' ? activePresetBtnStyle : presetBtnStyle}
            >
              Por Mes
            </button>
            <button 
              onClick={() => setDatePreset('year')}
              style={datePreset === 'year' ? activePresetBtnStyle : presetBtnStyle}
            >
              Por Año
            </button>
            <button 
              onClick={() => setDatePreset('custom')}
              style={datePreset === 'custom' ? activePresetBtnStyle : presetBtnStyle}
            >
              Rango Libre
            </button>
          </div>
        </div>
      </div>

      {/* Selectores dinámicos según el tipo de período */}
      {datePreset !== 'custom' && (
        <div style={{ ...customRangeStyle, marginBottom: '8px' }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            boxSizing: 'border-box'
          }}>
            {datePreset === 'day' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} color="#3b82f6" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569' }}>Día Específico:</span>
                </div>
                <input 
                  type="date" 
                  value={filterDay} 
                  onChange={e => setFilterDay(e.target.value)} 
                  style={{ ...dateInputStyle, flex: '1 1 150px' }} 
                />
              </>
            )}

            {datePreset === 'month' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} color="#3b82f6" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569' }}>Seleccionar Mes y Año:</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: '1 1 auto' }}>
                  <select 
                    value={filterMonth} 
                    onChange={e => setFilterMonth(parseInt(e.target.value))} 
                    style={{ ...dateInputStyle, background: '#fff', cursor: 'pointer', flex: '1 1 120px' }}
                  >
                    {[
                      { value: 1, label: 'Enero' },
                      { value: 2, label: 'Febrero' },
                      { value: 3, label: 'Marzo' },
                      { value: 4, label: 'Abril' },
                      { value: 5, label: 'Mayo' },
                      { value: 6, label: 'Junio' },
                      { value: 7, label: 'Julio' },
                      { value: 8, label: 'Agosto' },
                      { value: 9, label: 'Septiembre' },
                      { value: 10, label: 'Octubre' },
                      { value: 11, label: 'Noviembre' },
                      { value: 12, label: 'Diciembre' }
                    ].map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>

                  <select 
                    value={filterYear} 
                    onChange={e => setFilterYear(parseInt(e.target.value))} 
                    style={{ ...dateInputStyle, background: '#fff', cursor: 'pointer', flex: '1 1 100px' }}
                  >
                    {Array.from({ length: 5 }).map((_, i) => {
                      const yr = new Date().getFullYear() - 3 + i;
                      return <option key={yr} value={yr}>{yr}</option>;
                    })}
                  </select>
                </div>
              </>
            )}

            {datePreset === 'year' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} color="#3b82f6" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569' }}>Seleccionar Año:</span>
                </div>
                <select 
                  value={filterYear} 
                  onChange={e => setFilterYear(parseInt(e.target.value))} 
                  style={{ ...dateInputStyle, background: '#fff', cursor: 'pointer', flex: '1 1 120px' }}
                >
                  {Array.from({ length: 5 }).map((_, i) => {
                    const yr = new Date().getFullYear() - 3 + i;
                    return <option key={yr} value={yr}>{yr}</option>;
                  })}
                </select>
              </>
            )}
          </div>
        </div>
      )}

      {datePreset === 'custom' && (
        <div style={{ ...customRangeStyle, marginBottom: '8px' }}>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            alignItems: 'center', 
            gap: '12px', 
            padding: '12px 16px',
            boxSizing: 'border-box'
          }}>
            <Calendar size={14} color="#64748b" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569' }}>Rango:</span>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              style={{ ...dateInputStyle, flex: '1 1 130px', minWidth: '120px' }} 
            />
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>hasta</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              style={{ ...dateInputStyle, flex: '1 1 130px', minWidth: '120px' }} 
            />
            <button 
              onClick={fetchDashboardData} 
              style={{ ...queryBtnStyle, flex: '1 1 auto', minWidth: '100px', padding: '6px 16px' }}
            >
              Consultar
            </button>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div style={loadingContainerStyle}>
          <Loader2 className="animate-spin" size={36} color="#3b82f6" />
          <p style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Cargando analíticas del ERP...</p>
        </div>
      ) : error ? (
        <div style={errorContainerStyle}>
          <AlertCircle size={32} color="#ef4444" />
          <p style={{ color: '#ef4444', fontWeight: 800, marginTop: '8px' }}>Fallo al conectar con la base de datos</p>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 16px' }}>{error}</p>
          <button onClick={fetchDashboardData} style={retryBtnStyle}>Reintentar</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* 1. SECCIÓN KPIs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobileView ? '1fr' : 'repeat(4, 1fr)',
            gap: '16px'
          }}>
            {/* Card 1: Ingresos */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={kpiCardStyle}>
              <div style={{ ...kpiIconWrapperStyle, background: '#eff6ff', color: '#3b82f6' }}>
                <DollarSign size={20} />
              </div>
              <div>
                <p style={kpiLabelStyle}>Ventas Netas Totales</p>
                <h3 style={kpiValueStyle}>{formatCurrency(data?.kpis?.totalRevenue)}</h3>
              </div>
            </motion.div>

            {/* Card 2: Transacciones */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={kpiCardStyle}>
              <div style={{ ...kpiIconWrapperStyle, background: '#f0fdf4', color: '#16a34a' }}>
                <Receipt size={20} />
              </div>
              <div>
                <p style={kpiLabelStyle}>Transacciones Emitidas</p>
                <h3 style={kpiValueStyle}>{data?.kpis?.totalTransactions || 0} unds</h3>
              </div>
            </motion.div>

            {/* Card 3: Ticket Promedio */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={kpiCardStyle}>
              <div style={{ ...kpiIconWrapperStyle, background: '#faf5ff', color: '#a855f7' }}>
                <TrendingUp size={20} />
              </div>
              <div>
                <p style={kpiLabelStyle}>Valor Ticket Promedio</p>
                <h3 style={kpiValueStyle}>{formatCurrency(data?.kpis?.averageTicket)}</h3>
              </div>
            </motion.div>

            {/* Card 4: Anulados */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={kpiCardStyle}>
              <div style={{ ...kpiIconWrapperStyle, background: '#fef2f2', color: '#ef4444' }}>
                <AlertCircle size={20} />
              </div>
              <div>
                <p style={kpiLabelStyle}>Monto Total Anulado</p>
                <h3 style={{ ...kpiValueStyle, color: '#ef4444' }}>{formatCurrency(data?.kpis?.canceledRevenue)}</h3>
              </div>
            </motion.div>
          </div>

          {/* 2. SECCIÓN: GRÁFICO DE EVOLUCIÓN TEMPORAL */}
          <div style={dashboardCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={cardTitleStyle}>Evolución Temporal de Ventas</h3>
                <p style={cardSubtitleStyle}>Facturación en soles por período ({startDate === endDate ? 'Horas del día' : 'Fechas del rango'}).</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#2563eb', fontWeight: 800 }}>
                <Clock size={12} />
                <span>Tiempo Real</span>
              </div>
            </div>
            {!(data?.timeEvolution) || data.timeEvolution.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', color: '#94a3b8', fontSize: '12px' }}>
                Sin ventas registradas en el período.
              </div>
            ) : (
              renderSVGChart(data?.timeEvolution || [])
            )}
          </div>

          {/* 3. SECCIÓN INFERIOR: VENDEDORES Y COMPROBANTES */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobileView ? '1fr' : '3fr 2fr',
            gap: '24px'
          }}>
            {/* Top Vendedores */}
            <div style={dashboardCardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Award size={18} color="#eab308" />
                <h3 style={cardTitleStyle}>Ranking de Vendedores</h3>
              </div>
              {!(data?.sellersRanking) || data.sellersRanking.length === 0 ? (
                <div style={{ padding: '30px 0', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                  Sin datos de ventas en este período.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(data?.sellersRanking || []).map((s, idx) => {
                    const pct = (data?.kpis?.totalRevenue || 0) > 0 ? (s.amount / data.kpis.totalRevenue) * 100 : 0;
                    return (
                      <div key={s.code} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 950, color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                              #{idx + 1}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>{s.name}</span>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a' }}>{formatCurrency(s.amount)}</span>
                        </div>
                        {/* Barra de progreso Porcelain */}
                        <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8 }}
                            style={{ height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', borderRadius: '4px' }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>
                          <span>{s.quantity} transacciones</span>
                          <span>{pct.toFixed(1)}% del total</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tipos de Comprobantes */}
            <div style={dashboardCardStyle}>
              <h3 style={{ ...cardTitleStyle, marginBottom: '16px' }}>Tipos de Comprobantes</h3>
              {!(data?.documentTypes) || data.documentTypes.length === 0 ? (
                <div style={{ padding: '30px 0', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                  Sin datos disponibles.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(data?.documentTypes || []).map(d => {
                    const pct = (data?.kpis?.totalRevenue || 0) > 0 ? (d.amount / data.kpis.totalRevenue) * 100 : 0;
                    return (
                      <div key={d.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 850, color: '#334155' }}>{d.name}</h4>
                          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 650 }}>Cód: {d.code} • {d.quantity} emitidos</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>{formatCurrency(d.amount)}</div>
                          <span style={{ fontSize: '10px', fontWeight: 800, color: '#2563eb' }}>{pct.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 4. SECCIÓN ADICIONAL: COMPARATIVA DE SEDES (Solo si es consolidado) */}
          {selectedSede === 'all' && (data?.salesBySede || []).length > 0 && (
            <div style={dashboardCardStyle}>
              <h3 style={{ ...cardTitleStyle, marginBottom: '16px' }}>Ventas Consolidadas por Sede</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobileView ? '1fr' : 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '12px'
              }}>
                {(data?.salesBySede || []).map(sede => (
                  <div 
                    key={sede.sedeId} 
                    style={{
                      padding: '14px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Sede {sede.sedeId}</span>
                      <ArrowUpRight size={14} color="#3b82f6" />
                    </div>
                    <h4 style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 850, color: '#1e293b' }}>{sede.name}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 950, color: '#0f172a' }}>{formatCurrency(sede.amount)}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{sede.quantity} vtas</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ESTILOS DE INTERFAZ PORCELAIN GLASS (CSS INLINE)
const containerStyle = {
  padding: '30px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  background: '#f8fafc',
  overflowY: 'auto',
  width: '100%',
  maxWidth: '1400px',
  margin: '0 auto',
  boxSizing: 'border-box'
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '16px'
};

const headerMobileStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  alignItems: 'stretch'
};

const titleStyle = {
  margin: 0,
  fontSize: '24px',
  fontWeight: 950,
  color: '#0f172a',
  letterSpacing: '-0.02em'
};

const subtitleStyle = {
  margin: '4px 0 0',
  color: '#64748b',
  fontSize: '12px',
  fontWeight: 500
};

const filtersStyle = {
  display: 'flex',
  gap: '12px',
  alignItems: 'center',
  flexWrap: 'wrap'
};

const filtersMobileStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  alignItems: 'stretch'
};

const selectWrapperStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: '#fff',
  padding: '8px 12px',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
};

const selectStyle = {
  border: 'none',
  outline: 'none',
  fontSize: '12px',
  fontWeight: 800,
  color: '#334155',
  cursor: 'pointer',
  background: 'transparent'
};

const presetsWrapperStyle = {
  display: 'flex',
  background: '#fff',
  padding: '3px',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
};

const presetBtnStyle = {
  padding: '6px 12px',
  borderRadius: '8px',
  border: 'none',
  background: 'transparent',
  fontSize: '11px',
  fontWeight: 750,
  color: '#64748b',
  cursor: 'pointer',
  transition: 'all 0.15s'
};

const activePresetBtnStyle = {
  padding: '6px 12px',
  borderRadius: '8px',
  border: 'none',
  background: '#f1f5f9',
  fontSize: '11px',
  fontWeight: 900,
  color: '#0f172a',
  cursor: 'pointer',
  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  transition: 'all 0.15s'
};

const customRangeStyle = {
  background: '#fff',
  borderRadius: '16px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 2px 8px rgba(0,0,0,0.01)',
  overflow: 'hidden',
  boxSizing: 'border-box',
  width: '100%',
  flexShrink: 0
};

const dateInputStyle = {
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  padding: '6px 10px',
  fontSize: '11px',
  fontWeight: 800,
  color: '#334155',
  outline: 'none'
};

const queryBtnStyle = {
  background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '6px 14px',
  fontSize: '11px',
  fontWeight: 850,
  cursor: 'pointer'
};

// KPIs Cards
const kpiCardStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '20px',
  padding: '20px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.01)'
};

const kpiIconWrapperStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const kpiLabelStyle = {
  margin: 0,
  fontSize: '11px',
  fontWeight: 800,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const kpiValueStyle = {
  margin: '2px 0 0',
  fontSize: '20px',
  fontWeight: 950,
  color: '#0f172a',
  letterSpacing: '-0.02em'
};

// Dashboard general cards
const dashboardCardStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: '24px',
  padding: '24px',
  boxShadow: '0 4px 20px -2px rgba(15,23,42,0.01)'
};

const cardTitleStyle = {
  margin: 0,
  fontSize: '15px',
  fontWeight: 900,
  color: '#0f172a'
};

const cardSubtitleStyle = {
  margin: '2px 0 0',
  fontSize: '11px',
  color: '#94a3b8',
  fontWeight: 600
};

const loadingContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  padding: '100px 0'
};

const errorContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  padding: '100px 0',
  textAlign: 'center'
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
  color: '#64748b',
  fontSize: '10px',
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const trStyle = {
  borderBottom: '1px solid #f1f5f9'
};

const tdStyle = {
  padding: '14px 16px',
  fontSize: '13px',
  color: '#334155',
  verticalAlign: 'middle'
};
