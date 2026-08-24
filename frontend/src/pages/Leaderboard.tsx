import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Target, Trophy, UserRound, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

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
    queryFn: () => apiClient.get(`/ranking/prode?tournamentId=${selectedTournament}`).then((res) => res.data),
  });

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-400" /> Leaderboard — Prode FSP
          </h1>
          <p className="text-xs text-slate-400">Ranking por aciertos de pronósticos del torneo seleccionado</p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Link
            to="/grupos"
            className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl flex items-center gap-1.5 transition shadow-lg shrink-0"
          >
            <Users className="w-4 h-4" /> Grupos Privados
          </Link>

          <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex items-center justify-between sm:justify-start gap-2 flex-1 sm:flex-initial">
            <label className="text-xs text-slate-400 font-bold shrink-0">Torneo:</label>
            <select
              value={selectedTournament ?? ''}
              onChange={(e) => setSelectedTournament(e.target.value)}
              className="bg-slate-950 text-xs sm:text-sm text-white rounded-xl px-3 py-1.5 border border-slate-800 focus:outline-none focus:border-purple-500 w-full sm:w-auto truncate"
            >
              {tournaments?.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SCORING RULES */}
      <div className="bg-purple-950/40 border border-purple-800/40 rounded-2xl p-3 flex flex-wrap gap-3 text-[11px] text-purple-200">
        <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-yellow-400" /> Resultado exacto: <strong>6 pts</strong></span>
        <span className="flex items-center gap-1"><UserRound className="w-3.5 h-3.5" /> Ganador o empate correcto: <strong>3 pts</strong></span>
        <span className="text-purple-300/70">Solo cuentan los partidos ya finalizados.</span>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 font-bold text-sm">Cargando tabla de posiciones...</div>
      ) : (
        <>
          {/* MOBILE CARD LIST */}
          <div className="space-y-3 md:hidden">
            {rankingData?.data?.map((item: any) => (
              <div key={item.user.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 shrink-0 rounded-full bg-slate-800 border border-slate-700 font-black text-purple-400 flex items-center justify-center text-sm">
                  {item.user.displayName?.[0] ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm truncate">{item.user.displayName}</span>
                    {item.rank <= 3 && (
                      <span className="text-base">{item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : '🥉'}</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-semibold">@{item.user.username}</div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                    <span className="text-slate-400">Pronósticos: <strong className="text-white">{item.predictions}</strong></span>
                    <span className="text-green-400">Acertados: <strong>{item.won}</strong></span>
                    <span className="text-indigo-400">Exactos: <strong>{item.exact}</strong></span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="block text-[10px] text-slate-500 font-bold">POS</span>
                  <span className="block text-lg font-black text-yellow-400">#{item.rank}</span>
                  <span className="block text-sm font-black text-yellow-300">{Number(item.points).toLocaleString('es-AR')} pts</span>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-extrabold uppercase border-b border-slate-800">
                    <th className="py-3 px-4 w-16 text-center">POS</th>
                    <th className="py-3 px-4">USUARIO</th>
                    <th className="py-3 px-4 text-center">PRONÓSTICOS</th>
                    <th className="py-3 px-4 text-center">GANADOS</th>
                    <th className="py-3 px-4 text-center">EXACTOS</th>
                    <th className="py-3 px-4 text-right font-black text-yellow-400">PUNTOS PRODE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {rankingData?.data?.map((item: any) => (
                    <tr key={item.user.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-center">
                        {item.rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-yellow-500/20 text-yellow-400 font-black border border-yellow-500/40 text-sm">🥇 1</span>
                        ) : item.rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-300/20 text-slate-300 font-black border border-slate-300/40 text-sm">🥈 2</span>
                        ) : item.rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-700/20 text-amber-500 font-black border border-amber-700/40 text-sm">🥉 3</span>
                        ) : (
                          <span className="font-bold text-slate-500">#{item.rank}</span>
                        )}
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
                      <td className="py-3.5 px-4 text-center text-slate-300 font-bold">{item.predictions}</td>
                      <td className="py-3.5 px-4 text-center text-green-400 font-bold">{item.won}</td>
                      <td className="py-3.5 px-4 text-center text-indigo-400 font-bold">{item.exact}</td>
                      <td className="py-3.5 px-4 text-right font-black text-yellow-400 text-sm bg-yellow-500/5">
                        {Number(item.points).toLocaleString('es-AR')} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};