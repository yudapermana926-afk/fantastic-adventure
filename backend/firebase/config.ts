// Firebase Configuration
// Per gamesystem.txt: Firestore untuk users collection

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, collection, doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp, writeBatch, query, where, getDocs, increment } from 'firebase/firestore';
import { SlotStatus, Plan, Rarity, InventoryItem, ReferralData } from '../../types';
import { CROPS, PLAN_CONFIG } from '../../constants';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "cryptofarm-bd14a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "cryptofarm-bd14a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "cryptofarm-bd14a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "9701816366",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:9701816366:web:fd369290508596e27287bf",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-86F272EL36"
};

// Initialize Firebase (singleton)
let app: FirebaseApp;
let db: Firestore;

if (typeof window !== 'undefined') {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
}

// Collection references
export const USERS_COLLECTION = 'users';
export const WITHDRAWS_COLLECTION = 'withdrawals';
export const TRANSACTIONS_COLLECTION = 'transactions';

// User document interface per gamesystem.txt
export interface UserDocument {
  id: string;              // Telegram User ID
  username: string;         // Telegram Username
  plan: 'FREE' | 'MORTGAGE' | 'TENANT' | 'OWNER';
  balance: number;          // PTS balance
  storageUsed: number;      // Used storage slots
  storageMax: number;       // Max storage (100 + upgrades)
  extraStorage: number;     // Extra storage from purchases
  xp: number;
  totalHarvests: number;
  totalSales: number;
  slots: Record<number, SlotData>;
  purchasedSlots: number[]; // Slots 2-3 purchased
  inventory: Record<string, InventoryItem>;
  activeBuffs: Record<string, number>; // Effect -> expiry timestamp
  lastSpinTime: number;
  lastDailyReset: number;
  referralId: string | null; // Upline user ID
  referrals: ReferralData[];
  walletAddress: string | null; // Locked on first WD
  walletEmail: string | null; // Locked on first WD
  hasWithdrawn: boolean;
  hasYieldBooster: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SlotData {
  id: number;
  status: 'LOCKED' | 'EMPTY' | 'GROWING' | 'READY';
  crop: CropData | null;
  plantedAt: number | null;
}

export interface CropData {
  name: string;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  growthTime: number; // Base growth time
}

export interface InventoryItem {
  cropName: string;
  rarity: string;
  quantity: number;
}

export interface ReferralData {
  id: string;
  username: string;
  contribution: number;
  isActive: boolean; // Has made first sale
}

// Firestore helper functions
export { db, app, collection, doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp };

// Initialize new user document per gamesystem.txt 7.1
// and the new sequential plot unlocking system
export const createNewUser = async (userId: string, username: string, referralId?: string): Promise<UserDocument> => {
  // Initialize all 12 slots as locked
  const initialSlots: Record<number, SlotData> = {};
  
  for (let i = 1; i <= 12; i++) {
    initialSlots[i] = { 
      id: i, 
      status: 'LOCKED' as const, 
      crop: null, 
      plantedAt: null 
    };
  }

  // Slot 1 is always active for FREE tier
  initialSlots[1].status = 'EMPTY';

  return {
    id: userId,
    username,
    plan: 'FREE',
    balance: 0,
    storageUsed: 0,
    storageMax: 100,
    extraStorage: 0,
    xp: 0,
    totalHarvests: 0,
    totalSales: 0,
    slots: initialSlots,
    purchasedSlots: [],
    inventory: {},
    activeBuffs: {},
    lastSpinTime: 0,
    lastDailyReset: Date.now(),
    referralId: referralId || null,
    referrals: [],
    walletAddress: null,
    walletEmail: null,
    hasWithdrawn: false,
    hasYieldBooster: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
};

// Get user by ID
export const getUser = async (userId: string): Promise<UserDocument | null> => {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
    if (userDoc.exists()) {
      return userDoc.data() as UserDocument;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

// Create or update user
export const saveUser = async (userId: string, data: Partial<UserDocument>): Promise<void> => {
  await updateDoc(doc(db, USERS_COLLECTION, userId), {
    ...data,
    updatedAt: Timestamp.now(),
  });
};
