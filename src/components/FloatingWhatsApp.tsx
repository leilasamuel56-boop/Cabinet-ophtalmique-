import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X } from 'lucide-react';
import { clinicConfig } from '../config';

export const FloatingWhatsApp: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false);

  const whatsappUrl = `https://wa.me/${clinicConfig.whatsappNumber}?text=${encodeURIComponent(
    clinicConfig.whatsappMessageDefault
  )}`;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center gap-3">
      {/* Tooltip on hover/touch */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: 10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.95 }}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-slate-800 text-xs font-semibold shadow-lg border border-slate-200"
          >
            <span>Une question ? Écrivez au cabinet sur WhatsApp</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button with gentle pulse */}
      <motion.a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setShowTooltip(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        aria-label="Contacter le cabinet par WhatsApp"
        className="w-13 h-13 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-950/20 flex items-center justify-center relative group cursor-pointer"
      >
        {/* Ambient gentle ripple pulse */}
        <span className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping -z-10 group-hover:hidden" />
        <MessageSquare className="w-6 h-6" />
      </motion.a>
    </div>
  );
};
