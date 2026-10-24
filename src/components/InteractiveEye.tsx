import React, { useEffect, useRef, useState } from 'react';
import { motion, useSpring } from 'motion/react';

interface InteractiveEyeProps {
  className?: string;
  size?: number;
}

export const InteractiveEye: React.FC<InteractiveEyeProps> = ({
  className = '',
  size = 280,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isLookingAtUser, setIsLookingAtUser] = useState(false);

  // Smooth springs for eye pupil movement
  const pupilX = useSpring(0, { stiffness: 180, damping: 20 });
  const pupilY = useSpring(0, { stiffness: 180, damping: 20 });

  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const eyeCenterX = rect.left + rect.width / 2;
      const eyeCenterY = rect.top + rect.height / 2;

      let clientX = 0;
      let clientY = 0;

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const deltaX = clientX - eyeCenterX;
      const deltaY = clientY - eyeCenterY;
      const distance = Math.hypot(deltaX, deltaY);
      const angle = Math.atan2(deltaY, deltaX);

      // Maximum offset radius in SVG units
      const maxRadius = 38;
      const factor = Math.min(distance / 250, 1);
      const targetRadius = maxRadius * factor;

      pupilX.set(Math.cos(angle) * targetRadius);
      pupilY.set(Math.sin(angle) * targetRadius * 0.7); // slightly squished vertically for anatomical eye shape
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
    };
  }, [pupilX, pupilY]);

  // Periodic gentle natural blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 240);
    }, 4500);

    return () => clearInterval(blinkInterval);
  }, []);

  const triggerBlink = () => {
    setIsBlinking(true);
    setTimeout(() => setIsBlinking(false), 260);
  };

  return (
    <div
      ref={containerRef}
      onClick={triggerBlink}
      title="Cliquez pour faire cligner l'œil !"
      className={`relative cursor-pointer select-none group ${className}`}
      style={{ width: size, height: size * 0.75 }}
    >
      {/* Outer ambient glow */}
      <div className="absolute inset-0 rounded-full bg-teal-400/15 blur-2xl transform scale-110 group-hover:bg-teal-400/25 transition-all duration-700 pointer-events-none" />

      <svg
        viewBox="0 0 320 240"
        className="w-full h-full drop-shadow-xl overflow-visible"
      >
        <defs>
          {/* Sclera gradient */}
          <radialGradient id="scleraGrad" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#FFFFFF" />
            <stop offset="90%" stopColor="#F0FDFA" />
            <stop offset="100%" stopColor="#CCFBF1" />
          </radialGradient>

          {/* Iris complex gradient */}
          <radialGradient id="irisGrad" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#2DD4BF" />
            <stop offset="35%" stopColor="#0D9488" />
            <stop offset="70%" stopColor="#0F766E" />
            <stop offset="100%" stopColor="#115E59" />
          </radialGradient>

          {/* Outer limbal ring */}
          <linearGradient id="limbalRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#042F2E" />
            <stop offset="100%" stopColor="#0F766E" />
          </linearGradient>

          {/* Eye aperture clip path */}
          <clipPath id="eyeContour">
            <path d="M 20 120 Q 160 25 300 120 Q 160 215 20 120 Z" />
          </clipPath>
        </defs>

        {/* Outer subtle shadow contour */}
        <path
          d="M 18 120 Q 160 20 302 120 Q 160 220 18 120 Z"
          fill="none"
          stroke="rgba(15, 118, 110, 0.15)"
          strokeWidth="10"
          className="blur-xs"
        />

        {/* Eye contour border */}
        <path
          d="M 20 120 Q 160 25 300 120 Q 160 215 20 120 Z"
          fill="url(#scleraGrad)"
          stroke="#0F766E"
          strokeWidth="3.5"
          className="transition-colors duration-300"
        />

        {/* Clipped inner contents (eyeball, iris, specular highlights) */}
        <g clipPath="url(#eyeContour)">
          {/* Subtle vascular micro-details */}
          <path
            d="M 35 120 Q 60 115 80 125 M 40 126 Q 55 132 75 130 M 285 120 Q 260 112 240 122 M 280 127 Q 265 130 245 126"
            stroke="#14B8A6"
            strokeOpacity="0.25"
            strokeWidth="1.2"
            fill="none"
          />

          {/* Moving Iris & Pupil Group */}
          <motion.g
            style={{
              x: pupilX,
              y: pupilY,
            }}
          >
            {/* Limbal ring border */}
            <circle
              cx="160"
              cy="120"
              r="58"
              fill="url(#limbalRing)"
              opacity="0.9"
            />

            {/* Iris main circle */}
            <circle
              cx="160"
              cy="120"
              r="54"
              fill="url(#irisGrad)"
            />

            {/* Iris textural radial fibres */}
            {Array.from({ length: 18 }).map((_, i) => {
              const rot = i * 20;
              return (
                <line
                  key={i}
                  x1="160"
                  y1="120"
                  x2="160"
                  y2="72"
                  stroke="#5EEAD4"
                  strokeOpacity="0.45"
                  strokeWidth="1.6"
                  transform={`rotate(${rot} 160 120)`}
                />
              );
            })}

            {/* Inner golden ring */}
            <circle
              cx="160"
              cy="120"
              r="34"
              fill="none"
              stroke="#FDE047"
              strokeWidth="1.8"
              opacity="0.55"
              strokeDasharray="3 4"
            />

            {/* Dark pupil */}
            <circle
              cx="160"
              cy="120"
              r="24"
              fill="#020617"
            />

            {/* Specular high-light reflection (primary) */}
            <ellipse
              cx="148"
              cy="106"
              rx="9"
              ry="6"
              fill="#FFFFFF"
              opacity="0.95"
              transform="rotate(-25 148 106)"
            />

            {/* Specular highlight (secondary soft) */}
            <circle
              cx="172"
              cy="132"
              r="3.5"
              fill="#FFFFFF"
              opacity="0.65"
            />
          </motion.g>

          {/* Upper lid shadow on eyeball */}
          <path
            d="M 20 120 Q 160 35 300 120 Q 160 70 20 120 Z"
            fill="rgba(15, 23, 42, 0.08)"
          />

          {/* Animated Eyelids (Blink) */}
          <motion.path
            d="M 15 120 Q 160 20 305 120 L 305 0 L 15 0 Z"
            fill="#0F766E"
            initial={false}
            animate={{
              y: isBlinking ? 120 : 0,
            }}
            transition={{ duration: 0.12, ease: 'easeInOut' }}
          />
          <motion.path
            d="M 15 120 Q 160 220 305 120 L 305 240 L 15 240 Z"
            fill="#0F766E"
            initial={false}
            animate={{
              y: isBlinking ? -120 : 0,
            }}
            transition={{ duration: 0.12, ease: 'easeInOut' }}
          />
        </g>

        {/* Eyelash / accent lines top and bottom */}
        <path
          d="M 20 120 Q 160 25 300 120"
          fill="none"
          stroke="#0F766E"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <path
          d="M 30 120 Q 160 210 290 120"
          fill="none"
          stroke="#0F766E"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>

      {/* Floating subtle badge hint */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-teal-200/60 shadow-sm text-[11px] font-medium text-teal-800 whitespace-nowrap opacity-90 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-ping" />
        <span>Suivi oculaire interactif</span>
      </div>
    </div>
  );
};
