
import React, { useMemo } from 'react';
import { ChartPie, FileText, Settings, LogOut, ShieldCheck, X, Archive, Drill, ClipboardList, MessageSquareShare } from "lucide-react";
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: string;
  onLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userRole, onLogout, isOpen, setIsOpen }) => {
  const menuItems = useMemo(() => {
    const allItems = [
      { id: 'dashboard', label: 'Dashboard', icon: ChartPie, roles: [UserRole.ADMIN, UserRole.CONTRIBUTOR] },
      { id: 'demands', label: 'Demandas Técnicas', icon: Drill, roles: [UserRole.ADMIN, UserRole.CONTRIBUTOR] },
      { id: 'tracking', label: 'Ordem de Serviço', icon: MessageSquareShare, roles: [UserRole.ADMIN, UserRole.CONTRIBUTOR, UserRole.VENDEDOR, UserRole.REGIONAL_ADMIN, UserRole.VENDEDOR_LS, UserRole.REGIONAL_ADMIN_LS] },
      { id: 'reports', label: 'Relatórios', icon: FileText, roles: [UserRole.ADMIN, UserRole.CONTRIBUTOR] },
      { id: 'files', label: 'Central de Arquivos', icon: Archive, roles: [UserRole.ADMIN, UserRole.CONTRIBUTOR, UserRole.VENDEDOR, UserRole.REGIONAL_ADMIN, UserRole.VENDEDOR_LS, UserRole.REGIONAL_ADMIN_LS] },
      { id: 'settings', label: 'Configurações', icon: Settings, roles: [UserRole.ADMIN, UserRole.CONTRIBUTOR, UserRole.VENDEDOR, UserRole.REGIONAL_ADMIN, UserRole.VENDEDOR_LS, UserRole.REGIONAL_ADMIN_LS] },
    ];
    return allItems.filter(item => item.roles.includes(userRole as UserRole));
  }, [userRole]);

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  return (
    <aside className={`
      w-72 bg-gray-900 h-screen fixed left-0 top-0 text-white p-6 flex flex-col z-[70]
      transition-transform duration-300 ease-in-out border-r border-gray-800 shadow-2xl
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="flex items-center justify-between mb-10 px-2">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">Departamento Técnico</h1>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-gray-800 rounded-lg text-gray-400 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabClick(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="pt-6 border-t border-gray-800 mt-auto">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Sair do Sistema</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
