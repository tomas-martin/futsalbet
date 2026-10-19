import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Trophy,
  Clock,
  Edit2,
  Layers,
  ChevronRight,
  ExternalLink,
  MapPin,
  Sparkles,
  Trash2,
} from 'lucide-react';

/**
 * Normaliza nombres como "Jornada 1", "jornada 1", "fecha 1" a "Fecha 1"
 */
function normalizeRoundName(round?: string | null): string {
  if (!round || !round.trim()) return 'Sin Fecha Asignada';
  const clean = round.trim();
  const match = clean.match(/^(?:Jornada|Fecha)\s*(\d+)$/i);
  if (match) {
    return `Fecha ${match[1]}`;
  }
  return clean;
}

/**
 * Devuelve un número para ordenar las fechas naturalmente (Fecha 1 antes de Fecha 10)
 */
function getRoundOrder(roundName: string): number {
  if (roundName === 'Sin Fecha Asignada') return 9999;
  const match = roundName.match(/Fecha\s*(\d+)/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  if (/octavos/i.test(roundName)) return 9900;
  if (/cuartos/i.test(roundName)) return 9910;
  if (/semi/i.test(roundName)) return 9920;
  if (/final/i.test(roundName)) return 9930;
  return 9000;
}

export const AdminPartidos: React.FC = () => {
  const [selectedRound, setSelectedRound] = useState<string>('all');
  const [selectedTournament, setSelectedTournament] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');

  const [showCreate, setShowCreate] = useState(false);
  const [createDefaultRound, setCreateDefaultRound] = useState<string>('Fecha 1');
  const [editingMatch, setEditingMatch] = useState<any | null>(null);

  const queryClient = useQueryClient();

  const { data: matchesData, isLoading } = useQuery({
    queryKey: ['admin-matches'],
    queryFn: () => apiClient.get('/matches?limit=200').then((res) => res.data),
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/matches/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-matches'] });
      alert('Partido eliminado correctamente');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Error al eliminar partido'),
  });

  const handleDeleteMatch = (match: any) => {
    const home = match.homeTeam?.name || 'Local';
    const away = match.awayTeam?.name || 'Visitante';
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar el partido ${home} vs ${away}?\n\nEsta acción no se puede deshacer y también eliminará las predicciones asociadas.`
    );
    if (confirmed) {
      deleteMutation.mutate(match.id);
    }
  };

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

  // Obtener lista de Fechas disponibles para la barra de pestañas (incluyendo las 15 fechas del torneo)
  const allRounds = useMemo(() => {
    const rawMatches = matchesData?.data || [];
    const set = new Set<string>();
    // Pre-poblar las 15 fechas del torneo por defecto
    for (let i = 1; i <= 15; i++) {
      set.add(`Fecha ${i}`);
    }
    for (const m of rawMatches) {
      set.add(normalizeRoundName(m.round));
    }
    const list = Array.from(set);
    list.sort((a, b) => getRoundOrder(a) - getRoundOrder(b) || a.localeCompare(b));
    return list;
  }, [matchesData]);

  // Agrupar y filtrar partidos por Fecha
  const groupedMatches = useMemo(() => {
    const rawMatches = matchesData?.data || [];

    // Filtros de búsqueda y torneo
    const filtered = rawMatches.filter((m: any) => {
      if (selectedTournament !== 'all' && m.tournamentId !== selectedTournament) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const home = m.homeTeam?.name?.toLowerCase() || '';
        const away = m.awayTeam?.name?.toLowerCase() || '';
        const venue = m.venue?.toLowerCase() || '';
        const round = m.round?.toLowerCase() || '';
        if (!home.includes(q) && !away.includes(q) && !venue.includes(q) && !round.includes(q)) {
          return false;
        }
      }
      return true;
    });

    // Mapear por nombre de Fecha normalizado
    const groupsMap = new Map<string, any[]>();
    for (const match of filtered) {
      const key = normalizeRoundName(match.round);
      if (!groupsMap.has(key)) {
        groupsMap.set(key, []);
      }
      groupsMap.get(key)!.push(match);
    }

    // Convertir a array ordenado
    const sortedGroups = Array.from(groupsMap.entries()).map(([roundName, matches]) => {
      // Ordenar partidos dentro de cada fecha por horario cronológico
      matches.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

      const finished = matches.filter((m) => m.status === 'FINISHED').length;
      const live = matches.filter((m) => m.status === 'LIVE').length;
      const scheduled = matches.filter((m) => m.status === 'SCHEDULED').length;

      return {
        roundName,
        order: getRoundOrder(roundName),
        matches,
        total: matches.length,
        finished,
        live,
        scheduled,
      };
    });

    sortedGroups.sort((a, b) => a.order - b.order || a.roundName.localeCompare(b.roundName));
    return sortedGroups;
  }, [matchesData, selectedTournament, searchQuery]);

  // Grupos visibles según pestaña activa
  const visibleGroups = useMemo(() => {
    if (selectedRound === 'all') return groupedMatches;
    return groupedMatches.filter((g) => g.roundName === selectedRound);
  }, [groupedMatches, selectedRound]);

  const totalMatchesCount = matchesData?.data?.length || 0;

  const handleOpenCreateForRound = (roundName?: string) => {
    const targetRound = roundName && roundName !== 'Sin Fecha Asignada' 
      ? roundName 
      : (selectedRound !== 'all' && selectedRound !== 'Sin Fecha Asignada' ? selectedRound : 'Fecha 1');
    setCreateDefaultRound(targetRound);
    setShowCreate(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" /> Administración de Partidos por Fecha
          </h2>
          <p className="text-xs text-slate-400">
            Organiza, carga y modifica resultados divididos por fecha para puntuar el prode automáticamente.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleOpenCreateForRound()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl text-xs uppercase shadow-lg shadow-amber-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Crear Partido
          </button>
        </div>
      </div>

      {/* REGLAS NOTICE */}
      <div className="bg-purple-950/40 border border-purple-800/40 rounded-2xl p-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-purple-200">
        <span>🔒 Los pronósticos se bloquean al iniciar el partido.</span>
        <span>🎯 Prode: exacto <strong>6 pts</strong> • ganador o empate <strong>3 pts</strong>.</span>
        <span className="text-purple-300/70">Al cargar o modificar un marcador, se actualizan las posiciones automáticamente.</span>
      </div>

      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* BUSCADOR */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por equipo, cancha o fecha..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* SELECTOR DE TORNEO */}
        {tournaments && tournaments.length > 1 && (
          <div className="w-full md:w-64">
            <select
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">🏆 Todos los Torneos</option>
              {tournaments.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* PESTAÑAS DE FECHAS (TABS HORIZONTALES) */}
      <div className="border-b border-slate-800/80 pb-1">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedRound('all')}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              selectedRound === 'all'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Todas las Fechas
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                selectedRound === 'all' ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {totalMatchesCount}
            </span>
          </button>

          {allRounds.map((roundName) => {
            const count = (matchesData?.data || []).filter(
              (m: any) => normalizeRoundName(m.round) === roundName
            ).length;

            const isSelected = selectedRound === roundName;

            return (
              <button
                key={roundName}
                onClick={() => setSelectedRound(roundName)}
                className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <span>{roundName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL: GRUPOS POR FECHA */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500 font-bold text-sm">
          <div className="animate-spin w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto mb-3" />
          Cargando partidos...
        </div>
      ) : visibleGroups.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <p className="text-slate-400 text-sm font-semibold">No se encontraron partidos para el filtro actual.</p>
          <button
            onClick={() => handleOpenCreateForRound(selectedRound !== 'all' ? selectedRound : 'Fecha 1')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
          >
            <Plus className="w-4 h-4" /> Cargar primer partido aquí
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {visibleGroups.map((group) => (
            <div
              key={group.roundName}
              className="bg-slate-900/80 border border-slate-800/90 rounded-3xl overflow-hidden shadow-xl transition"
            >
              {/* ENCABEZADO DE LA FECHA */}
              <div className="bg-slate-950/80 border-b border-slate-800/80 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-black text-sm">
                    📅
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white">{group.roundName}</h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                        {group.total} {group.total === 1 ? 'partido' : 'partidos'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                      <span className="text-emerald-400 font-semibold">{group.finished} finalizados</span>
                      {group.live > 0 && <span className="text-rose-400 font-semibold">{group.live} en vivo</span>}
                      <span className="text-slate-400">{group.scheduled} por jugar</span>
                    </div>
                  </div>
                </div>

                {/* BOTÓN RÁPIDO PARA CREAR PARTIDO EN ESTA FECHA */}
                <button
                  onClick={() => handleOpenCreateForRound(group.roundName)}
                  className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700/80 hover:border-amber-500/40 font-bold rounded-xl text-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar a {group.roundName}
                </button>
              </div>

              {/* LISTA MOBILE (TARJETAS) */}
              <div className="p-3 space-y-3 md:hidden">
                {group.matches.map((m: any) => (
                  <div
                    key={m.id}
                    className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider truncate">
                        {m.tournament?.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          m.status === 'FINISHED'
                            ? 'bg-slate-800 text-emerald-400 border border-emerald-500/20'
                            : m.status === 'LIVE'
                            ? 'bg-rose-500/20 text-rose-400 animate-pulse'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="font-extrabold text-white text-sm">{m.homeTeam?.name}</div>
                        <div className="font-extrabold text-white text-sm">{m.awayTeam?.name}</div>
                      </div>

                      <div className="text-right">
                        {m.status === 'FINISHED' || m.status === 'LIVE' ? (
                          <div className="flex flex-col items-center justify-center bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                            <span className="text-base font-black text-amber-400">
                              {m.homeScore} - {m.awayScore}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 font-bold">vs</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        {new Date(m.scheduledAt).toLocaleDateString('es-AR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </span>
                      {m.venue && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="truncate text-slate-400">{m.venue}</span>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2 pt-1 flex-wrap">
                      <button
                        onClick={() => {
                          setSelectedMatch(m);
                          setHomeScore(m.homeScore !== undefined && m.homeScore !== null ? String(m.homeScore) : '');
                          setAwayScore(m.awayScore !== undefined && m.awayScore !== null ? String(m.awayScore) : '');
                        }}
                        className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition text-center shadow-sm"
                      >
                        {m.status === 'FINISHED' ? 'Modificar Resultado' : 'Cargar Resultado'}
                      </button>
                      <button
                        onClick={() => setEditingMatch(m)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          window.location.href = '/admin/predictions?match=' + m.id;
                        }}
                        className="px-3 py-2 bg-sky-600/80 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition"
                      >
                        Predicciones
                      </button>
                      <button
                        onClick={() => handleDeleteMatch(m)}
                        disabled={deleteMutation.isPending}
                        title="Eliminar Partido"
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs transition flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* TABLA DESKTOP */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/90 text-slate-400 font-extrabold uppercase border-b border-slate-800">
                      <th className="py-3 px-4">PARTIDO</th>
                      <th className="py-3 px-4">TORNEO</th>
                      <th className="py-3 px-4">FECHA Y HORA</th>
                      <th className="py-3 px-4">CANCHA</th>
                      <th className="py-3 px-4 text-center">ESTADO</th>
                      <th className="py-3 px-4 text-center">MARCADOR</th>
                      <th className="py-3 px-4 text-center">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {group.matches.map((m: any) => (
                      <tr key={m.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-bold text-white">
                          <span className="text-slate-100">{m.homeTeam?.name}</span>{' '}
                          <span className="text-slate-500 font-semibold">vs</span>{' '}
                          <span className="text-slate-100">{m.awayTeam?.name}</span>
                        </td>
                        <td className="py-3 px-4 text-purple-400 font-semibold">{m.tournament?.name}</td>
                        <td className="py-3 px-4 text-slate-300">
                          {new Date(m.scheduledAt).toLocaleDateString('es-AR', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          })}
                        </td>
                        <td className="py-3 px-4 text-slate-400">{m.venue || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                              m.status === 'FINISHED'
                                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/20'
                                : m.status === 'LIVE'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-purple-500/20 text-purple-300'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-black text-sm text-amber-400">
                          {m.status === 'FINISHED' || m.status === 'LIVE'
                            ? `${m.homeScore} - ${m.awayScore}`
                            : '-'}
                        </td>
                        <td className="py-3 px-4 text-center space-x-2">
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
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition border border-slate-700"
                          >
                            Editar
                          </button>

                          <button
                            onClick={() => {
                              window.location.href = '/admin/predictions?match=' + m.id;
                            }}
                            className="px-3 py-1.5 bg-sky-600/80 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition"
                          >
                            Predicciones
                          </button>

                          <button
                            onClick={() => handleDeleteMatch(m)}
                            disabled={deleteMutation.isPending}
                            title="Eliminar Partido"
                            className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold rounded-xl text-xs transition inline-flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL PARA RESOLVER / MODIFICAR RESULTADO */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="font-black text-lg text-white">
              {selectedMatch.status === 'FINISHED' ? 'Modificar Marcador' : 'Cargar Marcador Final'}
            </h3>
            <div className="p-2.5 bg-slate-950 rounded-2xl border border-slate-800 text-center">
              <span className="text-[10px] text-purple-400 font-bold uppercase">
                {normalizeRoundName(selectedMatch.round)} • {selectedMatch.tournament?.name}
              </span>
              <p className="text-xs text-white font-black mt-0.5">
                {selectedMatch.homeTeam?.name} vs {selectedMatch.awayTeam?.name}
              </p>
            </div>

            <form onSubmit={handleSettleMatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 truncate">
                    {selectedMatch.homeTeam?.name}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    placeholder="-"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center text-xl font-black text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 truncate">
                    {selectedMatch.awayTeam?.name}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    placeholder="-"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value.replace(/\D/g, '').slice(0, 2))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-center text-xl font-black text-amber-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-950/40 border border-purple-800/40 rounded-xl text-[11px] text-purple-300">
                Al confirmar, el estado cambiará a <strong>FINISHED</strong> y los puntos del Prode se calcularán al instante.
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
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CREAR PARTIDO */}
      {showCreate && (
        <CreateOrEditMatchModal
          tournaments={tournaments ?? []}
          teams={teams ?? []}
          defaultRound={createDefaultRound}
          onClose={() => setShowCreate(false)}
          onSave={(payload) => createMutation.mutate(payload)}
        />
      )}

      {/* MODAL DE EDITAR PARTIDO */}
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

// OPCIONES RÁPIDAS DE FECHAS (15 FECHAS POR TORNEO + PLAYOFFS)
const QUICK_ROUNDS = [
  'Fecha 1',
  'Fecha 2',
  'Fecha 3',
  'Fecha 4',
  'Fecha 5',
  'Fecha 6',
  'Fecha 7',
  'Fecha 8',
  'Fecha 9',
  'Fecha 10',
  'Fecha 11',
  'Fecha 12',
  'Fecha 13',
  'Fecha 14',
  'Fecha 15',
  'Cuartos de Final',
  'Semifinal',
  'Final',
];

// MODAL REUTILIZABLE PARA CREAR / EDITAR
const CreateOrEditMatchModal: React.FC<{
  tournaments: any[];
  teams: any[];
  initial?: any;
  defaultRound?: string;
  onClose: () => void;
  onSave: (payload: any) => void;
}> = ({ tournaments, teams, initial, defaultRound, onClose, onSave }) => {
  const [tournamentId, setTournamentId] = useState(
    initial?.tournamentId ?? tournaments[0]?.id ?? ''
  );
  const [homeTeamId, setHomeTeamId] = useState(initial?.homeTeamId ?? teams[0]?.id ?? '');
  const [awayTeamId, setAwayTeamId] = useState(initial?.awayTeamId ?? teams[1]?.id ?? '');
  const [scheduledAt, setScheduledAt] = useState(() => {
    if (initial?.scheduledAt) return new Date(initial.scheduledAt).toISOString().slice(0, 16);
    return new Date().toISOString().slice(0, 16);
  });
  const [venue, setVenue] = useState(initial?.venue ?? '');
  
  // Si estamos creando, usar defaultRound; si editamos, usar el round normalizado del partido
  const [round, setRound] = useState(
    initial?.round ? normalizeRoundName(initial.round) : defaultRound || 'Fecha 1'
  );

  const [status, setStatus] = useState(initial?.status ?? 'SCHEDULED');
  const [homeScore, setHomeScore] = useState<string>(
    initial?.homeScore !== undefined && initial?.homeScore !== null ? String(initial.homeScore) : ''
  );
  const [awayScore, setAwayScore] = useState<string>(
    initial?.awayScore !== undefined && initial?.awayScore !== null ? String(initial.awayScore) : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (homeTeamId === awayTeamId) return alert('El equipo local y visitante no pueden ser el mismo');

    const payload: any = {
      tournamentId,
      homeTeamId,
      awayTeamId,
      scheduledAt: new Date(scheduledAt).toISOString(),
      venue,
      round: round.trim() || 'Fecha 1',
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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        <h3 className="font-black text-lg text-white">
          {initial ? 'Editar Partido' : 'Crear Nuevo Partido'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* FECHA / JORNADA */}
          <div>
            <label className="block text-xs text-slate-300 font-bold mb-1.5 flex items-center justify-between">
              <span>Fecha / Ronda del Torneo</span>
              <span className="text-[10px] text-amber-400 font-normal">Selecciona o escribe abajo</span>
            </label>

            {/* CHIPS RÁPIDOS */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 mb-2">
              {QUICK_ROUNDS.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRound(r)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                    round === r
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={round}
              onChange={(e) => setRound(e.target.value)}
              placeholder="Ej: Fecha 1, Fecha 2, Cuartos..."
              className="w-full bg-slate-950 text-white rounded-xl px-3 py-2 border border-slate-800 text-xs focus:outline-none focus:border-amber-500 font-bold"
            />
          </div>

          {/* TORNEO */}
          <div>
            <label className="block text-xs text-slate-400 font-bold mb-1">Torneo</label>
            <select
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
              className="w-full bg-slate-950 text-white rounded-xl px-3 py-2 border border-slate-800 text-xs focus:outline-none focus:border-amber-500"
            >
              {tournaments.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* LOCAL Y VISITANTE */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 font-bold mb-1">Local</label>
              <select
                value={homeTeamId}
                onChange={(e) => setHomeTeamId(e.target.value)}
                className="w-full bg-slate-950 text-white rounded-xl px-3 py-2 border border-slate-800 text-xs focus:outline-none focus:border-amber-500"
              >
                {teams.map((team: any) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-bold mb-1">Visitante</label>
              <select
                value={awayTeamId}
                onChange={(e) => setAwayTeamId(e.target.value)}
                className="w-full bg-slate-950 text-white rounded-xl px-3 py-2 border border-slate-800 text-xs focus:outline-none focus:border-amber-500"
              >
                {teams.map((team: any) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FECHA Y HORA */}
          <div>
            <label className="block text-xs text-slate-400 font-bold mb-1">Día y Horario</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full bg-slate-950 text-white rounded-xl px-3 py-2 border border-slate-800 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* SEDE */}
          <div>
            <label className="block text-xs text-slate-400 font-bold mb-1">Cancha / Sede (opcional)</label>
            <input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Ej: Estadio Ribosqui, Cancha Jockey..."
              className="w-full bg-slate-950 text-white rounded-xl px-3 py-2 border border-slate-800 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* CAMPOS EXTRAS SI ES EDICIÓN */}
          {initial && (
            <>
              <div>
                <label className="block text-xs text-slate-400 font-bold mb-1">Estado</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-950 text-white rounded-xl px-3 py-2 border border-slate-800 text-xs focus:outline-none focus:border-amber-500"
                >
                  {['SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED', 'POSTPONED'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
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

              <div className="p-2.5 bg-purple-950/40 border border-purple-800/40 rounded-xl text-[11px] text-purple-300">
                Al guardar un partido FINISHED, el prode y la tabla de posiciones se recalcula automáticamente.
              </div>
            </>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase"
            >
              {initial ? 'Guardar Cambios' : 'Crear Partido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
