import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Users, Calendar, Coins, Ticket, Flame, Shield, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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
          <p className="text-3xl font-black text-white">{stats?.bets?.total || 0}</p>
          <div className="flex gap-2 text-[10px] font-bold">
            <span className="text-yellow-400">{stats?.bets?.pending} pend.</span>
            <span className="text-green-400">{stats?.bets?.won} gan.</span>
            <span className="text-rose-400">{stats?.bets?.lost} perd.</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase">Puntos en Circulación</span>
            <Coins className="w-4 h-4 text-yellow-400" />
          </div>
          <p className="text-3xl font-black text-yellow-400">
            {Number(stats?.points?.circulating || 0).toLocaleString()} <span className="text-xs font-normal">pts</span>
          </p>
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

      {/* RECHARTS CHART: BETS ACTIVITY OVER TIME */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" /> Actividad de Pronósticos (Últimos 7 días)
          </h3>
          <span className="text-xs text-slate-500 font-bold">Puntos Apostados por Día</span>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.charts?.betsByDay || []}>
              <defs>
                <linearGradient id="colorStake" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7a5af8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#7a5af8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
              />
              <Area type="monotone" dataKey="totalStake" stroke="#7a5af8" strokeWidth={3} fillOpacity={1} fill="url(#colorStake)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
