import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const AdminPredictions: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: matches } = useQuery({
    queryKey: ['admin-matches-list'],
    queryFn: () => apiClient.get('/matches?limit=200').then((res) => res.data.data),
  });

  // if a ?match=... param is provided, preselect it
  useEffect(() => {
    const m = searchParams.get('match');
    if (m) setSelectedMatch(m);
  }, [searchParams]);

  const { data: preds, isLoading } = useQuery({
    queryKey: ['admin-predictions', selectedMatch],
    enabled: !!selectedMatch,
    queryFn: () => apiClient.get(`/predictions/match/${selectedMatch}`).then((res) => res.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/predictions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-predictions', selectedMatch] });
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Error al eliminar pronóstico'),
  });

  useEffect(() => {
    // if the selectedMatch is cleared, remove param from URL
    if (!selectedMatch) {
      const params = Object.fromEntries([...searchParams.entries()].filter(([k]) => k !== 'match'));
      const qs = new URLSearchParams(params).toString();
      navigate(`/admin/predictions${qs ? `?${qs}` : ''}`, { replace: true });
    }
  }, [selectedMatch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">Predicciones por Partido</h2>
          <p className="text-xs text-slate-400">Selecciona un partido para ver todas las predicciones registradas</p>
        </div>
        <div>
          <select value={selectedMatch ?? ''} onChange={(e) => setSelectedMatch(e.target.value)} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white">
            <option value="">-- Seleccionar Partido --</option>
            {matches?.map((m: any) => (
              <option key={m.id} value={m.id}>{m.homeTeam?.name} vs {m.awayTeam?.name} • {new Date(m.scheduledAt).toLocaleString('es-AR')}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedMatch ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-400">Seleccioná un partido para ver las predicciones</div>
      ) : isLoading ? (
        <div className="py-12 text-center text-slate-500 font-bold">Cargando predicciones...</div>
      ) : preds && preds.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-400">No hay predicciones para este partido</div>
      ) : (
        <div className="space-y-3">
          {preds?.map((p: any) => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">{p.user.displayName} <span className="text-slate-400 text-xs">@{p.user.username}</span></div>
                <div className="text-xs text-slate-400">{p.user.email}</div>
                <div className="text-sm text-white font-black mt-2">{p.predictedHome} - {p.predictedAway}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  {p.match?.status === 'FINISHED' && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      Final: {p.match.homeScore} - {p.match.awayScore}
                    </span>
                  )}
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
              <div className="flex flex-col items-end gap-2">
                <div className="text-xs text-slate-400">Enviado: {new Date(p.createdAt).toLocaleString('es-AR')}</div>
                <button onClick={() => { if (confirm('Eliminar pronóstico?')) deleteMutation.mutate(p.id); }} className="px-3 py-1 bg-rose-500 text-white rounded-xl text-xs">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
