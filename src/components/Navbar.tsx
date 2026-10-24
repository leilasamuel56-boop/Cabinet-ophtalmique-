import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Calendar, Menu, X, ShieldAlert } from 'lucide-react';
import { clinicConfig } from '../config';

interface NavbarProps {
  onOpenBooking: () => void;
  onOpenEmergency: () => void;
  onOpenAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenBooking,
  onOpenEmergency,
  onOpenAdmin,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (targetId: string) => {
    const elem = document.getElementById(targetId);
    if (elem) {
      const navbarOffset = 75;
      const elementPosition = elem.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - navbarOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const targetId = href.replace('#', '');
    scrollToSection(targetId);
  };

  const navLinks = [
    { label: 'Services', href: '#services' },
    { label: 'Démarche', href: '#demarche' },
    { label: 'Rendez-vous', href: '#reservation' },
    { label: 'Préparation', href: '#preparation' },
    { label: 'Urgences', href: '#urgences' },
    { label: 'Infos & Accès', href: '#infos' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-100 py-2.5'
          : 'bg-white/90 backdrop-blur-xs py-4 border-b border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setMobileMenuOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
              {clinicConfig.shortName}
            </span>
            <span className="text-[11px] font-medium text-teal-700 leading-tight">
              {clinicConfig.doctorName} · Lomé
            </span>
          </div>
        </a>

        {/* Zone 2: Navigation Links (hidden on mobile) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="hover:text-teal-700 transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Primary Action & Direct Contact */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href={`tel:${clinicConfig.phone.replace(/\s+/g, '')}`}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="Appeler le cabinet"
          >
            <Phone className="w-3.5 h-3.5 text-teal-600" />
            <span>{clinicConfig.phoneDisplay}</span>
          </a>

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenBooking();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:scale-95 shadow-sm rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Prendre RDV</span>
          </button>

          {/* Mobile menu hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
            className="lg:hidden p-2 text-slate-700 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Animated Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-b border-slate-200 bg-white/98 backdrop-blur-md px-4 pt-2 pb-5 shadow-lg overflow-hidden"
          >
            <div className="flex flex-col space-y-1 pt-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="px-3 py-2.5 rounded-lg text-slate-700 font-medium hover:bg-teal-50 hover:text-teal-700 text-sm transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>{link.label}</span>
                  <span className="text-xs text-slate-400">→</span>
                </a>
              ))}

              <div className="pt-3 mt-1 border-t border-slate-100 grid grid-cols-2 gap-2">
                <a
                  href={`tel:${clinicConfig.phone.replace(/\s+/g, '')}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-slate-100 text-xs font-semibold text-slate-800 hover:bg-slate-200 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  <span>Appeler</span>
                </a>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenEmergency();
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-red-50 text-xs font-semibold text-red-700 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Urgences</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
