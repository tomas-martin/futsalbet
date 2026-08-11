import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Link } from 'react-router-dom';
import { Radio, ChevronRight, Activity } from 'lucide-react';

export const EnVivo: React.FC = () => {
  const { data: matches, isLoading } = useQuery({
    queryKey: ['live-matches-page'],
    queryFn: () => apiClient.get('/matches/live').then((res) => res.data.data),
    refetchInterval: 5000,
  });

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Radio className="w-6 h-6 text-rose-500 animate-pulse" /> Partidos En Vivo
        </h1>
        <p className="text-xs text-slate-400">Sigue los marcadores y minutos de los partidos en juego</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 font-bold text-sm animate-pulse">
          Cargando partidos en vivo...
        </div>
      ) : !matches || matches.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <Activity className="w-12 h-12 text-slate-600 mx-auto stroke-1" />
          <p className="font-bold text-slate-300 text-base">No hay partidos en vivo en este momento</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Revisa la sección de próximos partidos para ver cuándo son los siguientes encuentros de FEFUSA Mendoza.
          </p>
          <Link
            to="/partidos"
            className="inline-block mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition"
          >
            Ver Próximos Partidos
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {matches.map((m: any) => (
            <div key={m.id} className="bg-slate-900 border border-rose-500/30 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
                <span className="font-bold text-purple-400">{m.tournament.name}</span>
                <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 px-3 py-1 rounded-full font-black text-xs animate-pulse">
                  MINUTO {m.minute}'
                </span>
              </div>

              <div className="grid grid-cols-3 items-center text-center py-3">
                <div className="flex flex-col items-center gap-2">
                  <img src={m.homeTeam.logoUrl} alt="" className="w-12 h-12 object-contain" />
                  <span className="font-extrabold text-sm text-white">{m.homeTeam.name}</span>
                </div>

                <div className="text-3xl font-black text-white bg-slate-950 py-2 px-4 rounded-2xl border border-slate-800">
                  {m.homeScore} - {m.awayScore}
                </div>

                <div className="flex flex-col items-center gap-2">
                  <img src={m.awayTeam.logoUrl} alt="" className="w-12 h-12 object-contain" />
                  <span className="font-extrabold text-sm text-white">{m.awayTeam.name}</span>
                </div>
              </div>

              <Link
                to={`/partidos/${m.id}`}
                className="w-full block text-center py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs rounded-xl transition border border-rose-500/30 flex items-center justify-center gap-1"
              >
                Seguir estadísticas completas <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
