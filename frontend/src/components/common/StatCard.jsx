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
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-colors duration-150">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="text-2xl font-bold tracking-tight text-slate-900 mb-2">{value}</div>

      {(trend || helperText) && (
        <div className="flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                trendDirection === 'up' ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {trendDirection === 'up' ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {trend}
            </span>
          )}
          {helperText && <span className="text-slate-400">{helperText}</span>}
        </div>
      )}
    </div>
  );
}

export default StatCard;
