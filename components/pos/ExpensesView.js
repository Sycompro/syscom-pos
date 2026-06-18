'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, Calendar, Loader2, RefreshCw, Banknote, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ExpensesView({ onAddExpense }) {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');

    const [windowWidth, setWindowWidth] = useState(1280);

    useEffect(() => {
        setWindowWidth(window.innerWidth);
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobileView = windowWidth < 768;

    const fetchList = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/cash/expenses/list');
            const data = await res.json();
            if (data.success) {
                setList(data.list || []);
            } else {
                throw new Error(data.error || 'Fallo al cargar el historial de egresos');
            }
        } catch (err) {
            console.error('Error fetching expenses list:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, []);

    // Lógica de filtrado
    const filteredList = list.filter(item => {
        const matchText = 
            (item.concepto || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.desmotivo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.codmotivo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.nroctacte || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.idapecaj.toString().includes(searchTerm);

        let matchDate = true;
        if (filterDate) {
            const itemDateStr = item.fecha ? new Date(item.fecha).toISOString().split('T')[0] : '';
            matchDate = itemDateStr === filterDate;
        }

        return matchText && matchDate;
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        const userTimezoneOffset = d.getTimezoneOffset() * 60000;
        const localDate = new Date(d.getTime() + userTimezoneOffset);
        return localDate.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Estilos dinámicos reactivos
    const responsiveContainerStyle = {
        ...containerStyle,
        padding: isMobileView ? '16px' : '30px',
        gap: isMobileView ? '16px' : '24px',
    };

    const responsiveHeaderStyle = {
        ...headerStyle,
        flexDirection: isMobileView ? 'column' : 'row',
        alignItems: isMobileView ? 'stretch' : 'center',
        gap: isMobileView ? '12px' : '0'
    };

    const responsiveTitleStyle = {
        ...titleStyle,
        fontSize: isMobileView ? '20px' : '24px',
        textAlign: isMobileView ? 'left' : 'left'
    };

    const responsiveSearchWrapperStyle = {
        ...searchWrapperStyle,
        width: isMobileView ? '100%' : 'auto',
        flex: isMobileView ? 'initial' : 1
    };

    const responsiveDateFilterWrapperStyle = {
        ...dateFilterWrapperStyle,
        width: isMobileView ? '100%' : 'auto',
        justifyContent: isMobileView ? 'space-between' : 'flex-start'
    };

    const responsiveAddBtnStyle = {
        ...addBtnStyle,
        flex: isMobileView ? 1 : 'initial',
        justifyContent: 'center'
    };

    return (
        <div style={responsiveContainerStyle}>
            {/* Cabecera */}
            <div style={responsiveHeaderStyle}>
                <div>
                    <h2 style={responsiveTitleStyle}>Egresos y Gastos de Caja</h2>
                    <p style={subtitleStyle}>Registro y control de salidas de dinero en efectivo.</p>
                </div>
                <div style={{ display: 'flex', gap: '10px', width: isMobileView ? '100%' : 'auto' }}>
                    <button onClick={fetchList} style={refreshBtnStyle} disabled={loading} title="Actualizar lista">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button onClick={onAddExpense} style={responsiveAddBtnStyle}>
                        <Plus size={16} />
                        <span>Registrar Gasto</span>
                    </button>
                </div>
            </div>

            {/* Barra de Filtros */}
            <div style={filtersContainerStyle}>
                <div style={responsiveSearchWrapperStyle}>
                    <Search size={16} color="#94a3b8" />
                    <input 
                        type="text" 
                        placeholder="Buscar por concepto, motivo o cuenta..." 
                        style={searchInputStyle}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div style={responsiveDateFilterWrapperStyle}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Calendar size={16} color="#94a3b8" style={{ marginRight: '8px' }} />
                        <input 
                            type="date" 
                            style={dateInputStyle}
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                        />
                    </div>
                    {filterDate && (
                        <button onClick={() => setFilterDate('')} style={clearDateBtnStyle}>Limpiar</button>
                    )}
                </div>
            </div>

            {/* Contenido Principal */}
            <div style={contentCardStyle}>
                {loading ? (
                    <div style={loadingContainerStyle}>
                        <Loader2 className="animate-spin" size={32} color="#3b82f6" />
                        <p style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Cargando egresos...</p>
                    </div>
                ) : error ? (
                    <div style={errorContainerStyle}>
                        <p style={{ color: '#ef4444', fontWeight: 800 }}>Error al cargar datos</p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 16px' }}>{error}</p>
                        <button onClick={fetchList} style={retryBtnStyle}>Reintentar</button>
                    </div>
                ) : filteredList.length === 0 ? (
                    <div style={emptyContainerStyle}>
                        <Banknote size={48} color="#94a3b8" />
                        <p style={{ marginTop: '12px', fontWeight: 800, color: '#475569' }}>No se encontraron egresos</p>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 16px' }}>No hay registros que coincidan con la búsqueda.</p>
                        <button onClick={onAddExpense} style={retryBtnStyle}>Registrar Primer Gasto</button>
                    </div>
                ) : (
                    <div style={tableWrapperStyle}>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Fecha</th>
                                    <th style={thStyle}>Concepto</th>
                                    {!isMobileView && <th style={thStyle}>Motivo / Concepto ERP</th>}
                                    {!isMobileView && <th style={thStyle}>Nro. Cuenta / Cta Cte</th>}
                                    {!isMobileView && <th style={thStyle}>Caja</th>}
                                    <th style={{ ...thStyle, textAlign: 'right' }}>Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredList.map((item, index) => (
                                    <motion.tr 
                                        key={index}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: Math.min(index * 0.03, 0.3) }}
                                        style={trStyle}
                                    >
                                        <td style={{ ...tdStyle, padding: isMobileView ? '12px 10px' : '16px 20px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 700, color: '#334155' }}>{formatDate(item.fecha)}</span>
                                                <span style={{ fontSize: '10px', color: '#94a3b8' }}>{item.hora || '-'}</span>
                                            </div>
                                        </td>
                                        <td style={{ ...tdStyle, padding: isMobileView ? '12px 10px' : '16px 20px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 700, color: '#1e293b' }}>{item.concepto || '-'}</span>
                                                {isMobileView && (
                                                    <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', fontWeight: 500 }}>
                                                        {item.desmotivo || 'Otros'} {item.nroctacte ? `• ${item.nroctacte}` : ''} {item.idapecaj ? `• Caja #${item.idapecaj}` : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        {!isMobileView && (
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <div style={badgeStyle}>
                                                        <FileText size={10} color="#6366f1" />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: 800, color: '#475569' }}>{item.desmotivo || 'Otros Egresos'}</span>
                                                        <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>Cód: {item.codmotivo?.trim() || '06'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        {!isMobileView && (
                                            <td style={{ ...tdStyle, fontWeight: 650, color: '#475569' }}>
                                                {item.nroctacte?.trim() || '-'}
                                            </td>
                                        )}
                                        {!isMobileView && (
                                            <td style={{ ...tdStyle, fontWeight: 700, color: '#64748b' }}>
                                                Caja #{item.idapecaj}
                                            </td>
                                        )}
                                        <td style={{ 
                                            ...tdStyle, 
                                            padding: isMobileView ? '12px 10px' : '16px 20px', 
                                            fontWeight: 900, 
                                            color: '#ef4444', 
                                            textAlign: 'right',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            - {formatCurrency(item.monto)}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ESTILOS PREMIUM (CSS INLINE)
const containerStyle = {
    padding: '30px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    background: '#f8fafc',
    overflowY: 'auto'
};

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
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

const refreshBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    color: '#475569',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    transition: 'all 0.2s',
    flexShrink: 0
};

const addBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    color: '#fff',
    border: 'none',
    fontSize: '13px',
    fontWeight: 850,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
    transition: 'all 0.2s'
};

const filtersContainerStyle = {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap'
};

const searchWrapperStyle = {
    flex: 1,
    minWidth: '260px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#fff',
    padding: '12px 16px',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
};

const searchInputStyle = {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '13px',
    fontWeight: 650,
    color: '#1e293b'
};

const dateFilterWrapperStyle = {
    display: 'flex',
    alignItems: 'center',
    background: '#fff',
    padding: '10px 16px',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
};

const dateInputStyle = {
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    fontWeight: 700,
    color: '#334155',
    cursor: 'pointer'
};

const clearDateBtnStyle = {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontSize: '11px',
    fontWeight: 800,
    marginLeft: '8px',
    cursor: 'pointer'
};

const contentCardStyle = {
    flex: 1,
    background: '#fff',
    borderRadius: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 20px -2px rgba(15,23,42,0.02)',
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
    borderRadius: '10px',
    padding: '8px 16px',
    fontWeight: 700,
    fontSize: '13px',
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
    padding: '16px 20px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    color: '#475569',
    fontSize: '11px',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
};

const trStyle = {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.2s'
};

const tdStyle = {
    padding: '16px 20px',
    fontSize: '13px',
    color: '#334155',
    verticalAlign: 'middle'
};

const badgeStyle = {
    width: '24px',
    height: '24px',
    background: '#e0e7ff',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};
