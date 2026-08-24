import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  PlusCircle,
  KeyRound,
  Trophy,
  Copy,
  Check,
  LogOut,
  Trash2,
  Share2,
  ShieldCheck,
  UserRound,
  Target,
  Sparkles,
} from 'lucide-react';

export const Grupos: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<string>('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);

  // Form states
  const [groupName, setGroupName] = useState<string>('');
  const [groupDescription, setGroupDescription] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>('');

  // Feedback states
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Handle URL query parameter `?join=XXXXXX`
  useEffect(() => {
    const codeParam = searchParams.get('join');
    if (codeParam) {
      setJoinCode(codeParam.toUpperCase());
      setShowJoinModal(true);
    }
  }, [searchParams]);

  // Fetch my tournaments for filtering
  const { data: tournaments } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => apiClient.get('/tournaments').then((res) => res.data.data),
  });

  // Fetch my groups
  const { data: myGroups, isLoading: loadingGroups } = useQuery({
    queryKey: ['my-groups'],
    queryFn: () => apiClient.get('/groups/my').then((res) => res.data.data),
    enabled: isAuthenticated,
  });

  // Auto-select first group if none selected
  useEffect(() => {
    if (!selectedGroupId && myGroups && myGroups.length > 0) {
      setSelectedGroupId(myGroups[0].id);
    }
  }, [myGroups, selectedGroupId]);

  // Fetch active group details
  const { data: activeGroup, isLoading: loadingGroupDetails } = useQuery({
    queryKey: ['group-details', selectedGroupId],
    queryFn: () => apiClient.get(`/groups/${selectedGroupId}`).then((res) => res.data.data),
    enabled: isAuthenticated && !!selectedGroupId,
  });

  // Fetch active group ranking
  const { data: groupRanking, isLoading: loadingRanking } = useQuery({
    queryKey: ['group-ranking', selectedGroupId, selectedTournament],
    queryFn: () =>
      apiClient
        .get(`/groups/${selectedGroupId}/ranking${selectedTournament ? `?tournamentId=${selectedTournament}` : ''}`)
        .then((res) => res.data.data),
    enabled: isAuthenticated && !!selectedGroupId,
  });

  // Create Group Mutation
  const createGroupMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string }) => apiClient.post('/groups', payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      setShowCreateModal(false);
      setGroupName('');
      setGroupDescription('');
      setSelectedGroupId(res.data.data.id);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Error al crear grupo'),
  });

  // Join Group Mutation
  const joinGroupMutation = useMutation({
    mutationFn: (payload: { code: string }) => apiClient.post('/groups/join', payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      setShowJoinModal(false);
      setJoinCode('');
      // remove query param
      if (searchParams.get('join')) {
        setSearchParams({});
      }
      setSelectedGroupId(res.data.data.id);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Error al unirse al grupo'),
  });

  // Leave Group Mutation
  const leaveGroupMutation = useMutation({
    mutationFn: (groupId: string) => apiClient.post(`/groups/${groupId}/leave`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      setSelectedGroupId(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Error al salir del grupo'),
  });

  // Delete Group Mutation
  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: string) => apiClient.delete(`/groups/${groupId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      setSelectedGroupId(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Error al eliminar grupo'),
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = (code: string) => {
    const link = `${window.location.origin}/grupos?join=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
        <Users className="w-12 h-12 text-purple-400 mx-auto animate-pulse" />
        <h2 className="text-xl font-black text-white">Ligas y Grupos Privados</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Inicia sesión para crear o unirte a grupos privados con tus amigos y competir en una tabla exclusiva.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 p-6 rounded-3xl border border-purple-800/30 shadow-2xl">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-400" /> Grupos Privados
          </h1>
          <p className="text-xs sm:text-sm text-purple-200/80 mt-1">
            Compite únicamente con tus amigos en torneos o ligas personalizadas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl flex items-center gap-2 transition shadow-lg shadow-purple-600/30"
          >
            <PlusCircle className="w-4 h-4" /> Crear Grupo
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold text-xs rounded-2xl border border-purple-500/30 flex items-center gap-2 transition"
          >
            <KeyRound className="w-4 h-4 text-purple-400" /> Unirse con Código
          </button>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      {loadingGroups ? (
        <div className="py-12 text-center text-slate-500 font-bold text-sm">Cargando tus grupos...</div>
      ) : !myGroups || myGroups.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-white">Aún no eres miembro de ningún grupo</h3>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Crea tu propio grupo para invitar a tus amigos o únete con un código de invitación recibido.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition shadow-lg"
            >
              Crear mi primer grupo
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition"
            >
              Ingresar un código
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* SIDEBAR: LIST OF GROUPS */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-xs font-black uppercase text-slate-400 tracking-wider px-1">Mis Grupos</h2>
            <div className="space-y-2">
              {myGroups.map((g: any) => {
                const isSelected = g.id === selectedGroupId;
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGroupId(g.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500/60 text-white shadow-lg shadow-purple-950/40'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-extrabold text-sm truncate">{g.name}</p>
                      <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                        {g.memberCount} integrante{g.memberCount > 1 ? 's' : ''} • Cód: {g.code}
                      </p>
                    </div>
                    {g.myRole === 'ADMIN' && (
                      <span className="shrink-0 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-black px-2 py-0.5 rounded-full">
                        CREADOR
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN VIEW: GROUP DETAILS & LEADERBOARD */}
          <div className="lg:col-span-3 space-y-5">
            {loadingGroupDetails ? (
              <div className="py-12 text-center text-slate-500 font-bold text-sm">Cargando grupo...</div>
            ) : activeGroup ? (
              <>
                {/* GROUP CARD BANNER */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl sm:text-2xl font-black text-white">{activeGroup.name}</h2>
                        {activeGroup.myRole === 'ADMIN' && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> CREADOR
                          </span>
                        )}
                      </div>
                      {activeGroup.description && (
                        <p className="text-xs text-slate-400 mt-1">{activeGroup.description}</p>
                      )}
                      <p className="text-[11px] text-slate-500 font-medium mt-1">
                        Creado por <strong className="text-slate-300">{activeGroup.owner?.displayName}</strong> • {activeGroup.members?.length} integrantes
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {activeGroup.myRole === 'ADMIN' ? (
                        <button
                          onClick={() => {
                            if (confirm(`¿Estás seguro de eliminar el grupo "${activeGroup.name}"?`)) {
                              deleteGroupMutation.mutate(activeGroup.id);
                            }
                          }}
                          className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar Grupo
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (confirm(`¿Estás seguro de salir del grupo "${activeGroup.name}"?`)) {
                              leaveGroupMutation.mutate(activeGroup.id);
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Salir del Grupo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* INVITE CODE BAR */}
                  <div className="bg-purple-950/40 border border-purple-800/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="w-10 h-10 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center font-black text-lg shrink-0">
                        🔑
                      </div>
                      <div>
                        <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider block">Código de Invitación:</span>
                        <span className="text-xl font-black text-white tracking-widest font-mono">{activeGroup.code}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleCopyCode(activeGroup.code)}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow"
                      >
                        {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedCode ? '¡Copiado!' : 'Copiar Código'}</span>
                      </button>
                      <button
                        onClick={() => handleCopyLink(activeGroup.code)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-purple-200 font-bold text-xs rounded-xl border border-purple-500/30 flex items-center gap-1.5 transition"
                      >
                        {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Share2 className="w-4 h-4" />}
                        <span>{copiedLink ? '¡Link Copiado!' : 'Compartir Link'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* RANKING SECTION HEADER & FILTER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" /> Tabla del Grupo
                  </h3>

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-slate-400 font-bold">Torneo:</label>
                    <select
                      value={selectedTournament}
                      onChange={(e) => setSelectedTournament(e.target.value)}
                      className="bg-slate-900 text-xs text-white rounded-xl px-3 py-1.5 border border-slate-800 focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Todos los Torneos</option>
                      {tournaments?.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* GROUP RANKING TABLE */}
                {loadingRanking ? (
                  <div className="py-8 text-center text-slate-500 font-bold text-xs">Cargando clasificación del grupo...</div>
                ) : !groupRanking || groupRanking.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
                    Aún no hay puntuaciones computadas en este grupo.
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 font-extrabold uppercase border-b border-slate-800">
                            <th className="py-3 px-4 w-14 text-center">POS</th>
                            <th className="py-3 px-4">INTEGRANTE</th>
                            <th className="py-3 px-4 text-center">PRONÓSTICOS</th>
                            <th className="py-3 px-4 text-center">ACIERTO</th>
                            <th className="py-3 px-4 text-center">EXACTOS</th>
                            <th className="py-3 px-4 text-right font-black text-yellow-400">PUNTOS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-medium">
                          {groupRanking.map((item: any) => (
                            <tr
                              key={item.user.id}
                              className={`hover:bg-slate-800/40 transition ${
                                item.user.id === activeGroup.ownerId ? 'bg-purple-950/10' : ''
                              }`}
                            >
                              <td className="py-3.5 px-4 text-center">
                                {item.rank === 1 ? (
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-yellow-500/20 text-yellow-400 font-black border border-yellow-500/40 text-xs">
                                    🥇 1
                                  </span>
                                ) : item.rank === 2 ? (
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-300/20 text-slate-300 font-black border border-slate-300/40 text-xs">
                                    🥈 2
                                  </span>
                                ) : item.rank === 3 ? (
                                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-amber-700/20 text-amber-500 font-black border border-amber-700/40 text-xs">
                                    🥉 3
                                  </span>
                                ) : (
                                  <span className="font-bold text-slate-500">#{item.rank}</span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 font-black text-purple-400 flex items-center justify-center text-xs shrink-0">
                                    {item.user.displayName?.[0] ?? '?'}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-white text-xs truncate">{item.user.displayName}</span>
                                      {item.role === 'ADMIN' && (
                                        <span className="text-[9px] bg-amber-500/20 text-amber-400 font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
                                          Admin
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-medium block truncate">@{item.user.username}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-center text-slate-300 font-bold">{item.predictions}</td>
                              <td className="py-3.5 px-4 text-center text-green-400 font-bold">{item.won}</td>
                              <td className="py-3.5 px-4 text-center text-indigo-400 font-bold">{item.exact}</td>
                              <td className="py-3.5 px-4 text-right font-black text-yellow-400 text-sm bg-yellow-500/5">
                                {Number(item.points).toLocaleString('es-AR')} pts
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* MODAL: CREAR GRUPO */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-purple-400" /> Crear Grupo Privado
            </h3>
            <p className="text-xs text-slate-400">
              Crea un espacio exclusivo para competir entre tus amigos. Recibirás un código de invitación.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!groupName.trim()) return alert('Ingresa un nombre para el grupo');
                createGroupMutation.mutate({ name: groupName.trim(), description: groupDescription.trim() || undefined });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nombre del Grupo *</label>
                <input
                  type="text"
                  placeholder="Ej: Amigos del Futsal"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Descripción (Opcional)</label>
                <textarea
                  placeholder="Ej: Liga para la banda de la facultad"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createGroupMutation.isPending}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs transition shadow-lg shadow-purple-600/30"
                >
                  {createGroupMutation.isPending ? 'Creando...' : 'Crear Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UNIRSE A GRUPO */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-purple-400" /> Unirse a un Grupo Privado
            </h3>
            <p className="text-xs text-slate-400">
              Ingresa el código de invitación de 6 caracteres provisto por el creador del grupo.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!joinCode.trim()) return alert('Ingresa un código de invitación');
                joinGroupMutation.mutate({ code: joinCode.trim() });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Código de Invitación *</label>
                <input
                  type="text"
                  placeholder="Ej: XP92A7"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-center font-mono text-base font-black text-white tracking-widest placeholder-slate-600 focus:outline-none focus:border-purple-500 uppercase"
                  maxLength={10}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={joinGroupMutation.isPending}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-xs transition shadow-lg shadow-purple-600/30"
                >
                  {joinGroupMutation.isPending ? 'Uniéndose...' : 'Unirme al Grupo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
