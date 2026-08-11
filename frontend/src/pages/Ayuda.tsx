import React from 'react';
import { HelpCircle, ShieldAlert, Coins, Ticket, Trophy, CheckCircle2 } from 'lucide-react';

export const Ayuda: React.FC = () => {
  const faqs = [
    {
      q: '¿FutsalBet utiliza dinero real?',
      a: 'NO. FutsalBet es una plataforma 100% recreativa orientada al futsal de Mendoza. Funciona exclusivamente con Puntos Virtuales ficticios. No hay Mercado Pago, tarjetas de crédito, depósitos ni retiros.',
      icon: ShieldAlert,
    },
    {
      q: '¿Cómo obtengo Puntos Virtuales?',
      a: 'Cada usuario nuevo recibe automáticamente 1000 Puntos Virtuales al registrarse como bono de bienvenida. También ganas puntos al acertar tus pronósticos deportivos.',
      icon: Coins,
    },
    {
      q: '¿Cómo funcionan los pronósticos combinados?',
      a: 'Puedes seleccionar 2 o más opciones de partidos diferentes. Las cuotas virtuales se multiplicarán automáticamente (ej: 1.80 × 1.50 = 2.70). Si aciertas todas las selecciones, ganas la combinación.',
      icon: Ticket,
    },
    {
      q: '¿Cómo se resuelven las apuestas cuando termina un partido?',
      a: 'El sistema calcula automáticamente el resultado final. Si el pronóstico fue correcto, se transfieren los puntos correspondientes a tu billetera virtual y recibes una notificación.',
      icon: CheckCircle2,
    },
    {
      q: '¿Qué es el Ranking de Usuarios?',
      a: 'Es una tabla de posiciones pública entre todos los usuarios registrados donde se compite de forma recreativa por quién acumula la mayor cantidad de Puntos Virtuales.',
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
        <p className="text-xs text-slate-400">Todo lo que necesitas saber sobre FutsalBet</p>
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
