import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLES } from '../../utils/roleHelpers.js';

export function Header() {
  const { user, role, switchDemoRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = (newRole) => {
    switchDemoRole(newRole);
    if (newRole === ROLES.ADMIN) {
      navigate('/admin/dashboard');
    } else if (newRole === ROLES.STAFF) {
      navigate('/staff/dashboard');
    } else {
      navigate('/customer/dashboard');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="demo-banner-pill">
          <span className="demo-banner-dot"></span>
          <span>DEMO PREVIEW MODE</span>
        </div>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Active View: <strong style={{ color: 'var(--text-primary)' }}>{role}</strong>
        </span>
      </div>

      <div className="header-right">
        {/* Quick Demo Role Switcher */}
        <div className="role-switcher-container">
          <button
            type="button"
            className={`role-pill-btn ${role === ROLES.ADMIN ? 'active' : ''}`}
            onClick={() => handleRoleChange(ROLES.ADMIN)}
          >
            Admin
          </button>
          <button
            type="button"
            className={`role-pill-btn ${role === ROLES.STAFF ? 'active' : ''}`}
            onClick={() => handleRoleChange(ROLES.STAFF)}
          >
            Staff
          </button>
          <button
            type="button"
            className={`role-pill-btn ${role === ROLES.CUSTOMER ? 'active' : ''}`}
            onClick={() => handleRoleChange(ROLES.CUSTOMER)}
          >
            Customer
          </button>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleLogout}
          title="Sign out / Exit"
          style={{ gap: '0.375rem' }}
        >
          <LogOut style={{ width: '14px', height: '14px' }} />
          <span>Exit</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
