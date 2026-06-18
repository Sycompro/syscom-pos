'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export default function CustomSelect({ value, onChange, options = [], placeholder = 'Seleccionar...', icon, disabled = false, style = {}, dropdownWidth }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Cerrar al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const handleToggle = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleSelect = (val) => {
    if (onChange) {
      onChange({ target: { value: val } });
    }
    setIsOpen(false);
  };

  // Estilos
  const controlStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    fontSize: '11px',
    fontWeight: 700,
    color: disabled ? '#94a3b8' : '#1e293b',
    cursor: disabled ? 'not-allowed' : 'pointer',
    height: '33px',
    boxSizing: 'border-box',
    userSelect: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    ...style
  };

  const listContainerStyle = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    width: dropdownWidth || '100%',
    maxHeight: '220px',
    overflowY: 'auto',
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(8px)',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    zIndex: 999,
    padding: '4px',
    boxSizing: 'border-box'
  };

  const optionItemStyle = (isSelected) => ({
    padding: '8px 12px',
    fontSize: '11px',
    fontWeight: 700,
    borderRadius: '8px',
    cursor: 'pointer',
    background: isSelected ? '#3b82f6' : 'transparent',
    color: isSelected ? '#ffffff' : '#1e293b',
    transition: 'background 0.15s, color 0.15s',
    userSelect: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    textAlign: 'left',
    border: 'none',
    boxSizing: 'border-box'
  });

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div onClick={handleToggle} style={controlStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: 'calc(100% - 20px)' }}>
          {icon && <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronDown 
          size={14} 
          style={{ 
            color: '#94a3b8', 
            transition: 'transform 0.2s', 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            marginLeft: '4px',
            flexShrink: 0
          }} 
        />
      </div>

      {isOpen && (
        <div style={listContainerStyle}>
          {options.length === 0 ? (
            <div style={{ padding: '8px 12px', color: '#94a3b8', fontStyle: 'italic', fontSize: '11px' }}>
              Sin opciones
            </div>
          ) : (
            options.map(opt => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  style={optionItemStyle(isSelected)}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = '#f1f5f9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  {opt.label}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
