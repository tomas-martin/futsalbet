import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Award, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Resultados: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['results-page'],
    queryFn: () => apiClient.get('/matches/results?limit=30').then((res) => res.data),
  });

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Award className="w-6 h-6 text-green-400" /> Resultados Anteriores
        </h1>
        <p className="text-xs text-slate-400">Histórico de marcadores de partidos de futsal mendocino</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 font-bold text-sm">Cargando resultados...</div>
      ) : !data?.data || data.data.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 font-bold">
          No hay resultados cargados aún.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {data.data.map((m: any) => (
            <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                <span className="font-bold text-purple-400 truncate">{m.tournament.name}</span>
                <span>
                  {new Date(m.scheduledAt).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3 flex-1">
                  <img src={m.homeTeam.logoUrl} alt="" className="w-8 h-8 object-contain" />
                  <span className="font-extrabold text-sm text-white">{m.homeTeam.name}</span>
                </div>

                <div className="text-lg font-black text-white bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                  {m.homeScore} - {m.awayScore}
                </div>

                <div className="flex items-center justify-end gap-3 flex-1 text-right">
                  <span className="font-extrabold text-sm text-white">{m.awayTeam.name}</span>
                  <img src={m.awayTeam.logoUrl} alt="" className="w-8 h-8 object-contain" />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 text-right">
                <Link to={`/partidos/${m.id}`} className="text-xs font-bold text-purple-400 hover:underline inline-flex items-center gap-1">
                  Ver resumen <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
