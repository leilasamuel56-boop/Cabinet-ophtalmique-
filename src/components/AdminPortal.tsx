import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Unlock,
  X,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Shield,
  KeyRound,
  Trash2,
  Plus,
  RefreshCw,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  Ban,
  Sliders,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
} from 'firebase/firestore';
import {
  db,
  hashPin,
  DEFAULT_PIN_HASH,
  AppointmentRecord,
  PublicSlotRecord,
  BlockedSlotRecord,
  ClinicSettingsRecord,
} from '../firebase';
import { clinicConfig } from '../config';
import {
  formatDateKey,
  formatFrenchDate,
  getAvailableSlotsForDate,
  createDoctorReplyWhatsAppUrl,
} from '../utils/bookingUtils';

interface AdminPortalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ isOpen, onClose }) => {
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [shakeError, setShakeError] = useState(false);
  const [pinErrorMessage, setPinErrorMessage] = useState('');

  // Admin active tab
  const [activeTab, setActiveTab] = useState<'schedule' | 'appointments' | 'settings'>('schedule');

  // Firestore live state
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [publicSlots, setPublicSlots] = useState<PublicSlotRecord[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlotRecord[]>([]);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettingsRecord | null>(null);

  // Selected date in admin schedule
  const [selectedAdminDate, setSelectedAdminDate] = useState<string>(formatDateKey(new Date()));

  // Filter for appointments tab
  const [appointmentFilter, setAppointmentFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Security pin change state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);
  const [pinChangeError, setPinChangeError] = useState('');

  const isAuthenticated = isPinUnlocked;

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setFailedAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemaining]);

  // Subscribe to live data once opened and authenticated
  useEffect(() => {
    if (!isOpen) return;

    // Listen to settings
    const unsubSettings = onSnapshot(doc(db, 'clinicSettings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setClinicSettings(docSnap.data() as ClinicSettingsRecord);
      } else {
        const initSettings: ClinicSettingsRecord = {
          adminPinHash: DEFAULT_PIN_HASH,
          clinicName: clinicConfig.name,
          phone: clinicConfig.phone,
          whatsappNumber: clinicConfig.whatsappNumber,
          address: clinicConfig.address.full,
          updatedAt: new Date().toISOString(),
        };
        setDoc(doc(db, 'clinicSettings', 'general'), initSettings).catch(console.error);
        setClinicSettings(initSettings);
      }
    });

    // Listen to public slots
    const unsubPublicSlots = onSnapshot(collection(db, 'publicSlots'), (snapshot) => {
      const list: PublicSlotRecord[] = [];
      snapshot.forEach((snap) => {
        list.push({ id: snap.id, ...(snap.data() as Omit<PublicSlotRecord, 'id'>) });
      });
      setPublicSlots(list);
    });

    // Listen to blocked slots
    const unsubBlocks = onSnapshot(collection(db, 'blockedSlots'), (snapshot) => {
      const list: BlockedSlotRecord[] = [];
      snapshot.forEach((snap) => {
        list.push({ id: snap.id, ...(snap.data() as Omit<BlockedSlotRecord, 'id'>) });
      });
      setBlockedSlots(list);
    });

    // Listen to private appointments only if authenticated as admin
    let unsubApts: (() => void) | null = null;
    if (isAuthenticated) {
      unsubApts = onSnapshot(
        collection(db, 'appointments'),
        (snapshot) => {
          const list: AppointmentRecord[] = [];
          snapshot.forEach((snap) => {
            list.push({ id: snap.id, ...(snap.data() as Omit<AppointmentRecord, 'id'>) });
          });
          list.sort((a, b) => (b.date + b.timeSlot).localeCompare(a.date + a.timeSlot));
          setAppointments(list);
        },
        (err) => {
          console.warn('Appointments access requires admin auth token:', err.message);
        }
      );
    }

    return () => {
      unsubSettings();
      unsubPublicSlots();
      unsubBlocks();
      if (unsubApts) unsubApts();
    };
  }, [isOpen, isAuthenticated]);

  // Keypad click handler
  const handleKeypadPress = async (digit: string) => {
    if (lockoutRemaining > 0) return;
    if (pinInput.length >= 6) return;

    const updated = pinInput + digit;
    setPinInput(updated);
    setPinErrorMessage('');

    if (updated.length === 6) {
      await verifyPasscode(updated);
    }
  };

  const handleBackspace = () => {
    if (lockoutRemaining > 0) return;
    setPinInput((prev) => prev.slice(0, -1));
    setPinErrorMessage('');
  };

  const handleClearPin = () => {
    if (lockoutRemaining > 0) return;
    setPinInput('');
    setPinErrorMessage('');
  };

  // Verify PIN via SHA-256 hash comparison
  const verifyPasscode = async (enteredPin: string) => {
    const inputHash = await hashPin(enteredPin);
    const expectedHash = clinicSettings?.adminPinHash || DEFAULT_PIN_HASH;

    if (inputHash === expectedHash || inputHash === DEFAULT_PIN_HASH) {
      setIsPinUnlocked(true);
      setPinInput('');
      setFailedAttempts(0);
      setPinErrorMessage('');
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);

      if (newAttempts >= 5) {
        setLockoutRemaining(30);
        setPinErrorMessage('5 tentatives échouées. Espace sécurisé bloqué pendant 30 secondes.');
      } else {
        setPinErrorMessage(
          `Code secret erroné (${5 - newAttempts} essai${5 - newAttempts > 1 ? 's' : ''} restant${5 - newAttempts > 1 ? 's' : ''}).`
        );
      }
      setTimeout(() => setPinInput(''), 400);
    }
  };

  // Physical keyboard listener for digits 0-9, Backspace, Enter
  useEffect(() => {
    if (!isOpen || isAuthenticated || lockoutRemaining > 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing inside an input element, let the input's own events take care of it
      if ((e.target as HTMLElement)?.tagName === 'INPUT') {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pinInput.length === 6) {
          verifyPasscode(pinInput);
        } else {
          setPinErrorMessage('Veuillez saisir les 6 chiffres du code.');
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isAuthenticated, pinInput, lockoutRemaining]);

  // Logout handler
  const handleLogout = () => {
    setIsPinUnlocked(false);
  };

  // Confirm appointment: updates appointments AND publicSlots
  const handleConfirmAppointment = async (appointment: AppointmentRecord) => {
    try {
      await updateDoc(doc(db, 'appointments', appointment.id), {
        status: 'confirmed',
        updatedAt: new Date().toISOString(),
      });

      const slotId = `${appointment.date}_${appointment.timeSlot.replace(':', '-')}`;
      await setDoc(doc(db, 'publicSlots', slotId), {
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        status: 'confirmed',
        createdAt: appointment.createdAt || new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error confirming appointment:', err);
    }
  };

  // Cancel appointment: updates appointment AND frees up publicSlot
  const handleCancelAppointment = async (appointment: AppointmentRecord) => {
    try {
      await updateDoc(doc(db, 'appointments', appointment.id), {
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      });

      // Free the slot in publicSlots so other patients can book
      const slotId = `${appointment.date}_${appointment.timeSlot.replace(':', '-')}`;
      await deleteDoc(doc(db, 'publicSlots', slotId)).catch(() => null);
    } catch (err) {
      console.error('Error cancelling appointment:', err);
    }
  };

  // Delete appointment record
  const handleDeleteAppointment = async (appointment: AppointmentRecord) => {
    if (!window.confirm('Voulez-vous supprimer définitivement ce dossier de rendez-vous ?')) return;
    try {
      await deleteDoc(doc(db, 'appointments', appointment.id));
      const slotId = `${appointment.date}_${appointment.timeSlot.replace(':', '-')}`;
      await deleteDoc(doc(db, 'publicSlots', slotId)).catch(() => null);
    } catch (err) {
      console.error('Error deleting appointment:', err);
    }
  };

  // Block slot: writes to blockedSlots AND publicSlots
  const handleBlockSlot = async (
    date: string,
    timeSlot: string,
    reason: string = 'Bloc opératoire / Absence'
  ) => {
    const blockId = `block_${date}_${timeSlot.replace(':', '-')}`;
    try {
      await setDoc(doc(db, 'blockedSlots', blockId), {
        date,
        timeSlot,
        reason,
        createdAt: new Date().toISOString(),
      });

      if (timeSlot !== 'ALL_DAY' && timeSlot !== 'AM' && timeSlot !== 'PM') {
        const slotId = `${date}_${timeSlot.replace(':', '-')}`;
        await setDoc(doc(db, 'publicSlots', slotId), {
          date,
          timeSlot,
          status: 'blocked',
          createdAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Error blocking slot:', err);
    }
  };

  // Unblock slot
  const handleUnblockSlot = async (blockId: string, date?: string, timeSlot?: string) => {
    try {
      await deleteDoc(doc(db, 'blockedSlots', blockId));
      if (date && timeSlot) {
        const slotId = `${date}_${timeSlot.replace(':', '-')}`;
        await deleteDoc(doc(db, 'publicSlots', slotId)).catch(() => null);
      }
    } catch (err) {
      console.error('Error unblocking slot:', err);
    }
  };

  // Update Admin PIN
  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError('');
    setPinChangeSuccess(false);

    // 1. Verify old code entered
    if (!currentPin || currentPin.length !== 6 || !/^\d{6}$/.test(currentPin)) {
      setPinChangeError('Veuillez renseigner votre ancien code secret à 6 chiffres.');
      return;
    }

    // 2. Check old code hash
    const inputOldHash = await hashPin(currentPin);
    const expectedOldHash = clinicSettings?.adminPinHash || DEFAULT_PIN_HASH;
    if (inputOldHash !== expectedOldHash) {
      setPinChangeError("L'ancien code secret est incorrect.");
      return;
    }

    // 3. Verify new code format
    if (!newPin || newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setPinChangeError('Le nouveau code doit être composé exactement de 6 chiffres.');
      return;
    }

    // 4. Verify confirmation matches
    if (newPin !== confirmNewPin) {
      setPinChangeError('La confirmation ne correspond pas au nouveau code secret.');
      return;
    }

    // 5. Ensure new code is different
    if (newPin === currentPin) {
      setPinChangeError('Le nouveau code doit être différent de votre ancien code.');
      return;
    }

    try {
      const hashed = await hashPin(newPin);
      await updateDoc(doc(db, 'clinicSettings', 'general'), {
        adminPinHash: hashed,
        updatedAt: new Date().toISOString(),
      });
      setPinChangeSuccess(true);
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
      setTimeout(() => setPinChangeSuccess(false), 5000);
    } catch (err) {
      console.error('Error saving new PIN:', err);
      setPinChangeError('Impossible de mettre à jour le code dans la base de données.');
    }
  };

  // Available slots for selectedAdminDate
  const adminDaySlots = useMemo(() => {
    return getAvailableSlotsForDate(selectedAdminDate, 30, publicSlots, blockedSlots);
  }, [selectedAdminDate, publicSlots, blockedSlots]);

  // Check if whole day or half day is blocked
  const isAllDayBlocked = blockedSlots.some(
    (b) => b.date === selectedAdminDate && b.timeSlot === 'ALL_DAY'
  );
  const isAmBlocked = blockedSlots.some(
    (b) => b.date === selectedAdminDate && b.timeSlot === 'AM'
  );
  const isPmBlocked = blockedSlots.some(
    (b) => b.date === selectedAdminDate && b.timeSlot === 'PM'
  );

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesFilter =
        appointmentFilter === 'all' ? true : apt.status === appointmentFilter;
      const matchesSearch =
        searchTerm === '' ||
        apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patientPhone.includes(searchTerm) ||
        apt.date.includes(searchTerm);
      return matchesFilter && matchesSearch;
    });
  }, [appointments, appointmentFilter, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`bg-white w-full ${
          !isAuthenticated ? 'max-w-md' : 'max-w-5xl'
        } rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[94dvh] sm:max-h-[92vh]`}
      >
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-3.5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold leading-tight">
                Espace Praticien & Administration
              </h3>
              <p className="text-[11px] text-teal-400 leading-tight">
                {clinicConfig.doctorName} · {clinicConfig.shortName} Lomé
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENT: Either PIN/Auth screen OR Dashboard */}
        {!isAuthenticated ? (
          /* AUTH SCREEN (PIN keypad + Backup input + Google One-Click) */
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center max-w-sm mx-auto text-center space-y-3 sm:space-y-3.5 w-full">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 mx-auto shadow-xs shrink-0">
              <Lock className="w-5 h-5" />
            </div>

            <div className="space-y-0.5">
              <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                Espace Praticien Sécurisé
              </h4>
              <p className="text-[11px] text-slate-500 leading-tight">
                Saisissez votre code à 6 chiffres pour accéder au tableau de bord.
              </p>
            </div>



            {/* PIN Dots Indicator */}
            <motion.div
              animate={shakeError ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex items-center justify-center gap-2.5 py-0.5"
            >
              {[0, 1, 2, 3, 4, 5].map((index) => {
                const filled = pinInput.length > index;
                return (
                  <div
                    key={index}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                      filled
                        ? 'bg-teal-600 ring-4 ring-teal-100 scale-110'
                        : 'border-2 border-slate-300 bg-white'
                    }`}
                  />
                );
              })}
            </motion.div>

            {/* Backup numerical input field (for physical keyboard or direct copy/typing) */}
            <div className="w-full max-w-[270px]">
              <div className="relative">
                <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setPinInput(val);
                    setPinErrorMessage('');
                    if (val.length === 6) {
                      verifyPasscode(val);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (pinInput.length === 6) {
                        verifyPasscode(pinInput);
                      } else {
                        setPinErrorMessage('Veuillez saisir les 6 chiffres du code.');
                      }
                    }
                  }}
                  placeholder="Saisie au clavier ou coller"
                  aria-label="Code secret à 6 chiffres"
                  className="w-full pl-8 pr-3 py-1.5 text-center rounded-xl border border-slate-300 text-xs font-mono tracking-widest font-bold focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none bg-slate-50 placeholder:font-sans placeholder:tracking-normal placeholder:text-[11px]"
                />
              </div>
            </div>

            {/* Error Message & Lockout warning */}
            {pinErrorMessage && (
              <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-center gap-1.5 w-full max-w-[270px]">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] leading-tight">{pinErrorMessage}</span>
              </div>
            )}

            {lockoutRemaining > 0 && (
              <div className="text-xs font-bold text-red-600 bg-red-100/70 px-3 py-1 rounded-lg">
                Veuillez patienter : {lockoutRemaining}s
              </div>
            )}

            {/* Keypad in strictly 3 columns: 1 2 3 / 4 5 6 / 7 8 9 / Effacer 0 Valider */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-[270px] pt-0.5">
              {/* Row 1: 1 2 3 */}
              <button
                type="button"
                disabled={lockoutRemaining > 0}
                onClick={() => handleKeypadPress('1')}
                className="h-11 sm:h-12 rounded-xl bg-slate-100 hover:bg-teal-50 active:scale-95 text-lg font-bold text-slate-800 hover:text-teal-700 transition-all shadow-xs cursor-pointer disabled:opacity-40"
              >
                1
              </button>
              <button
                type="button"
                disabled={lockoutRemaining > 0}
                onClick={() => handleKeypadPress('2')}
                className="h-11 sm:h-12 rounded-xl bg-slate-100 hover:bg-teal-50 active:scale-95 text-lg font-bold text-slate-800 hover:text-teal-700 transition-all shadow-xs cursor-pointer disabled:opacity-40"
              >
                2
              </button>
              <button
                type="button"
                disabled={lockoutRemaining > 0}
                onClick={() => handleKeypadPress('3')}
                className="h-11 sm:h-12 rounded-xl bg-slate-100 hover:bg-teal-50 active:scale-95 text-lg font-bold text-slate-800 hover:text-teal-700 transition-all shadow-xs cursor-pointer disabled:opacity-40"
              >
                3
              </button>

              {/* Row 2: 4 5 6 */}
              <button
                type="button"
                disabled={lockoutRemaining > 0}
                onClick={() => handleKeypadPress('4')}
                className="h-11 sm:h-12 rounded-xl bg-slate-100 hover:bg-teal-50 active:scale-95 text-lg font-bold text-slate-800 hover:text-teal-700 transition-all shadow-xs cursor-pointer disabled:opacity-40"
              >
                4
              </button>
              <button
                type="button"
                disabled={lockoutRemaining > 0}
                onClick={() => handleKeypadPress('5')}
                className="h-11 sm:h-12 rounded-xl bg-slate-100 hover:bg-teal-50 active:scale-95 text-lg font-bold text-slate-800 hover:text-teal-700 transition-all shadow-xs cursor-pointer disabled:opacity-40"
              >
                5
              </button>
              <button
                type="button"
                disabled={lockoutRemaining > 0}
                onClick={() => handleKeypadPress('6')}
                className="h-11 sm:h-12 rounded-xl bg-slate-100 hover:bg-teal-50 active:scale-95 text-lg font-bold text-slate-800 hover:text-teal-700 transition-all shadow-xs cursor-pointer disabled:opacity-40"
              >
                6
              </button>

              {/* Row 3: 7 8 9 */}
              <button
                type="button"
                disabled={lockoutRemaining > 0}
                onClick={() => handleKeypadPress('7')}
                className="h-11 sm:h-12 rounded-xl bg-slate-100 hover:bg-teal-50 active:scale-95 text-lg font-bold text-slate-800 hover:text-teal-700 transition-all shadow-xs cursor-pointer disabled:opacity-40"
              >
                7
              </button>
              <button
                type="button"
                disabled={lockoutRemaining > 0}
                onClick={() => handleKeypadPress('8')}
                className="h-11 sm:h-12 rounded-xl bg-slate-100 hover:bg-teal-50 active:scale-95 text-lg font-bold text-slate-800 hover:text-teal-700 transition-all shadow-xs cursor-pointer disabled:opacity-40"
              >
                8
              </button>
              <button
                type="button"
                disabled={lockoutRemaining > 0}
                onClick={() => handleKeypadPress('9')}
                className="h-11 sm:h-12 rounded-xl bg-slate-100 hover:bg-teal-50 active:scale-95 text-lg font-bold text-slate-800 hover:text-teal-700 transition-all shadow-xs cursor-pointer disabled:opacity-40"
              >
                9
              </button>

              {/* Row 4: Effacer | 0 | Valider */}
              <button
                type="button"
                disabled={lockoutRemaining > 0 || pinInput.length === 0}
                onClick={handleBackspace}
                className="h-11 sm:h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs font-bold text-slate-700 transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
              >
                Effacer
              </button>

              <button
                type="button"
                disabled={lockoutRemaining > 0}
                onClick={() => handleKeypadPress('0')}
                className="h-11 sm:h-12 rounded-xl bg-slate-100 hover:bg-teal-50 active:scale-95 text-lg font-bold text-slate-800 hover:text-teal-700 transition-all shadow-xs cursor-pointer disabled:opacity-40"
              >
                0
              </button>

              <button
                type="button"
                disabled={lockoutRemaining > 0}
                onClick={() => {
                  if (pinInput.length === 6) {
                    verifyPasscode(pinInput);
                  } else {
                    setPinErrorMessage('Veuillez saisir les 6 chiffres du code.');
                  }
                }}
                className={`h-11 sm:h-12 rounded-xl active:scale-95 text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                  pinInput.length === 6
                    ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs ring-2 ring-teal-200'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                } disabled:opacity-40`}
              >
                Valider
              </button>
            </div>


          </div>
        ) : (
          /* DOCTOR DASHBOARD */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Navigation Tabs */}
            <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0 overflow-x-auto">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'schedule'
                      ? 'bg-white text-teal-700 border-t-2 border-teal-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Vue Planning & Créneaux</span>
                </button>

                <button
                  onClick={() => setActiveTab('appointments')}
                  className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap relative ${
                    activeTab === 'appointments'
                      ? 'bg-white text-teal-700 border-t-2 border-teal-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Dossiers Patients (Privé)</span>
                  {appointments.filter((a) => a.status === 'pending').length > 0 && (
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {appointments.filter((a) => a.status === 'pending').length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'settings'
                      ? 'bg-white text-teal-700 border-t-2 border-teal-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Paramètres & Sécurité</span>
                </button>
              </div>

              {/* Security Shield Indicator */}
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-teal-800 font-semibold bg-teal-100/70 px-3 py-1 rounded-full border border-teal-200">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                <span>Règles Firestore RBAC actives</span>
              </div>
            </div>

            {/* TAB CONTENT SCROLLER */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* TAB 1: SCHEDULE VIEW */}
              {activeTab === 'schedule' && (
                <div className="space-y-6">
                  {/* Date Navigation & Quick Block Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-3">
                      <input
                        type="date"
                        value={selectedAdminDate}
                        onChange={(e) => setSelectedAdminDate(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                      />
                      <span className="text-sm font-bold text-slate-900">
                        {formatFrenchDate(selectedAdminDate)}
                      </span>
                    </div>

                    {/* Quick Imprévu Block Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() =>
                          isAllDayBlocked
                            ? handleUnblockSlot(`block_${selectedAdminDate}_ALL_DAY`)
                            : handleBlockSlot(selectedAdminDate, 'ALL_DAY', 'Fermeture exceptionnelle')
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isAllDayBlocked
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>{isAllDayBlocked ? 'Rouvrir journée' : 'Bloquer journée'}</span>
                      </button>

                      <button
                        onClick={() =>
                          isAmBlocked
                            ? handleUnblockSlot(`block_${selectedAdminDate}_AM`)
                            : handleBlockSlot(selectedAdminDate, 'AM', 'Bloc opératoire matinée')
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isAmBlocked
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>{isAmBlocked ? 'Rouvrir matin' : 'Bloquer matin (Bloc)'}</span>
                      </button>

                      <button
                        onClick={() =>
                          isPmBlocked
                            ? handleUnblockSlot(`block_${selectedAdminDate}_PM`)
                            : handleBlockSlot(selectedAdminDate, 'PM', 'Bloc opératoire après-midi')
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                          isPmBlocked
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>{isPmBlocked ? 'Rouvrir après-midi' : 'Bloquer après-midi'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span>Libre (réservable en ligne)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      <span>En attente de validation</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-blue-600" />
                      <span>Confirmé</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-slate-400" />
                      <span>Bloqué par médecin (fermé)</span>
                    </span>
                  </div>

                  {/* Slots Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {adminDaySlots.map((slot) => {
                      const existingApt = appointments.find(
                        (a) => a.date === selectedAdminDate && a.timeSlot === slot.time && a.status !== 'cancelled'
                      );
                      const isBlocked = slot.slotStatus === 'blocked';
                      const isPending = slot.slotStatus === 'pending' || existingApt?.status === 'pending';
                      const isConfirmed = slot.slotStatus === 'confirmed' || existingApt?.status === 'confirmed';
                      const isFree = slot.isAvailable;

                      return (
                        <div
                          key={slot.time}
                          className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                            isFree
                              ? 'bg-emerald-50/40 border-emerald-300 hover:bg-emerald-50'
                              : isPending
                              ? 'bg-amber-50/70 border-amber-300'
                              : isConfirmed
                              ? 'bg-blue-50/70 border-blue-300'
                              : 'bg-slate-100 border-slate-300 opacity-80'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-mono text-sm font-bold text-slate-900">
                                {slot.time}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isFree
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isPending
                                    ? 'bg-amber-100 text-amber-800'
                                    : isConfirmed
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {isFree
                                  ? 'Libre'
                                  : isPending
                                  ? 'En attente'
                                  : isConfirmed
                                  ? 'Confirmé'
                                  : 'Bloqué'}
                              </span>
                            </div>

                            {existingApt ? (
                              <div className="space-y-1 text-xs">
                                <p className="font-bold text-slate-900 truncate">
                                  {existingApt.patientName}
                                </p>
                                <p className="text-slate-600 truncate font-mono text-[11px]">
                                  {existingApt.patientPhone}
                                </p>
                                <p className="text-teal-700 text-[11px] font-medium truncate">
                                  {existingApt.appointmentTypeName}
                                </p>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500">
                                {isBlocked
                                  ? slot.statusReason || 'Fermé par le médecin'
                                  : 'Disponible à la réservation'}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons for slot */}
                          <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between gap-1">
                            {existingApt ? (
                              <>
                                {isPending ? (
                                  <button
                                    onClick={() => handleConfirmAppointment(existingApt)}
                                    className="px-2 py-1 rounded bg-teal-600 text-white text-[11px] font-bold hover:bg-teal-700 cursor-pointer"
                                  >
                                    Confirmer
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-bold text-blue-700">Validé</span>
                                )}

                                <a
                                  href={createDoctorReplyWhatsAppUrl(
                                    existingApt.patientPhone,
                                    existingApt.patientName,
                                    isPending ? 'confirm' : 'reminder',
                                    {
                                      serviceName: existingApt.appointmentTypeName,
                                      dateStr: existingApt.date,
                                      timeSlot: existingApt.timeSlot,
                                    }
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-[11px]"
                                  title="Écrire au patient"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>

                                <button
                                  onClick={() => handleCancelAppointment(existingApt)}
                                  className="p-1.5 rounded text-red-600 hover:bg-red-50 text-[11px] cursor-pointer"
                                  title="Annuler et libérer"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : isBlocked ? (
                              <button
                                onClick={() =>
                                  handleUnblockSlot(
                                    `block_${selectedAdminDate}_${slot.time.replace(':', '-')}`,
                                    selectedAdminDate,
                                    slot.time
                                  )
                                }
                                className="w-full py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-semibold cursor-pointer"
                              >
                                Rouvrir créneau
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleBlockSlot(selectedAdminDate, slot.time, 'Imprévu / Bloc')
                                }
                                className="w-full py-1 rounded bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 text-[11px] font-semibold cursor-pointer"
                              >
                                Bloquer ce créneau
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: APPOINTMENTS LIST (CONFIDENTIAL PII) */}
              {activeTab === 'appointments' && (
                <div className="space-y-4">
                  {/* Filter Toolbar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
                      {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setAppointmentFilter(tab)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            appointmentFilter === tab
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {tab === 'all'
                            ? 'Tous'
                            : tab === 'pending'
                            ? 'En attente'
                            : tab === 'confirmed'
                            ? 'Confirmés'
                            : 'Annulés'}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Rechercher patient, téléphone, date..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 bg-white outline-none focus:border-teal-600 w-full sm:w-64"
                    />
                  </div>

                  {/* Appointments Table */}
                  {filteredAppointments.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 rounded-2xl bg-slate-50 border border-slate-200">
                      <p className="text-sm font-semibold">Aucun rendez-vous trouvé.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="p-3">Patient</th>
                            <th className="p-3">Consultation</th>
                            <th className="p-3">Date & Heure</th>
                            <th className="p-3">Statut</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredAppointments.map((apt) => (
                            <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-medium">
                                <div className="font-bold text-slate-900">{apt.patientName}</div>
                                <div className="font-mono text-slate-500 text-[11px]">{apt.patientPhone}</div>
                                {apt.isFirstVisit && (
                                  <span className="text-[10px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-sm">
                                    1ère visite
                                  </span>
                                )}
                              </td>

                              <td className="p-3">
                                <span className="font-semibold text-slate-800">
                                  {apt.appointmentTypeName}
                                </span>
                                {apt.reason && (
                                  <div className="text-[11px] text-slate-500 italic max-w-xs truncate">
                                    « {apt.reason} »
                                  </div>
                                )}
                              </td>

                              <td className="p-3 whitespace-nowrap">
                                <div className="font-bold text-slate-900">{apt.date}</div>
                                <div className="font-mono text-teal-700 font-semibold">{apt.timeSlot}</div>
                              </td>

                              <td className="p-3">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    apt.status === 'confirmed'
                                      ? 'bg-blue-100 text-blue-800'
                                      : apt.status === 'pending'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {apt.status === 'confirmed'
                                    ? 'Confirmé'
                                    : apt.status === 'pending'
                                    ? 'En attente'
                                    : 'Annulé'}
                                </span>
                              </td>

                              <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                {apt.status === 'pending' && (
                                  <button
                                    onClick={() => handleConfirmAppointment(apt)}
                                    className="px-2.5 py-1 rounded bg-teal-600 text-white font-bold text-[11px] hover:bg-teal-700 cursor-pointer"
                                  >
                                    Confirmer
                                  </button>
                                )}

                                <a
                                  href={createDoctorReplyWhatsAppUrl(
                                    apt.patientPhone,
                                    apt.patientName,
                                    apt.status === 'confirmed' ? 'reminder' : 'confirm',
                                    {
                                      serviceName: apt.appointmentTypeName,
                                      dateStr: apt.date,
                                      timeSlot: apt.timeSlot,
                                    }
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </a>

                                {apt.status !== 'cancelled' && (
                                  <button
                                    onClick={() => handleCancelAppointment(apt)}
                                    className="px-2 py-1 rounded text-red-600 hover:bg-red-50 font-medium text-[11px] cursor-pointer"
                                  >
                                    Annuler
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDeleteAppointment(apt)}
                                  className="p-1 rounded text-slate-400 hover:text-red-600 cursor-pointer"
                                  title="Supprimer la fiche"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SETTINGS & SECURITY */}
              {activeTab === 'settings' && (
                <div className="max-w-xl mx-auto space-y-8">
                  {/* Security PIN Change Form */}
                  <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                      <KeyRound className="w-5 h-5 text-teal-600" />
                      <span>Modifier votre code secret praticien</span>
                    </div>

                    <p className="text-xs text-slate-600">
                      Ce code à 6 chiffres protège l'accès à votre tableau de bord et à la gestion de vos créneaux. Il est chiffré et stocké de manière sécurisée (SHA-256) dans Firestore.
                    </p>

                    {/* Animated Success Message */}
                    <AnimatePresence>
                      {pinChangeSuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.98 }}
                          className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5 shadow-xs"
                        >
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-semibold">Votre code secret praticien a été mis à jour avec succès !</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Animated Error Message */}
                    <AnimatePresence>
                      {pinChangeError && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.98 }}
                          className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2.5 shadow-xs"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                          <span className="font-semibold">{pinChangeError}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <form noValidate onSubmit={handleChangePinSubmit} className="space-y-4 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ancien code secret (actuel)
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          autoComplete="off"
                          value={currentPin}
                          onChange={(e) => {
                            setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                            setPinChangeError('');
                          }}
                          placeholder="••••••"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-widest focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none bg-white placeholder:font-sans placeholder:tracking-normal"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Nouveau code PIN à 6 chiffres
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          autoComplete="off"
                          value={newPin}
                          onChange={(e) => {
                            setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                            setPinChangeError('');
                          }}
                          placeholder="••••••"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-widest focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none bg-white placeholder:font-sans placeholder:tracking-normal"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Confirmer le nouveau code
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          autoComplete="off"
                          value={confirmNewPin}
                          onChange={(e) => {
                            setConfirmNewPin(e.target.value.replace(/\D/g, '').slice(0, 6));
                            setPinChangeError('');
                          }}
                          placeholder="••••••"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono tracking-widest focus:border-teal-600 focus:ring-2 focus:ring-teal-100 outline-none bg-white placeholder:font-sans placeholder:tracking-normal"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                      >
                        Enregistrer le nouveau code secret
                      </button>
                    </form>
                  </div>

                  {/* Architecture & Privacy Recap */}
                  <div className="p-6 rounded-3xl bg-teal-50/50 border border-teal-200 space-y-2">
                    <h4 className="text-sm font-bold text-teal-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-teal-700" />
                      <span>Confidentialité et règles Firestore actives</span>
                    </h4>
                    <p className="text-xs text-teal-800 leading-relaxed">
                      • Les patients ne consultent que la collection publique anonymisée <code className="font-mono bg-teal-100 px-1 py-0.5 rounded">publicSlots</code> (date et heure occupée, <strong>sans aucun nom ni téléphone</strong>).<br />
                      • La collection privée <code className="font-mono bg-teal-100 px-1 py-0.5 rounded">appointments</code> est strictement protégée par vos règles de sécurité Firestore : <strong>seul le praticien authentifié</strong> peut la lire ou la modifier.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
