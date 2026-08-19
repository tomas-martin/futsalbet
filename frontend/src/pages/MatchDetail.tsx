import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Calendar, MapPin, Radio, Trophy, ArrowLeft, Target } from 'lucide-react';

export const MatchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: match, isLoading } = useQuery({
    queryKey: ['match-detail', id],
    queryFn: () => apiClient.get(`/matches/${id}`).then((res) => res.data),
    refetchInterval: 10000,
  });

  if (isLoading) {
    return <div className="py-20 text-center text-slate-500 font-bold">Cargando detalles del partido...</div>;
  }

  if (!match) {
    return <div className="py-20 text-center text-slate-400 font-bold">Partido no encontrado</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* BACK BUTTON */}
      <Link to="/partidos" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> Volver a partidos
      </Link>

      {/* MATCH HEADER CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-purple-400" />
            <span className="font-bold text-purple-300">{match.tournament.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {match.status === 'LIVE' ? (
              <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 px-3 py-1 rounded-full font-black text-xs animate-pulse flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" /> EN VIVO ({match.minute}')
              </span>
            ) : match.status === 'FINISHED' ? (
              <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-bold text-xs">
                FINALIZADO
              </span>
            ) : (
              <span className="bg-purple-950 text-purple-300 border border-purple-800/60 px-3 py-1 rounded-full font-bold text-xs">
                PRÓXIMO
              </span>
            )}
          </div>
        </div>

        {/* TEAMS & SCORE */}
        <div className="grid grid-cols-3 items-center text-center py-4">
          <div className="flex flex-col items-center gap-2">
            <img src={match.homeTeam.logoUrl} alt="" className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg" />
            <span className="font-black text-sm md:text-xl text-white leading-tight break-words px-1">{match.homeTeam.name}</span>
            <span className="text-xs text-slate-500 font-semibold">Local</span>
          </div>

          <div className="space-y-2">
            {match.status === 'FINISHED' || match.status === 'LIVE' ? (
              <div className="text-3xl md:text-6xl font-black text-white bg-slate-950/80 py-2 md:py-3 px-4 md:px-6 rounded-2xl border border-slate-800 inline-block shadow-inner">
                {match.homeScore} - {match.awayScore}
              </div>
            ) : (
              <div className="text-2xl font-black text-purple-400">VS</div>
            )}
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(match.scheduledAt).toLocaleDateString('es-AR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {match.venue || 'Polideportivo Mendoza'}
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <img src={match.awayTeam.logoUrl} alt="" className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg" />
            <span className="font-black text-sm md:text-xl text-white leading-tight break-words px-1">{match.awayTeam.name}</span>
            <span className="text-xs text-slate-500 font-semibold">Visitante</span>
          </div>
        </div>
      </div>

      {/* PRODE SECTION */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" /> Prode FSP
        </h2>

        {match.status === 'FINISHED' ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center text-slate-400 font-semibold text-sm">
            Partido finalizado. El prode de este encuentro ya fue puntuado.
          </div>
        ) : match.status === 'LIVE' ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center text-slate-400 font-semibold text-sm">
            El partido está en vivo. Los pronósticos ya están bloqueados.
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-3">
            <p className="text-slate-300 font-bold text-sm">
              Pronosticá este partido y sumá puntos en la tabla del prode
            </p>
            <p className="text-xs text-slate-500">
              Resultado exacto: <strong className="text-white">6 pts</strong> • Ganador o empate: <strong className="text-white">3 pts</strong>
            </p>
            <Link
              to="/prode"
              className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-purple-600/30"
            >
              Cargar Pronóstico
            </Link>
          </div>
        )}
      </div>

      {/* MATCH EVENTS (IF ANY) */}
      {match.events && match.events.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <h3 className="font-black text-lg text-white">Eventos del Partido</h3>
          <div className="space-y-2">
            {match.events.map((e: any) => (
              <div key={e.id} className="flex items-center gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="font-black text-purple-400 bg-purple-950 px-2 py-1 rounded-lg">{e.minute}'</span>
                <span className="font-bold text-white uppercase">{e.type}:</span>
                <span className="text-slate-300">{e.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
