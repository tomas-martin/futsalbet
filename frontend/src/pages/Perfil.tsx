import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, Award, Shield, User as UserIcon, LogOut, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Perfil: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* USER HEADER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 border-2 border-purple-400 font-black text-2xl text-white flex items-center justify-center shadow-lg shadow-purple-600/30">
            {user.displayName[0]}
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{user.displayName}</h1>
            <p className="text-xs text-purple-400 font-bold">@{user.username} • Rol: {user.role}</p>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-2 self-start md:self-auto"
        >
          <LogOut className="w-4 h-4" /> Cerrar Sesión
        </button>
      </div>

      {/* PRODE SUMMARY CARD */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 border border-purple-800/40 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-extrabold tracking-wider text-purple-300 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-yellow-400" /> Prode FSP 2026
          </span>
          <Link to="/leaderboard" className="text-xs font-bold text-purple-300 hover:underline">
            Ver Tabla →
          </Link>
        </div>
        <p className="text-xs text-slate-400">
          Acertá resultados exactos (<strong className="text-white">6 pts</strong>) o ganador/empate (<strong className="text-white">3 pts</strong>)
          en los partidos de la FEFUSA. Tus pronósticos se bloquean cuando arranca el partido.
        </p>
      </div>

      {/* QUICK LINKS GRID */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link
          to="/prode"
          className="bg-slate-900 border border-slate-800 hover:border-purple-600/60 rounded-3xl p-6 transition space-y-3 shadow-lg group"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-base text-white group-hover:text-purple-300">Jugar al Prode</h3>
          <p className="text-xs text-slate-400">Cargá tus pronósticos de los próximos partidos</p>
        </Link>

        <Link
          to="/mis-pronosticos"
          className="bg-slate-900 border border-slate-800 hover:border-purple-600/60 rounded-3xl p-6 transition space-y-3 shadow-lg group"
        >
          <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-base text-white group-hover:text-purple-300">Mis Pronósticos</h3>
          <p className="text-xs text-slate-400">Historial de tus pronósticos y puntos ganados</p>
        </Link>

        <Link
          to="/favoritos"
          className="bg-slate-900 border border-slate-800 hover:border-purple-600/60 rounded-3xl p-6 transition space-y-3 shadow-lg group"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-base text-white group-hover:text-purple-300">Favoritos</h3>
          <p className="text-xs text-slate-400">Acceso rápido a tus equipos y torneos favoritos</p>
        </Link>
      </div>

      {user.role === 'ADMIN' && (
        <Link
          to="/admin/dashboard"
          className="flex items-center gap-3 bg-slate-900 border border-amber-500/30 hover:border-amber-500/60 rounded-3xl p-5 transition shadow-lg group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-amber-300 group-hover:text-amber-200">Panel Administrador</h3>
            <p className="text-xs text-slate-400">Cargar partidos, resultados y administrar usuarios</p>
          </div>
        </Link>
      )}
    </div>
  );
};