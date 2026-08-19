import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { FileText } from 'lucide-react';

export const AdminLogs: React.FC = () => {
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => apiClient.get('/admin/logs?limit=50').then((res) => res.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-400" /> Registros de Auditoría (AuditLogs)
        </h2>
        <p className="text-xs text-slate-400">Trazabilidad de modificaciones de usuarios, partidos y predicciones</p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 font-bold text-sm">Cargando logs...</div>
      ) : (
        <>
          {/* MOBILE CARD LIST */}
          <div className="space-y-3 md:hidden">
            {logsData?.data?.map((log: any) => (
              <div key={log.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {new Date(log.createdAt).toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                    {log.action}
                  </span>
                </div>
                <div className="font-bold text-white text-sm truncate">{log.user?.email || 'Sistema'}</div>
                <div className="text-purple-300 font-bold text-xs">{log.entity} ({log.entityId || 'N/A'})</div>
                <div className="text-slate-300 text-[11px] break-all">
                  {JSON.stringify(log.newData || log.oldData)}
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
                    <th className="py-3 px-4">FECHA</th>
                    <th className="py-3 px-4">ADMINISTRADOR</th>
                    <th className="py-3 px-4">ACCIÓN</th>
                    <th className="py-3 px-4">ENTIDAD</th>
                    <th className="py-3 px-4">DETALLES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {logsData?.data?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(log.createdAt).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">{log.user?.email || 'Sistema'}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-purple-300 font-bold">{log.entity} ({log.entityId || 'N/A'})</td>
                      <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                        {JSON.stringify(log.newData || log.oldData)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
