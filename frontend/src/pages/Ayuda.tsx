import React from 'react';
import { HelpCircle, ShieldCheck, Target, Trophy, Lock, CheckCircle2 } from 'lucide-react';

export const Ayuda: React.FC = () => {
  const faqs = [
    {
      q: '¿Qué es el Prode de FutsalBet?',
      a: 'Es un juego de pronósticos 100% recreativo. Pronosticás el resultado (Local-Visitante) de cada partido del torneo FEFUSA Mendoza antes de que arranque, y sumás puntos por aciertos.',
      icon: Target,
    },
    {
      q: '¿FutsalBet utiliza dinero real?',
      a: 'NO. FutsalBet es una plataforma recreativa del futsal de Mendoza. No hay dinero real, depósitos ni retiros: solo se juega por puntos y prestigio en la tabla del prode.',
      icon: ShieldCheck,
    },
    {
      q: '¿Cómo se puntúa?',
      a: 'Resultado exacto: 6 puntos. Acertar el ganador o el empate sin el marcador exacto: 3 puntos. Pronóstico fallado: 0 puntos.',
      icon: Trophy,
    },
    {
      q: '¿Hasta cuándo puedo cargar o editar mi pronóstico?',
      a: 'Podés cargar y modificar tu pronóstico hasta que comience el partido. Cuando pasa el horario de inicio, el pronóstico queda bloqueado y no se puede editar.',
      icon: Lock,
    },
    {
      q: '¿Cuándo se suman los puntos?',
      a: 'Cuando el partido finaliza, el sistema compara tu pronóstico con el resultado real y suma los puntos automáticamente. Recibís una notificación con el resultado.',
      icon: CheckCircle2,
    },
    {
      q: '¿Qué es la Tabla del Prode?',
      a: 'Es el ranking público de todos los jugadores, ordenado por puntos acumulados en el prode del torneo. Ganar más partidos exactos te sube en la tabla.',
      icon: Trophy,
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto mb-2">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-white">Preguntas Frecuentes y Reglas</h1>
        <p className="text-xs text-slate-400">Todo lo que necesitas saber sobre el Prode FutsalBet</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const Icon = faq.icon;
          return (
            <div key={idx} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-800/60 text-purple-400 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-base text-white">{faq.q}</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-11">{faq.a}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};