import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar (Desktop persistent + Mobile drawer) */}
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header onToggleMobile={() => setMobileOpen(prev => !prev)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
