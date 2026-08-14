import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

export const Leaderboard: React.FC = () => {
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);

  const { data: tournaments } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => apiClient.get('/tournaments').then((res) => res.data.data),
  });

  // default to first tournament when available
  React.useEffect(() => {
    if (!selectedTournament && tournaments && tournaments.length > 0) {
      setSelectedTournament(tournaments[0].id);
    }
  }, [tournaments]);

  const { data: rankingData, isLoading } = useQuery({
    queryKey: ['leaderboard', selectedTournament],
    enabled: !!selectedTournament,
    queryFn: () => apiClient.get(`/ranking?tournamentId=${selectedTournament}`).then((res) => res.data),
  });

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Leaderboard — Torneo</h1>
          <p className="text-xs text-slate-400">Tabla de posiciones del torneo seleccionado</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl">
          <label className="text-xs text-slate-400 font-bold mr-2">Torneo:</label>
          <select
            value={selectedTournament ?? ''}
            onChange={(e) => setSelectedTournament(e.target.value)}
            className="bg-slate-950 text-sm text-white rounded-xl px-3 py-1 border border-slate-800"
          >
            {tournaments?.map((t: any) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
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
                      <span className="font-bold text-slate-500">#{item.rank}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 font-black text-purple-400 flex items-center justify-center text-sm">
                          {item.user.displayName?.[0] ?? '?'}
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
