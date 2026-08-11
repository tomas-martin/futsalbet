import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Users, Lock, Unlock, Shield, Coins, Search } from 'lucide-react';

export const AdminUsuarios: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [pointsAdj, setPointsAdj] = useState('');

  const { data: usersData, refetch, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => apiClient.get(`/admin/users${search ? `?search=${search}` : ''}`).then((res) => res.data),
  });

  const handleToggleStatus = async (user: any) => {
    try {
      await apiClient.put(`/admin/users/${user.id}`, {
        isActive: !user.isActive,
      });
      refetch();
    } catch {
      alert('Error al actualizar estado');
    }
  };

  const handleToggleRole = async (user: any) => {
    const newRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await apiClient.put(`/admin/users/${user.id}`, {
        role: newRole,
      });
      refetch();
    } catch {
      alert('Error al actualizar rol');
    }
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !pointsAdj) return;
    try {
      await apiClient.put(`/admin/users/${selectedUser.id}`, {
        pointsAdjustment: parseFloat(pointsAdj),
      });
      alert('Puntos ajustados exitosamente');
      setSelectedUser(null);
      setPointsAdj('');
      refetch();
    } catch {
      alert('Error al ajustar puntos');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" /> Administración de Usuarios
          </h2>
          <p className="text-xs text-slate-400">Bloquear, cambiar roles y otorgar puntos virtuales</p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por email o usuario..."
            className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-amber-500 w-64"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-slate-500 font-bold text-sm">Cargando usuarios...</div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-extrabold uppercase border-b border-slate-800">
                  <th className="py-3 px-4">USUARIO</th>
                  <th className="py-3 px-4">ROL</th>
                  <th className="py-3 px-4">ESTADO</th>
                  <th className="py-3 px-4 text-right">PUNTOS VIRTUALES</th>
                  <th className="py-3 px-4 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {usersData?.data?.map((u: any) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-white text-sm block">{u.displayName}</span>
                        <span className="text-[11px] text-slate-400">@{u.username} • {u.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        u.isActive ? 'bg-green-500/20 text-green-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {u.isActive ? 'ACTIVO' : 'BLOQUEADO'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-yellow-400 text-sm">
                      {Number(u.wallet?.balance || 0).toLocaleString()} pts
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`p-1.5 rounded-lg border transition ${
                            u.isActive
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/30'
                          }`}
                          title={u.isActive ? 'Bloquear usuario' : 'Desbloquear usuario'}
                        >
                          {u.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleToggleRole(u)}
                          className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg transition"
                          title="Cambiar Rol"
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="p-1.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg transition"
                          title="Ajustar Puntos"
                        >
                          <Coins className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADJUST POINTS MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-black text-lg text-white">Ajustar Puntos Virtuales</h3>
            <p className="text-xs text-slate-400">
              Usuario: <strong className="text-white">{selectedUser.displayName}</strong> (@{selectedUser.username})
            </p>
            <form onSubmit={handleAdjustPoints} className="space-y-3">
              <input
                type="number"
                required
                placeholder="Ej: +500 o -200"
                value={pointsAdj}
                onChange={(e) => setPointsAdj(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="w-1/2 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
