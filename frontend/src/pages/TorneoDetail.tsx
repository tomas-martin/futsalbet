import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Trophy, Calendar, Table, ArrowLeft, Filter, Sparkles, Shield, ArrowUpRight } from 'lucide-react';

export const TorneoDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [subTab, setSubTab] = useState<'standings' | 'matches' | 'playoffs'>('standings');
  const [selectedRoundFilter, setSelectedRoundFilter] = useState<string>('all');

  const { data: tournament } = useQuery({
    queryKey: ['tournament-detail', id],
    queryFn: () => apiClient.get(`/tournaments/${id}`).then((res) => res.data),
  });

  const { data: standings } = useQuery({
    queryKey: ['tournament-standings', id],
    queryFn: () => apiClient.get(`/tournaments/${id}/standings`).then((res) => res.data.data),
    refetchInterval: 30000,
  });

  const { data: matches } = useQuery({
    queryKey: ['tournament-matches', id],
    queryFn: () => apiClient.get(`/tournaments/${id}/matches`).then((res) => res.data.data),
    refetchInterval: 30000,
  });

  // Extraer rondas disponibles para filtrar en el fixture
  const availableRounds = useMemo(() => {
    if (!matches) return [];
    const set = new Set<string>();
    matches.forEach((m: any) => {
      if (m.round && m.round.trim()) set.add(m.round.trim());
    });
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '') || '999', 10);
      const numB = parseInt(b.replace(/\D/g, '') || '999', 10);
      return numA - numB || a.localeCompare(b);
    });
  }, [matches]);

  // Partidos filtrados para la pestaña de Fixture
  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    if (selectedRoundFilter === 'all') return matches;
    if (selectedRoundFilter === 'regular') {
      return matches.filter((m: any) => !/cuartos|semi|final/i.test(m.round || ''));
    }
    if (selectedRoundFilter === 'playoffs') {
      return matches.filter((m: any) => /cuartos|semi|final/i.test(m.round || ''));
    }
    return matches.filter((m: any) => m.round === selectedRoundFilter);
  }, [matches, selectedRoundFilter]);

  // Partidos clasificados por etapa de Playoff
  const playoffMatches = useMemo(() => {
    const list = matches || [];
    const cuartos = list.filter((m: any) => /cuartos/i.test(m.round || ''));
    const semis = list.filter((m: any) => /semi/i.test(m.round || ''));
    const final = list.filter((m: any) => /final/i.test(m.round || '') && !/cuartos|semi/i.test(m.round || ''));
    return { cuartos, semis, final };
  }, [matches]);

  // Clasificados provisionales según tabla (los 8 primeros)
  const top8Teams = useMemo(() => {
    if (!standings || standings.length < 8) return [];
    return standings.slice(0, 8);
  }, [standings]);

  if (!tournament) {
    return <div className="py-12 text-center text-slate-500 font-bold">Cargando torneo...</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <Link to="/torneos" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition">
        <ArrowLeft className="w-4 h-4" /> Volver a torneos
      </Link>

      {/* HEADER CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-5">
          <img src={tournament.logoUrl} alt="" className="w-20 h-20 object-contain bg-slate-950 p-3 rounded-2xl border border-slate-800 shrink-0" />
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">{tournament.name}</h1>
            <p className="text-sm font-bold text-purple-400 mt-1">{tournament.organizer} • Temporada {tournament.season}</p>
            <p className="text-xs text-slate-400 mt-1">{tournament.description || 'Torneo oficial de Futsal'}</p>
          </div>
        </div>

        {/* FORMATO BADGE */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-xs space-y-1.5 w-full md:w-auto shrink-0">
          <div className="flex items-center gap-2 font-black text-amber-400">
            <Trophy className="w-4 h-4" /> Formato de Torneo
          </div>
          <div className="text-slate-300 font-medium">
            <span className="text-white font-bold">15 Fechas Regulares</span> (todos contra todos)
          </div>
          <div className="text-emerald-400 font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Top 8 clasifica a Playoffs (Cuartos, Semi y Final)
          </div>
        </div>
      </div>

      {/* SUB TABS */}
      <div className="flex border-b border-slate-800 gap-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSubTab('standings')}
          className={`py-3 text-xs font-extrabold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
            subTab === 'standings' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Table className="w-4 h-4" /> Tabla de Posiciones (15 Fechas)
        </button>
        <button
          onClick={() => setSubTab('matches')}
          className={`py-3 text-xs font-extrabold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
            subTab === 'matches' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" /> Fixture y Partidos
        </button>
        <button
          onClick={() => setSubTab('playoffs')}
          className={`py-3 text-xs font-extrabold flex items-center gap-2 border-b-2 whitespace-nowrap transition ${
            subTab === 'playoffs' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" /> Playoffs (Cuartos, Semi y Final)
        </button>
      </div>

      {/* TABLA DE POSICIONES */}
      {subTab === 'standings' && (
        <div className="space-y-4">
          {/* BANNER INFORMATIVO DE CLASIFICACIÓN A PLAYOFFS */}
          <div className="bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-800/40 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Fase Regular: Se juegan 15 fechas. Los mejores 8 equipos clasifican a Cuartos de Final de Playoffs.</span>
            </div>
            <button
              onClick={() => setSubTab('playoffs')}
              className="text-amber-400 hover:text-amber-300 font-black flex items-center gap-1 transition"
            >
              Ver Cuadro de Playoffs <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* MOBILE CARD LIST */}
          <div className="space-y-3 md:hidden">
            {standings?.map((s: any, idx: number) => {
              const isPlayoffZone = idx < 8;
              const isLeader = idx === 0;

              return (
                <div
                  key={s.id}
                  className={`border rounded-2xl p-4 transition ${
                    isLeader
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : isPlayoffZone
                      ? 'bg-slate-900 border-emerald-500/30'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-black shrink-0 ${
                        isLeader
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                          : isPlayoffZone
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <Link to={`/equipos/${s.team.id}`} className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img src={s.team.logoUrl} alt="" className="w-7 h-7 object-contain shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-white text-sm truncate block">{s.team.name}</span>
                        {isPlayoffZone && (
                          <span className="text-[10px] text-emerald-400 font-bold block">
                            {isLeader ? '1° • Cuartos de Final' : 'Cuartos de Final'}
                          </span>
                        )}
                      </div>
                    </Link>
                    <span className="font-black text-purple-400 text-lg shrink-0">{s.points}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-800/70 text-center text-[11px]">
                    <div><span className="block text-slate-500 font-bold">PJ</span><span className="font-black text-white">{s.played}</span></div>
                    <div><span className="block text-slate-500 font-bold">PG</span><span className="font-black text-green-400">{s.won}</span></div>
                    <div><span className="block text-slate-500 font-bold">PE</span><span className="font-black text-yellow-400">{s.drawn}</span></div>
                    <div><span className="block text-slate-500 font-bold">PP</span><span className="font-black text-rose-400">{s.lost}</span></div>
                    <div><span className="block text-slate-500 font-bold">GF</span><span className="font-black text-white">{s.goalsFor}</span></div>
                    <div><span className="block text-slate-500 font-bold">GC</span><span className="font-black text-white">{s.goalsAgainst}</span></div>
                    <div><span className="block text-slate-500 font-bold">DG</span><span className="font-black text-slate-300">{s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}</span></div>
                    <div><span className="block text-slate-500 font-bold">PTS</span><span className="font-black text-purple-400">{s.points}</span></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP TABLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-extrabold uppercase border-b border-slate-800">
                    <th className="py-3 px-4 w-12 text-center">POS</th>
                    <th className="py-3 px-4">EQUIPO</th>
                    <th className="py-3 px-3 text-center">ESTADO</th>
                    <th className="py-3 px-3 text-center">PJ</th>
                    <th className="py-3 px-3 text-center">PG</th>
                    <th className="py-3 px-3 text-center">PE</th>
                    <th className="py-3 px-3 text-center">PP</th>
                    <th className="py-3 px-3 text-center">GF</th>
                    <th className="py-3 px-3 text-center">GC</th>
                    <th className="py-3 px-3 text-center">DG</th>
                    <th className="py-3 px-4 text-center font-black text-purple-400">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {standings?.map((s: any, idx: number) => {
                    const isPlayoffZone = idx < 8;
                    const isLeader = idx === 0;

                    return (
                      <tr
                        key={s.id}
                        className={`hover:bg-slate-800/40 transition ${
                          idx === 7 ? 'border-b-2 border-emerald-500/40' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center font-bold text-slate-400">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                              isLeader
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-500/20'
                                : isPlayoffZone
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Link to={`/equipos/${s.team.id}`} className="flex items-center gap-3 hover:text-purple-400 transition">
                            <img src={s.team.logoUrl} alt="" className="w-7 h-7 object-contain" />
                            <span className="font-bold text-white text-sm">{s.team.name}</span>
                          </Link>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isLeader ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <Trophy className="w-2.5 h-2.5" /> 1° Puesto
                            </span>
                          ) : isPlayoffZone ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Cuartos de Final
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500">Fase Regular</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-300 font-bold">{s.played}</td>
                        <td className="py-3 px-3 text-center text-green-400 font-bold">{s.won}</td>
                        <td className="py-3 px-3 text-center text-yellow-400 font-bold">{s.drawn}</td>
                        <td className="py-3 px-3 text-center text-rose-400 font-bold">{s.lost}</td>
                        <td className="py-3 px-3 text-center text-slate-400">{s.goalsFor}</td>
                        <td className="py-3 px-3 text-center text-slate-400">{s.goalsAgainst}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-300">
                          {s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}
                        </td>
                        <td className="py-3 px-4 text-center font-black text-purple-400 text-sm bg-purple-950/20">
                          {s.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* LEYENDA EXPLICATIVA */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400 pt-2 px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500/40 border border-emerald-400"></span>
              <span>Puestos 1 al 8: Clasifican a Cuartos de Final (Playoffs)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-700 border border-slate-600"></span>
              <span>Puestos 9 al 16: Concluyen su participación en la Fecha 15</span>
            </div>
          </div>
        </div>
      )}

      {/* FIXTURE Y PARTIDOS */}
      {subTab === 'matches' && (
        <div className="space-y-4">
          {/* BARRA DE FILTROS POR FECHA / FASE */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedRoundFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedRoundFilter === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Todos ({matches?.length || 0})
            </button>
            <button
              onClick={() => setSelectedRoundFilter('regular')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedRoundFilter === 'regular'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Fase Regular (Fechas 1 a 15)
            </button>
            <button
              onClick={() => setSelectedRoundFilter('playoffs')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedRoundFilter === 'playoffs'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 border border-amber-800/40'
              }`}
            >
              <Trophy className="w-3 h-3" /> Playoffs (Cuartos, Semi, Final)
            </button>

            {/* SEPARADOR */}
            <div className="h-4 w-px bg-slate-800 shrink-0" />

            {/* CHIPS DE FECHAS INDIVIDUALES */}
            {availableRounds.map((round) => (
              <button
                key={round}
                onClick={() => setSelectedRoundFilter(round)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedRoundFilter === round
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {round}
              </button>
            ))}
          </div>

          {filteredMatches.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400">
              No hay partidos registrados para este filtro.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {filteredMatches.map((m: any) => {
                const isPlayoff = /cuartos|semi|final/i.test(m.round || '');

                return (
                  <div
                    key={m.id}
                    className={`bg-slate-900 border rounded-2xl p-4 space-y-3 transition ${
                      isPlayoff ? 'border-amber-500/40 hover:border-amber-400/60 shadow-lg shadow-amber-500/5' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        {isPlayoff && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                        <span className={`font-bold ${isPlayoff ? 'text-amber-300 font-black' : 'text-purple-400'}`}>
                          {m.round || 'Fecha Regular'}
                        </span>
                      </div>
                      <span className="font-medium">
                        {new Date(m.scheduledAt).toLocaleDateString('es-AR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between px-2">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <img src={m.homeTeam.logoUrl} alt="" className="w-8 h-8 object-contain shrink-0" />
                        <span className="font-bold text-sm text-white truncate">{m.homeTeam.name}</span>
                      </div>

                      {m.status === 'FINISHED' ? (
                        <span className="text-base font-black text-white bg-slate-950 px-3 py-1 rounded-xl border border-slate-800 shrink-0 mx-2">
                          {m.homeScore} - {m.awayScore}
                        </span>
                      ) : m.status === 'LIVE' ? (
                        <span className="text-xs font-black text-rose-400 bg-rose-500/20 px-2.5 py-1 rounded-xl border border-rose-500/30 shrink-0 mx-2 animate-pulse">
                          EN VIVO
                        </span>
                      ) : (
                        <span className="text-xs font-black text-slate-500 px-2 shrink-0 mx-2">VS</span>
                      )}

                      <div className="flex items-center justify-end gap-2.5 flex-1 text-right min-w-0">
                        <span className="font-bold text-sm text-white truncate">{m.awayTeam.name}</span>
                        <img src={m.awayTeam.logoUrl} alt="" className="w-8 h-8 object-contain shrink-0" />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{m.venue || 'Mendoza'}</span>
                      <Link to={`/partidos/${m.id}`} className="text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1">
                        Ver Detalles <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CUADRO DE PLAYOFFS (CUARTOS, SEMI Y FINAL) */}
      {subTab === 'playoffs' && (
        <div className="space-y-6">
          {/* HEADER DE PLAYOFFS */}
          <div className="bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-900 border border-amber-800/40 rounded-3xl p-6 md:p-8 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white">Fase Final • Playoffs por el Campeonato</h2>
                <p className="text-xs md:text-sm text-amber-200/80 font-medium">
                  Tras disputar las 15 fechas regulares, los mejores 8 equipos se enfrentan en eliminación directa: Cuartos, Semifinal y Gran Final.
                </p>
              </div>
            </div>
          </div>

          {/* GRID DE LAS 3 ETAPAS DE PLAYOFFS */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* ETAPA 1: CUARTOS DE FINAL */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-black text-white text-sm">Cuartos de Final</h3>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  8 Equipos
                </span>
              </div>

              {/* Si hay partidos de cuartos creados */}
              {playoffMatches.cuartos.length > 0 ? (
                <div className="space-y-3">
                  {playoffMatches.cuartos.map((m: any) => (
                    <div key={m.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span className="font-bold text-amber-400">Cuartos</span>
                        <span>{new Date(m.scheduledAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <div className="flex items-center gap-2">
                          <img src={m.homeTeam?.logoUrl} alt="" className="w-5 h-5 object-contain" />
                          <span>{m.homeTeam?.name}</span>
                        </div>
                        <span className="font-black text-purple-400">{m.status === 'FINISHED' ? m.homeScore : '-'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <div className="flex items-center gap-2">
                          <img src={m.awayTeam?.logoUrl} alt="" className="w-5 h-5 object-contain" />
                          <span>{m.awayTeam?.name}</span>
                        </div>
                        <span className="font-black text-purple-400">{m.status === 'FINISHED' ? m.awayScore : '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Cruces proyectados según la tabla de posiciones actual */
                <div className="space-y-3">
                  <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    Cruces según posiciones actuales de la tabla:
                  </div>

                  {[
                    { seedA: 0, seedB: 7, label: 'Llave 1 (1° vs 8°)' },
                    { seedA: 1, seedB: 6, label: 'Llave 2 (2° vs 7°)' },
                    { seedA: 2, seedB: 5, label: 'Llave 3 (3° vs 6°)' },
                    { seedA: 3, seedB: 4, label: 'Llave 4 (4° vs 5°)' },
                  ].map((bracket, idx) => {
                    const teamA = top8Teams[bracket.seedA]?.team;
                    const teamB = top8Teams[bracket.seedB]?.team;

                    return (
                      <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-3 space-y-2">
                        <div className="text-[10px] font-black text-emerald-400 uppercase">{bracket.label}</div>
                        <div className="flex items-center justify-between text-xs font-bold text-white">
                          <div className="flex items-center gap-2">
                            {teamA?.logoUrl && <img src={teamA.logoUrl} alt="" className="w-5 h-5 object-contain" />}
                            <span>{teamA?.name || `${bracket.seedA + 1}° Puesto`}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-black">{bracket.seedA + 1}°</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-bold text-white">
                          <div className="flex items-center gap-2">
                            {teamB?.logoUrl && <img src={teamB.logoUrl} alt="" className="w-5 h-5 object-contain" />}
                            <span>{teamB?.name || `${bracket.seedB + 1}° Puesto`}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-black">{bracket.seedB + 1}°</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ETAPA 2: SEMIFINALES */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <h3 className="font-black text-white text-sm">Semifinales</h3>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                  4 Equipos
                </span>
              </div>

              {playoffMatches.semis.length > 0 ? (
                <div className="space-y-3">
                  {playoffMatches.semis.map((m: any) => (
                    <div key={m.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span className="font-bold text-purple-400">Semifinal</span>
                        <span>{new Date(m.scheduledAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <div className="flex items-center gap-2">
                          <img src={m.homeTeam?.logoUrl} alt="" className="w-5 h-5 object-contain" />
                          <span>{m.homeTeam?.name}</span>
                        </div>
                        <span className="font-black text-purple-400">{m.status === 'FINISHED' ? m.homeScore : '-'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <div className="flex items-center gap-2">
                          <img src={m.awayTeam?.logoUrl} alt="" className="w-5 h-5 object-contain" />
                          <span>{m.awayTeam?.name}</span>
                        </div>
                        <span className="font-black text-purple-400">{m.status === 'FINISHED' ? m.awayScore : '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                    Se definen al finalizar los Cuartos de Final:
                  </div>

                  {[
                    { label: 'Semifinal 1', from: 'Ganador Llave 1 vs Ganador Llave 4' },
                    { label: 'Semifinal 2', from: 'Ganador Llave 2 vs Ganador Llave 3' },
                  ].map((semi, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                      <div className="text-[10px] font-black text-purple-400 uppercase">{semi.label}</div>
                      <p className="text-xs font-bold text-slate-300">{semi.from}</p>
                      <div className="text-[10px] text-slate-500">A definirse tras la Fecha 15 y Cuartos</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ETAPA 3: GRAN FINAL */}
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-5 space-y-4 shadow-xl shadow-amber-500/5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h3 className="font-black text-white text-sm">Gran Final</h3>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Por el Título 👑
                </span>
              </div>

              {playoffMatches.final.length > 0 ? (
                <div className="space-y-3">
                  {playoffMatches.final.map((m: any) => (
                    <div key={m.id} className="bg-slate-950 border border-amber-500/40 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between text-xs text-amber-400 font-black">
                        <span>🏆 PARTIDO POR EL CAMPEONATO</span>
                        <span>{new Date(m.scheduledAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-extrabold text-white">
                        <div className="flex items-center gap-2">
                          <img src={m.homeTeam?.logoUrl} alt="" className="w-7 h-7 object-contain" />
                          <span>{m.homeTeam?.name}</span>
                        </div>
                        <span className="font-black text-amber-400 text-lg">{m.status === 'FINISHED' ? m.homeScore : '-'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm font-extrabold text-white">
                        <div className="flex items-center gap-2">
                          <img src={m.awayTeam?.logoUrl} alt="" className="w-7 h-7 object-contain" />
                          <span>{m.awayTeam?.name}</span>
                        </div>
                        <span className="font-black text-amber-400 text-lg">{m.status === 'FINISHED' ? m.awayScore : '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm">Final del Torneo</h4>
                    <p className="text-xs text-slate-400 mt-1">Ganador Semifinal 1 vs Ganador Semifinal 2</p>
                  </div>
                  <div className="text-[10px] font-bold text-amber-300/80 bg-amber-500/10 px-3 py-1 rounded-full inline-block">
                    Coronación del Campeón del Futsal Mendocino
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
