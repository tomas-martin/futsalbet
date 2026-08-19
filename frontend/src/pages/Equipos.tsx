import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Link } from 'react-router-dom';
import { Shield, ChevronRight, MapPin } from 'lucide-react';

export const Equipos: React.FC = () => {
  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams-list'],
    queryFn: () => apiClient.get('/teams').then((res) => res.data.data),
  });

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-purple-400" /> Equipos de Futsal
        </h1>
        <p className="text-xs text-slate-400">Clubes de Primera FSP Mendoza</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 font-bold text-sm">Cargando equipos...</div>
      ) : !teams || teams.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 font-bold">
          No hay equipos registrados.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {teams.map((team: any) => (
            <Link
              key={team.id}
              to={`/equipos/${team.id}`}
              className="bg-slate-900 border border-slate-800 hover:border-purple-600/60 rounded-3xl p-3.5 sm:p-5 text-center space-y-2.5 sm:space-y-3 transition hover:-translate-y-1 shadow-lg group flex flex-col items-center justify-between"
            >
              <img src={team.logoUrl} alt="" className="w-12 h-12 sm:w-16 sm:h-16 object-contain mx-auto group-hover:scale-110 transition duration-200 shrink-0" />
              <div className="w-full min-w-0">
                <h3 className="font-extrabold text-xs sm:text-sm text-white group-hover:text-purple-300 transition truncate">{team.name}</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 flex items-center justify-center gap-1 mt-0.5 truncate">
                  <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{team.city || 'Mendoza'}</span>
                </p>
              </div>
              <span className="inline-flex items-center text-[11px] sm:text-xs font-bold text-purple-400 gap-1 group-hover:underline">
                Ver perfil <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
