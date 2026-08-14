import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminPartidos: React.FC = () => {
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);

  const [showCreate, setShowCreate] = useState(false);
  const [editingMatch, setEditingMatch] = useState<any | null>(null);

  const queryClient = useQueryClient();

  const { data: matchesData, refetch, isLoading } = useQuery({
    queryKey: ['admin-matches'],
    queryFn: () => apiClient.get('/matches?limit=50').then((res) => res.data),
  });

  const { data: tournaments } = useQuery({
    queryKey: ['admin-tournaments'],
    queryFn: () => apiClient.get('/tournaments').then((res) => res.data.data),
  });

  const { data: teams } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: () => apiClient.get('/teams').then((res) => res.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post('/matches', payload),
    onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['admin-matches'] });
      setShowCreate(false);
      alert('Partido creado correctamente');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Error al crear partido'),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => apiClient.put(`/matches/${payload.id}`, payload.data),
    onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['admin-matches'] });
      setEditingMatch(null);
      alert('Partido actualizado correctamente');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Error al actualizar partido'),
  });

  const handleSettleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;

    try {
      await apiClient.post(`/matches/${selectedMatch.id}/settle`, {
        homeScore,
        awayScore,
      });

      alert('Partido finalizado y apuestas resueltas automáticamente');
      setSelectedMatch(null);
      queryClient.invalidateQueries({ queryKey: ['admin-matches'] });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al resolver el partido');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" /> Administración de Partidos y Resultados
          </h2>
          <p className="text-xs text-slate-400">Ingresa resultados para disparar la resolución automática de apuestas</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm"
          >
            Crear Partido
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 font-bold text-sm">Cargando partidos...</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-extrabold uppercase border-b border-slate-800">
                  <th className="py-3 px-4">PARTIDO</th>
                  <th className="py-3 px-4">TORNEO</th>
                  <th className="py-3 px-4">FECHA</th>
                  <th className="py-3 px-4">ESTADO</th>
                  <th className="py-3 px-4 text-center">MARCADOR</th>
                  <th className="py-3 px-4 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {matchesData?.data?.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-white">
                      {m.homeTeam?.name} vs {m.awayTeam?.name}
                    </td>
                    <td className="py-3.5 px-4 text-purple-400 font-semibold">{m.tournament?.name}</td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(m.scheduledAt).toLocaleDateString('es-AR')}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        m.status === 'FINISHED' ? 'bg-slate-800 text-slate-300' :
                        m.status === 'LIVE' ? 'bg-rose-500/20 text-rose-400' : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-sm text-white">
                      {m.status === 'FINISHED' || m.status === 'LIVE' ? `${m.homeScore} - ${m.awayScore}` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center space-x-2">
                      {m.status !== 'FINISHED' && (
                        <button
                          onClick={() => {
                            setSelectedMatch(m);
                            setHomeScore(m.homeScore || 0);
                            setAwayScore(m.awayScore || 0);
                          }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition"
                        >
                          Cargar Resultado
                        </button>
                      )}

                      <button
                        onClick={() => setEditingMatch(m)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-xs transition"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => { window.location.href = '/admin/predictions?match=' + m.id; }}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition"
                      >
                        Ver Predicciones
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SETTLE MATCH MODAL */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-black text-lg text-white">Finalizar Partido</h3>
            <p className="text-xs text-slate-400 font-bold">
              {selectedMatch.homeTeam?.name} vs {selectedMatch.awayTeam?.name}
            </p>

            <form onSubmit={handleSettleMatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{selectedMatch.homeTeam?.name}</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={homeScore}
                    onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center text-lg font-black text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{selectedMatch.awayTeam?.name}</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={awayScore}
                    onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center text-lg font-black text-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-950/40 border border-purple-800/40 rounded-xl text-[11px] text-purple-300">
                Al confirmar, el estado cambiará a <strong>FINISHED</strong> y se liquidarán todas las apuestas asociadas.
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMatch(null)}
                  className="w-1/2 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase"
                >
                  Resolver Partido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MATCH MODAL */}
      {showCreate && (
        <CreateOrEditMatchModal
          tournaments={tournaments ?? []}
          teams={teams ?? []}
          onClose={() => setShowCreate(false)}
          onSave={(payload) => createMutation.mutate(payload)}
        />
      )}

      {/* EDIT MATCH MODAL */}
      {editingMatch && (
        <CreateOrEditMatchModal
          tournaments={tournaments ?? []}
          teams={teams ?? []}
          initial={editingMatch}
          onClose={() => setEditingMatch(null)}
          onSave={(payload) => updateMutation.mutate({ id: editingMatch.id, data: payload })}
        />
      )}
    </div>
  );
};



// Reusable modal component for create/edit
const CreateOrEditMatchModal: React.FC<{
  tournaments: any[];
  teams: any[];
  initial?: any;
  onClose: () => void;
  onSave: (payload: any) => void;
}> = ({ tournaments, teams, initial, onClose, onSave }) => {
  const [tournamentId, setTournamentId] = useState(initial?.tournamentId ?? (tournaments[0]?.id ?? ''));
  const [homeTeamId, setHomeTeamId] = useState(initial?.homeTeamId ?? (teams[0]?.id ?? ''));
  const [awayTeamId, setAwayTeamId] = useState(initial?.awayTeamId ?? (teams[1]?.id ?? ''));
  const [scheduledAt, setScheduledAt] = useState(() => {
    if (initial?.scheduledAt) return new Date(initial.scheduledAt).toISOString().slice(0, 16);
    return new Date().toISOString().slice(0, 16);
  });
  const [venue, setVenue] = useState(initial?.venue ?? '');
  const [round, setRound] = useState(initial?.round ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (homeTeamId === awayTeamId) return alert('El equipo local y visitante no pueden ser el mismo');

    const payload: any = {
      tournamentId,
      homeTeamId,
      awayTeamId,
      scheduledAt: new Date(scheduledAt).toISOString(),
      venue,
      round,
    };

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
        <h3 className="font-black text-lg text-white">{initial ? 'Editar Partido' : 'Crear Partido'}</h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 font-bold mb-1">Torneo</label>
            <select value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} className="w-full bg-slate-950 text-white rounded-xl px-3 py-2 border border-slate-800">
              {tournaments.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 font-bold mb-1">Local</label>
              <select value={homeTeamId} onChange={(e) => setHomeTeamId(e.target.value)} className="w-full bg-slate-950 text-white rounded-xl px-3 py-2 border border-slate-800">
                {teams.map((team: any) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-bold mb-1">Visitante</label>
              <select value={awayTeamId} onChange={(e) => setAwayTeamId(e.target.value)} className="w-full bg-slate-950 text-white rounded-xl px-3 py-2 border border-slate-800">
                {teams.map((team: any) => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-bold mb-1">Fecha y hora</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full bg-slate-950 text-white rounded-xl px-3 py-2 border border-slate-800" />
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-bold mb-1">Sede (opcional)</label>
            <input value={venue} onChange={(e) => setVenue(e.target.value)} className="w-full bg-slate-950 text-white rounded-xl px-3 py-2 border border-slate-800" />
          </div>

          <div>
            <label className="block text-xs text-slate-400 font-bold mb-1">Ronda (opcional)</label>
            <input value={round} onChange={(e) => setRound(e.target.value)} className="w-full bg-slate-950 text-white rounded-xl px-3 py-2 border border-slate-800" />
          </div>

          <div className="flex gap-2 mt-2">
            <button type="button" onClick={onClose} className="w-1/2 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs">Cancelar</button>
            <button type="submit" className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs">{initial ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
