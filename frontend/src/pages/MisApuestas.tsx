import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Ticket, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

export const MisApuestas: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'WON' | 'LOST'>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['my-bets', filter],
    queryFn: () => apiClient.get(`/bets/my${filter !== 'ALL' ? `?status=${filter}` : ''}`).then((res) => res.data),
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Ticket className="w-6 h-6 text-purple-400" /> Mis Pronósticos
          </h1>
          <p className="text-xs text-slate-400">Historial completo de tus apuestas con puntos virtuales</p>
        </div>

        {/* FILTERS */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          {['ALL', 'PENDING', 'WON', 'LOST'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filter === f ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {f === 'ALL' ? 'Todas' : f === 'PENDING' ? 'Pendientes' : f === 'WON' ? 'Ganadas' : 'Perdidas'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 font-bold text-sm">Cargando pronósticos...</div>
      ) : !data?.data || data.data.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 font-bold">
          No tienes apuestas registradas en esta categoría.
        </div>
      ) : (
        <div className="space-y-4">
          {data.data.map((bet: any) => (
            <div key={bet.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
                <span className="font-bold text-slate-400">
                  {new Date(bet.createdAt).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${
                    bet.status === 'WON'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : bet.status === 'LOST'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}
                >
                  {bet.status === 'WON' ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> GANADA (+{bet.potentialPayout} pts)
                    </>
                  ) : bet.status === 'LOST' ? (
                    <>
                      <XCircle className="w-3.5 h-3.5" /> PERDIDA
                    </>
                  ) : (
                    <>
                      <Clock className="w-3.5 h-3.5" /> PENDIENTE
                    </>
                  )}
                </span>
              </div>

              {/* SELECTIONS */}
              <div className="space-y-2">
                {bet.selections?.map((sel: any) => (
                  <div key={sel.id} className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-extrabold text-white">
                        {sel.marketOption?.market?.match?.homeTeam?.name} vs {sel.marketOption?.market?.match?.awayTeam?.name}
                      </p>
                      <p className="text-[11px] text-purple-400 font-semibold mt-0.5">
                        {sel.marketOption?.market?.name} • <strong className="text-white">{sel.marketOption?.label}</strong>
                      </p>
                    </div>
                    <span className="font-black text-yellow-400 text-sm bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                      {Number(sel.odds).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* SUMMARY FOOTER */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Puntos apostados: </span>
                  <strong className="text-white font-extrabold">{bet.stakeAmount} pts</strong>
                </div>
                <div>
                  <span className="text-slate-400">Cuota Total: </span>
                  <strong className="text-yellow-400 font-extrabold">{Number(bet.totalOdds).toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Premio Potencial: </span>
                  <strong className="text-green-400 font-extrabold text-sm">{bet.potentialPayout} pts</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
