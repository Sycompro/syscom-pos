'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Plus } from 'lucide-react';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  icon,
  disabled = false,
  style = {},
  dropdownWidth,
  searchable = false,
  onAdd,
  addLabel = '+ Crear nuevo',
  openUp = false,
  large = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

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

  // Auto-focus en el input de búsqueda al abrir
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen, searchable]);

  const selectedOption = options.find(opt => opt.value === value);

  // Filtrar opciones según el término de búsqueda
  const filteredOptions = useMemo(() => {
    if (!searchable || !searchTerm.trim()) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(opt => opt.label.toLowerCase().includes(term));
  }, [options, searchTerm, searchable]);

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
    fontSize: large ? '14px' : '11px',
    fontWeight: 700,
    color: disabled ? '#94a3b8' : '#1e293b',
    cursor: disabled ? 'not-allowed' : 'pointer',
    height: large ? '54px' : '33px',
    boxSizing: 'border-box',
    userSelect: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    ...style
  };

  const listContainerStyle = {
    position: 'absolute',
    top: openUp ? 'auto' : 'calc(100% + 4px)',
    bottom: openUp ? 'calc(100% + 4px)' : 'auto',
    left: 0,
    width: dropdownWidth || '100%',
    maxHeight: isOpen ? '280px' : '0px',
    overflowY: isOpen ? 'auto' : 'hidden',
    background: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(8px)',
    border: isOpen ? '1px solid #e2e8f0' : '1px solid transparent',
    borderRadius: '12px',
    boxShadow: isOpen ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' : 'none',
    zIndex: 999,
    padding: isOpen ? '4px' : '0px 4px',
    boxSizing: 'border-box',
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'translateY(0)' : (openUp ? 'translateY(6px)' : 'translateY(-6px)'),
    transition: 'max-height 0.22s ease, opacity 0.18s ease, transform 0.18s ease, padding 0.18s ease, border-color 0.18s ease',
    pointerEvents: isOpen ? 'auto' : 'none'
  };

  const searchWrapperStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 8px',
    margin: '2px 2px 4px 2px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    boxSizing: 'border-box'
  };

  const searchInputStyle = {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '11px',
    fontWeight: 600,
    color: '#1e293b',
    width: '100%',
    padding: 0,
    margin: 0
  };

  const optionItemStyle = (isSelected) => ({
    padding: large ? '12px 16px' : '8px 12px',
    fontSize: large ? '14px' : '11px',
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

  const addButtonStyle = {
    borderTop: '1px solid #e2e8f0',
    padding: '10px 12px',
    color: '#3b82f6',
    fontWeight: 800,
    fontSize: '11px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderTop: '1px solid #e2e8f0',
    borderRadius: 0,
    boxSizing: 'border-box',
    textAlign: 'left'
  };

  const hasNoResults = filteredOptions.length === 0;

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
          size={large ? 18 : 14} 
          style={{ 
            color: '#94a3b8', 
            transition: 'transform 0.2s', 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            marginLeft: '4px',
            flexShrink: 0
          }} 
        />
      </div>

      <div style={listContainerStyle}>
        {searchable && (
          <div style={searchWrapperStyle}>
            <Search size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar..."
              style={searchInputStyle}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        {hasNoResults && !onAdd ? (
          <div style={{ padding: '8px 12px', color: '#94a3b8', fontStyle: 'italic', fontSize: '11px' }}>
            Sin opciones
          </div>
        ) : (
          <div style={{ maxHeight: searchable ? '180px' : '210px', overflowY: 'auto' }}>
            {filteredOptions.map(opt => {
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
            })}
          </div>
        )}

        {onAdd && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
              setIsOpen(false);
            }}
            style={addButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f0f7ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Plus size={13} style={{ flexShrink: 0 }} />
            {addLabel}
          </button>
        )}
      </div>
    </div>
  );
}
