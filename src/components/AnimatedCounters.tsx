import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { clinicConfig } from '../config';

const CounterItem: React.FC<{
  label: string;
  value: number;
  suffix: string;
  description: string;
  delayIndex: number;
}> = ({ label, value, suffix, description, delayIndex }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let startTime: number | null = null;
    const duration = 1600; // ms
    const startValue = 0;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out expo
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(easeOut * (value - startValue) + startValue);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [isInView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: delayIndex * 0.1 }}
      className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-teal-300 transition-all group"
    >
      <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-mono tabular-nums">
        <span className="text-teal-700">{displayValue.toLocaleString('fr-FR')}</span>
        <span className="text-teal-500 ml-0.5">{suffix}</span>
      </div>
      <h3 className="mt-2 text-sm sm:text-base font-bold text-slate-800">
        {label}
      </h3>
      <p className="mt-1 text-xs text-slate-500 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
};

export const AnimatedCounters: React.FC = () => {
  return (
    <section className="py-12 bg-white border-y border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {clinicConfig.metrics.map((metric, idx) => (
            <CounterItem
              key={metric.label}
              label={metric.label}
              value={metric.value}
              suffix={metric.suffix}
              description={metric.description}
              delayIndex={idx}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
