import React from 'react';

export function Select({
  label,
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  error,
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  const selectId = id || name;

  return (
    <div className={`form-group ${className}`.trim()}>
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className="form-select"
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

export default Select;
