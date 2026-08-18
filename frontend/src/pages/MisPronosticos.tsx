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
  const [homeScore, setHomeScore] = useState<number | ''>('');
  const [awayScore, setAwayScore] = useState<number | ''>('');

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
    setHomeScore(pred.predictedHome ?? 0);
    setAwayScore(pred.predictedAway ?? 0);
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
    saveMutation.mutate({ matchId, predictedHome: Number(homeScore), predictedAway: Number(awayScore) });
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
            <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-white">{p.match.homeTeam?.name} <span className="text-slate-400">vs</span> {p.match.awayTeam?.name}</div>
                <div className="text-xs text-slate-400">{new Date(p.match.scheduledAt).toLocaleString('es-AR')}</div>
                <div className="flex items-center gap-2 mt-2">
                  {p.result === 'PENDING' ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">PENDIENTE</span>
                  ) : p.result === 'WON' ? (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      p.pointsEarned === 6 ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-green-500/20 text-green-400 border-green-500/40'
                    }`}>
                      {p.pointsEarned === 6 ? '🎯 EXACTO' : '✅ ACERTADO'} +{p.pointsEarned} pts
                    </span>
                  ) : (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">✗ PERDIDO</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {editingId === p.id ? (
                  <>
                    <input type="number" min={0} value={homeScore} onChange={(e) => setHomeScore(e.target.value === '' ? '' : Number(e.target.value))} className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-center text-white" />
                    <span className="text-white font-black">-</span>
                    <input type="number" min={0} value={awayScore} onChange={(e) => setAwayScore(e.target.value === '' ? '' : Number(e.target.value))} className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-center text-white" />
                <button onClick={() => submitEdit(p.match.id, p.match.scheduledAt)} className="ml-3 px-3 py-1.5 bg-amber-500 text-slate-900 rounded-xl font-bold text-xs">Guardar</button>
                    <button onClick={cancelEdit} className="ml-2 px-3 py-1.5 bg-slate-700 text-white rounded-xl font-bold text-xs">Cancelar</button>
                  </>
                ) : (
                  <>
                    <div className="text-white font-black text-lg">{p.predictedHome} - {p.predictedAway}</div>
                {(p.match.status === 'SCHEDULED' && Date.now() < new Date(p.match.scheduledAt).getTime()) ? (
                      <button onClick={() => startEdit(p)} className="ml-4 px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-bold text-xs">Editar</button>
                    ) : (
                      <div className="text-xs text-slate-400 ml-4">No editable</div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
