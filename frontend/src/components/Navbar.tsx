import React from 'react';
import { NavLink } from 'react-router-dom';
import { Trophy, Calendar, Radio, Award, ShieldAlert, HelpCircle, Target, Star, Users } from 'lucide-react';

export const Navbar: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Inicio', icon: Calendar, exact: true },
    { to: '/partidos', label: 'Partidos', icon: Calendar },
    { to: '/prode', label: 'Prode', icon: Target, badge: 'FSP' },
    { to: '/en-vivo', label: 'En Vivo', icon: Radio, badge: 'LIVE' },
    { to: '/resultados', label: 'Resultados', icon: Award },
    { to: '/torneos', label: 'Torneos', icon: Trophy },
    { to: '/equipos', label: 'Equipos', icon: ShieldAlert },
    { to: '/leaderboard', label: 'Tabla General', icon: Star },
    { to: '/grupos', label: 'Grupos Privados', icon: Users },
    { to: '/ayuda', label: 'Ayuda', icon: HelpCircle },
  ];

  return (
    <nav className="bg-slate-900 border-b border-slate-800 hidden md:block">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `px-4 py-3 text-xs font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-purple-500 text-purple-400 bg-purple-950/20'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
              {item.badge && (
                <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};