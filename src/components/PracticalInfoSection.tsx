import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { MapPin, Clock, Phone, MessageSquare, ExternalLink, Navigation } from 'lucide-react';
import { clinicConfig } from '../config';

export const PracticalInfoSection: React.FC = () => {
  // Compute current open/closed status for Lomé (UTC/GMT+0)
  const isClinicOpenNow = useMemo(() => {
    const now = new Date();
    // Lomé is GMT+0 / UTC+0
    const utcDay = now.getUTCDay(); // 0 is Sun, 6 is Sat
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const currentMins = utcHours * 60 + utcMinutes;

    if (utcDay >= 1 && utcDay <= 5) {
      // Monday to Friday: 7:30 to 16:00
      return currentMins >= 7 * 60 + 30 && currentMins < 16 * 60;
    } else if (utcDay === 6) {
      // Saturday: 8:00 to 12:00
      return currentMins >= 8 * 60 && currentMins < 12 * 60;
    }
    return false;
  }, []);

  return (
    <section id="infos" className="scroll-mt-24 py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-left max-w-2xl mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Localisation & Accès
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Venir à notre cabinet d'ophtalmologie
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Facilement accessible au Quartier Dakar à Lomé, avec stationnement sécurisé et accueil adapté pour les patients à mobilité réduite.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left: Practical details card */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-xs flex flex-col justify-between h-full space-y-6">
              {/* Status indicator */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Statut du cabinet
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    isClinicOpenNow
                      ? 'bg-teal-100 text-teal-800 border border-teal-200'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isClinicOpenNow ? 'bg-teal-600 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  <span>{isClinicOpenNow ? 'Ouvert actuellement' : 'Fermé actuellement'}</span>
                </span>
              </div>

              {/* Address item */}
              <div className="flex items-start gap-4 pt-1">
                <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 text-teal-600 shadow-xs">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Adresse</h4>
                  <p className="text-xs sm:text-sm text-slate-700 mt-1 font-medium leading-relaxed">
                    {clinicConfig.address.full}
                  </p>
                  <p className="text-xs text-teal-700 font-semibold mt-1">
                    Repère : tout près de l'hôtel La Négresse
                  </p>
                </div>
              </div>

              {/* Hours item */}
              <div className="flex items-start gap-4 pt-4 border-t border-slate-200/80">
                <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 text-teal-600 shadow-xs">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="w-full">
                  <h4 className="text-sm font-bold text-slate-900 mb-2">Horaires d'ouverture</h4>
                  <div className="space-y-2 text-xs sm:text-sm text-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-600">Lundi – Vendredi :</span>
                      <span className="font-bold text-slate-900">7h30 – 16h00</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-600">Samedi :</span>
                      <span className="font-bold text-slate-900">8h00 – 12h00</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Dimanche :</span>
                      <span>Fermé (Urgences sur appel)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone item */}
              <div className="flex items-start gap-4 pt-4 border-t border-slate-200/80">
                <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 text-teal-600 shadow-xs">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Contact direct</h4>
                  <p className="text-sm sm:text-base text-slate-900 font-mono font-bold mt-1">
                    {clinicConfig.phoneDisplay}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Accueil téléphonique et assistance WhatsApp
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 grid grid-cols-2 gap-3">
                <a
                  href={`tel:${clinicConfig.phone.replace(/\s+/g, '')}`}
                  className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  <span>Appeler</span>
                </a>
                <a
                  href={`https://wa.me/${clinicConfig.whatsappNumber}?text=${encodeURIComponent(
                    clinicConfig.whatsappMessageDefault
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right: Embedded Interactive Map Container */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="rounded-3xl overflow-hidden border border-slate-200/90 shadow-md bg-slate-100 flex flex-col h-full min-h-[460px]">
              {/* Map header toolbar */}
              <div className="px-5 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-teal-600" />
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    Plan d'accès interactif · Lomé
                  </span>
                </div>
                <a
                  href={clinicConfig.address.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-700 hover:text-teal-800 transition-colors"
                >
                  <span>Ouvrir dans Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Responsive Google Maps Embed */}
              <div className="flex-1 w-full relative min-h-[380px]">
                <iframe
                  title="Plan d'accès Cabinet d'Ophtalmologie Quartier Dakar Lomé"
                  src="https://maps.google.com/maps?q=Quartier+Dakar+Lome+Togo+Hotel+La+Negresse&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full min-h-[420px] border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Map Bottom Hint */}
              <div className="px-5 py-3.5 bg-white border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                <span>Quartier Dakar · Proche hôtel La Négresse, Lomé</span>
                <span className="font-semibold text-teal-700">Togo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
