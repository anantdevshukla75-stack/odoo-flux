import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PageHeader({ title, description, breadcrumbs = [], children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {crumb.path ? (
                  <Link to={crumb.path} className="hover:text-slate-600 transition-colors">
                    {crumb.name}
                  </Link>
                ) : (
                  <span className="text-slate-600 font-medium">{crumb.name}</span>
                )}
                {idx < breadcrumbs.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
      </div>

      {children && <div className="flex items-center gap-2.5 shrink-0">{children}</div>}
    </div>
  );
}

export default PageHeader;
