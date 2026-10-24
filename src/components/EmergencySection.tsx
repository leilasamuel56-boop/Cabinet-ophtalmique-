import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Phone, MessageSquare, AlertCircle, Clock } from 'lucide-react';
import { clinicConfig } from '../config';

export const EmergencySection: React.FC = () => {
  const whatsappEmergencyUrl = `https://wa.me/${clinicConfig.whatsappNumber}?text=${encodeURIComponent(
    "URGENCE OCULAIRE : Bonjour Docteur, j'ai une urgence oculaire aiguë (douleur/baisse brutale de vision/traumatisme) et j'ai besoin d'une prise en charge rapide."
  )}`;

  return (
    <section id="urgences" className="scroll-mt-20 py-16 bg-red-50/60 relative overflow-hidden border-b border-red-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-white border-2 border-red-200 shadow-xl overflow-hidden p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Urgency warning */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-red-600 animate-pulse" />
                <span>Prise en charge sans attente</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                Urgences Oculaires Aiguës
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Tout symptôme oculaire brutal peut mettre en jeu votre acuité visuelle.
                Ne perdez pas de temps à attendre un rendez-vous ordinaire : contactez
                immédiatement l'équipe de garde.
              </p>

              {/* Symptoms List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {clinicConfig.emergencySymptoms.map((symp) => (
                  <div
                    key={symp.id}
                    className="p-3 rounded-xl bg-red-50/50 border border-red-100 flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {symp.title}
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        {symp.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Direct Immediate Contact Card */}
            <div className="lg:col-span-5 bg-gradient-to-br from-red-600 to-rose-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-center gap-2 text-red-100 text-xs font-semibold">
                  <Clock className="w-4 h-4" />
                  <span>Assistance rapide Lomé</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mt-2">
                  Ligne d'Urgence Directe
                </h3>
                <p className="text-xs text-red-100 mt-1">
                  Disponible pour orienter les traumatismes oculaires et affections aiguës.
                </p>
              </div>

              <div className="space-y-3">
                <a
                  href={whatsappEmergencyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white text-red-700 hover:bg-red-50 font-bold text-sm shadow-md transition-all whitespace-nowrap"
                >
                  <MessageSquare className="w-4 h-4 text-red-600" />
                  <span>Contacter en urgence sur WhatsApp</span>
                </a>

                <a
                  href={`tel:${clinicConfig.phone.replace(/\s+/g, '')}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-red-800/80 hover:bg-red-800 text-white font-bold text-sm border border-red-400/40 transition-all whitespace-nowrap"
                >
                  <Phone className="w-4 h-4 text-white" />
                  <span>Appeler : {clinicConfig.phoneDisplay}</span>
                </a>
              </div>

              <p className="text-[11px] text-red-200 text-center">
                Adresse : {clinicConfig.address.full}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
