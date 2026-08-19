import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Link } from 'react-router-dom';
import { Calendar, Radio, Award, Trophy, ChevronRight, Sparkles, Flame, Star, ArrowUpRight } from 'lucide-react';

export const Home: React.FC = () => {
  const { data: upcomingData } = useQuery({
    queryKey: ['matches-upcoming'],
    queryFn: () => apiClient.get('/matches/upcoming').then((res) => res.data.data),
    refetchInterval: 30000,
  });

  const { data: liveData } = useQuery({
    queryKey: ['matches-live'],
    queryFn: () => apiClient.get('/matches/live').then((res) => res.data.data),
    refetchInterval: 5000,
  });

  const { data: resultsData } = useQuery({
    queryKey: ['matches-results-home'],
    queryFn: () => apiClient.get('/matches/results?limit=4').then((res) => res.data.data),
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6 pb-12">
      {/* HERO BANNER */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 md:p-8 border border-purple-800/40 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Futsal de Mendoza, Argentina
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Prode de Futsal <br />
            <span className="bg-gradient-to-r from-yellow-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
              100% Recreativo
            </span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Demostrá tus conocimientos del futsal mendocino (FEFUSA). Acertá resultados exactos
            <strong className="text-yellow-400"> (6 pts)</strong> o ganador/empate
            <strong className="text-yellow-400"> (3 pts)</strong> y subí en la tabla del prode.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/prode"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-purple-600/30 flex items-center gap-2"
            >
              Jugar al Prode <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/leaderboard"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 transition"
            >
              Ver Tabla del Prode
            </Link>
          </div>
        </div>
      </section>

      {/* PARTIDOS EN VIVO (Si hay) */}
      {liveData && liveData.length > 0 && (
        <section className="bg-slate-900/80 border border-rose-500/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Partidos En Vivo <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
              </h2>
            </div>
            <Link to="/en-vivo" className="text-xs font-bold text-rose-400 hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {liveData.map((m: any) => (
              <div key={m.id} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-b border-slate-800 pb-2">
                  <span className="text-purple-400">{m.tournament.name}</span>
                  <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded-full font-black text-[10px]">
                    MINUTO {m.minute}'
                  </span>
                </div>
                <div className="grid grid-cols-3 items-center text-center py-2">
                  <div className="flex flex-col items-center gap-1">
                    <img src={m.homeTeam.logoUrl} alt="" className="w-10 h-10 object-contain" />
                    <span className="font-bold text-xs text-white">{m.homeTeam.name}</span>
                  </div>
                  <div className="text-2xl font-black text-white bg-slate-900 py-1.5 px-3 rounded-xl border border-slate-800">
                    {m.homeScore} - {m.awayScore}
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <img src={m.awayTeam.logoUrl} alt="" className="w-10 h-10 object-contain" />
                    <span className="font-bold text-xs text-white">{m.awayTeam.name}</span>
                  </div>
                </div>
                <Link
                  to={`/partidos/${m.id}`}
                  className="w-full block text-center py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs rounded-xl transition border border-rose-500/30"
                >
                  Seguir minuto a minuto
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PRÓXIMOS PARTIDOS DESTACADOS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-black text-white">Próximos Partidos</h2>
          </div>
          <Link to="/partidos" className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1">
            Ver todos <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {upcomingData?.slice(0, 4).map((match: any) => (
            <div
              key={match.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-purple-800/60 rounded-2xl p-4 transition space-y-3"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/80 pb-2">
                <span className="font-semibold text-purple-400 truncate max-w-[200px]">
                  {match.tournament.name}
                </span>
                <span className="text-slate-400 font-medium">
                  {new Date(match.scheduledAt).toLocaleDateString('es-AR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between px-2 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <img src={match.homeTeam.logoUrl} alt="" className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0" />
                  <span className="font-bold text-xs sm:text-sm text-white truncate min-w-0 flex-1">{match.homeTeam.name}</span>
                </div>
                <span className="text-xs font-extrabold text-slate-500 px-1 sm:px-3 shrink-0">VS</span>
                <div className="flex items-center justify-end gap-2 sm:gap-3 flex-1 text-right min-w-0">
                  <span className="font-bold text-xs sm:text-sm text-white truncate min-w-0 flex-1">{match.awayTeam.name}</span>
                  <img src={match.awayTeam.logoUrl} alt="" className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0" />
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-xs border-t border-slate-800/60">
                <span className="text-slate-500 truncate max-w-[140px]">{match.venue || 'Mendoza'}</span>
                <Link
                  to={`/partidos/${match.id}`}
                  className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 shrink-0"
                >
                  Detalles <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ÚLTIMOS RESULTADOS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-black text-white">Últimos Resultados</h2>
          </div>
          <Link to="/resultados" className="text-xs font-bold text-purple-400 hover:underline flex items-center gap-1">
            Ver más <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {resultsData?.map((m: any) => (
            <div key={m.id} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center space-y-2">
              <p className="text-[10px] text-slate-500 font-semibold truncate">{m.tournament.name}</p>
              <div className="flex items-center justify-between py-1 px-1 gap-1">
                <div className="flex flex-col items-center min-w-0 flex-1">
                  <img src={m.homeTeam.logoUrl} alt="" className="w-7 h-7 object-contain shrink-0" />
                  <span className="text-[11px] font-bold text-slate-200 mt-1 truncate w-full">{m.homeTeam.shortName || m.homeTeam.name}</span>
                </div>
                <span className="text-base sm:text-lg font-black text-white bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 shrink-0">
                  {m.homeScore} - {m.awayScore}
                </span>
                <div className="flex flex-col items-center min-w-0 flex-1">
                  <img src={m.awayTeam.logoUrl} alt="" className="w-7 h-7 object-contain shrink-0" />
                  <span className="text-[11px] font-bold text-slate-200 mt-1 truncate w-full">{m.awayTeam.shortName || m.awayTeam.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
