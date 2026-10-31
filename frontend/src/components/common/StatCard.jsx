import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendDirection = 'up',
  helperText
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-card-label">{label}</span>
        {Icon && (
          <div className="stat-card-icon-wrap">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="stat-card-value">{value}</div>

      {(trend || helperText) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 'auto' }}>
          {trend && (
            <span className={`stat-card-trend ${trendDirection === 'up' ? 'trend-up' : 'trend-down'}`}>
              {trendDirection === 'up' ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {trend}
            </span>
          )}
          {helperText && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {helperText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default StatCard;
