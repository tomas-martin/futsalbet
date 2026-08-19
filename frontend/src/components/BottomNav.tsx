import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Radio, Target, Star, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const BottomNav: React.FC = () => {
  const { isAdmin } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 z-40 px-1 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl text-[10px] font-extrabold transition min-w-[56px] ${
              isActive ? 'text-purple-400 bg-purple-500/10' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Home className="w-5 h-5" />
          <span>Inicio</span>
        </NavLink>

        <NavLink
          to="/partidos"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl text-[10px] font-extrabold transition min-w-[56px] ${
              isActive ? 'text-purple-400 bg-purple-500/10' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Calendar className="w-5 h-5" />
          <span>Partidos</span>
        </NavLink>

        <NavLink
          to="/prode"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl text-[10px] font-extrabold transition min-w-[56px] ${
              isActive ? 'text-purple-400 bg-purple-500/15 border border-purple-500/20' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Target className="w-5 h-5 text-purple-400" />
          <span>Prode</span>
        </NavLink>

        <NavLink
          to="/en-vivo"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl text-[10px] font-extrabold transition min-w-[56px] ${
              isActive ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
          <span>En Vivo</span>
        </NavLink>

        <NavLink
          to="/leaderboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl text-[10px] font-extrabold transition min-w-[56px] ${
              isActive ? 'text-yellow-400 bg-yellow-500/10' : 'text-slate-400 hover:text-slate-200'
            }`
          }
        >
          <Star className="w-5 h-5 text-yellow-400" />
          <span>Tabla</span>
        </NavLink>

        {isAdmin ? (
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl text-[10px] font-extrabold transition min-w-[56px] ${
                isActive ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <Shield className="w-5 h-5 text-amber-400" />
            <span>Admin</span>
          </NavLink>
        ) : (
          <NavLink
            to="/perfil"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl text-[10px] font-extrabold transition min-w-[56px] ${
                isActive ? 'text-purple-400 bg-purple-500/10' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            <User className="w-5 h-5" />
            <span>Perfil</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
};