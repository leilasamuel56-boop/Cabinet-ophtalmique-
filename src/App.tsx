import React, { useState, useEffect } from 'react';
import { testConnection } from './firebase';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AnimatedCounters } from './components/AnimatedCounters';
import { ServicesSection } from './components/ServicesSection';
import { HowItWorks } from './components/HowItWorks';
import { BookingSection } from './components/BookingSection';
import { PreparationSection } from './components/PreparationSection';
import { EmergencySection } from './components/EmergencySection';
import { FaqSection } from './components/FaqSection';
import { PracticalInfoSection } from './components/PracticalInfoSection';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { AdminPortal } from './components/AdminPortal';

export default function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [preselectedServiceId, setPreselectedServiceId] = useState<string>('consultation');

  // Verify connection to Firestore on boot as mandated
  useEffect(() => {
    testConnection();
  }, []);

  const scrollToBooking = (serviceId?: string) => {
    if (serviceId) {
      setPreselectedServiceId(serviceId);
    }
    const elem = document.getElementById('reservation');
    if (elem) {
      const navbarOffset = 75;
      const elementPosition = elem.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - navbarOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const scrollToEmergency = () => {
    const elem = document.getElementById('urgences');
    if (elem) {
      const navbarOffset = 75;
      const elementPosition = elem.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - navbarOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col antialiased selection:bg-teal-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenBooking={() => scrollToBooking()}
        onOpenEmergency={scrollToEmergency}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      <main className="flex-1">
        {/* Hero Section with Interactive Eye & Mot-par-Mot Animation */}
        <Hero
          onBookClick={() => scrollToBooking()}
          onEmergencyClick={scrollToEmergency}
        />

        {/* Animated Experience Counters */}
        <AnimatedCounters />

        {/* Specialized Services & Surgeries */}
        <ServicesSection onSelectService={(id) => scrollToBooking(id)} />

        {/* How It Works in 3 Steps */}
        <HowItWorks onStartBooking={() => scrollToBooking()} />

        {/* Real-time Interactive Booking Widget */}
        <BookingSection
          initialServiceId={preselectedServiceId}
          onEmergencyClick={scrollToEmergency}
        />

        {/* Pre-Appointment Patient Instructions */}
        <PreparationSection />

        {/* Emergency Eye Care Callout */}
        <EmergencySection />

        {/* Interactive FAQ Accordion */}
        <FaqSection />

        {/* Practical Info, Operating Hours & Google Maps */}
        <PracticalInfoSection />
      </main>

      {/* Footer with Discreet Admin Link */}
      <Footer onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Floating Soft-Pulse WhatsApp Button */}
      <FloatingWhatsApp />

      {/* Doctor Admin Portal Modal */}
      <AdminPortal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </div>
  );
}
