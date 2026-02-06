export enum Plan {
  FREE = 'FREE',
  MORTGAGE = 'MORTGAGE',
  TENANT = 'TENANT',
  OWNER = 'OWNER',
}

export enum Rarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

export interface CropConfig {
  name: string;
  rarity: Rarity;
  growthTime: number; // in seconds
  sellPrice: number;
  color: string;
}

export enum SlotStatus {
  DISABLED = 'DISABLED', // Permanently locked by plan (requires upgrade)
  LOCKED_SHOP = 'LOCKED_SHOP', // Can be purchased with PTS
  EMPTY = 'EMPTY',      // Ready to plant
  GROWING = 'GROWING',  // Crop growing
  READY = 'READY',      // Ready to harvest
}

export interface FarmSlot {
  id: number;
  status: SlotStatus;
  crop: CropData | null;
  plantedAt: number | null; // Timestamp
  isAdReady: boolean;
  isPurchased: boolean; // For slots 2 and 3 specifically
}

export interface CropData {
  name: string;
  rarity: Rarity;
  growthTime: number; // Base growth time
}

// Per gamesystem.txt user document interface
export interface UserState {
  username: string;
  id: string; // Telegram User ID
  plan: Plan;
  balance: number;
  storageUsed: number;
  storageMax: number;
  extraStorage: number; // Purchased storage slots
  xp: number;
  hasYieldBooster: boolean; // Permanent perk
  faucetPayEmail?: string | null;
  walletAddress?: string | null;
  // Timers & Trackers
  lastSpinTime: number; // Timestamp for free spin cooldown
  lastDailyReset: string; // ISO date string for daily task reset
  // Lifetime Stats
  totalHarvests: number;
  totalSales: number;
  // Daily Tasks
  dailyTasks: DailyTask[];
  dailyTaskCompletedCount: number;
  dailyTaskFullBonusClaimed: boolean;
  // Affiliate System
  referralId?: string | null; // Upline user ID (who invited this user)
  pendingCommission: number; // Pending PTS from referrals (needs to be claimed)
  totalCommissionEarned: number; // Lifetime commission earned
  hasWithdrawn: boolean;
}

// 2-Tier Affiliate Referral Structure
export interface ReferralLevel {
  level: 1 | 2;
  userId: string;
  username: string;
  contribution: number; // PTS earned for upline
  isActive: boolean; // Has made first sale
  joinedAt: number; // Timestamp when joined
}

export interface Referral {
  id: string;
  username: string;
  contribution: number; // Total PTS earned for upline
  isActive: boolean; // Has made first sale
  tier: 1 | 2; // Level 1 (direct) or Level 2 (indirect)
  joinedAt: number;
}

export interface AffiliateStats {
  totalReferrals: number;
  activeReferrals: number;
  tier1Count: number;
  tier2Count: number;
  totalEarnings: number;
  pendingCommission: number;
}

export interface InventoryItem {
  cropName: string;
  quantity: number;
  rarity: Rarity;
  type: 'CROP' | 'TOOL';
}

export interface ToolItem {
  id: string;
  name: string;
  quantity: number;
  icon: string;
  effect: BuffType;
  duration: number;
  description: string;
  isActive: boolean; // Whether buff is currently active
}

// Daily Task Categories
export enum TaskCategory {
  FARMING = 'FARMING',
  ECONOMIC = 'ECONOMIC',
  SOCIAL = 'SOCIAL',
}

// Daily Task Actions
export enum TaskAction {
  HARVEST = 'HARVEST',
  PLANT_RARE = 'PLANT_RARE',
  SELL = 'SELL',
  EARN_PTS = 'EARN_PTS',
  BUY_ITEM = 'BUY_ITEM',
  WATCH_AD = 'WATCH_AD',
  INVITE_FRIEND = 'INVITE_FRIEND',
  JOIN_CHANNEL = 'JOIN_CHANNEL',
}

// Per gamesystem.txt section 4 - Daily Tasks (Updated)
export interface DailyTask {
  id: string;
  category: TaskCategory;
  action: TaskAction;
  description: string;
  target: number;
  currentProgress: number;
  rewardPts: number;
  rewardItem?: string; // Optional item reward (e.g., 'Speed Soil')
  isClaimed: boolean;
  isCompleted: boolean;
  icon?: string; // Icon emoji for the task
}

// Daily Task State in UserState
export interface DailyTaskState {
  tasks: DailyTask[];
  lastResetDate: string; // ISO date string (YYYY-MM-DD) for daily reset
  completedCount: number; // Number of tasks completed today
  hasFullCompletionBonus: boolean; // Whether full bonus is claimed
  fullCompletionReward: number; // PTS bonus for completing all tasks
}

export type Inventory = Record<string, InventoryItem>;

// Buff Types per gamesystem.txt section 7
export type BuffType = 
  | 'SPEED_SOIL'         // -10% growth time
  | 'GROWTH_FERTILIZER'  // -20% growth time
  | 'RARE_ESSENCE'       // +20% rare drop rate
  | 'TRADE_PERMIT'       // +10% sell price
  | 'PRICE_BOOSTER'      // +15% sell price (from ads)
  | 'GOLDEN_SCARECROW';  // x3 rare-legend chance

export interface ActiveBuff {
  type: BuffType;
  expiresAt: number; // Timestamp
}

export interface ShopItem {
  id: string;
  name: string;
  type: 'PERMANENT' | 'CONSUMABLE';
  cost: number;
  description: string;
  icon: string;
  effect?: BuffType;
  duration?: number; // in ms (86400000 = 24h)
  slotId?: number; // For Plot purchases
  storageAmount?: number; // For Storage upgrades
}

export interface MarketTrend {
  cropName: string;
  change: number; // Percentage float, e.g., 0.05 for +5%
  isUp: boolean;
}

// Withdraw Types per gamesystem.txt section 9
export type WithdrawMethod = 'FAUCETPAY' | 'TON';
export type WithdrawStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export interface Withdrawal {
  id: string;
  userId: string;
  amountPts: number;
  amountUsdt: number;
  feePts: number;
  netUsdt: number;
  method: WithdrawMethod;
  destination: string; // Email or wallet address
  status: WithdrawStatus;
  txHash?: string; // For TON transactions
  timestamp: number;
  processedAt?: number;
  errorMessage?: string;
}

export interface WithdrawLimits {
  newUserMin: number; // 100 PTS for first withdrawal
  returningUserMin: number; // 1000 PTS for subsequent
  hasWithdrawnBefore: boolean;
}

export interface WithdrawValidation {
  isValid: boolean;
  minAmount: number;
  maxAmount: number;
  fee: number;
  netUsdt: number;
  error?: string;
}

export interface WalletLock {
  isLocked: boolean;
  method: WithdrawMethod | null;
  destination: string;
  lockedAt: number;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info';
}

// Telegram Auth Types
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface SpinReward {
  type: 'COINS' | 'HERB' | 'JACKPOT';
  value: number | string; // Amount or herb name
  rarity?: Rarity; // For herb rewards (Common, Uncommon, Rare, Epic, Legendary)
  icon?: string; // Emoji icon for display
}

export interface SpinState {
  isSpinning: boolean;
  lastFreeSpin: number; // Timestamp of last free spin
  currentReward: SpinReward | null;
  isAdRequired: boolean; // For free spin - requires ad to claim
  showResult: boolean;
}
