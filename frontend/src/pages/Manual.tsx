import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  User,
  Shield,
  Trophy,
  HelpCircle,
  CheckCircle2,
  Printer,
  ChevronDown,
  ChevronUp,
  Target,
  Users,
  Award,
  Lock,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface ManualSection {
  id: string;
  category: 'user' | 'admin' | 'rules' | 'faq';
  title: string;
  subtitle: string;
  icon: React.ElementType;
  badge?: string;
  steps?: { stepNumber: number; title: string; description: string }[];
  details?: string[];
}

export const Manual: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'user' | 'admin' | 'rules' | 'faq'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openAccordionId, setOpenAccordionId] = useState<string | null>('user-prode');

  const manualSections: ManualSection[] = [
    {
      id: 'user-register',
      category: 'user',
      title: '1. Registro e Inicio de Sesión',
      subtitle: 'Crea tu cuenta gratuita y comienza a pronosticar marcadores',
      icon: User,
      badge: 'Paso inicial',
      steps: [
        { stepNumber: 1, title: 'Crear Cuenta', description: 'Haz clic en "Registrarse" arriba a la derecha e ingresa tu email, username y contraseña.' },
        { stepNumber: 2, title: 'Acceso Inmediato', description: 'Al registrarte accederás directamente a la plataforma para participar en el Prode de FEFUSA Mendoza.' },
        { stepNumber: 3, title: 'Tu Perfil', description: 'Podrás consultar tu estadística personal, aciertos exactos y ranking global desde la sección Perfil.' }
      ]
    },
    {
      id: 'user-prode',
      category: 'user',
      title: '2. Cómo Realizar Pronósticos (Prode)',
      subtitle: 'Pronostica marcadores de partidos de FEFUSA Mendoza y suma puntos',
      icon: Target,
      badge: 'Recomendado',
      steps: [
        { stepNumber: 1, title: 'Explorar Partidos', description: 'Ve a "Prode" o "Partidos" para explorar la lista de encuentros disponibles de la fecha.' },
        { stepNumber: 2, title: 'Ingresar Marcador', description: 'Ingresa la cantidad de goles esperada para el equipo Local y el equipo Visitante.' },
        { stepNumber: 3, title: 'Guardar Pronósticos', description: 'Haz clic en "Guardar Pronóstico" en cada partido o "Guardar todos" para enviar la fecha.' },
        { stepNumber: 4, title: 'Límite de Edición', description: 'Puedes modificar tus marcadores las veces que quieras hasta la hora exacta de inicio del partido.' }
      ]
    },
    {
      id: 'user-groups',
      category: 'user',
      title: '3. Grupos Privados y Amigos',
      subtitle: 'Compite en ligas privadas creadas exclusivamente para tus amigos o club',
      icon: Users,
      badge: 'Social',
      steps: [
        { stepNumber: 1, title: 'Crear o Unirse a Grupo', description: 'Ingresa a "Grupos Privados" en el menú principal.' },
        { stepNumber: 2, title: 'Código de Invitación', description: 'Genera un código único al crear tu grupo y compártelo por WhatsApp con tus amigos.' },
        { stepNumber: 3, title: 'Tabla Exclusiva', description: 'El grupo mantiene un ranking independiente calculado con los puntos del Prode de cada miembro.' }
      ]
    },
    {
      id: 'user-leaderboard',
      category: 'user',
      title: '4. Tabla General y Mis Pronósticos',
      subtitle: 'Escala posiciones demostrando tu conocimiento del Futsal Mendocino',
      icon: Trophy,
      badge: 'Ranking',
      steps: [
        { stepNumber: 1, title: 'Acumulación de Puntos', description: 'Sumas 6 puntos por acertar el resultado exacto y 3 puntos por acertar la tendencia (ganador o empate).' },
        { stepNumber: 2, title: 'Mis Pronósticos', description: 'Revisa en "Mis Pronósticos" tus marcadores guardados, aciertos y resultados finales.' },
        { stepNumber: 3, title: 'Notificaciones', description: 'Recibes alertas al finalizar los partidos informándote cuántos puntos sumaste en la fecha.' }
      ]
    },
    {
      id: 'admin-matches',
      category: 'admin',
      title: '1. Creación y Programación de Partidos',
      subtitle: 'Panel exclusivo de Administrador para gestionar torneos y fechas',
      icon: Shield,
      badge: 'Solo Admin',
      steps: [
        { stepNumber: 1, title: 'Acceso al Panel', description: 'Inicia sesión como Admin y presiona el botón "Panel Admin" en la barra superior.' },
        { stepNumber: 2, title: 'Crear o Editar Partido', description: 'Navega a /admin/partidos, selecciona equipos, fecha/hora, cancha y fase del torneo.' },
        { stepNumber: 3, title: 'Estado del Partido', description: 'Gestiona la transición entre SCHEDULED (Programado), LIVE (En Vivo) y FINISHED (Finalizado).' }
      ]
    },
    {
      id: 'admin-settlement',
      category: 'admin',
      title: '2. Carga de Resultado y Cierre Automático',
      subtitle: 'El motor del sistema procesa marcadores y suma puntos automáticamente',
      icon: CheckCircle2,
      badge: 'Solo Admin',
      steps: [
        { stepNumber: 1, title: 'Finalizar Encuentro', description: 'Cambia el estado del partido a FINISHED e ingresa el marcador final real (ej: 4 - 2).' },
        { stepNumber: 2, title: 'Cierre Automático', description: 'El backend procesa todas las predicciones registradas para ese partido.' },
        { stepNumber: 3, title: 'Acreditación de Puntos', description: 'El sistema otorga 6 o 3 puntos a cada usuario según corresponda y actualiza la Tabla General.' }
      ]
    },
    {
      id: 'rules-scoring',
      category: 'rules',
      title: 'Sistema de Puntuación y Bloqueo',
      subtitle: 'Conoce cómo se calculan los puntos en el Prode y sus restricciones',
      icon: Award,
      badge: 'Reglas',
      details: [
        '🎯 Resultado Exacto (Prode): Otorga 6 Puntos directos en la tabla general.',
        '⚽ Tendencia Ganadora / Empate: Otorga 3 Puntos directos si acertaste el ganador o el empate sin dar el marcador exacto.',
        '❌ Sin Acierto: Otorga 0 Puntos.',
        '🔒 Bloqueo Automático: Al llegar la hora exacta de inicio del partido, todos los pronósticos sobre ese encuentro quedan bloqueados sin excepción.'
      ]
    },
    {
      id: 'faq-points',
      category: 'faq',
      title: '¿FutsalBet requiere o utiliza dinero real?',
      subtitle: 'Información sobre el funcionamiento recreativo',
      icon: ShieldAlert,
      badge: 'FAQ',
      details: [
        '❌ NO. FutsalBet es una plataforma 100% recreativa de Prode.',
        '🚫 No existe dinero real, apuestas monetarias, ni integración con Mercado Pago o bancos.',
        '🏆 El único fin es el entretenimiento y la competición deportiva entre seguidores del futsal mendocino.'
      ]
    }
  ];

  const filteredSections = useMemo(() => {
    return manualSections.filter((section) => {
      const matchesCategory = activeCategory === 'all' || section.category === activeCategory;
      const matchesQuery =
        searchQuery.trim() === '' ||
        section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.steps?.some(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        section.details?.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  const toggleAccordion = (id: string) => {
    setOpenAccordionId(prev => (prev === id ? null : id));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 px-2 sm:px-4">
      {/* HEADER HERO */}
      <div className="bg-gradient-to-r from-purple-900/40 via-slate-900 to-indigo-950/40 border border-purple-500/20 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-3 z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Centro de Ayuda y Documentación</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Manual de Usuario <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">FutsalBet</span>
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Aprende a realizar tus pronósticos de marcadores exactos, sumar puntos, competir en grupos privados y dominar todas las herramientas para usuarios y administradores.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="z-10 shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition shadow-lg hover:shadow-purple-500/10"
          title="Imprimir o guardar como PDF"
        >
          <Printer className="w-4 h-4 text-purple-400" />
          <span>Imprimir PDF</span>
        </button>

        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* SEARCH AND FILTER BAR */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por palabra clave (ej. Prode, Marcador, Puntos, Admin...)"
            className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* CATEGORY TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', label: 'Todos los Temas', icon: BookOpen },
            { id: 'user', label: 'Jugadores (Usuarios)', icon: User },
            { id: 'admin', label: 'Administración', icon: Shield },
            { id: 'rules', label: 'Reglas y Puntuación', icon: Award },
            { id: 'faq', label: 'Preguntas Frecuentes', icon: HelpCircle },
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap border ${
                  isActive
                    ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTIONS LIST ACCORDION */}
      <div className="space-y-4">
        {filteredSections.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No se encontraron resultados</h3>
            <p className="text-xs text-slate-400 mt-1">Intenta buscar con otros términos o cambia la categoría seleccionada.</p>
          </div>
        ) : (
          filteredSections.map((section) => {
            const Icon = section.icon;
            const isOpen = openAccordionId === section.id;

            return (
              <div
                key={section.id}
                className={`bg-slate-900 border transition duration-200 rounded-3xl overflow-hidden shadow-xl ${
                  isOpen ? 'border-purple-500/50 ring-1 ring-purple-500/20' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* ACCORDION HEADER */}
                <button
                  onClick={() => toggleAccordion(section.id)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                      section.category === 'admin'
                        ? 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                        : 'bg-purple-950/60 border-purple-500/40 text-purple-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-base font-extrabold text-white truncate">{section.title}</h3>
                        {section.badge && (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            section.category === 'admin'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                          }`}>
                            {section.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">{section.subtitle}</p>
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-slate-800/80 text-slate-400 shrink-0">
                    {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* ACCORDION BODY */}
                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 border-t border-slate-800/60 pt-5 space-y-6">
                    {/* STEPS LIST */}
                    {section.steps && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {section.steps.map((step) => (
                          <div
                            key={step.stepNumber}
                            className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex gap-3.5 items-start"
                          >
                            <div className="w-7 h-7 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md shadow-purple-600/30">
                              {step.stepNumber}
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-xs font-extrabold text-white">{step.title}</h4>
                              <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* DETAILS LIST */}
                    {section.details && (
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
                        {section.details.map((detail, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                            <span className="shrink-0 mt-0.5 text-purple-400">•</span>
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* QUICK FOOTER INFO CARD */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">¿Tienes dudas adicionales sobre las reglas?</h4>
            <p className="text-xs text-slate-400">Revisa la sección de Preguntas Frecuentes o comunícate con el administrador del torneo.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
