import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CalendarPlus,
  Send,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import {
  db,
  handleFirestoreError,
  OperationType,
  AppointmentRecord,
  PublicSlotRecord,
  BlockedSlotRecord,
} from '../firebase';
import { clinicConfig, ServiceItem } from '../config';
import {
  formatDateKey,
  formatFrenchDate,
  getAvailableSlotsForDate,
  createWhatsAppBookingUrl,
  downloadCalendarEvent,
} from '../utils/bookingUtils';

interface BookingSectionProps {
  initialServiceId?: string;
  onEmergencyClick: () => void;
}

export const BookingSection: React.FC<BookingSectionProps> = ({
  initialServiceId,
  onEmergencyClick,
}) => {
  // Step tracker: 1: Service, 2: Date & Slot, 3: Patient Info, 4: Confirmed
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Selections
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    initialServiceId || 'consultation'
  );

  // Default to tomorrow or today if early
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const d = new Date();
    if (d.getDay() === 0) {
      d.setDate(d.getDate() + 1);
    } else if (d.getHours() >= 15) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    }
    return formatDateKey(d);
  });

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');

  // Patient Info Form
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [reason, setReason] = useState('');
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingWarning, setBookingWarning] = useState<string | null>(null);
  const [completedBooking, setCompletedBooking] = useState<{
    id: string;
    patientName: string;
    patientPhone: string;
    serviceName: string;
    dateStr: string;
    timeSlot: string;
    durationMinutes: number;
    whatsappUrl: string;
  } | null>(null);

  // Real-time Anonymized Slots (strictly ZERO PII accessed by patient)
  const [publicSlots, setPublicSlots] = useState<PublicSlotRecord[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlotRecord[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);

  // Update selected service if prop changes
  useEffect(() => {
    if (initialServiceId) {
      setSelectedServiceId(initialServiceId);
      if (initialServiceId === 'urgence') {
        onEmergencyClick();
      }
    }
  }, [initialServiceId, onEmergencyClick]);

  // Subscribe ONLY to public anonymized slots & doctor blocked times
  useEffect(() => {
    const unsubPublicSlots = onSnapshot(
      collection(db, 'publicSlots'),
      (snapshot) => {
        const slots: PublicSlotRecord[] = [];
        snapshot.forEach((docSnap) => {
          slots.push({ id: docSnap.id, ...(docSnap.data() as Omit<PublicSlotRecord, 'id'>) });
        });
        setPublicSlots(slots);
        setIsLoadingSlots(false);
      },
      (error) => {
        console.warn('Realtime public slots subscription notice:', error);
        setIsLoadingSlots(false);
      }
    );

    const unsubBlocked = onSnapshot(
      collection(db, 'blockedSlots'),
      (snapshot) => {
        const blocks: BlockedSlotRecord[] = [];
        snapshot.forEach((docSnap) => {
          blocks.push({ id: docSnap.id, ...(docSnap.data() as Omit<BlockedSlotRecord, 'id'>) });
        });
        setBlockedSlots(blocks);
      },
      (error) => {
        console.warn('Realtime blocked slots subscription notice:', error);
      }
    );

    return () => {
      unsubPublicSlots();
      unsubBlocked();
    };
  }, []);

  // Selected Service object
  const selectedService = useMemo(() => {
    return (
      clinicConfig.services.find((s) => s.id === selectedServiceId) ||
      clinicConfig.services[0]
    );
  }, [selectedServiceId]);

  // Available slots for currently selected date calculated from publicSlots
  const availableSlots = useMemo(() => {
    return getAvailableSlotsForDate(
      selectedDateStr,
      selectedService.defaultDurationMinutes,
      publicSlots,
      blockedSlots
    );
  }, [selectedDateStr, selectedService.defaultDurationMinutes, publicSlots, blockedSlots]);

  // Generate 14 upcoming bookable days
  const upcomingDays = useMemo(() => {
    const days: { dateStr: string; label: string; subLabel: string; isClosed: boolean }[] = [];
    const base = new Date();

    for (let i = 0; i < 21 && days.length < 14; i++) {
      const d = new Date();
      d.setDate(base.getDate() + i);
      const isSunday = d.getDay() === 0;
      const key = formatDateKey(d);

      let label = d.toLocaleDateString('fr-FR', { weekday: 'short' });
      label = label.charAt(0).toUpperCase() + label.slice(1);
      const subLabel = `${d.getDate()} ${d.toLocaleDateString('fr-FR', { month: 'short' })}`;

      if (i === 0) label = "Aujourd'hui";
      else if (i === 1) label = 'Demain';

      days.push({
        dateStr: key,
        label,
        subLabel,
        isClosed: isSunday,
      });
    }
    return days;
  }, []);

  // Handle service selection
  const handleSelectService = (service: ServiceItem) => {
    if (service.isUrgent) {
      onEmergencyClick();
      return;
    }
    setSelectedServiceId(service.id);
    setSelectedTimeSlot('');
    setCurrentStep(2);
  };

  // Submit appointment to Firestore (writes private appointment AND reserves public slot)
  const handleConfirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    setBookingWarning(null);

    const trimmedName = patientName.trim();
    const trimmedPhone = patientPhone.trim();
    const trimmedReason = (reason || '').trim();

    if (!trimmedName) {
      setBookingError('Veuillez renseigner votre nom complet.');
      return;
    }

    if (!trimmedPhone || trimmedPhone.length < 8) {
      setBookingError('Veuillez indiquer un numéro WhatsApp ou téléphone valide.');
      return;
    }

    if (!selectedTimeSlot) {
      setBookingError('Veuillez choisir un créneau horaire.');
      return;
    }

    setIsSubmitting(true);

    const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const slotId = `${selectedDateStr}_${selectedTimeSlot.replace(':', '-')}`;

    // 1. Prepare WhatsApp URL ahead of time so it is guaranteed to exist and work
    const waUrl = createWhatsAppBookingUrl({
      patientName: trimmedName,
      patientPhone: trimmedPhone,
      serviceName: selectedService.name,
      dateStr: selectedDateStr,
      timeSlot: selectedTimeSlot,
      isFirstVisit,
      reason: trimmedReason, // if empty, WhatsApp URL completely omits the Motif line
    });

    try {
      // 2. Write the private appointment record (contains PII, protected from public reading)
      // Motif is default empty string "", NEVER undefined!
      const appointmentData: Omit<AppointmentRecord, 'id'> = {
        patientName: trimmedName,
        patientPhone: trimmedPhone,
        appointmentType: selectedService.id,
        appointmentTypeName: selectedService.name,
        date: selectedDateStr,
        timeSlot: selectedTimeSlot,
        durationMinutes: selectedService.defaultDurationMinutes,
        isFirstVisit,
        reason: trimmedReason,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'appointments', appointmentId), appointmentData);

      // 3. Write the anonymized publicSlot record (contains NO personal info, prevents double booking)
      await setDoc(doc(db, 'publicSlots', slotId), {
        date: selectedDateStr,
        timeSlot: selectedTimeSlot,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Booking sync notice (transmitting directly through WhatsApp):', err);
      setBookingWarning(
        'Votre créneau est transmis directement sur WhatsApp au cabinet. Le secrétariat validera votre demande à réception.'
      );
    } finally {
      setIsSubmitting(false);

      // 4. Always record completed booking and transition to Step 4
      setCompletedBooking({
        id: appointmentId,
        patientName: trimmedName,
        patientPhone: trimmedPhone,
        serviceName: selectedService.name,
        dateStr: selectedDateStr,
        timeSlot: selectedTimeSlot,
        durationMinutes: selectedService.defaultDurationMinutes,
        whatsappUrl: waUrl,
      });

      setCurrentStep(4);

      // 5. Always trigger WhatsApp redirect
      setTimeout(() => {
        try {
          window.open(waUrl, '_blank');
        } catch {
          // If popup blocker triggers, patient can tap the prominent WhatsApp button on Step 4
        }
      }, 500);
    }
  };

  const handleDownloadICS = () => {
    if (!completedBooking) return;
    downloadCalendarEvent({
      title: `Rendez-vous Ophtalmologie : ${completedBooking.serviceName}`,
      description: `Rendez-vous au ${clinicConfig.name} avec ${clinicConfig.doctorName}.\nAdresse : ${clinicConfig.address.full}\nTél : ${clinicConfig.phone}`,
      location: clinicConfig.address.full,
      dateStr: completedBooking.dateStr,
      timeSlot: completedBooking.timeSlot,
      durationMinutes: completedBooking.durationMinutes,
    });
  };

  const resetBookingForm = () => {
    setCurrentStep(1);
    setSelectedTimeSlot('');
    setPatientName('');
    setPatientPhone('');
    setReason('');
    setBookingError(null);
    setBookingWarning(null);
    setCompletedBooking(null);
  };

  return (
    <section id="reservation" className="scroll-mt-24 py-20 bg-gradient-to-b from-white via-slate-50 to-teal-50/40 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Données médicales & numéros sécurisés</span>
          </div>
          <h2 className="mt-1 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Réservez votre consultation en direct
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Créneaux synchronisés en temps réel. Seules les disponibilités sont affichées, vos données restent strictement confidentielles.
          </p>
        </div>

        {/* Progress Bar Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -z-0" />
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-teal-600 transition-all duration-300 -z-0"
              style={{
                width:
                  currentStep === 1
                    ? '0%'
                    : currentStep === 2
                    ? '35%'
                    : currentStep === 3
                    ? '70%'
                    : '100%',
              }}
            />

            {[
              { num: 1, label: 'Service' },
              { num: 2, label: 'Date & Heure' },
              { num: 3, label: 'Vos Infos' },
              { num: 4, label: 'Validation' },
            ].map((s) => (
              <div key={s.num} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStep > s.num
                      ? 'bg-teal-600 text-white ring-4 ring-teal-100'
                      : currentStep === s.num
                      ? 'bg-teal-600 text-white ring-4 ring-teal-200 shadow-md scale-105'
                      : 'bg-white text-slate-400 border-2 border-slate-200'
                  }`}
                >
                  {currentStep > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-[11px] font-semibold mt-1.5 ${
                    currentStep >= s.num ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Card Container */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {/* STEP 1: Type de rendez-vous */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    1. Choisissez le type de consultation
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Sélectionnez le motif qui correspond le mieux à votre besoin visuel.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {clinicConfig.services.map((service) => {
                    const isSelected = selectedServiceId === service.id;
                    const isUrgent = service.isUrgent;

                    return (
                      <div
                        key={service.id}
                        onClick={() => handleSelectService(service)}
                        className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          isUrgent
                            ? 'border-red-200 hover:border-red-400 bg-red-50/40 hover:bg-red-50'
                            : isSelected
                            ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                            : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={service.imageUrl}
                              alt={service.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                            />
                            <div className="min-w-0">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {service.name}
                              </h4>
                              <span className="text-[11px] font-bold text-teal-700 font-mono block">
                                {service.price}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap ${
                              isUrgent
                                ? 'bg-red-100 text-red-700 font-bold'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isUrgent ? 'Immédiat' : `${service.defaultDurationMinutes} min`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-2 line-clamp-2">
                          {service.shortDescription}
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="font-semibold text-teal-700 text-[11px]">
                            {isUrgent ? 'Ligne prioritaire 7j/7' : 'Choisir ce créneau'}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 2: Choix de la date et du créneau */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-semibold text-teal-700">
                      Motif : {selectedService.name} ({selectedService.defaultDurationMinutes} min)
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                      2. Choisissez la date puis l'heure
                    </h3>
                  </div>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Changer de motif</span>
                  </button>
                </div>

                {/* Horizontal scrolling Date Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Date du rendez-vous
                  </label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {upcomingDays.map((day) => {
                      const isSelected = selectedDateStr === day.dateStr;
                      const isClosed = day.isClosed;

                      return (
                        <button
                          key={day.dateStr}
                          disabled={isClosed}
                          onClick={() => {
                            setSelectedDateStr(day.dateStr);
                            setSelectedTimeSlot('');
                          }}
                          className={`shrink-0 px-3.5 py-2.5 rounded-xl text-center border transition-all cursor-pointer ${
                            isClosed
                              ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                              : isSelected
                              ? 'bg-teal-600 border-teal-600 text-white shadow-md'
                              : 'bg-white border-slate-200 hover:border-teal-300 text-slate-700 hover:bg-teal-50/30'
                          }`}
                        >
                          <div className="text-xs font-bold leading-tight">
                            {day.label}
                          </div>
                          <div
                            className={`text-[11px] mt-0.5 font-medium ${
                              isSelected ? 'text-teal-100' : 'text-slate-500'
                            }`}
                          >
                            {day.subLabel}
                          </div>
                          {isClosed && (
                            <span className="block text-[9px] font-bold text-red-500 mt-0.5">
                              Fermé
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots Grid */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Créneaux disponibles le {formatFrenchDate(selectedDateStr)}
                    </label>
                    <span className="text-xs text-slate-500">
                      {availableSlots.filter((s) => s.isAvailable).length} créneau(x) libre(s)
                    </span>
                  </div>

                  {isLoadingSlots ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 animate-pulse py-4">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-11 bg-slate-100 rounded-xl" />
                      ))}
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-amber-50 border border-amber-200 text-amber-800">
                      <AlertCircle className="w-6 h-6 mx-auto mb-2 text-amber-600" />
                      <p className="text-sm font-semibold">
                        Le cabinet est fermé à cette date (Dimanche ou jour férié).
                      </p>
                      <p className="text-xs mt-1 text-amber-700">
                        Veuillez choisir un autre jour du Lundi au Samedi.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                      {availableSlots.map((slot) => {
                        const isSelected = selectedTimeSlot === slot.time;
                        const isAvailable = slot.isAvailable;

                        return (
                          <button
                            key={slot.time}
                            disabled={!isAvailable}
                            onClick={() => setSelectedTimeSlot(slot.time)}
                            className={`py-2.5 px-2 rounded-xl text-center border font-mono text-xs font-semibold transition-all relative ${
                              !isAvailable
                                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through opacity-60'
                                : isSelected
                                ? 'bg-teal-600 border-teal-600 text-white shadow-md ring-2 ring-teal-200 scale-102'
                                : 'bg-white border-slate-200 text-slate-800 hover:border-teal-400 hover:bg-teal-50/40 cursor-pointer'
                            }`}
                            title={!isAvailable ? slot.statusReason : 'Créneau disponible'}
                          >
                            <span>{slot.time}</span>
                            {!isAvailable && (
                              <span className="block text-[9px] font-sans no-underline font-normal text-slate-400 truncate">
                                Occupé
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Step navigation buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour</span>
                  </button>

                  <button
                    disabled={!selectedTimeSlot}
                    onClick={() => setCurrentStep(3)}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                      selectedTimeSlot
                        ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm cursor-pointer'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <span>Continuer vers vos coordonnées</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Coordonnées patient */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-semibold text-teal-700">
                      Créneau sélectionné : {formatFrenchDate(selectedDateStr)} à {selectedTimeSlot}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                      3. Informations du patient
                    </h3>
                  </div>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Changer de date</span>
                  </button>
                </div>

                {bookingError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <form onSubmit={handleConfirmReservation} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nom complet du patient <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        placeholder="Ex : Koffi Mensah Jean"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 text-sm outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Numéro WhatsApp / Téléphone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        placeholder="Ex : +228 90 00 00 00 ou 90000000"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 text-sm outline-none transition-all font-mono"
                      />
                    </div>
                    <span className="block text-[11px] text-slate-500 mt-1">
                      Numéro protégé, exclusivement visible par le médecin pour confirmer votre rendez-vous.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Motif ou symptômes
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <textarea
                        rows={2}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Ex : Baisse de vision de loin, renouvellement de lunettes, contrôle de la vue..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 text-sm outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isFirstVisit}
                        onChange={(e) => setIsFirstVisit(e.target.checked)}
                        className="w-4 h-4 text-teal-600 rounded-sm border-slate-300 focus:ring-teal-500"
                      />
                      <span className="text-xs text-slate-700 font-medium">
                        C'est ma première visite dans ce cabinet d'ophtalmologie
                      </span>
                    </label>
                  </div>

                  <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Modifier date</span>
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Envoi en cours...</span>
                        </>
                      ) : (
                        <>
                          <span>Réserver & Confirmer sur WhatsApp</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* STEP 4: Confirmation screen */}
            {currentStep === 4 && completedBooking && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center py-4 space-y-6"
              >
                <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mx-auto shadow-inner">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 150 }}
                  >
                    <CheckCircle className="w-10 h-10" />
                  </motion.div>
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                    Demande Enregistrée & Créneau Bloqué
                  </span>
                  <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                    Merci {completedBooking.patientName} !
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto">
                    Votre créneau est immédiatement réservé dans notre système.
                    Finalisez l'envoi du message WhatsApp pour que le secrétariat valide votre dossier.
                  </p>

                  {bookingWarning && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 max-w-md mx-auto text-left">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{bookingWarning}</span>
                    </div>
                  )}
                </div>

                {/* Recap Box */}
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 text-left max-w-md mx-auto space-y-2.5 text-xs text-slate-700">
                  <div className="flex justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Type de rendez-vous :</span>
                    <span className="font-bold text-slate-900">{completedBooking.serviceName}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Date & Heure :</span>
                    <span className="font-bold text-teal-700">
                      {formatFrenchDate(completedBooking.dateStr)} à {completedBooking.timeSlot}
                    </span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-slate-200">
                    <span className="text-slate-500 font-medium">Cabinet :</span>
                    <span className="font-semibold text-slate-900">{clinicConfig.address.full}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">WhatsApp :</span>
                    <span className="font-mono text-slate-900 font-semibold">{completedBooking.patientPhone}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
                  <a
                    href={completedBooking.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Ouvrir WhatsApp maintenant</span>
                  </a>

                  <button
                    onClick={handleDownloadICS}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs shadow-xs transition-all cursor-pointer"
                  >
                    <CalendarPlus className="w-4 h-4 text-teal-600" />
                    <span>Ajouter à mon calendrier (.ics)</span>
                  </button>
                </div>

                <div className="pt-4">
                  <button
                    onClick={resetBookingForm}
                    className="text-xs text-slate-500 hover:text-slate-800 underline underline-offset-4 cursor-pointer"
                  >
                    Prendre un autre rendez-vous
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
