import React from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  ArrowRight,
  ShieldAlert,
  Tag,
  CheckCircle2,
} from 'lucide-react';
import { clinicConfig } from '../config';

interface ServicesSectionProps {
  onSelectService: (serviceId: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectService }) => {
  return (
    <section id="services" className="scroll-mt-20 py-20 bg-slate-50 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="max-w-2xl text-left mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Prestations Médicales & Chirurgicales
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight text-balance">
            Nos Services Ophtalmologiques Spécialisés
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Diagnostics biomicroscopiques de pointe et interventions micro-chirurgicales ambulatoires de référence à Lomé.
          </p>
        </div>

        {/* Grid of 6 Premium Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {clinicConfig.services.map((service, index) => {
            const isUrgent = service.isUrgent;

            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                whileHover={{ y: -6 }}
                className={`group rounded-3xl overflow-hidden bg-white border transition-all duration-300 flex flex-col justify-between shadow-xs hover:shadow-xl ${
                  isUrgent
                    ? 'border-red-200 hover:border-red-400 hover:shadow-red-500/10'
                    : 'border-slate-200 hover:border-teal-300 hover:shadow-teal-900/10'
                }`}
              >
                <div>
                  {/* Image en haut : object-fit cover, hauteur 220px, largeur 100%, coins arrondis */}
                  <div className="relative w-full h-[220px] overflow-hidden bg-slate-100">
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-[220px] object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />

                    {/* Gradient scrim overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />

                    {/* Badge / Bouton en haut de la carte */}
                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
                      <button
                        type="button"
                        onClick={() => onSelectService(service.id)}
                        className={`pointer-events-auto px-3 py-1.5 rounded-xl text-xs font-bold backdrop-blur-md shadow-md transition-all cursor-pointer ${
                          isUrgent
                            ? 'bg-red-600/90 hover:bg-red-600 text-white border border-red-400/40'
                            : 'bg-white/90 hover:bg-white text-slate-900 border border-white/60 hover:text-teal-700'
                        }`}
                      >
                        {service.badge || service.name}
                      </button>

                      {isUrgent && (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-700 text-white text-[11px] font-bold shadow-md animate-pulse">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Urgence</span>
                        </span>
                      )}
                    </div>

                    {/* Service Name anchored on bottom of image */}
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="text-lg font-extrabold text-white leading-tight drop-shadow-md">
                        {service.name}
                      </h3>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    {/* Detailed description */}
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed min-h-[72px]">
                      {service.fullDescription}
                    </p>

                    {/* Price and Duration strip */}
                    <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-teal-600" />
                          <span>Tarif</span>
                        </span>
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm mt-0.5 font-mono">
                          {service.price}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-teal-600" />
                          <span>Durée</span>
                        </span>
                        <span className="font-bold text-slate-800 text-xs sm:text-sm mt-0.5">
                          ~{service.defaultDurationMinutes} min
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bouton de sélection en bas */}
                <div className="p-6 pt-0">
                  <button
                    onClick={() => onSelectService(service.id)}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98 ${
                      isUrgent
                        ? 'bg-red-600 hover:bg-red-700 text-white hover:shadow-md'
                        : 'bg-teal-600 hover:bg-teal-700 text-white hover:shadow-teal-600/20 hover:shadow-md'
                    }`}
                  >
                    <span>{isUrgent ? 'Contacter en urgence' : 'Sélectionner ce service'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
