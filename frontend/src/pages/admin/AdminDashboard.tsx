import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Users, Calendar, Ticket, Target, Shield, Activity } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => apiClient.get('/admin/stats').then((res) => res.data),
  });

  if (isLoading) {
    return <div className="py-12 text-center text-slate-500 font-bold">Cargando métricas...</div>;
  }

  return (
    <div className="space-y-6">
      {/* METRICS CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Usuarios Totales</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-white">{stats?.users?.total || 0}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Pronósticos Totales</span>
            <Ticket className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-black text-white">{stats?.prode?.total || 0}</p>
          <div className="flex gap-2 text-[10px] font-bold">
            <span className="text-yellow-400">{stats?.prode?.pending} pend.</span>
            <span className="text-green-400">{stats?.prode?.won} acert.</span>
            <span className="text-purple-400">{stats?.prode?.exact} exact.</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Equipos</span>
            <Shield className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-3xl font-black text-white">{stats?.teams?.total || 0}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Partidos Próximos/Vivo</span>
            <Calendar className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-black text-white">
            {stats?.matches?.upcoming || 0} <span className="text-xs text-rose-400">({stats?.matches?.live} en vivo)</span>
          </p>
        </div>
      </div>

      {/* PRODE SUMMARY */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Activity className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase">Partidos Finalizados</span>
          </div>
          <p className="text-3xl font-black text-white">{stats?.matches?.finished || 0}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold uppercase">Torneos</span>
          </div>
          <p className="text-3xl font-black text-white">{stats?.tournaments?.total || 0}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Ticket className="w-4 h-4 text-green-400" />
            <span className="text-xs font-bold uppercase">Pronósticos Acertados</span>
          </div>
          <p className="text-3xl font-black text-green-400">{stats?.prode?.won || 0}</p>
        </div>
      </div>
    </div>
  );
};