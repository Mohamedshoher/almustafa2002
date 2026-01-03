
import React from 'react';
import { LayoutDashboard, Users, UserPlus, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'لوحة التحكم', icon: LayoutDashboard },
    { path: '/customers', label: 'العملاء', icon: Users },
    { path: '/add-customer', label: 'إضافة عميل', icon: UserPlus },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-64 bg-indigo-900 text-white flex-col sticky top-0 h-screen shadow-xl">
        <div className="p-6 text-2xl font-bold border-b border-indigo-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">💰</div>
          <span>المديونيات</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isActive ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-800'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-indigo-800">
          <div className="text-xs text-indigo-400">نظام إدارة المحل v1.0</div>
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="md:hidden bg-indigo-900 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <span className="font-bold">نظام المديونيات</span>
        <div className="flex gap-4">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className="p-1">
              <item.icon size={24} />
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
