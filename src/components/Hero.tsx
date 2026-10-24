import React from 'react';
import { motion } from 'motion/react';
import { Calendar, ShieldAlert, ArrowRight, CheckCircle2, MapPin } from 'lucide-react';
import { clinicConfig } from '../config';
import { InteractiveEye } from './InteractiveEye';

interface HeroProps {
  onBookClick: () => void;
  onEmergencyClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onBookClick, onEmergencyClick }) => {
  const headlineWords = [
    'Votre',
    'vision,',
    'notre',
    'vocation',
    'chirurgicale',
    'au',
    'cœur',
    'de',
    'Lomé.',
  ];

  return (
    <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden bg-gradient-to-b from-teal-50/60 via-white to-slate-50">
      {/* Gentle organic animated ambient gradient bubbles */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-teal-200/25 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-36 right-10 w-80 h-80 bg-cyan-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Headlines & Actions */}
          <div className="lg:col-span-7 text-left space-y-6">
            {/* Location & Specialist Kicker */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>{clinicConfig.address.district}, Lomé (près de l'hôtel La Négresse)</span>
            </motion.div>

            {/* Mot-par-mot animated headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.18] text-balance">
              {headlineWords.map((word, idx) => (
                <motion.span
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: 0.08 + idx * 0.04,
                    ease: [0.2, 0.65, 0.3, 0.9],
                  }}
                  className={`inline-block mr-2 ${
                    word.includes('vocation') || word.includes('chirurgicale')
                      ? 'text-teal-700 underline decoration-teal-300 decoration-wavy underline-offset-4'
                      : ''
                  }`}
                >
                  {word}
                </motion.span>
              ))}
            </h1>

            {/* Sub-text */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed"
            >
              Consultations ophtalmologiques complètes, chirurgie de pointe de la{' '}
              <strong className="text-slate-800 font-semibold">cataracte</strong>, dépistage du{' '}
              <strong className="text-slate-800 font-semibold">glaucome</strong> et suivi du{' '}
              <strong className="text-slate-800 font-semibold">diabète oculaire</strong>.
              Prenez votre rendez-vous en ligne avec confirmation directe par WhatsApp.
            </motion.p>

            {/* Reassuring bullet points */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs text-slate-600 font-medium"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Micro-chirurgie ambulatoire indolore</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Matériel biomicroscopique de pointe</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Prise de rendez-vous sans attente au cabinet</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Horaires adaptés dès 7h30 du matin</span>
              </div>
            </motion.div>

            {/* Buttons with micro-bounce and magnetic interaction */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.6 }}
              className="flex flex-wrap items-center gap-3.5 pt-2"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onBookClick}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm sm:text-base font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md hover:shadow-teal-600/25 transition-all cursor-pointer whitespace-nowrap"
              >
                <Calendar className="w-5 h-5" />
                <span>Réserver un rendez-vous</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onEmergencyClick}
                className="inline-flex items-center gap-2 px-5 py-3.5 text-sm sm:text-base font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all cursor-pointer whitespace-nowrap"
              >
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <span>Urgence oculaire</span>
              </motion.button>
            </motion.div>
          </div>

          {/* Right Column: Interactive Eye & Doctor Visual Card */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="w-full flex flex-col items-center"
            >
              {/* Interactive Eye Component */}
              <div className="p-4 bg-white/70 backdrop-blur-md rounded-3xl border border-teal-100 shadow-xl shadow-teal-900/5 relative">
                <InteractiveEye size={290} />

                {/* Eye caption */}
                <p className="text-center text-xs text-slate-500 mt-2">
                  Bougez le curseur ou touchez l'écran : la pupille suit votre regard
                </p>
              </div>

              {/* Doctor credential card snippet */}
              <div className="mt-5 w-full max-w-sm bg-white/90 backdrop-blur-xs rounded-2xl p-3.5 border border-slate-200 shadow-xs flex items-center gap-3.5">
                <img
                  src="https://i.imgur.com/pbXhLGh.jpeg"
                  alt={`${clinicConfig.doctorName}, ${clinicConfig.doctorTitle}`}
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border-2 border-teal-500/30 shadow-xs"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {clinicConfig.doctorName}
                  </h4>
                  <p className="text-xs text-teal-700 font-medium truncate">
                    {clinicConfig.doctorTitle}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {clinicConfig.operatingHours.weekday}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
