import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Star, Shield, Calendar, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Favoritos: React.FC = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['my-favorites'],
    queryFn: () => apiClient.get('/favorites').then((res) => res.data),
  });

  const handleRemove = async (teamId: string) => {
    try {
      await apiClient.delete(`/favorites/teams/${teamId}`);
      refetch();
    } catch {
      alert('Error al eliminar favorito');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" /> Mis Favoritos
        </h1>
        <p className="text-xs text-slate-400">Equipos y torneos que sigues</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 font-bold text-sm">Cargando favoritos...</div>
      ) : !data?.teams || data.teams.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 font-bold">
          No has guardado equipos favoritos aún. Ve al perfil de un equipo y presiona "Marcar Favorito".
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.teams.map((t: any) => (
              <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 text-center space-y-3 relative group">
                <button
                  onClick={() => handleRemove(t.id)}
                  className="absolute top-3 right-3 text-slate-500 hover:text-rose-400 transition"
                  title="Eliminar de favoritos"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <img src={t.logoUrl} alt="" className="w-14 h-14 object-contain mx-auto" />
                <h3 className="font-extrabold text-sm text-white">{t.name}</h3>
                <Link
                  to={`/equipos/${t.id}`}
                  className="block text-xs font-bold text-purple-400 hover:underline"
                >
                  Ver Perfil
                </Link>
              </div>
            ))}
          </div>

          {/* UPCOMING MATCHES OF FAVORITES */}
          {data.upcomingMatches && data.upcomingMatches.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" /> Próximos Partidos de tus Favoritos
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {data.upcomingMatches.map((m: any) => (
                  <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <img src={m.homeTeam.logoUrl} alt="" className="w-6 h-6 object-contain" />
                      <span className="font-bold text-white">{m.homeTeam.name}</span>
                    </div>
                    <span className="font-black text-slate-500">VS</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{m.awayTeam.name}</span>
                      <img src={m.awayTeam.logoUrl} alt="" className="w-6 h-6 object-contain" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
