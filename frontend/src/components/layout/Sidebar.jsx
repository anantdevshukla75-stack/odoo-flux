import React from 'react';
import { NavLink } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  ADMIN_NAVIGATION,
  STAFF_NAVIGATION,
  CUSTOMER_NAVIGATION
} from '../../data/navigation.js';
import { ROLES } from '../../utils/roleHelpers.js';

export function Sidebar() {
  const { user, role } = useAuth();

  let navSections = [];
  if (role === ROLES.ADMIN) {
    navSections = ADMIN_NAVIGATION;
  } else if (role === ROLES.STAFF) {
    navSections = STAFF_NAVIGATION;
  } else {
    navSections = CUSTOMER_NAVIGATION;
  }

  // Helper to render Lucide icon dynamically
  const renderIcon = (iconName) => {
    const IconComponent = LucideIcons[iconName] || LucideIcons.Circle;
    return <IconComponent className="nav-icon" />;
  };

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <img src="/logo.svg" alt="Brightloop Logo" className="brand-logo" />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="brand-text">Brightloop</span>
          <span style={{ fontSize: '0.6875rem', color: '#9CA3AF' }}>Subscription Billing</span>
        </div>
        <span className="brand-badge" style={{ marginLeft: 'auto' }}>
          {role}
        </span>
      </div>

      <div className="sidebar-content">
        {navSections.map((section, idx) => (
          <div key={idx}>
            <div className="nav-section-title">{section.section}</div>
            <ul className="nav-list">
              {section.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `nav-item-link ${isActive ? 'active' : ''}`
                    }
                  >
                    {renderIcon(item.icon)}
                    <span>{item.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="user-info-card">
          <div className="user-avatar">
            {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.fullName || 'User'}</div>
            <div className="user-role-badge">{user?.companyName || user?.role || 'Guest'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
