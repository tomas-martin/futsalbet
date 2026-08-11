import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Coins, Ticket, Award, Shield, User as UserIcon, LogOut } from 'lucide-react';
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

      {/* VIRTUAL POINTS SUMMARY CARD */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 border border-purple-800/40 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-extrabold tracking-wider text-purple-300 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-yellow-400" /> Billetera de Puntos Virtuales
          </span>
          <Link to="/mis-puntos" className="text-xs font-bold text-yellow-400 hover:underline">
            Ver Movimientos →
          </Link>
        </div>
        <div className="text-4xl font-black text-yellow-400">
          {user.balance?.toLocaleString('es-AR')} <span className="text-sm font-bold text-slate-400">PUNTOS</span>
        </div>
        <p className="text-xs text-slate-400">
          * Recordatorio: Los puntos son totalmente virtuales para pronósticos recreativos sin dinero real.
        </p>
      </div>

      {/* QUICK LINKS GRID */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link
          to="/mis-apuestas"
          className="bg-slate-900 border border-slate-800 hover:border-purple-600/60 rounded-3xl p-6 transition space-y-3 shadow-lg group"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
            <Ticket className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-base text-white group-hover:text-purple-300">Mis Pronósticos</h3>
          <p className="text-xs text-slate-400">Revisa tu historial de apuestas simples y combinadas</p>
        </Link>

        <Link
          to="/mis-puntos"
          className="bg-slate-900 border border-slate-800 hover:border-purple-600/60 rounded-3xl p-6 transition space-y-3 shadow-lg group"
        >
          <div className="w-10 h-10 rounded-2xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
          <h3 className="font-extrabold text-base text-white group-hover:text-purple-300">Mis Puntos</h3>
          <p className="text-xs text-slate-400">Trazabilidad de bonos, premios y apuestas</p>
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
    </div>
  );
};
