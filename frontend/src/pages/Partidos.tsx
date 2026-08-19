import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Link } from 'react-router-dom';
import { Calendar, Radio, Award, ArrowUpRight } from 'lucide-react';

export const Partidos: React.FC = () => {
  const [tab, setTab] = useState<'upcoming' | 'live' | 'results'>('upcoming');

  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches-list', tab],
    queryFn: () => {
      if (tab === 'live') return apiClient.get('/matches/live').then((res) => res.data.data);
      if (tab === 'results') return apiClient.get('/matches/results').then((res) => res.data.data);
      return apiClient.get('/matches/upcoming').then((res) => res.data.data);
    },
    refetchInterval: tab === 'live' ? 5000 : 30000,
  });

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER & TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-400" /> Partidos de Futsal
          </h1>
          <p className="text-xs text-slate-400">Consulta los próximos encuentros, resultados y en vivo</p>
        </div>

        <div className="grid grid-cols-3 w-full sm:w-auto bg-slate-900 border border-slate-800 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setTab('upcoming')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              tab === 'upcoming' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> <span>Próximos</span>
          </button>
          <button
            onClick={() => setTab('live')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              tab === 'live' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" /> <span>En Vivo</span>
          </button>
          <button
            onClick={() => setTab('results')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              tab === 'results' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> <span>Resultados</span>
          </button>
        </div>
      </div>

      {/* MATCHES LIST */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-500 font-bold text-sm animate-pulse">
          Cargando partidos...
        </div>
      ) : !matches || matches.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-2">
          <p className="font-bold text-slate-300">No hay partidos en esta categoría</p>
          <p className="text-xs text-slate-500">Prueba cambiando de pestaña o vuelve más tarde.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {matches.map((match: any) => (
            <div
              key={match.id}
              className="bg-slate-900 border border-slate-800 hover:border-purple-800/60 rounded-3xl p-4 sm:p-5 transition space-y-4 shadow-lg"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
                <span className="font-bold text-purple-400 truncate max-w-[180px] sm:max-w-[220px]">
                  {match.tournament?.name}
                </span>
                {tab === 'live' ? (
                  <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded-full font-black text-[10px]">
                    MINUTO {match.minute}'
                  </span>
                ) : (
                  <span className="text-slate-400 font-medium shrink-0">
                    {new Date(match.scheduledAt).toLocaleDateString('es-AR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between px-1 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <img src={match.homeTeam.logoUrl} alt="" className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="font-extrabold text-xs sm:text-sm text-white block truncate">{match.homeTeam.name}</span>
                    <span className="text-[10px] text-slate-500 font-semibold block">Local</span>
                  </div>
                </div>

                {tab === 'results' || tab === 'live' ? (
                  <div className="text-base sm:text-xl font-black text-white bg-slate-950 px-2.5 sm:px-3 py-1 rounded-xl border border-slate-800 shrink-0">
                    {match.homeScore} - {match.awayScore}
                  </div>
                ) : (
                  <span className="text-xs font-black text-slate-600 px-2 shrink-0">VS</span>
                )}

                <div className="flex items-center justify-end gap-2 sm:gap-3 flex-1 text-right min-w-0">
                  <div className="min-w-0 flex-1">
                    <span className="font-extrabold text-xs sm:text-sm text-white block truncate">{match.awayTeam.name}</span>
                    <span className="text-[10px] text-slate-500 font-semibold block">Visitante</span>
                  </div>
                  <img src={match.awayTeam.logoUrl} alt="" className="w-8 h-8 sm:w-10 sm:h-10 object-contain shrink-0" />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500 truncate max-w-[150px]">{match.venue || 'Mendoza'}</span>
                <Link
                  to={`/partidos/${match.id}`}
                  className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 shrink-0"
                >
                  {tab === 'upcoming' ? 'Pronosticar' : 'Detalles'} <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
