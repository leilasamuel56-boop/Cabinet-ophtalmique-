import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  getDocs,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot as mandated by skill
export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline or initial ping unreached.');
    }
  }
}

// Fixed cryptographically strong salt for admin passcode
export const PIN_SALT = 'CabinetOphtalmoLome_SecureSalt_2026_';

// Salted SHA-256 hash utility for admin 6-digit passcode
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(PIN_SALT + pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Salted SHA-256 hash for the authorized passcode
export const DEFAULT_PIN_HASH = '306cc74d4d2571a213be2110f0f37c767488e6e1a9f9a81f05e2d871b3a48201';

// Private appointment record containing patient PII
export interface AppointmentRecord {
  id: string;
  patientName: string;
  patientPhone: string;
  appointmentType: string;
  appointmentTypeName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:MM
  durationMinutes: number;
  isFirstVisit: boolean;
  reason?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

// Anonymized slot availability record containing ZERO PII (Patients read this)
export interface PublicSlotRecord {
  id: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:MM
  status: 'pending' | 'confirmed' | 'blocked';
  createdAt: string;
}

// Doctor blocked times (surgeries, absences)
export interface BlockedSlotRecord {
  id: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:MM or ALL_DAY or AM or PM
  reason?: string;
  createdAt: string;
}

// Clinic settings & PIN hash
export interface ClinicSettingsRecord {
  adminPinHash: string;
  clinicName?: string;
  phone?: string;
  whatsappNumber?: string;
  address?: string;
  updatedAt?: string;
}
