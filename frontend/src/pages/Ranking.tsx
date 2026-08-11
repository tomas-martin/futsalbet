import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Trophy, Medal, Star, Coins, Flame } from 'lucide-react';

export const Ranking: React.FC = () => {
  const [sortBy, setSortBy] = useState<'balance' | 'totalWon' | 'totalBet'>('balance');

  const { data: rankingData, isLoading } = useQuery({
    queryKey: ['ranking', sortBy],
    queryFn: () => apiClient.get(`/ranking?sortBy=${sortBy}`).then((res) => res.data),
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" /> Ranking Recreativo de Usuarios
          </h1>
          <p className="text-xs text-slate-400">Compite por el primer lugar de Puntos Virtuales</p>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setSortBy('balance')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              sortBy === 'balance' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-yellow-400" /> Puntos Actuales
          </button>
          <button
            onClick={() => setSortBy('totalWon')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              sortBy === 'totalWon' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" /> Ganados
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 font-bold text-sm">Cargando tabla de posiciones...</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-extrabold uppercase border-b border-slate-800">
                  <th className="py-3 px-4 w-16 text-center">POS</th>
                  <th className="py-3 px-4">USUARIO</th>
                  <th className="py-3 px-4 text-center">PRONÓSTICOS</th>
                  <th className="py-3 px-4 text-center">GANADOS</th>
                  <th className="py-3 px-4 text-right font-black text-yellow-400">PUNTOS VIRTUALES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {rankingData?.data?.map((item: any) => (
                  <tr key={item.user.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 text-center">
                      {item.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-yellow-500/20 text-yellow-400 font-black border border-yellow-500/40 text-sm">
                          🥇 1
                        </span>
                      ) : item.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-300/20 text-slate-300 font-black border border-slate-300/40 text-sm">
                          🥈 2
                        </span>
                      ) : item.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-700/20 text-amber-500 font-black border border-amber-700/40 text-sm">
                          🥉 3
                        </span>
                      ) : (
                        <span className="font-bold text-slate-500">#{item.rank}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 font-black text-purple-400 flex items-center justify-center text-sm">
                          {item.user.displayName[0]}
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm block">{item.user.displayName}</span>
                          <span className="text-[11px] text-slate-500 font-semibold">@{item.user.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-300 font-bold">{item.totalBets}</td>
                    <td className="py-3.5 px-4 text-center text-green-400 font-bold">{item.wonBets}</td>
                    <td className="py-3.5 px-4 text-right font-black text-yellow-400 text-sm bg-yellow-500/5">
                      {Number(item.balance).toLocaleString('es-AR')} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
