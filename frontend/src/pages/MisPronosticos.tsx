import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const MisPronosticos: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-predictions'],
    queryFn: () => apiClient.get('/predictions/my').then((res) => res.data.data),
    enabled: isAuthenticated,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');

  const saveMutation = useMutation({
    mutationFn: (payload: any) => apiClient.post('/predictions', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-predictions'] });
      setEditingId(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Error al guardar pronóstico'),
  });

  const startEdit = (pred: any) => {
    const matchStart = new Date(pred.match.scheduledAt).getTime();
    const now = Date.now();
    if (pred.match.status !== 'SCHEDULED' || now >= matchStart) {
      alert('No se pueden editar pronósticos después de iniciado el partido');
      return;
    }

    setEditingId(pred.id);
    setHomeScore(pred.predictedHome !== undefined && pred.predictedHome !== null ? String(pred.predictedHome) : '');
    setAwayScore(pred.predictedAway !== undefined && pred.predictedAway !== null ? String(pred.predictedAway) : '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setHomeScore('');
    setAwayScore('');
  };

  const submitEdit = (matchId: string, scheduledAt: string) => {
    if (homeScore === '' || awayScore === '') return alert('Ingresa ambos marcadores');
    const matchStart = new Date(scheduledAt).getTime();
    if (Date.now() >= matchStart) return alert('No se pueden editar pronósticos después de iniciado el partido');
    saveMutation.mutate({ matchId, predictedHome: parseInt(homeScore, 10), predictedAway: parseInt(awayScore, 10) });
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
        Debes iniciar sesión para ver tus pronósticos.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-black text-white">Mis Pronósticos</h1>
        <p className="text-xs text-slate-400">Tus predicciones enviadas para los partidos del torneo.</p>
      </div>

      {/* SCORING RULES */}
      <div className="bg-purple-950/40 border border-purple-800/40 rounded-2xl p-3 flex flex-wrap gap-3 text-[11px] text-purple-200">
        <span>🎯 Resultado exacto: <strong>6 pts</strong></span>
        <span>🏆 Ganador o empate correcto: <strong>3 pts</strong></span>
        <span className="text-purple-300/70">Los puntos se suman cuando el partido finaliza.</span>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 font-bold">Cargando pronósticos...</div>
      ) : !data || data.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center text-slate-400">No tenés pronósticos guardados.</div>
      ) : (
        <div className="space-y-4">
          {data.map((p: any) => (
            <div
              key={p.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3 transition shadow-lg"
            >
              <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2.5">
                <span className="font-bold text-purple-400 truncate max-w-[180px] sm:max-w-none">
                  {p.match.tournament?.name}
                </span>
                <span className="text-slate-400 text-[11px] font-medium shrink-0">
                  {new Date(p.match.scheduledAt).toLocaleString('es-AR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <img src={p.match.homeTeam?.logoUrl} alt="" className="w-8 h-8 object-contain shrink-0" />
                    <span className="font-bold text-xs sm:text-sm text-white truncate">{p.match.homeTeam?.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-500 shrink-0">VS</span>
                  <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                    <span className="font-bold text-xs sm:text-sm text-white truncate text-right">{p.match.awayTeam?.name}</span>
                    <img src={p.match.awayTeam?.logoUrl} alt="" className="w-8 h-8 object-contain shrink-0" />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/70 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {p.result === 'PENDING' ? (
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      PENDIENTE
                    </span>
                  ) : p.result === 'WON' ? (
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                      p.pointsEarned === 6 ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-green-500/20 text-green-400 border-green-500/40'
                    }`}>
                      {p.pointsEarned === 6 ? '🎯 EXACTO' : '✅ ACERTADO'} +{p.pointsEarned} pts
                    </span>
                  ) : (
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      ✗ PERDIDO
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  {editingId === p.id ? (
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        placeholder="-"
                        value={homeScore}
                        onChange={(e) => setHomeScore(e.target.value.replace(/\D/g, '').slice(0, 2))}
                        className="w-12 h-9 bg-slate-950 border border-slate-800 rounded-xl px-1 text-center text-white font-bold focus:outline-none focus:border-purple-500"
                      />
                      <span className="text-white font-black">-</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        placeholder="-"
                        value={awayScore}
                        onChange={(e) => setAwayScore(e.target.value.replace(/\D/g, '').slice(0, 2))}
                        className="w-12 h-9 bg-slate-950 border border-slate-800 rounded-xl px-1 text-center text-white font-bold focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={() => submitEdit(p.match.id, p.match.scheduledAt)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Tu Pronóstico */}
                        <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Pronóstico:</span>
                          <span className="text-white font-black text-sm">{p.predictedHome} - {p.predictedAway}</span>
                        </div>

                        {/* Resultado Real */}
                        {p.match.homeScore !== null && p.match.awayScore !== null ? (
                          <div className="flex items-center gap-1.5 bg-purple-950/50 px-3 py-1.5 rounded-xl border border-purple-800/60 shadow-inner">
                            <span className="text-[10px] text-purple-300 font-bold uppercase">Resultado Real:</span>
                            <span className="text-purple-200 font-black text-sm">{p.match.homeScore} - {p.match.awayScore}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-slate-800/40">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Resultado Real:</span>
                            <span className="text-slate-500 font-semibold text-xs">Sin definir</span>
                          </div>
                        )}
                      </div>

                      {(p.match.status === 'SCHEDULED' && Date.now() < new Date(p.match.scheduledAt).getTime()) ? (
                        <button
                          onClick={() => startEdit(p)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition shrink-0"
                        >
                          Editar
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-semibold shrink-0">Bloqueado</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
