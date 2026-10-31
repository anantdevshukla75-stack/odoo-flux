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
    <div className={`flex flex-col gap-1.5 mb-3.5 ${className}`.trim()}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-slate-700 tracking-wide"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`w-full px-3 py-2 text-sm bg-white text-slate-900 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all duration-150 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
            : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
        }`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600 font-medium">{error}</span>}
    </div>
  );
}

export default Select;
