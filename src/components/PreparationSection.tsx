import React from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Glasses,
  Users,
  Clock,
  Sparkles,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { clinicConfig } from '../config';

const getPrepIcon = (iconName: string) => {
  switch (iconName) {
    case 'FileCheck':
      return <FileText className="w-6 h-6 text-teal-600" />;
    case 'Glasses':
      return <Glasses className="w-6 h-6 text-teal-600" />;
    case 'UserCheck':
      return <Users className="w-6 h-6 text-teal-600" />;
    case 'Clock':
      return <Clock className="w-6 h-6 text-teal-600" />;
    case 'Sparkles':
      return <Sparkles className="w-6 h-6 text-teal-600" />;
    default:
      return <Info className="w-6 h-6 text-teal-600" />;
  }
};

export const PreparationSection: React.FC = () => {
  return (
    <section id="preparation" className="scroll-mt-20 py-20 bg-white border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-left max-w-2xl mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Conseils Médicaux Pratiques
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight text-balance">
            Préparation avant votre rendez-vous
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Afin de garantir un examen ophtalmologique optimal et éviter tout retard,
            veuillez respecter ces quelques recommandations simples.
          </p>
        </div>

        {/* Warning Callout for Dilated Pupil / Driving */}
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <strong className="font-bold">Attention importante pour la conduite :</strong> Si vous venez pour un fond d'œil (diabète, bilan rétine) ou une chirurgie de la cataracte, l'instillation de gouttes anesthésiantes ou dilatatrices provoque un flou visuel temporaire (2 à 4h). <span className="underline font-semibold">Ne venez pas seul(e) au volant de votre voiture ou en moto.</span>
          </div>
        </div>

        {/* Grid of Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clinicConfig.preparationInstructions.map((instruction, idx) => (
            <motion.div
              key={instruction.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className={`p-6 rounded-2xl border transition-all ${
                instruction.important
                  ? 'bg-teal-50/30 border-teal-200 shadow-xs'
                  : 'bg-white border-slate-200/90 shadow-xs hover:border-teal-200'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center mb-4 border border-teal-100">
                {getPrepIcon(instruction.icon)}
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">
                {instruction.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {instruction.text}
              </p>
              {instruction.important && (
                <span className="inline-block mt-3 text-[10px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/70 px-2 py-0.5 rounded-sm">
                  Recommandé
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
