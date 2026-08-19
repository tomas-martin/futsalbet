import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Trophy, Calendar, Table, ArrowLeft } from 'lucide-react';

export const TorneoDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [subTab, setSubTab] = useState<'standings' | 'matches'>('standings');

  const { data: tournament } = useQuery({
    queryKey: ['tournament-detail', id],
    queryFn: () => apiClient.get(`/tournaments/${id}`).then((res) => res.data),
  });

  const { data: standings } = useQuery({
    queryKey: ['tournament-standings', id],
    queryFn: () => apiClient.get(`/tournaments/${id}/standings`).then((res) => res.data.data),
    refetchInterval: 30000,
  });

  const { data: matches } = useQuery({
    queryKey: ['tournament-matches', id],
    queryFn: () => apiClient.get(`/tournaments/${id}/matches`).then((res) => res.data.data),
    refetchInterval: 30000,
  });

  if (!tournament) {
    return <div className="py-12 text-center text-slate-500 font-bold">Cargando torneo...</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <Link to="/torneos" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> Volver a torneos
      </Link>

      {/* HEADER CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex items-center gap-6 shadow-2xl">
        <img src={tournament.logoUrl} alt="" className="w-20 h-20 object-contain bg-slate-950 p-3 rounded-2xl border border-slate-800" />
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">{tournament.name}</h1>
          <p className="text-sm font-bold text-purple-400 mt-1">{tournament.organizer} • Temporada {tournament.season}</p>
          <p className="text-xs text-slate-400 mt-1">{tournament.description}</p>
        </div>
      </div>

      {/* SUB TABS */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setSubTab('standings')}
          className={`py-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition ${
            subTab === 'standings' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Table className="w-4 h-4" /> Tabla de Posiciones
        </button>
        <button
          onClick={() => setSubTab('matches')}
          className={`py-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition ${
            subTab === 'matches' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" /> Fixture y Partidos
        </button>
      </div>

      {/* STANDINGS TABLE */}
      {subTab === 'standings' && (
        <>
          {/* MOBILE CARD LIST */}
          <div className="space-y-3 md:hidden">
            {standings?.map((s: any, idx: number) => (
              <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black shrink-0 ${
                    idx === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    idx < 4 ? 'bg-purple-600/20 text-purple-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <Link to={`/equipos/${s.team.id}`} className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img src={s.team.logoUrl} alt="" className="w-7 h-7 object-contain shrink-0" />
                    <span className="font-bold text-white text-sm truncate">{s.team.name}</span>
                  </Link>
                  <span className="font-black text-purple-400 text-lg shrink-0">{s.points}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/70 text-center text-[11px]">
                  <div><span className="block text-slate-500 font-bold">PJ</span><span className="font-black text-white">{s.played}</span></div>
                  <div><span className="block text-slate-500 font-bold">PG</span><span className="font-black text-green-400">{s.won}</span></div>
                  <div><span className="block text-slate-500 font-bold">PE</span><span className="font-black text-yellow-400">{s.drawn}</span></div>
                  <div><span className="block text-slate-500 font-bold">PP</span><span className="font-black text-rose-400">{s.lost}</span></div>
                  <div><span className="block text-slate-500 font-bold">GF</span><span className="font-black text-white">{s.goalsFor}</span></div>
                  <div><span className="block text-slate-500 font-bold">GC</span><span className="font-black text-white">{s.goalsAgainst}</span></div>
                  <div><span className="block text-slate-500 font-bold">DG</span><span className="font-black text-slate-300">{s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}</span></div>
                  <div><span className="block text-slate-500 font-bold">PTS</span><span className="font-black text-purple-400">{s.points}</span></div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-extrabold uppercase border-b border-slate-800">
                    <th className="py-3 px-4 w-12 text-center">POS</th>
                    <th className="py-3 px-4">EQUIPO</th>
                    <th className="py-3 px-3 text-center">PJ</th>
                    <th className="py-3 px-3 text-center">PG</th>
                    <th className="py-3 px-3 text-center">PE</th>
                    <th className="py-3 px-3 text-center">PP</th>
                    <th className="py-3 px-3 text-center">GF</th>
                    <th className="py-3 px-3 text-center">GC</th>
                    <th className="py-3 px-3 text-center">DG</th>
                    <th className="py-3 px-4 text-center font-black text-purple-400">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {standings?.map((s: any, idx: number) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 text-center font-bold text-slate-400">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                          idx === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                          idx < 4 ? 'bg-purple-600/20 text-purple-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link to={`/equipos/${s.team.id}`} className="flex items-center gap-3 hover:text-purple-400 transition">
                          <img src={s.team.logoUrl} alt="" className="w-7 h-7 object-contain" />
                          <span className="font-bold text-white text-sm">{s.team.name}</span>
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-300 font-bold">{s.played}</td>
                      <td className="py-3 px-3 text-center text-green-400 font-bold">{s.won}</td>
                      <td className="py-3 px-3 text-center text-yellow-400 font-bold">{s.drawn}</td>
                      <td className="py-3 px-3 text-center text-rose-400 font-bold">{s.lost}</td>
                      <td className="py-3 px-3 text-center text-slate-400">{s.goalsFor}</td>
                      <td className="py-3 px-3 text-center text-slate-400">{s.goalsAgainst}</td>
                      <td className="py-3 px-3 text-center font-bold text-slate-300">
                        {s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}
                      </td>
                      <td className="py-3 px-4 text-center font-black text-purple-400 text-sm bg-purple-950/20">
                        {s.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* FIXTURE */}
      {subTab === 'matches' && (
        <div className="grid md:grid-cols-2 gap-4">
          {matches?.map((m: any) => (
            <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                <span className="font-bold text-purple-400">{m.round || 'Fecha regular'}</span>
                <span>{new Date(m.scheduledAt).toLocaleDateString('es-AR')}</span>
              </div>
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <img src={m.homeTeam.logoUrl} alt="" className="w-8 h-8 object-contain" />
                  <span className="font-bold text-sm text-white">{m.homeTeam.name}</span>
                </div>
                {m.status === 'FINISHED' ? (
                  <span className="text-base font-black text-white bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                    {m.homeScore} - {m.awayScore}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-500">VS</span>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-white">{m.awayTeam.name}</span>
                  <img src={m.awayTeam.logoUrl} alt="" className="w-8 h-8 object-contain" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
