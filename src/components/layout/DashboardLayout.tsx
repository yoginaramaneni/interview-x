import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Dropdown } from '../ui/Dropdown';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Mic,
  Code,
  Layers,
  BarChart3,
  Settings,
  Sun,
  Moon,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  ChevronDown
} from 'lucide-react';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Resume Builder', path: '/resume', icon: <FileText className="w-5 h-5" /> },
    { name: 'Job Match Analyzer', path: '/job-match', icon: <Briefcase className="w-5 h-5" /> },
    { name: 'AI Voice Interview', path: '/interview', icon: <Mic className="w-5 h-5" /> },
    { name: 'Coding Sandbox', path: '/coding', icon: <Code className="w-5 h-5" /> },
    { name: 'Aptitude Practice', path: '/aptitude', icon: <Layers className="w-5 h-5" /> },
    { name: 'Performance Reports', path: '/reports', icon: <BarChart3 className="w-5 h-5" /> },
    { name: 'Settings', path: '/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const profileMenuItems = [
    { label: 'Profile Settings', onClick: () => navigate('/settings') },
    { label: 'Billing Settings', onClick: () => navigate('/settings?tab=billing') },
    { label: 'Sign Out', onClick: handleSignOut, variant: 'danger' as const },
  ];

  const mockNotifications = [
    { id: 1, title: 'Resume Analyzed', desc: 'Your resume ATS score has been updated to 88%.', time: '5m ago' },
    { id: 2, title: 'Upcoming Interview', desc: 'Mock Technical Interview scheduled for tomorrow at 10 AM.', time: '2h ago' },
    { id: 3, title: 'System Notification', desc: 'Welcome to InterviewAI X! Get started by uploading your resume.', time: '1d ago' },
  ];

  const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-40 w-full shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-blue-600 dark:text-blue-400">InterviewAI</span>
          <span className="text-[10px] uppercase font-bold tracking-widest bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded-md">X</span>
        </div>
        <button
          onClick={toggleMobileSidebar}
          className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar Navigation - Desktop */}
      <aside className={`fixed inset-y-0 left-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-64 p-6 z-50 transform md:transform-none transition-transform duration-300 flex flex-col justify-between shrink-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
              <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">InterviewAI</span>
              <span className="text-xs uppercase font-bold tracking-widest bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-lg">X</span>
            </Link>
            <button onClick={toggleMobileSidebar} className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3.5 px-4.5 py-3 rounded-button text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/10'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/40'
                    }
                  `}
                >
                  <span className={isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600'}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile footer in Sidebar */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar fallback={user?.full_name || 'John Doe'} size="sm" />
            <div className="flex flex-col select-none">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user?.full_name || 'John Doe'}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{user?.role || 'Candidate'}</span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        {/* Top Navbar */}
        <nav className="hidden md:flex items-center justify-between px-8 h-18 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 w-full shrink-0">
          {/* Breadcrumb Title */}
          <div>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              {menuItems.find((item) => item.path === location.pathname)?.name || 'Platform'}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            {/* Search Box */}
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search resources, reports..."
                className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-input text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Notifications Center */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-650 rounded-full" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-card shadow-xl p-4 z-40">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-850">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Notifications</span>
                    <button className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline">Mark all read</button>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-60 overflow-y-auto">
                    {mockNotifications.map((notif) => (
                      <div key={notif.id} className="py-2.5 flex flex-col gap-1 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 px-1 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-850 dark:text-slate-200">{notif.title}</span>
                          <span className="text-[9px] text-slate-400 dark:text-slate-500">{notif.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{notif.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity">
                  <Avatar fallback={user?.full_name || 'John Doe'} size="sm" />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              }
              items={profileMenuItems}
            />
          </div>
        </nav>

        {/* Active Page Body */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto w-full">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
