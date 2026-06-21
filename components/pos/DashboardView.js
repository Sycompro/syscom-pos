'use client';
import { useState, useEffect } from 'react';
import { 
  Calendar, TrendingUp, Loader2, AlertCircle, Building2, 
  Users, DollarSign, Receipt, Percent, Award, Clock, ArrowUpRight,
  CreditCard, FileText, User, Scale, ShieldCheck, AlertTriangle, Info, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import CustomSelect from './CustomSelect';
import CustomDatePicker from './CustomDatePicker';

export default function DashboardView() {
  const { data: session } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState('general'); // 'general' | 'stats'

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

  const renderWeekdayChart = (weekdayData) => {
    if (!weekdayData) return null;

    const daysMap = {
      1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 7: 'Domingo'
    };
    
    const completeDays = Array.from({ length: 7 }).map((_, i) => {
      const dayNum = i + 1;
      const found = weekdayData.find(d => d.dayNum === dayNum);
      return {
        dayNum,
        dayName: daysMap[dayNum],
        amount: found ? found.amount : 0,
        quantity: found ? found.quantity : 0
      };
    });

    const width = 800;
    const height = 240;
    const paddingLeft = 60;
    const paddingRight = 30;
    const paddingTop = 25;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxAmount = Math.max(...completeDays.map(d => d.amount), 500);

    const yScaleValues = Array.from({ length: 4 }).map((_, i) => (maxAmount * (i / 3)));

    const barWidth = 45;
    const gap = (chartWidth - (barWidth * 7)) / 8;

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ minWidth: '600px' }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="emptyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
          </defs>

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

          {completeDays.map((d, index) => {
            const barHeight = d.amount > 0 ? (d.amount / maxAmount) * chartHeight : 8;
            const x = paddingLeft + gap + index * (barWidth + gap);
            const y = paddingTop + chartHeight - barHeight;

            return (
              <g key={d.dayNum} className="group" style={{ cursor: 'pointer' }}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="6"
                  ry="6"
                  fill={d.amount > 0 ? "url(#barGradient)" : "url(#emptyGradient)"}
                  style={{ transition: 'all 0.3s ease' }}
                />

                {d.amount > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 8}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#1e293b"
                    fontWeight="850"
                  >
                    S/ {Math.round(d.amount)}
                  </text>
                )}

                <text
                  x={x + barWidth / 2}
                  y={paddingTop + chartHeight + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#64748b"
                  fontWeight="750"
                >
                  {d.dayName}
                </text>

                <text
                  x={x + barWidth / 2}
                  y={paddingTop + chartHeight + 32}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#94a3b8"
                  fontWeight="600"
                >
                  {d.quantity} vtas
                </text>

                <title>{`${d.dayName}: S/ ${d.amount.toFixed(2)} (${d.quantity} transacciones)`}</title>
              </g>
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
    <div style={{ ...containerStyle, padding: windowWidth < 1024 ? '16px' : '30px', gap: windowWidth < 1024 ? '16px' : '24px' }}>
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
                <div style={{ flex: '1 1 150px' }}>
                  <CustomDatePicker
                    value={filterDay}
                    onChange={val => setFilterDay(val)}
                    style={{
                      height: '35px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                    }}
                  />
                </div>
              </>
            )}

            {datePreset === 'month' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} color="#3b82f6" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569' }}>Seleccionar Mes y Año:</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: '1 1 auto' }}>
                  <div style={{ flex: '1 1 120px', minWidth: '100px' }}>
                    <CustomSelect 
                      value={String(filterMonth)} 
                      onChange={e => setFilterMonth(parseInt(e.target.value))} 
                      options={[
                        { value: '1', label: 'Enero' },
                        { value: '2', label: 'Febrero' },
                        { value: '3', label: 'Marzo' },
                        { value: '4', label: 'Abril' },
                        { value: '5', label: 'Mayo' },
                        { value: '6', label: 'Junio' },
                        { value: '7', label: 'Julio' },
                        { value: '8', label: 'Agosto' },
                        { value: '9', label: 'Septiembre' },
                        { value: '10', label: 'Octubre' },
                        { value: '11', label: 'Noviembre' },
                        { value: '12', label: 'Diciembre' }
                      ]}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        background: '#fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                        height: '35px',
                        fontSize: '12px',
                        color: '#334155',
                        fontWeight: 800,
                      }}
                    />
                  </div>

                  <div style={{ flex: '1 1 100px', minWidth: '80px' }}>
                    <CustomSelect 
                      value={String(filterYear)} 
                      onChange={e => setFilterYear(parseInt(e.target.value))} 
                      options={Array.from({ length: 5 }).map((_, i) => {
                        const yr = new Date().getFullYear() - 3 + i;
                        return { value: String(yr), label: String(yr) };
                      })}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        background: '#fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                        height: '35px',
                        fontSize: '12px',
                        color: '#334155',
                        fontWeight: 800,
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {datePreset === 'year' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} color="#3b82f6" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569' }}>Seleccionar Año:</span>
                </div>
                <div style={{ flex: '1 1 120px', minWidth: '100px' }}>
                  <CustomSelect 
                    value={String(filterYear)} 
                    onChange={e => setFilterYear(parseInt(e.target.value))} 
                    options={Array.from({ length: 5 }).map((_, i) => {
                      const yr = new Date().getFullYear() - 3 + i;
                      return { value: String(yr), label: String(yr) };
                    })}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      background: '#fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                      height: '35px',
                      fontSize: '12px',
                      color: '#334155',
                      fontWeight: 800,
                    }}
                  />
                </div>
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
            <div style={{ flex: '1 1 130px', minWidth: '120px' }}>
              <CustomDatePicker
                value={startDate}
                onChange={val => setStartDate(val)}
                style={{
                  height: '35px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                }}
              />
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>hasta</span>
            <div style={{ flex: '1 1 130px', minWidth: '120px' }}>
              <CustomDatePicker
                value={endDate}
                onChange={val => setEndDate(val)}
                style={{
                  height: '35px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                }}
              />
            </div>
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
          {/* TAB SELECTOR PORCELAIN */}
          <div style={{
            display: 'flex',
            background: '#fff',
            padding: '4px',
            borderRadius: '14px',
            border: '1px solid #e2e8f0',
            alignSelf: 'flex-start',
            boxShadow: '0 2px 6px rgba(0,0,0,0.015)',
            marginBottom: '4px'
          }}>
            <button 
              onClick={() => setCurrentTab('general')}
              style={currentTab === 'general' ? {
                padding: '8px 20px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 850,
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.15)',
                transition: 'all 0.2s'
              } : {
                padding: '8px 20px',
                borderRadius: '10px',
                border: 'none',
                background: 'transparent',
                fontSize: '12px',
                fontWeight: 750,
                color: '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Métricas Generales
            </button>
            <button 
              onClick={() => setCurrentTab('stats')}
              style={currentTab === 'stats' ? {
                padding: '8px 20px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 850,
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.15)',
                transition: 'all 0.2s'
              } : {
                padding: '8px 20px',
                borderRadius: '10px',
                border: 'none',
                background: 'transparent',
                fontSize: '12px',
                fontWeight: 750,
                color: '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Rendimiento Estadístico
            </button>
          </div>

          {currentTab === 'general' && (
            <>
              {/* 1. SECCIÓN KPIs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: windowWidth < 1200 ? (windowWidth < 640 ? '1fr' : 'repeat(2, 1fr)') : 'repeat(4, 1fr)',
                gap: windowWidth < 1024 ? '12px' : '16px'
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
                gridTemplateColumns: windowWidth < 1024 ? '1fr' : '3fr 2fr',
                gap: windowWidth < 1024 ? '16px' : '24px'
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
            </>
          )}

          {currentTab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* KPIs de Dispersión */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: windowWidth < 1200 ? (windowWidth < 640 ? '1fr' : 'repeat(2, 1fr)') : 'repeat(4, 1fr)',
                gap: windowWidth < 1024 ? '12px' : '16px'
              }}>
                {/* Card 1: Coeficiente de Variación */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={kpiCardStyle}>
                  <div style={{ ...kpiIconWrapperStyle, background: '#f5f3ff', color: '#8b5cf6' }}>
                    <Percent size={20} />
                  </div>
                  <div>
                    <p style={kpiLabelStyle}>Coeficiente de Variación</p>
                    <h3 style={kpiValueStyle}>
                      {(() => {
                        const avgTicket = data?.kpis?.averageTicket || 0;
                        const stdDev = data?.performanceStats?.dispersion?.stdDev || 0;
                        const cv = avgTicket > 0 ? (stdDev / avgTicket) * 100 : 0;
                        return `${cv.toFixed(2)}%`;
                      })()}
                    </h3>
                  </div>
                </motion.div>

                {/* Card 2: Desviación Estándar */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={kpiCardStyle}>
                  <div style={{ ...kpiIconWrapperStyle, background: '#eff6ff', color: '#3b82f6' }}>
                    <Scale size={20} />
                  </div>
                  <div>
                    <p style={kpiLabelStyle}>Desviación Estándar (σ)</p>
                    <h3 style={kpiValueStyle}>{formatCurrency(data?.performanceStats?.dispersion?.stdDev)}</h3>
                  </div>
                </motion.div>

                {/* Card 3: Ticket Máximo */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={kpiCardStyle}>
                  <div style={{ ...kpiIconWrapperStyle, background: '#ecfdf5', color: '#10b981' }}>
                    <ArrowUpRight size={20} />
                  </div>
                  <div>
                    <p style={kpiLabelStyle}>Ticket Máximo Registrado</p>
                    <h3 style={kpiValueStyle}>{formatCurrency(data?.performanceStats?.dispersion?.maxTicket)}</h3>
                  </div>
                </motion.div>

                {/* Card 4: Ticket Mínimo */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={kpiCardStyle}>
                  <div style={{ ...kpiIconWrapperStyle, background: '#fff1f2', color: '#f43f5e' }}>
                    <ArrowUpRight style={{ transform: 'rotate(90deg)' }} size={20} />
                  </div>
                  <div>
                    <p style={kpiLabelStyle}>Ticket Mínimo Registrado</p>
                    <h3 style={kpiValueStyle}>{formatCurrency(data?.performanceStats?.dispersion?.minTicket)}</h3>
                  </div>
                </motion.div>
              </div>

              {/* Banner de Diagnóstico y Estabilidad */}
              {(() => {
                const avgTicket = data?.kpis?.averageTicket || 0;
                const stdDev = data?.performanceStats?.dispersion?.stdDev || 0;
                const cv = avgTicket > 0 ? (stdDev / avgTicket) * 100 : 0;
                
                let bannerBg = '#f0fdf4';
                let bannerBorder = '#bbf7d0';
                let iconColor = '#16a34a';
                let titleColor = '#15803d';
                let textColor = '#166534';
                let diagnosticTitle = 'Estabilidad Comercial Alta (Semáforo Verde)';
                let diagnosticDesc = 'La facturación muestra fluctuaciones muy bajas. El comportamiento de compra es altamente homogéneo y predecible, sin dependencia crítica de picos de facturación atípicos.';
                let IconComponent = ShieldCheck;

                if (cv >= 30 && cv <= 50) {
                  bannerBg = '#fffbeb';
                  bannerBorder = '#fde68a';
                  iconColor = '#d97706';
                  titleColor = '#b45309';
                  textColor = '#92400e';
                  diagnosticTitle = 'Variabilidad Comercial Moderada (Semáforo Amarillo)';
                  diagnosticDesc = 'Existe una fluctuación moderada en los montos de compra. La facturación es generalmente estable, aunque se combinan compras cotidianas con algunos tickets de alto valor eventuales.';
                  IconComponent = Info;
                } else if (cv > 50) {
                  bannerBg = '#fef2f2';
                  bannerBorder = '#fecaca';
                  iconColor = '#dc2626';
                  titleColor = '#b91c1c';
                  textColor = '#991b1b';
                  diagnosticTitle = 'Alta Variabilidad Comercial (Semáforo Rojo)';
                  diagnosticDesc = 'Se registra una alta dispersión en la facturación. El rendimiento comercial es altamente dependiente de compras esporádicas de gran volumen (outliers) o picos de ventas aislados.';
                  IconComponent = AlertTriangle;
                } else if (avgTicket === 0) {
                  bannerBg = '#f8fafc';
                  bannerBorder = '#e2e8f0';
                  iconColor = '#64748b';
                  titleColor = '#334155';
                  textColor = '#475569';
                  diagnosticTitle = 'Sin Datos Suficientes';
                  diagnosticDesc = 'No hay transacciones registradas en este período para calcular la variabilidad de la facturación.';
                  IconComponent = AlertCircle;
                }

                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      background: bannerBg,
                      border: `1.5px solid ${bannerBorder}`,
                      borderRadius: '20px',
                      padding: '18px 24px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.015)'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#ffffff',
                      borderRadius: '12px',
                      padding: '8px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      color: iconColor,
                      flexShrink: 0
                    }}>
                      <IconComponent size={24} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 900, color: titleColor }}>{diagnosticTitle}</h4>
                      <p style={{ margin: 0, fontSize: '12px', fontWeight: 650, color: textColor, lineHeight: 1.5 }}>
                        {diagnosticDesc}
                      </p>
                    </div>
                  </motion.div>
                );
              })()}

              {/* Distribución Frecuencia por Días */}
              <div style={dashboardCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <h3 style={cardTitleStyle}>Distribución por Día de la Semana</h3>
                    <p style={cardSubtitleStyle}>Frecuencia y volumen de facturación consolidada por día de atención.</p>
                  </div>
                </div>
                {!(data?.performanceStats?.weekdayDistribution) || data.performanceStats.weekdayDistribution.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', color: '#94a3b8', fontSize: '12px' }}>
                    Sin ventas registradas en el período.
                  </div>
                ) : (
                  renderWeekdayChart(data?.performanceStats?.weekdayDistribution || [])
                )}
              </div>

              {/* Concentración de Pareto (80/20) */}
              <div style={dashboardCardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <BarChart3 size={18} color="#2563eb" />
                  <div>
                    <h3 style={cardTitleStyle}>Análisis de Pareto de Artículos (Regla 80/20)</h3>
                    <p style={cardSubtitleStyle}>Clasificación ABC de productos según su aportación acumulada a los ingresos totales.</p>
                  </div>
                </div>
                {!(data?.performanceStats?.paretoProducts) || data.performanceStats.paretoProducts.length === 0 ? (
                  <div style={{ padding: '30px 0', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                    Sin datos de ventas en este período para el análisis de Pareto.
                  </div>
                ) : (
                  <div style={tableWrapperStyle}>
                    <table style={tableStyle}>
                      <thead>
                        <tr>
                          <th style={{ ...thStyle, width: '60px' }}>Rank</th>
                          <th style={thStyle}>Código</th>
                          <th style={thStyle}>Descripción de Artículo</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Cant. Vendida</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Ingresos</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>% Aportación</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>% Acumulado</th>
                          <th style={{ ...thStyle, textAlign: 'center' }}>Clasificación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          let runningTotal = 0;
                          const totalRevenue = data?.kpis?.totalRevenue || 1;
                          return (data?.performanceStats?.paretoProducts || []).map((p, idx) => {
                            const itemPct = (p.amount / totalRevenue) * 100;
                            const prevRunningTotal = runningTotal;
                            runningTotal += p.amount;
                            const cumPct = (runningTotal / totalRevenue) * 100;

                            let classification = 'C';
                            let badgeColor = '#64748b';
                            let badgeBg = '#f1f5f9';
                            let badgeText = 'Clase C (Secundario)';

                            if (prevRunningTotal / totalRevenue < 0.8) {
                              classification = 'A';
                              badgeColor = '#3730a3';
                              badgeBg = '#e0e7ff';
                              badgeText = 'Clase A (Crítico)';
                            } else if (prevRunningTotal / totalRevenue < 0.95) {
                              classification = 'B';
                              badgeColor = '#92400e';
                              badgeBg = '#fef3c7';
                              badgeText = 'Clase B (Medio)';
                            }

                            return (
                              <tr key={p.code} style={trStyle}>
                                <td style={{ ...tdStyle, fontWeight: 950, color: '#64748b' }}>#{idx + 1}</td>
                                <td style={{ ...tdStyle, fontWeight: 700, color: '#475569' }}>{p.code}</td>
                                <td style={{ ...tdStyle, fontWeight: 800, color: '#1e293b' }}>{p.name}</td>
                                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 750 }}>{p.quantity} unds</td>
                                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>{formatCurrency(p.amount)}</td>
                                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 750, color: '#2563eb' }}>{itemPct.toFixed(2)}%</td>
                                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 850, color: '#475569' }}>{cumPct.toFixed(2)}%</td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    color: badgeColor,
                                    background: badgeBg
                                  }}>
                                    {badgeText}
                                  </span>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
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
  overflow: 'visible',
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
