import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Link } from 'react-router-dom';
import { Trophy, ChevronRight, MapPin, Users } from 'lucide-react';

export const Torneos: React.FC = () => {
  const { data: tournaments, isLoading } = useQuery({
    queryKey: ['tournaments-list'],
    queryFn: () => apiClient.get('/tournaments').then((res) => res.data.data),
  });

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" /> Torneos de Futsal
        </h1>
        <p className="text-xs text-slate-400">Torneos de futsal en Mendoza, Argentina</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 font-bold text-sm">Cargando torneos...</div>
      ) : !tournaments || tournaments.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 font-bold">
          No hay torneos registrados.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {tournaments.map((t: any) => (
            <div key={t.id} className="bg-slate-900 border border-slate-800 hover:border-purple-800/60 rounded-3xl p-6 transition space-y-4 shadow-xl">
              <div className="flex items-center gap-4">
                <img src={t.logoUrl} alt="" className="w-14 h-14 object-contain bg-slate-950 p-2 rounded-2xl border border-slate-800" />
                <div>
                  <h3 className="font-extrabold text-base text-white">{t.name}</h3>
                  <p className="text-xs text-purple-400 font-semibold">{t.organizer} • Temporada {t.season}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {t.region}, {t.country}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{t.description}</p>

              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1 font-semibold">
                    <Users className="w-3.5 h-3.5 text-purple-400" /> {t._count?.standings || 12} Equipos
                  </span>
                </div>
                <Link
                  to={`/torneos/${t.id}`}
                  className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                >
                  <span>Ver Posiciones y Fixture</span> <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
