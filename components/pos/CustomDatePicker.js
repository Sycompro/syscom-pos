'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function CustomDatePicker({ value, onChange, label }) {
    const [show, setShow] = useState(false);
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
        setShow(false);
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

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            {label && <label style={labelStyle}>{label}</label>}
            <div onClick={() => setShow(!show)} style={inputStyle}>
                <CalendarIcon size={14} style={{ color: '#94a3b8' }} />
                <span style={{ color: value ? '#0f172a' : '#cbd5e1', fontWeight: 600 }}>
                    {value || 'fecha'}
                </span>
            </div>

            {show && (
                <div style={calendarPopupStyle}>
                    <div style={calendarHeaderStyle}>
                        <button onClick={() => changeMonth(-1)} style={navBtnStyle}><ChevronLeft size={16} /></button>
                        
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <select 
                                value={viewDate.getMonth()} 
                                onChange={handleMonthChange}
                                style={selectHeaderStyle}
                            >
                                {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                            </select>
                            
                            <select 
                                value={viewDate.getFullYear()} 
                                onChange={handleYearChange}
                                style={selectHeaderStyle}
                            >
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>

                        <button onClick={() => changeMonth(1)} style={navBtnStyle}><ChevronRight size={16} /></button>
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
                                        background: isSelected ? '#3b82f6' : 'transparent',
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

const labelStyle = { fontSize: '9px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px', display: 'block' };
const inputStyle = { width: '100%', padding: '6px 8px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', minHeight: '30px', boxSizing: 'border-box' };
const calendarPopupStyle = { position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 500, background: '#fff', borderRadius: '16px', padding: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)', border: '1px solid #f1f5f9', width: '240px' };
const calendarHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' };
const selectHeaderStyle = { border: 'none', background: '#f1f5f9', borderRadius: '6px', padding: '4px 6px', fontSize: '11px', fontWeight: 800, color: '#0f172a', outline: 'none', cursor: 'pointer' };
const navBtnStyle = { background: '#f8fafc', border: 'none', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' };
const weekDaysStyle = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px' };
const weekDayItemStyle = { fontSize: '9px', fontWeight: 800, color: '#94a3b8', textAlign: 'center' };
const daysGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px' };
const dayItemStyle = { height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', transition: 'all 0.15s ease' };
