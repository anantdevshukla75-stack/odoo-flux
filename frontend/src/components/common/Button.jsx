import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'danger' | 'ghost'
  size = 'md',        // 'sm' | 'md' | 'lg'
  icon: Icon,
  loading = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== 'md' ? `btn-${size}` : '';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`btn ${variantClass} ${sizeClass} ${className}`.trim()}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
}

export default Button;
