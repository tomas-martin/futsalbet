import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Shield, MapPin, Calendar, ArrowLeft, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const EquipoDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();

  const { data: team, isLoading } = useQuery({
    queryKey: ['team-detail', id],
    queryFn: () => apiClient.get(`/teams/${id}`).then((res) => res.data),
  });

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated || !team) return;
    try {
      await apiClient.post('/favorites/teams', { teamId: team.id });
      alert('Equipo agregado a favoritos');
    } catch {
      alert('Error al guardar favorito');
    }
  };

  if (isLoading) {
    return <div className="py-12 text-center text-slate-500 font-bold">Cargando equipo...</div>;
  }

  if (!team) {
    return <div className="py-12 text-center text-slate-400 font-bold">Equipo no encontrado</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <Link to="/equipos" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> Volver a equipos
      </Link>

      {/* HEADER CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-6">
          <img src={team.logoUrl} alt="" className="w-20 h-20 object-contain bg-slate-950 p-3 rounded-2xl border border-slate-800" />
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">{team.name}</h1>
            <p className="text-sm font-bold text-purple-400 mt-0.5">{team.shortName} • Futsal Mendoza</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {team.city}, {team.region}
            </p>
          </div>
        </div>

        {isAuthenticated && (
          <button
            onClick={handleFavoriteToggle}
            className="px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-xl text-xs font-bold transition flex items-center gap-2"
          >
            <Star className="w-4 h-4 fill-yellow-400" /> Marcar Favorito
          </button>
        )}
      </div>

      {/* RECENT MATCHES */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" /> Partidos Recientes y Próximos
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {team.matches?.map((m: any) => (
            <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                <span className="font-bold text-purple-400">{m.tournament?.name}</span>
                <span>{new Date(m.scheduledAt).toLocaleDateString('es-AR')}</span>
              </div>
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <img src={m.homeTeam.logoUrl} alt="" className="w-7 h-7 object-contain" />
                  <span className="font-bold text-xs text-white">{m.homeTeam.name}</span>
                </div>
                {m.status === 'FINISHED' ? (
                  <span className="text-base font-black text-white bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                    {m.homeScore} - {m.awayScore}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-500">VS</span>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">{m.awayTeam.name}</span>
                  <img src={m.awayTeam.logoUrl} alt="" className="w-7 h-7 object-contain" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
