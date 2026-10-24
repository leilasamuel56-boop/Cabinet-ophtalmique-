import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { clinicConfig } from '../config';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-20 bg-slate-50 border-b border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Foire Aux Questions
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Questions fréquentes de nos patients
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            Retrouvez les réponses aux interrogations régulières concernant les consultations et chirurgies oculaires.
          </p>
        </div>

        <div className="space-y-3.5">
          {clinicConfig.faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleAccordion(idx)}
                  className="w-full px-5 py-4 sm:px-6 sm:py-4.5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 sm:px-6 sm:pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
