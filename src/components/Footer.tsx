import React from 'react';
import { Lock, Heart, Shield } from 'lucide-react';
import { clinicConfig } from '../config';

interface FooterProps {
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs py-12 border-t border-slate-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          {/* Col 1: About */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <span>{clinicConfig.name}</span>
            </div>
            <p className="text-slate-400 max-w-sm leading-relaxed text-xs">
              Soins ophtalmologiques d'excellence, chirurgie moderne de la cataracte et des paupières,
              prise en charge du glaucome et bilan de rétinopathie au Togo.
            </p>
            <p className="text-slate-500 text-[11px]">
              {clinicConfig.address.full}
            </p>
          </div>

          {/* Col 2: Services rapides */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Services Principaux
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>Consultations ophtalmologiques</li>
              <li>Chirurgie de la cataracte</li>
              <li>Dépistage du glaucome</li>
              <li>Fond d'œil diabète</li>
              <li>Urgences oculaires</li>
            </ul>
          </div>

          {/* Col 3: Horaires & Téléphone */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">
              Horaires & Contact
            </h4>
            <div className="space-y-1 text-xs">
              <p className="text-slate-300 font-semibold">{clinicConfig.operatingHours.weekday}</p>
              <p className="text-slate-300 font-semibold">{clinicConfig.operatingHours.saturday}</p>
              <p className="text-slate-400 pt-1 font-mono">{clinicConfig.phoneDisplay}</p>
              <p className="text-teal-400 text-[11px]">WhatsApp actif 7j/7 pour urgences</p>
            </div>
          </div>
        </div>

        {/* Bottom bar with discreet Admin link */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} {clinicConfig.name} · Tous droits réservés.
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              <span>Fait avec rigueur médicale pour Lomé</span>
            </span>

            {/* Discrete Admin Link at the very bottom */}
            <button
              onClick={onOpenAdmin}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-teal-400 transition-colors py-1 px-2 rounded-md hover:bg-slate-800/80 cursor-pointer"
              title="Accès réservé au médecin et au secrétariat"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Espace administrateur</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
