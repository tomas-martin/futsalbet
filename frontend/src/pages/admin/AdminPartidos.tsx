import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminPartidos: React.FC = () => {
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');

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
        homeScore: parseInt(homeScore || '0', 10),
        awayScore: parseInt(awayScore || '0', 10),
      });

      alert('Partido finalizado y prode puntuado automáticamente');
      setSelectedMatch(null);
      queryClient.invalidateQueries({ queryKey: ['admin-matches'] });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al resolver el partido');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" /> Administración de Partidos y Resultados
          </h2>
          <p className="text-xs text-slate-400">Ingresa resultados para puntuar el prode automáticamente</p>
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

      {/* RULES NOTICE */}
      <div className="bg-purple-950/40 border border-purple-800/40 rounded-2xl p-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-purple-200">
        <span>🔒 Los pronósticos se bloquean cuando pasa el horario de inicio del partido.</span>
        <span>🎯 Prode: resultado exacto <strong>6 pts</strong> • ganador o empate <strong>3 pts</strong>.</span>
        <span className="text-purple-300/70">Al cargar un resultado se puntúa el prode automáticamente (6 pts exacto • 3 pts ganador).</span>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 font-bold text-sm">Cargando partidos...</div>
      ) : (
        <>
          {/* MOBILE CARD LIST */}
          <div className="space-y-3 md:hidden">
            {matchesData?.data?.map((m: any) => (
              <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-white text-sm">
                  {m.homeTeam?.name} <span className="text-slate-500 font-semibold">vs</span> {m.awayTeam?.name}
                </div>
                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                  <span className="text-purple-400 font-semibold">{m.tournament?.name}</span>
                  <span className="text-slate-400">{new Date(m.scheduledAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                    m.status === 'FINISHED' ? 'bg-slate-800 text-slate-300' :
                    m.status === 'LIVE' ? 'bg-rose-500/20 text-rose-400' : 'bg-purple-500/20 text-purple-400'
                  }`}>
                    {m.status}
                  </span>
                  <span className="font-black text-white text-sm ml-auto">
                    {m.status === 'FINISHED' || m.status === 'LIVE' ? `${m.homeScore} - ${m.awayScore}` : '-'}
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setSelectedMatch(m);
                      setHomeScore(m.homeScore !== undefined && m.homeScore !== null ? String(m.homeScore) : '');
                      setAwayScore(m.awayScore !== undefined && m.awayScore !== null ? String(m.awayScore) : '');
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition"
                  >
                    {m.status === 'FINISHED' ? 'Modificar Resultado' : 'Cargar Resultado'}
                  </button>
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
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP TABLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl hidden md:block">
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
                      <td className="py-3.5 px-4 text-slate-400">{new Date(m.scheduledAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}</td>
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
                        <button
                          onClick={() => {
                            setSelectedMatch(m);
                            setHomeScore(m.homeScore ?? 0);
                            setAwayScore(m.awayScore ?? 0);
                          }}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs transition"
                        >
                          {m.status === 'FINISHED' ? 'Modificar Resultado' : 'Cargar Resultado'}
                        </button>

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
        </>
      )}

      {/* SETTLE MATCH MODAL */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="font-black text-lg text-white">
              {selectedMatch.status === 'FINISHED' ? 'Modificar Resultado' : 'Finalizar Partido'}
            </h3>
            <p className="text-xs text-slate-400 font-bold">
              {selectedMatch.homeTeam?.name} vs {selectedMatch.awayTeam?.name}
            </p>

            <form onSubmit={handleSettleMatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 truncate">{selectedMatch.homeTeam?.name}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    placeholder="-"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center text-lg font-black text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 truncate">{selectedMatch.awayTeam?.name}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    placeholder="-"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center text-lg font-black text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-950/40 border border-purple-800/40 rounded-xl text-[11px] text-purple-300">
                Al confirmar, el estado cambiará a <strong>FINISHED</strong> y el prode se volverá a puntuar con el nuevo marcador.
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
  const [status, setStatus] = useState(initial?.status ?? 'SCHEDULED');
  const [homeScore, setHomeScore] = useState<string>(initial?.homeScore !== undefined && initial?.homeScore !== null ? String(initial.homeScore) : '');
  const [awayScore, setAwayScore] = useState<string>(initial?.awayScore !== undefined && initial?.awayScore !== null ? String(initial.awayScore) : '');

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

    if (initial) {
      payload.status = status;
      if (status === 'FINISHED') {
        payload.homeScore = parseInt(homeScore || '0', 10);
        payload.awayScore = parseInt(awayScore || '0', 10);
      }
    }

    onSave(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
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

          {initial && (
            <>
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1">Estado</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-slate-950 text-white rounded-xl px-3 py-2 border border-slate-800">
                  {['SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED', 'POSTPONED'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {status === 'FINISHED' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 font-bold mb-1">Goles Local</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      placeholder="-"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      className="w-full bg-slate-950 text-white rounded-xl px-3 py-2 border border-slate-800 text-center font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 font-bold mb-1">Goles Visitante</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      placeholder="-"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      className="w-full bg-slate-950 text-white rounded-xl px-3 py-2 border border-slate-800 text-center font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              <div className="p-2 bg-purple-950/40 border border-purple-800/40 rounded-xl text-[10px] text-purple-300">
                Si cambias el marcador de un partido FINISHED, el prode se vuelve a puntuar automáticamente.
              </div>
            </>
          )}

          <div className="flex gap-2 mt-2">
            <button type="button" onClick={onClose} className="w-1/2 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs">Cancelar</button>
            <button type="submit" className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs">{initial ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
