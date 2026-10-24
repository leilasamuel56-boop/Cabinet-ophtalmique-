import React from 'react';
import { motion } from 'motion/react';
import { Calendar, MessageSquare, ClipboardCheck, ArrowRight } from 'lucide-react';

interface HowItWorksProps {
  onStartBooking: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onStartBooking }) => {
  const steps = [
    {
      step: '01',
      title: 'Je choisis mon créneau',
      description:
        'Sélectionnez votre type de consultation et choisissez directement une date et une heure disponible en temps réel selon les horaires du cabinet.',
      icon: <Calendar className="w-6 h-6 text-teal-600" />,
      tag: 'Sans attente',
    },
    {
      step: '02',
      title: 'Je valide sur WhatsApp',
      description:
        'Votre créneau est immédiatement bloqué. Vous êtes redirigé(e) vers notre WhatsApp avec le récapitulatif complet prêt à envoyer en un clic.',
      icon: <MessageSquare className="w-6 h-6 text-teal-600" />,
      tag: 'Confirmation directe',
    },
    {
      step: '03',
      title: 'Je reçois mes consignes',
      description:
        'Vous obtenez vos consignes personnalisées (ordonnances, lunettes actuelles, accompagnateur en cas de dilatation) pour une prise en charge sereine.',
      icon: <ClipboardCheck className="w-6 h-6 text-teal-600" />,
      tag: 'Sérénité médicale',
    },
  ];

  return (
    <section id="demarche" className="scroll-mt-20 py-20 bg-white border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Parcours Patient Simplifié
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Comment prendre votre rendez-vous en 3 étapes
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Une démarche fluide, transparente et adaptée à votre quotidien à Lomé.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-1/3 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-teal-200 via-teal-400 to-teal-200 -z-0" />

          {steps.map((item, idx) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.15 }}
              className="relative z-10 bg-white rounded-3xl p-7 border border-slate-200/90 shadow-xs hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-13 h-13 rounded-2xl bg-teal-50 flex items-center justify-center border border-teal-100">
                    {item.icon}
                  </div>
                  <span className="text-2xl font-black text-slate-200 font-mono">
                    {item.step}
                  </span>
                </div>

                <div className="inline-block text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md mb-2">
                  {item.tag}
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Étape {idx + 1} sur 3
                </span>
                {idx === 0 && (
                  <button
                    onClick={onStartBooking}
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
                  >
                    <span>Commencer</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
