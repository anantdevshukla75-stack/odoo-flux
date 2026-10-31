import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import LoadingState from '../common/LoadingState.jsx';

export function ProtectedRoute({ allowedRoles = [] }) {
  const { user, role, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingState message="Restoring your session..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect to the default dashboard for their actual role
    if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'STAFF') return <Navigate to="/staff/dashboard" replace />;
    return <Navigate to="/customer/dashboard" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
