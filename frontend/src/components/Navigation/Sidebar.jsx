import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  FileText, 
  Receipt, 
  Tag, 
  CreditCard, 
  Users, 
  Settings, 
  Zap,
  LogOut 
} from 'lucide-react';

export default function Sidebar({ activeRole, activeTab, setActiveTab, onLogout }) {
  // Navigation structure mapped strictly to Brightloop roles
  const adminNav = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products & Variants', icon: Package },
    { id: 'discounts', label: 'Discount Rules', icon: Tag },
    { id: 'staff', label: 'Staff Management', icon: Users },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const staffNav = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'quotations', label: 'Quotations', icon: FileText },
    { id: 'subscriptions', label: 'Subscriptions', icon: Zap },
    { id: 'invoices', label: 'Invoices & Taxes', icon: Receipt },
    { id: 'payments', label: 'Payments', icon: CreditCard },
  ];

  const customerNav = [
    { id: 'my_subscriptions', label: 'My Subscriptions', icon: Zap },
    { id: 'my_invoices', label: 'Invoices & Billing', icon: Receipt },
  ];

  let navItems = customerNav;
  if (activeRole === 'admin') navItems = adminNav;
  if (activeRole === 'staff') navItems = staffNav;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center space-x-3 px-6 border-b border-slate-800">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-wide leading-tight">Brightloop</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Subscription Engine</p>
          </div>
        </div>

        {/* Role Badge */}
        <div className="px-6 py-4">
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-2.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Active Portal</p>
              <p className="text-xs font-bold text-indigo-400 uppercase">{activeRole} View</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Action */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}