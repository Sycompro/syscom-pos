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
  large = false,
  iconOnly = false
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
    border: isOpen ? '2px solid #3b82f6' : '2px solid #e2e8f0',
    background: '#ffffff',
    fontSize: large ? '14px' : '11px',
    fontWeight: 700,
    color: disabled ? '#94a3b8' : '#1e293b',
    cursor: disabled ? 'not-allowed' : 'pointer',
    height: large ? '54px' : '33px',
    boxSizing: 'border-box',
    userSelect: 'none',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: isOpen ? '0 0 0 4px rgba(59, 130, 246, 0.12)' : 'none',
    ...style,
    ...(isOpen ? { borderColor: '#3b82f6', border: '2px solid #3b82f6', boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.12)' } : {})
  };

  const listContainerStyle = {
    position: 'absolute',
    top: openUp ? 'auto' : 'calc(100% + 8px)',
    bottom: openUp ? 'calc(100% + 8px)' : 'auto',
    left: 0,
    width: dropdownWidth || '100%',
    maxHeight: isOpen ? '280px' : '0px',
    overflowY: isOpen ? 'auto' : 'hidden',
    background: 'rgba(255, 255, 255, 0.96)',
    backdropFilter: 'blur(16px)',
    border: isOpen ? '1px solid rgba(226, 232, 240, 0.8)' : '1px solid transparent',
    borderRadius: '16px',
    boxShadow: isOpen ? '0 12px 30px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03)' : 'none',
    zIndex: 999,
    padding: isOpen ? '6px' : '0px 6px',
    boxSizing: 'border-box',
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'translateY(0) scale(1)' : (openUp ? 'translateY(8px) scale(0.97)' : 'translateY(-8px) scale(0.97)'),
    transition: 'max-height 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), padding 0.2s ease, border-color 0.2s ease',
    pointerEvents: isOpen ? 'auto' : 'none'
  };

  const searchWrapperStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    margin: '2px 2px 6px 2px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    background: '#f8fafc',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
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
    padding: large ? '12px 18px' : '8px 14px',
    fontSize: large ? '14px' : '11px',
    fontWeight: 700,
    borderRadius: '10px',
    margin: '3px 0',
    cursor: 'pointer',
    background: isSelected ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'transparent',
    color: isSelected ? '#ffffff' : '#1e293b',
    transition: 'all 0.2s ease',
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
    padding: '12px 14px',
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
    borderTop: '1px solid rgba(226, 232, 240, 0.8)',
    marginTop: '4px',
    borderRadius: 0,
    boxSizing: 'border-box',
    textAlign: 'left'
  };

  const hasNoResults = filteredOptions.length === 0;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: iconOnly ? 'auto' : '100%' }}>
      <style jsx>{`
        .custom-select-list::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-select-list::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-select-list::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 20px;
        }
        .custom-select-list::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div onClick={handleToggle} style={controlStyle}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: iconOnly ? 'center' : 'flex-start',
          gap: '8px', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap', 
          width: '100%' 
        }}>
          {icon && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>}
          {!iconOnly && (
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          )}
        </div>
        {!iconOnly && (
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
        )}
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
          <div className="custom-select-list" style={{ maxHeight: searchable ? '180px' : '210px', overflowY: 'auto' }}>
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
