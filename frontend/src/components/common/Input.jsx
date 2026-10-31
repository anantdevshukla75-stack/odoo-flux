import React from 'react';

export function Input({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  const inputId = id || name;

  return (
    <div className={`flex flex-col gap-1.5 mb-3.5 ${className}`.trim()}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-slate-700 tracking-wide"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full px-3 py-2 text-sm bg-white text-slate-900 border rounded-lg shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all duration-150 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
            : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
        }`}
        {...props}
      />
      {error && <span className="text-xs text-red-600 font-medium">{error}</span>}
      {helperText && !error && (
        <span className="text-xs text-slate-500">{helperText}</span>
      )}
    </div>
  );
}

export default Input;
