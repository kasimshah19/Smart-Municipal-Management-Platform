import React from 'react';
import Select from 'react-select';

const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select...", 
  isDisabled = false, 
  isClearable = true,
  isMulti = false,
  name,
  className = "",
  error = null
}) => {

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: '0.5rem',
      borderColor: error ? '#ef4444' : state.isFocused ? '#3b82f6' : '#e5e7eb',
      boxShadow: state.isFocused ? (error ? '0 0 0 3px rgba(239, 68, 68, 0.2)' : '0 0 0 3px rgba(59, 130, 246, 0.2)') : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      '&:hover': { borderColor: error ? '#ef4444' : state.isFocused ? '#3b82f6' : '#9ca3af' },
      fontSize: '0.875rem',
      minHeight: '42px',
      transition: 'all 0.2s ease-in-out',
      backgroundColor: state.isDisabled ? '#f9fafb' : 'white',
      cursor: state.isDisabled ? 'not-allowed' : 'default',
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '2px 12px'
    }),
    singleValue: (base) => ({
      ...base,
      color: '#1f2937',
      fontWeight: '500'
    }),
    placeholder: (base) => ({
      ...base,
      color: '#9ca3af',
      fontWeight: '400'
    }),
    option: (base, state) => ({
      ...base,
      fontSize: '0.875rem',
      padding: '10px 12px',
      backgroundColor: state.isSelected ? '#eff6ff' : state.isFocused ? '#f9fafb' : 'white',
      color: state.isSelected ? '#1d4ed8' : '#374151',
      fontWeight: state.isSelected ? '600' : '400',
      cursor: 'pointer',
      transition: 'background-color 0.15s ease-in-out, color 0.15s ease-in-out',
      '&:active': {
        backgroundColor: '#e0e7ff',
      }
    }),
    menu: (base) => ({
      ...base,
      zIndex: 50,
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
      marginTop: '6px'
    }),
    menuList: (base) => ({
      ...base,
      padding: '4px'
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: '#e5e7eb',
      margin: '8px 0'
    }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isFocused ? '#6b7280' : '#9ca3af',
      '&:hover': {
        color: '#4b5563'
      },
      transition: 'color 0.2s ease-in-out'
    }),
    clearIndicator: (base) => ({
      ...base,
      color: '#9ca3af',
      '&:hover': {
        color: '#ef4444'
      },
      transition: 'color 0.2s ease-in-out'
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#eff6ff',
      borderRadius: '4px',
      border: '1px solid #bfdbfe'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#1d4ed8',
      fontWeight: '500',
      fontSize: '0.8125rem'
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#1d4ed8',
      '&:hover': {
        backgroundColor: '#dbeafe',
        color: '#1e3a8a'
      },
      transition: 'all 0.2s ease-in-out'
    })
  };

  // Convert raw value back to object(s) if value is a string/number/array
  let selectedOption = null;
  if (isMulti) {
    selectedOption = Array.isArray(value) ? options.filter(o => value.includes(o.value)) : [];
  } else {
    selectedOption = options.find(o => o.value === value) || null;
  }

  const handleChange = (selected) => {
    let finalValue = '';
    if (isMulti) {
      finalValue = selected ? selected.map(s => s.value) : [];
    } else {
      finalValue = selected ? selected.value : '';
    }
    
    // If used within a traditional form that expects an event object
    const event = {
      target: {
        name: name,
        value: finalValue,
        // Mock selectedOptions for compatibility with traditional select multiple handler
        selectedOptions: isMulti && selected ? selected.map(s => ({ value: s.value })) : []
      }
    };
    onChange(event);
  };

  return (
    <div className={`w-full ${className}`}>
      <Select
        name={name}
        options={options}
        value={selectedOption}
        onChange={handleChange}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isClearable={isClearable}
        isMulti={isMulti}
        styles={customSelectStyles}
        menuPosition="fixed"
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default SearchableSelect;
