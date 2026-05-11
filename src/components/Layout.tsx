import React from 'react';
import { useAuth } from '../lib/contexts/AuthContext';
import { LayoutDashboard, PlusCircle, Database, LogOut, ChevronRight, Menu, X, Folder, DollarSign, Calculator, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const { profile, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Панель', icon: LayoutDashboard },
    { id: 'new', label: 'Новый проект', icon: PlusCircle },
    { id: 'estimator', label: 'Конструктор оценки', icon: Calculator },
    { id: 'rates', label: 'Ставки специалистов', icon: DollarSign },
    { id: 'projects', label: 'Проекты', icon: Folder },
    { id: 'modules', label: 'База данных', icon: Database },
  ];

  if (profile?.role === UserRole.ADMIN) {
    menuItems.push({ id: 'admin', label: 'Администрирование', icon: Shield });
  }

  return (
    <div className="flex h-screen bg-white text-black font-sans overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-black text-white flex flex-col border-r border-black transition-all duration-300"
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-bold tracking-tighter uppercase italic serif"
            >
              PE Intelligence
            </motion.h1>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-white/10 rounded-md transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 mt-6 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center p-3 rounded-lg transition-all group",
                activeTab === item.id 
                  ? "bg-[#9932CC] text-white" 
                  : "hover:bg-white/5 text-white/60"
              )}
            >
              <item.icon size={20} className={cn(activeTab === item.id ? "text-white" : "")} />
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="ml-3 font-medium text-sm"
                >
                  {item.label}
                </motion.span>
              )}
              {isSidebarOpen && activeTab === item.id && (
                <ChevronRight size={16} className="ml-auto" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          {isSidebarOpen ? (
            <div className="flex items-center space-x-3 p-2">
              <div className="w-8 h-8 rounded-full bg-[#9932CC] flex items-center justify-center text-white font-bold text-xs">
                {profile?.displayName?.[0] || 'U'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{profile?.displayName}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">{profile?.role}</p>
              </div>
              <button 
                onClick={logout}
                className="p-2 text-white/40 hover:text-white transition-colors"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button 
              onClick={logout}
              className="w-full flex justify-center p-2 text-white/40 hover:text-white transition-colors"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top decorative line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#9932CC] opacity-10" />
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-6xl mx-auto"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
