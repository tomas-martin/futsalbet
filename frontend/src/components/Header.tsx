import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, User as UserIcon, Shield, LogOut, Trophy } from 'lucide-react';
import { apiClient } from '../api/client';

export const Header: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      apiClient.get('/notifications?limit=1')
        .then((res) => setUnreadCount(res.data.unreadCount || 0))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 md:px-4 h-16 flex items-center justify-between gap-2 md:gap-4">
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2 group min-w-0">
          <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl overflow-hidden shadow-lg shadow-orange-500/30 group-hover:scale-105 transition duration-200 border-2 border-orange-500/40 shrink-0">
            <img src="/logo.jpg" alt="FutsalBet Logo" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <span className="font-black text-base md:text-xl tracking-tight bg-gradient-to-r from-white via-orange-100 to-orange-400 bg-clip-text text-transparent whitespace-nowrap">
              FUTSAL<span className="text-orange-500">BET</span>
            </span>
            <span className="hidden sm:block text-[9px] font-semibold text-orange-400 tracking-wider uppercase leading-none">
              FEFUSA Mendoza • Primera FSP
            </span>
          </div>
        </Link>

        {/* ACTIONS & USER BAR */}
        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          {isAuthenticated ? (
            <>
              {/* Admin Button if Admin */}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden md:inline">Panel Admin</span>
                </Link>
              )}

              {/* Leaderboard */}
              <Link
                to="/leaderboard"
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Tabla de Posiciones Prode"
              >
                <Trophy className="w-5 h-5 text-yellow-400" />
              </Link>

              {/* Notifications */}
              <Link
                to="/perfil"
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg relative transition"
                title="Notificaciones"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
                )}
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-purple-400">
                    {user?.displayName?.[0] || 'U'}
                  </div>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-sm font-bold text-white truncate">{user?.displayName}</p>
                      <p className="text-xs text-slate-400 truncate">@{user?.username}</p>
                    </div>
                    <Link
                      to="/perfil"
                      onClick={() => setMenuOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" /> Perfil
                    </Link>
                    <Link
                      to="/mis-pronosticos"
                      onClick={() => setMenuOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Trophy className="w-4 h-4 text-slate-400" /> Mis Pronósticos
                    </Link>
                    <Link
                      to="/leaderboard"
                      onClick={() => setMenuOpen(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                    >
                      <Trophy className="w-4 h-4 text-yellow-400" /> Tabla del Prode
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="px-4 py-2 text-xs font-semibold text-amber-400 hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" /> Panel Admin
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-slate-800 flex items-center gap-2 border-t border-slate-800"
                    >
                      <LogOut className="w-4 h-4" /> Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition shadow-lg shadow-purple-600/30"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};