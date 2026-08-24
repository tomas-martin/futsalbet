import React, { useState, useEffect } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  User as UserIcon,
  Shield,
  LogOut,
  Trophy,
  Menu,
  X,
  Calendar,
  Radio,
  Award,
  ShieldAlert,
  HelpCircle,
  Target,
  Star,
  Home,
  Users
} from 'lucide-react';
import { apiClient } from '../api/client';

export const Header: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      apiClient.get('/notifications?limit=1')
        .then((res) => setUnreadCount(res.data.unreadCount || 0))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const mobileNavItems = [
    { to: '/', label: 'Inicio', icon: Home, exact: true },
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
    <>
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-3 md:px-4 h-14 md:h-16 flex items-center justify-between gap-2">
          {/* LOGO & HAMBURGER */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="p-2 -ml-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition md:hidden"
              aria-label="Abrir menú"
            >
              {drawerOpen ? <X className="w-6 h-6 text-purple-400" /> : <Menu className="w-6 h-6 text-slate-200" />}
            </button>

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
          </div>

          {/* ACTIONS & USER BAR */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
            {isAuthenticated ? (
              <>
                {/* Admin Button if Admin */}
                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">Panel Admin</span>
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
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-800 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 border border-purple-400/50 flex items-center justify-center font-black text-sm text-white shadow-md">
                      {user?.displayName?.[0] || 'U'}
                    </div>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-1 z-50">
                      <div className="px-4 py-2.5 border-b border-slate-800">
                        <p className="text-sm font-bold text-white truncate">{user?.displayName}</p>
                        <p className="text-xs text-slate-400 truncate">@{user?.username}</p>
                      </div>
                      <Link
                        to="/perfil"
                        onClick={() => setMenuOpen(false)}
                        className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 flex items-center gap-2.5"
                      >
                        <UserIcon className="w-4 h-4 text-purple-400" /> Perfil
                      </Link>
                      <Link
                        to="/mis-pronosticos"
                        onClick={() => setMenuOpen(false)}
                        className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 flex items-center gap-2.5"
                      >
                        <Trophy className="w-4 h-4 text-yellow-400" /> Mis Pronósticos
                      </Link>
                      <Link
                        to="/leaderboard"
                        onClick={() => setMenuOpen(false)}
                        className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 flex items-center gap-2.5"
                      >
                        <Star className="w-4 h-4 text-yellow-400" /> Tabla General
                      </Link>
                      <Link
                        to="/grupos"
                        onClick={() => setMenuOpen(false)}
                        className="px-4 py-2.5 text-xs font-semibold text-purple-300 hover:bg-slate-800 flex items-center gap-2.5"
                      >
                        <Users className="w-4 h-4 text-purple-400" /> Grupos Privados
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setMenuOpen(false)}
                          className="px-4 py-2.5 text-xs font-semibold text-amber-400 hover:bg-slate-800 flex items-center gap-2.5"
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
                        className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-400 hover:bg-slate-800 flex items-center gap-2.5 border-t border-slate-800"
                      >
                        <LogOut className="w-4 h-4" /> Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white transition whitespace-nowrap"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition shadow-lg shadow-purple-600/30 whitespace-nowrap"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER NAVIGATION MENU */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-slate-900 border-r border-slate-800 text-slate-100 flex flex-col h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-orange-500/40">
                  <img src="/logo.jpg" alt="" className="w-full h-full object-cover" />
                </div>
                <span className="font-black text-lg text-white">
                  FUTSAL<span className="text-orange-500">BET</span>
                </span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
              {mobileNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                        isActive
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-purple-400" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}

              {isAuthenticated && (
                <>
                  <div className="pt-3 pb-1 px-3 text-[10px] font-black tracking-wider uppercase text-slate-500">
                    Mi Cuenta
                  </div>
                  <NavLink
                    to="/mis-pronosticos"
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition ${
                        isActive
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`
                    }
                  >
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span>Mis Pronósticos</span>
                  </NavLink>
                  <NavLink
                    to="/perfil"
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition ${
                        isActive
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`
                    }
                  >
                    <UserIcon className="w-4 h-4 text-purple-400" />
                    <span>Mi Perfil</span>
                  </NavLink>
                </>
              )}

              {isAdmin && (
                <>
                  <div className="pt-3 pb-1 px-3 text-[10px] font-black tracking-wider uppercase text-amber-500">
                    Administración
                  </div>
                  <NavLink
                    to="/admin/dashboard"
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-3 transition ${
                        isActive
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'text-amber-400 hover:bg-slate-800/80'
                      }`
                    }
                  >
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Panel Admin</span>
                  </NavLink>
                </>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 font-black text-white flex items-center justify-center text-sm">
                      {user?.displayName?.[0] || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{user?.displayName}</p>
                      <p className="text-[10px] text-slate-400 truncate">@{user?.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      logout();
                      navigate('/');
                    }}
                    className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Cerrar Sesión
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setDrawerOpen(false)}
                    className="py-2 text-center bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setDrawerOpen(false)}
                    className="py-2 text-center bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-purple-600/30"
                  >
                    Registro
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};