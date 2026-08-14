import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

export const AdminPredictions: React.FC = () => {
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: matches } = useQuery({
    queryKey: ['admin-matches-list'],
    queryFn: () => apiClient.get('/matches?limit=200').then((res) => res.data.data),
  });

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
