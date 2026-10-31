import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

export function AppLayout() {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
