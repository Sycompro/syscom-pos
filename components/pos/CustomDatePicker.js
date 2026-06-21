'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import CustomSelect from './CustomSelect';


export default function CustomDatePicker({ value, onChange, label, inline = false, style = {} }) {
    const [show, setShow] = useState(inline);
    const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
    
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const days = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

    // Generar años desde 1920 hasta el año actual + 5
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear + 5; i >= 1920; i--) years.push(i);

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const generateDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const daysArr = [];

        for (let i = 0; i < firstDay; i++) daysArr.push(null);
        for (let i = 1; i <= daysInMonth; i++) daysArr.push(i);
        
        return daysArr;
    };

    const handleSelect = (day) => {
        if (!day) return;
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        // Formatear a YYYY-MM-DD
        const y = newDate.getFullYear();
        const m = String(newDate.getMonth() + 1).padStart(2, '0');
        const d = String(newDate.getDate()).padStart(2, '0');
        onChange(`${y}-${m}-${d}`);
        if (!inline) {
            setShow(false);
        }
    };

    const handleYearChange = (e) => {
        setViewDate(new Date(parseInt(e.target.value), viewDate.getMonth(), 1));
    };

    const handleMonthChange = (e) => {
        setViewDate(new Date(viewDate.getFullYear(), parseInt(e.target.value), 1));
    };

    const changeMonth = (offset) => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
    };

    const containerStyle = inline ? {
        position: 'relative',
        background: '#fff',
        borderRadius: '16px',
        padding: '12px',
        width: '100%',
        boxSizing: 'border-box'
    } : calendarPopupStyle;

    if (inline) {
        return (
            <div style={{ width: '100%' }}>
                {label && <label style={labelStyle}>{label}</label>}
                <div style={containerStyle}>
                    <div style={calendarHeaderStyle}>
                        <button type="button" onClick={() => changeMonth(-1)} style={navBtnStyle}><ChevronLeft size={16} /></button>
                        
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <CustomSelect 
                                value={viewDate.getMonth()} 
                                onChange={handleMonthChange}
                                options={months.map((m, i) => ({ value: i, label: m }))}
                                style={{ ...selectHeaderStyle, minWidth: '85px' }}
                                dropdownWidth="110px"
                            />
                            
                            <CustomSelect 
                                value={viewDate.getFullYear()} 
                                onChange={handleYearChange}
                                options={years.map(y => ({ value: y, label: String(y) }))}
                                style={{ ...selectHeaderStyle, minWidth: '70px' }}
                                dropdownWidth="90px"
                            />
                        </div>

                        <button type="button" onClick={() => changeMonth(1)} style={navBtnStyle}><ChevronRight size={16} /></button>
                    </div>

                    <div style={weekDaysStyle}>
                        {days.map(d => <div key={d} style={weekDayItemStyle}>{d}</div>)}
                    </div>

                    <div style={daysGridStyle}>
                        {generateDays().map((d, i) => {
                            const isSelected = d && value === `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                            return (
                                <div 
                                    key={i} 
                                    onClick={() => handleSelect(d)}
                                    style={{
                                        ...dayItemStyle,
                                        cursor: d ? 'pointer' : 'default',
                                        background: isSelected ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'transparent',
                                        color: isSelected ? '#fff' : (d ? '#1e293b' : 'transparent'),
                                        fontWeight: isSelected ? '800' : '600',
                                        fontSize: '11px'
                                    }}
                                >
                                    {d}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            {label && <label style={labelStyle}>{label}</label>}
            <div onClick={() => setShow(!show)} style={{ ...inputStyle, ...style }}>
                <CalendarIcon size={14} style={{ color: '#94a3b8' }} />
                <span style={{ color: value ? '#0f172a' : '#cbd5e1', fontWeight: 600 }}>
                    {value || 'fecha'}
                </span>
            </div>

            {show && (
                <div style={containerStyle}>
                    <div style={calendarHeaderStyle}>
                        <button type="button" onClick={() => changeMonth(-1)} style={navBtnStyle}><ChevronLeft size={16} /></button>
                        
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <CustomSelect 
                                value={viewDate.getMonth()} 
                                onChange={handleMonthChange}
                                options={months.map((m, i) => ({ value: i, label: m }))}
                                style={{ ...selectHeaderStyle, minWidth: '85px' }}
                                dropdownWidth="110px"
                            />
                            
                            <CustomSelect 
                                value={viewDate.getFullYear()} 
                                onChange={handleYearChange}
                                options={years.map(y => ({ value: y, label: String(y) }))}
                                style={{ ...selectHeaderStyle, minWidth: '70px' }}
                                dropdownWidth="90px"
                            />
                        </div>

                        <button type="button" onClick={() => changeMonth(1)} style={navBtnStyle}><ChevronRight size={16} /></button>
                    </div>

                    <div style={weekDaysStyle}>
                        {days.map(d => <div key={d} style={weekDayItemStyle}>{d}</div>)}
                    </div>

                    <div style={daysGridStyle}>
                        {generateDays().map((d, i) => {
                            const isSelected = d && value === `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                            return (
                                <div 
                                    key={i} 
                                    onClick={() => handleSelect(d)}
                                    style={{
                                        ...dayItemStyle,
                                        cursor: d ? 'pointer' : 'default',
                                        background: isSelected ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'transparent',
                                        color: isSelected ? '#fff' : (d ? '#1e293b' : 'transparent'),
                                        fontWeight: isSelected ? '800' : '600',
                                        fontSize: '11px'
                                    }}
                                >
                                    {d}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

const labelStyle = { fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', display: 'block' };
const inputStyle = { 
    width: '100%', padding: '0 12px', background: '#fff', border: '1px solid #e2e8f0', 
    borderRadius: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', 
    gap: '10px', cursor: 'pointer', height: '42px', boxSizing: 'border-box' 
};
const calendarPopupStyle = { 
    position: 'absolute', 
    top: 'calc(100% + 8px)', 
    left: 0, 
    zIndex: 500, 
    background: 'rgba(255, 255, 255, 0.96)', 
    backdropFilter: 'blur(16px)',
    borderRadius: '16px', 
    padding: '12px', 
    boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03)', 
    border: '1px solid rgba(226, 232, 240, 0.8)', 
    width: '240px' 
};
const calendarHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' };
const selectHeaderStyle = { border: 'none', background: '#f1f5f9', borderRadius: '6px', padding: '0 4px 0 8px', fontSize: '11px', fontWeight: 800, color: '#0f172a', outline: 'none', cursor: 'pointer', height: '24px' };
const navBtnStyle = { background: '#f8fafc', border: 'none', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' };
const weekDaysStyle = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px' };
const weekDayItemStyle = { fontSize: '9px', fontWeight: 800, color: '#94a3b8', textAlign: 'center' };
const daysGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' };
const dayItemStyle = { height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', transition: 'all 0.15s ease' };
