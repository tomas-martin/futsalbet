import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, Calendar, Coins, ShieldAlert, FileText, ArrowLeft } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const adminNavItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
    { to: '/admin/partidos', label: 'Partidos y Resultados', icon: Calendar },
    { to: '/admin/cuotas', label: 'Cuotas y Mercados', icon: Coins },
    { to: '/admin/logs', label: 'Audit Logs', icon: FileText },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* ADMIN HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Panel Administrativo</h1>
            <p className="text-xs text-amber-400 font-bold">Gestión de FutsalBet • Control de Cuotas y Partidos</p>
          </div>
        </div>

        <NavLink
          to="/"
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Sitio
        </NavLink>
      </div>

      {/* ADMIN SUB NAVBAR */}
      <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl overflow-x-auto gap-1">
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* OUTLET */}
      <Outlet />
    </div>
  );
};
