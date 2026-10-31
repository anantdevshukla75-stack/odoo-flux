import React from 'react';

export function PageHeader({ title, description, children }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-header-title">{title}</h1>
        {description && <p className="page-header-desc">{description}</p>}
      </div>
      {children && <div className="page-header-actions">{children}</div>}
    </div>
  );
}

export default PageHeader;
