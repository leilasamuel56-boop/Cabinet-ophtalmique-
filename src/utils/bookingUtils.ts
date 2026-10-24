import { PublicSlotRecord, BlockedSlotRecord } from '../firebase';
import { clinicConfig } from '../config';

/**
 * Format date YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Human readable French date format, e.g. "Vendredi 28 Octobre 2026"
 */
export function formatFrenchDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Generate time slots for a specific date based on clinic hours & appointment duration.
 * Uses anonymized publicSlots so patients never see any patient PII.
 */
export function getAvailableSlotsForDate(
  dateStr: string,
  durationMinutes: number,
  publicSlots: PublicSlotRecord[],
  blockedSlots: BlockedSlotRecord[]
): { time: string; isAvailable: boolean; statusReason?: string; slotStatus?: string }[] {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayOfWeek = dateObj.getDay(); // 0 is Sunday, 6 is Saturday

  // Sunday is closed
  if (dayOfWeek === 0) {
    return [];
  }

  // Clinic hours
  let startMinutes = 7 * 60 + 30; // 07:30 default
  let endMinutes = 16 * 60; // 16:00 default
  const slotInterval = 30; // slot grid spacing

  if (dayOfWeek === 6) {
    // Saturday
    startMinutes = 8 * 60; // 08:00
    endMinutes = 12 * 60; // 12:00
  }

  // Check if date is globally blocked by doctor
  const allDayBlock = blockedSlots.find((b) => b.date === dateStr && b.timeSlot === 'ALL_DAY');
  const amBlock = blockedSlots.find((b) => b.date === dateStr && b.timeSlot === 'AM');
  const pmBlock = blockedSlots.find((b) => b.date === dateStr && b.timeSlot === 'PM');

  const slots: { time: string; isAvailable: boolean; statusReason?: string; slotStatus?: string }[] = [];
  const now = new Date();
  const isToday = formatDateKey(now) === dateStr;
  const currentMinutesNow = now.getHours() * 60 + now.getMinutes();

  for (let m = startMinutes; m + durationMinutes <= endMinutes; m += slotInterval) {
    const hours = Math.floor(m / 60);
    const mins = m % 60;
    const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;

    // Past slot if today
    if (isToday && m <= currentMinutesNow + 15) {
      slots.push({
        time: timeStr,
        isAvailable: false,
        statusReason: 'Heure passée',
        slotStatus: 'past',
      });
      continue;
    }

    // Check doctor day/half-day block
    if (allDayBlock) {
      slots.push({
        time: timeStr,
        isAvailable: false,
        statusReason: allDayBlock.reason || 'Journée indisponible (Bloc/Congé)',
        slotStatus: 'blocked',
      });
      continue;
    }

    if (amBlock && m < 12 * 60) {
      slots.push({
        time: timeStr,
        isAvailable: false,
        statusReason: amBlock.reason || 'Matinée réservée au bloc opératoire',
        slotStatus: 'blocked',
      });
      continue;
    }

    if (pmBlock && m >= 12 * 60) {
      slots.push({
        time: timeStr,
        isAvailable: false,
        statusReason: pmBlock.reason || 'Après-midi réservée au bloc opératoire',
        slotStatus: 'blocked',
      });
      continue;
    }

    // Specific slot block
    const specificBlock = blockedSlots.find((b) => b.date === dateStr && b.timeSlot === timeStr);
    if (specificBlock) {
      slots.push({
        time: timeStr,
        isAvailable: false,
        statusReason: specificBlock.reason || 'Créneau bloqué par le praticien',
        slotStatus: 'blocked',
      });
      continue;
    }

    // Existing active reservation in anonymized publicSlots
    const existingSlot = publicSlots.find(
      (s) => s.date === dateStr && s.timeSlot === timeStr && s.status !== 'blocked'
    );

    if (existingSlot) {
      slots.push({
        time: timeStr,
        isAvailable: false,
        statusReason:
          existingSlot.status === 'confirmed'
            ? 'Réservé (confirmé)'
            : 'En cours de validation',
        slotStatus: existingSlot.status,
      });
      continue;
    }

    // Slot is free!
    slots.push({
      time: timeStr,
      isAvailable: true,
      slotStatus: 'free',
    });
  }

  return slots;
}

/**
 * Generate WhatsApp message URL for patient confirmation
 */
export function createWhatsAppBookingUrl(booking: {
  patientName: string;
  patientPhone: string;
  serviceName: string;
  dateStr: string;
  timeSlot: string;
  isFirstVisit: boolean;
  reason?: string;
}): string {
  const frenchDate = formatFrenchDate(booking.dateStr);
  const trimmedReason = (booking.reason || '').trim();
  const reasonLine = trimmedReason ? `\n• Motif : ${trimmedReason}` : '';
  const firstVisitLine = booking.isFirstVisit ? '\n• Première visite : Oui' : '';
  const text = `Bonjour Docteur, je souhaite confirmer mon rendez-vous :\n\n• Type : ${booking.serviceName}\n• Date : ${frenchDate}\n• Heure : ${booking.timeSlot}\n• Nom : ${booking.patientName}\n• Tél : ${booking.patientPhone}${firstVisitLine}${reasonLine}\n\nMerci de me confirmer la prise en charge.`;

  return `https://wa.me/${clinicConfig.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

/**
 * Generate WhatsApp message URL for doctor to message patient
 */
export function createDoctorReplyWhatsAppUrl(
  patientPhone: string,
  patientName: string,
  type: 'confirm' | 'cancel' | 'reminder',
  details: { serviceName: string; dateStr: string; timeSlot: string }
): string {
  const cleanPhone = patientPhone.replace(/[^0-9]/g, '');
  const frenchDate = formatFrenchDate(details.dateStr);

  let message = '';
  if (type === 'confirm') {
    message = `Bonjour ${patientName},\n\nVotre rendez-vous pour "${details.serviceName}" est bien CONFIRMÉ le ${frenchDate} à ${details.timeSlot} au Cabinet d'Ophtalmologie (Quartier Dakar, Lomé).\n\nRappel : pensez à apporter vos lunettes et anciennes ordonnances.\nÀ très bientôt,\n${clinicConfig.doctorName}`;
  } else if (type === 'cancel') {
    message = `Bonjour ${patientName},\n\nNous vous informons de l'annulation ou du report de votre rendez-vous du ${frenchDate} à ${details.timeSlot}.\nMerci de nous contacter pour convenir d'une nouvelle date.\nCordialement,\n${clinicConfig.name}`;
  } else {
    message = `Bonjour ${patientName},\n\nRappel de votre rendez-vous d'ophtalmologie prévu le ${frenchDate} à ${details.timeSlot} à notre cabinet (Lomé, Quartier Dakar).\nEn cas d'empêchement, merci de nous prévenir au plus vite.`;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate downloadable .ics calendar file for the patient
 */
export function downloadCalendarEvent(event: {
  title: string;
  description: string;
  location: string;
  dateStr: string; // YYYY-MM-DD
  timeSlot: string; // HH:MM
  durationMinutes: number;
}): void {
  const [y, m, d] = event.dateStr.split('-').map(Number);
  const [h, min] = event.timeSlot.split(':').map(Number);

  const startDate = new Date(Date.UTC(y, m - 1, d, h, min));
  const endDate = new Date(startDate.getTime() + event.durationMinutes * 60000);

  const formatICSDate = (dt: Date) => {
    return dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cabinet Ophtalmologie Lome//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:ophtalmo-${Date.now()}@lome.tg`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location.replace(/,/g, '\\,')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `rendez-vous-ophtalmo-${event.dateStr}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
