'use client';
import { useState, useEffect } from 'react';
import { Search, Eye, Calendar, User, Loader2, RefreshCw, Banknote, ShieldCheck, Lock, Unlock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GeneralCashView({ onInspectCash }) {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'open', 'closed'

    const fetchList = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/cash/list');
            const data = await res.json();
            if (data.success) {
                setList(data.list || []);
            } else {
                throw new Error(data.error || 'Fallo al cargar el historial de cajas');
            }
        } catch (err) {
            console.error('Error fetching cash list:', err);
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
        // Filtro de texto (usuario o código)
        const matchText = 
            (item.nomusuario || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.codusu || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.idapecaj.toString().includes(searchTerm);

        // Filtro de fecha (fecape)
        // item.fecape suele venir como YYYY-MM-DD o con formato de fecha de SQL Server.
        // Formateamos para comparar
        let matchDate = true;
        if (filterDate) {
            const itemDateStr = item.fecape ? new Date(item.fecape).toISOString().split('T')[0] : '';
            matchDate = itemDateStr === filterDate;
        }

        // Filtro de estado (0 = abierta, 1 = cerrada)
        let matchStatus = true;
        if (filterStatus === 'open') {
            matchStatus = item.estado === 0;
        } else if (filterStatus === 'closed') {
            matchStatus = item.estado === 1;
        }

        return matchText && matchDate && matchStatus;
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        // Evitar desajustes de zona horaria al formatear fecha simple
        const userTimezoneOffset = d.getTimezoneOffset() * 60000;
        const localDate = new Date(d.getTime() + userTimezoneOffset);
        return localDate.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div style={containerStyle}>
            {/* Cabecera */}
            <div style={headerStyle}>
                <div>
                    <h2 style={titleStyle}>Caja General</h2>
                    <p style={subtitleStyle}>Historial detallado y arqueos de caja en tiempo real.</p>
                </div>
                <button onClick={fetchList} style={refreshBtnStyle} disabled={loading} title="Actualizar historial">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    <span>Actualizar</span>
                </button>
            </div>

            {/* Barra de Filtros */}
            <div style={filtersContainerStyle}>
                <div style={searchWrapperStyle}>
                    <Search size={16} color="#94a3b8" />
                    <input 
                        type="text" 
                        placeholder="Buscar por usuario o ID caja..." 
                        style={searchInputStyle}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div style={dateFilterWrapperStyle}>
                    <Calendar size={16} color="#94a3b8" style={{ marginRight: '8px' }} />
                    <input 
                        type="date" 
                        style={dateInputStyle}
                        value={filterDate}
                        onChange={e => setFilterDate(e.target.value)}
                    />
                    {filterDate && (
                        <button onClick={() => setFilterDate('')} style={clearDateBtnStyle}>Limpiar</button>
                    )}
                </div>

                <div style={statusTabsStyle}>
                    {[
                        { id: 'all', label: 'Todas' },
                        { id: 'open', label: 'Abiertas' },
                        { id: 'closed', label: 'Cerradas' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterStatus(tab.id)}
                            style={{
                                ...statusTabBtnStyle,
                                background: filterStatus === tab.id ? '#1e293b' : 'transparent',
                                color: filterStatus === tab.id ? '#fff' : '#64748b',
                                boxShadow: filterStatus === tab.id ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none',
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Contenido Principal */}
            <div style={contentCardStyle}>
                {loading ? (
                    <div style={loadingContainerStyle}>
                        <Loader2 className="animate-spin" size={32} color="#3b82f6" />
                        <p style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Cargando historial de cajas...</p>
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
                        <p style={{ marginTop: '12px', fontWeight: 800, color: '#475569' }}>No se encontraron cajas</p>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>Prueba ajustando los filtros de búsqueda o fecha.</p>
                    </div>
                ) : (
                    <div style={tableWrapperStyle}>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>ID</th>
                                    <th style={thStyle}>Apertura</th>
                                    <th style={thStyle}>Cierre</th>
                                    <th style={thStyle}>Usuario / Vendedor</th>
                                    <th style={thStyle}>Monto Apertura</th>
                                    <th style={thStyle}>Estado</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredList.map((item, index) => {
                                    const isClosed = item.estado === 1;
                                    return (
                                        <motion.tr 
                                            key={item.idapecaj}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: Math.min(index * 0.03, 0.3) }}
                                            style={trStyle}
                                        >
                                            <td style={{ ...tdStyle, fontWeight: 900, color: '#1e293b' }}>
                                                #{item.idapecaj}
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 700, color: '#334155' }}>{formatDate(item.fecape)}</span>
                                                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>{item.hora || '-'}</span>
                                                </div>
                                            </td>
                                            <td style={tdStyle}>
                                                {isClosed ? (
                                                    <span style={{ fontWeight: 600, color: '#475569' }}>{formatDate(item.feccie)}</span>
                                                ) : (
                                                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Unlock size={10} /> En curso
                                                    </span>
                                                )}
                                            </td>
                                            <td style={tdStyle}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <div style={avatarStyle}>
                                                        <User size={12} color="#6366f1" />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: 800, color: '#1e293b' }}>{item.nomusuario || 'Desconocido'}</span>
                                                        <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>Cód: {item.codusu?.trim() || '-'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ ...tdStyle, fontWeight: 900, color: '#0f172a' }}>
                                                {formatCurrency(item.apesol)}
                                            </td>
                                            <td style={tdStyle}>
                                                {isClosed ? (
                                                    <span style={badgeClosedStyle}>
                                                        <Lock size={10} /> Cerrada
                                                    </span>
                                                ) : (
                                                    <span style={badgeOpenStyle}>
                                                        <Unlock size={10} /> Abierta
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                                                <button 
                                                    onClick={() => onInspectCash(item.idapecaj, isClosed)}
                                                    style={actionBtnStyle}
                                                    title="Inspeccionar arqueo"
                                                >
                                                    <Eye size={14} />
                                                    <span>Inspeccionar</span>
                                                </button>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
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
    fontSize: '14px',
    fontWeight: 500
};

const refreshBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '12px',
    background: '#fff',
    border: '1px solid #e2e8f0',
    color: '#475569',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
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

const statusTabsStyle = {
    display: 'flex',
    background: '#e2e8f0',
    padding: '3px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    gap: '2px'
};

const statusTabBtnStyle = {
    border: 'none',
    borderRadius: '9px',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'all 0.2s'
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

const avatarStyle = {
    width: '24px',
    height: '24px',
    background: '#e0e7ff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const badgeOpenStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: '#ecfdf5',
    color: '#10b981',
    border: '1px solid #a7f3d0',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 900
};

const badgeClosedStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    background: '#f1f5f9',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 900
};

const actionBtnStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '10px',
    background: '#f1f5f9',
    border: 'none',
    color: '#475569',
    fontSize: '12px',
    fontWeight: 800,
    cursor: 'pointer',
    transition: 'all 0.2s'
};
