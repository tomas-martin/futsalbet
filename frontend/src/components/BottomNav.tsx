import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Radio, Trophy, Ticket, User, Target } from 'lucide-react';
import { useBetSlip } from '../context/BetSlipContext';

export const BottomNav: React.FC = () => {
  const { items, toggleOpen } = useBetSlip();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 z-40 px-2 py-1">
      <div className="flex items-center justify-around">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-bold ${
              isActive ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Inicio</span>
        </NavLink>

        <NavLink
          to="/partidos"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-bold ${
              isActive ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Calendar className="w-5 h-5" />
          <span>Partidos</span>
        </NavLink>

        <NavLink
          to="/prode"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-bold ${
              isActive ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Target className="w-5 h-5" />
          <span>Prode</span>
        </NavLink>

        <NavLink
          to="/en-vivo"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-bold relative ${
              isActive ? 'text-rose-400' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
          <span>En Vivo</span>
        </NavLink>

        <button
          onClick={toggleOpen}
          className="flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-bold text-slate-400 hover:text-slate-200 relative"
        >
          <div className="relative">
            <Ticket className="w-5 h-5 text-purple-400" />
            {items.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-purple-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {items.length}
              </span>
            )}
          </div>
          <span>Boleta</span>
        </button>

        <NavLink
          to="/perfil"
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-1 px-3 text-[10px] font-bold ${
              isActive ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <User className="w-5 h-5" />
          <span>Perfil</span>
        </NavLink>
      </div>
    </nav>
  );
};
