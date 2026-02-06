import { CropConfig, Rarity, Plan, ShopItem, BuffType, MarketTrend, SpinReward } from './types';
import { SlotStatus } from './types';

// Exchange rate: 250,000 PTS = 1 USDT (as per withdrawal config)
export const EXCHANGE_RATE = 250000;

export const RARITY_COLORS = {
  [Rarity.COMMON]: '#4ADE80',    // Green
  [Rarity.UNCOMMON]: '#3B82F6',  // Blue
  [Rarity.RARE]: '#A855F7',      // Purple
  [Rarity.EPIC]: '#F97316',      // Orange
  [Rarity.LEGENDARY]: '#EAB308', // Gold
};

// Drop probabilities per gamesystem.txt section 1
export const DROP_PROBABILITIES = {
  [Rarity.COMMON]: 0.10,      // 10%
  [Rarity.UNCOMMON]: 0.06,     // 6%
  [Rarity.RARE]: 0.02,         // 2%
  [Rarity.EPIC]: 0.005,        // 0.5%
  [Rarity.LEGENDARY]: 0.001,   // 0.1%
};

// Cumulative thresholds for RNG
export const DROP_THRESHOLDS = {
  [Rarity.COMMON]: 0.10,
  [Rarity.UNCOMMON]: 0.16,     // 0.10 + 0.06
  [Rarity.RARE]: 0.18,         // 0.16 + 0.02
  [Rarity.EPIC]: 0.185,        // 0.18 + 0.005
  [Rarity.LEGENDARY]: 0.186,   // 0.185 + 0.001
};

// Plot purchase prices (sequentially applied)
export const EXTRA_SLOT_PRICES = {
  first: 10000,   // First extra plot purchase
  second: 750000, // Second extra plot purchase
};

// Get purchasable plot slots based on plan
export const getPurchasableSlots = (plan: Plan): number[] => {
  const config = PLAN_CONFIG[plan];
  const slots: number[] = [];
  
  for (let i = config.purchasableStart; i <= config.purchasableEnd; i++) {
    slots.push(i);
  }
  
  return slots;
};

// Create dynamic shop items based on plan
export const getShopItemsForPlan = (plan: Plan, purchasedSlots: number[]): ShopItem[] => {
  const purchasableSlots = getPurchasableSlots(plan);
  const items: ShopItem[] = [];

  // Add purchasable plot slots
  purchasableSlots.forEach((slotId, index) => {
    const isPurchased = purchasedSlots.includes(slotId);
    if (!isPurchased) {
      items.push({
        id: `plot_${slotId}`,
        name: `Land Plot #${slotId}`,
        type: 'PERMANENT',
        cost: index === 0 ? EXTRA_SLOT_PRICES.first : EXTRA_SLOT_PRICES.second,
        description: `Unlocks Plot #${slotId}`,
        icon: '🗺️',
        slotId,
      });
    }
  });

  // Add permanent items
  items.push({
    id: 'storage_up',
    name: 'Barn Upgrade',
    type: 'PERMANENT',
    cost: 5000,
    description: '+20 Storage Slots',
    icon: '📦',
    storageAmount: 20,
  });

  // Add consumables
  items.push(
    { id: 'speed_soil', name: 'Speed Soil', type: 'CONSUMABLE', cost: 500, description: '-10% Growth Time (24h)', icon: '⚡', effect: 'SPEED_SOIL', duration: 86400000 },
    { id: 'growth_fert', name: 'Growth Fertilizer', type: 'CONSUMABLE', cost: 1000, description: '-20% Growth Time (24h)', icon: '🧪', effect: 'GROWTH_FERTILIZER', duration: 86400000 },
    { id: 'trade_permit', name: 'Trade Permit', type: 'CONSUMABLE', cost: 1500, description: '+10% Sell Prices (24h)', icon: '📈', effect: 'TRADE_PERMIT', duration: 86400000 },
    { id: 'rare_essence', name: 'Rare Essence', type: 'CONSUMABLE', cost: 2000, description: '+20% Rare Drop Rate (24h)', icon: '✨', effect: 'RARE_ESSENCE', duration: 86400000 },
    { id: 'golden_scarecrow', name: 'Golden Scarecrow', type: 'CONSUMABLE', cost: 3000, description: 'x3 Rare-Legend Chance (24h)', icon: '🧟', effect: 'GOLDEN_SCARECROW', duration: 86400000 },
    { id: 'yield_booster', name: 'Yield Booster', type: 'PERMANENT', cost: 500000, description: '25% chance for Double Harvest', icon: '🌽' },
  );

  return items;
};

export const CROPS: CropConfig[] = [
  // COMMON (240s, Price 20-50) - 10% chance
  { name: 'Cabbage', rarity: Rarity.COMMON, growthTime: 240, sellPrice: 20, color: '#4ADE80' },
  { name: 'Spinach', rarity: Rarity.COMMON, growthTime: 240, sellPrice: 25, color: '#22C55E' },
  { name: 'Water Spinach', rarity: Rarity.COMMON, growthTime: 240, sellPrice: 30, color: '#16A34A' },
  { name: 'Corn', rarity: Rarity.COMMON, growthTime: 240, sellPrice: 40, color: '#FACC15' },
  { name: 'Eggplant', rarity: Rarity.COMMON, growthTime: 240, sellPrice: 50, color: '#8B5CF6' },

  // UNCOMMON (300s, Price 50-70) - 6% chance
  { name: 'Tomato', rarity: Rarity.UNCOMMON, growthTime: 300, sellPrice: 50, color: '#EF4444' },
  { name: 'Carrot', rarity: Rarity.UNCOMMON, growthTime: 300, sellPrice: 55, color: '#FB923C' },
  { name: 'Broccoli', rarity: Rarity.UNCOMMON, growthTime: 300, sellPrice: 60, color: '#10B981' },
  { name: 'Potato', rarity: Rarity.UNCOMMON, growthTime: 300, sellPrice: 65, color: '#D97706' },
  { name: 'Cucumber', rarity: Rarity.UNCOMMON, growthTime: 300, sellPrice: 70, color: '#059669' },

  // RARE (420s, Price 120-250) - 2% chance
  { name: 'Asparagus', rarity: Rarity.RARE, growthTime: 420, sellPrice: 120, color: '#84CC16' },
  { name: 'Bell Pepper', rarity: Rarity.RARE, growthTime: 420, sellPrice: 150, color: '#60A5FA' },
  { name: 'Cauliflower', rarity: Rarity.RARE, growthTime: 420, sellPrice: 180, color: '#F3F4F6' },
  { name: 'Purple Cabbage', rarity: Rarity.RARE, growthTime: 420, sellPrice: 200, color: '#9333EA' },
  { name: 'Oyster Mushroom', rarity: Rarity.RARE, growthTime: 420, sellPrice: 250, color: '#E5E7EB' },

  // EPIC (480s, Price 400-800) - 0.5% chance
  { name: 'Shiitake Mushroom', rarity: Rarity.EPIC, growthTime: 480, sellPrice: 400, color: '#78350F' },
  { name: 'Artichoke', rarity: Rarity.EPIC, growthTime: 480, sellPrice: 500, color: '#14532D' },
  { name: 'Bamboo Shoot', rarity: Rarity.EPIC, growthTime: 480, sellPrice: 600, color: '#FCD34D' },
  { name: 'Giant Pumpkin', rarity: Rarity.EPIC, growthTime: 480, sellPrice: 800, color: '#F97316' },

  // LEGENDARY (720s, Price 2000-8000) - 0.1% chance
  { name: 'Wasabi', rarity: Rarity.LEGENDARY, growthTime: 720, sellPrice: 2000, color: '#86EFAC' },
  { name: 'Black Garlic', rarity: Rarity.LEGENDARY, growthTime: 720, sellPrice: 4000, color: '#1F2937' },
  { name: 'Black Truffle', rarity: Rarity.LEGENDARY, growthTime: 720, sellPrice: 8000, color: '#000000' },
];

// Plan Configuration per gamesystem.txt
// =============================================================================
// MEMBERSHIP SYSTEM CONFIGURATION (Source of Truth)
// =============================================================================
// Sequential Unlocking System:
// - FREE: Active: 1, LOCKED_SHOP: 2-3, DISABLED: 4-12
// - MORTGAGE: Active: 1-4, LOCKED_SHOP: 5-6, DISABLED: 7-12
// - TENANT: Active: 1-7, LOCKED_SHOP: 8-9, DISABLED: 10-12
// - OWNER: Active: 1-10, LOCKED_SHOP: 11-12, DISABLED: -

// =============================================================================
// PLAN CONFIGURATION - Single Source of Truth
// =============================================================================
// Consolidates: MEMBERSHIP_CONFIG, PLAN_CONFIG, PLAN_DETAILS
// =============================================================================
// Sequential Unlocking System:
// - FREE: Active: 1, LOCKED_SHOP: 2-3, DISABLED: 4-12
// - MORTGAGE: Active: 1-4, LOCKED_SHOP: 5-6, DISABLED: 7-12
// - TENANT: Active: 1-7, LOCKED_SHOP: 8-9, DISABLED: 10-12
// - OWNER: Active: 1-10, LOCKED_SHOP: 11-12, DISABLED: -

export const PLAN_CONFIG = {
  [Plan.FREE]: {
    // Core Game Mechanics
    baseLimit: 1,
    purchasableStart: 2,
    purchasableEnd: 3,
    maxPurchasableSlots: 2,
    storage: 100,
    bonus: 0,
    hasAds: true,
    adFrequency: 'HIGH' as const,
    isAdFree: false,
    // Pricing
    id: 'FREE',
    name: 'Free',
    price: 0,
    priceDisplay: 'FREE',
    currency: 'USD',
    usdtPrice: 0,
    // Features
    features: {
      autoPlots: 1,
      purchasableSlots: [2, 3],
      storage: 100,
      sellBonus: 0,
      adFrequency: 'HIGH',
      hasAds: true,
      isAdFree: false,
    },
    // UI Benefits
    benefits: [
      { icon: '🌱', text: '1 Plot Automatically Active' },
      { icon: '📦', text: '100 Items Storage Capacity' },
      { icon: '💰', text: '+0% Sell Bonus at Market' },
      { icon: '📺', text: 'High Ad Frequency' },
    ],
    // Visual
    visual: {
      gradient: 'from-gray-400 to-gray-600',
      border: 'border-gray-400',
      glowColor: 'shadow-gray-500/30',
      icon: '🌱',
      color: 'from-gray-400 to-gray-600',
      label: 'FREE',
    }
  },
  [Plan.MORTGAGE]: {
    // Core Game Mechanics
    baseLimit: 4,
    purchasableStart: 5,
    purchasableEnd: 6,
    maxPurchasableSlots: 2,
    storage: 240,
    bonus: 0.05,
    hasAds: true,
    adFrequency: 'MEDIUM' as const,
    isAdFree: false,
    // Pricing
    id: 'MORTGAGE',
    name: 'Mortgage',
    price: 20,
    priceDisplay: '20 USDT',
    currency: 'USDT',
    usdtPrice: 20,
    // Features
    features: {
      autoPlots: 4,
      purchasableSlots: [5, 6],
      storage: 240,
      sellBonus: 5,
      adFrequency: 'MEDIUM',
      hasAds: true,
      isAdFree: false,
    },
    // UI Benefits
    benefits: [
      { icon: '🌱', text: '4 Plots Automatically Active' },
      { icon: '📦', text: '240 Items Storage Capacity' },
      { icon: '💰', text: '+5% Sell Bonus at Market' },
      { icon: '📺', text: 'Medium Ad Frequency' },
    ],
    // Visual
    visual: {
      gradient: 'from-gray-400 to-gray-500',
      border: 'border-gray-400',
      glowColor: 'shadow-gray-500/30',
      icon: '🏠',
      color: 'from-gray-400 to-gray-500',
      label: 'MORTGAGE',
    }
  },
  [Plan.TENANT]: {
    // Core Game Mechanics
    baseLimit: 7,
    purchasableStart: 8,
    purchasableEnd: 9,
    maxPurchasableSlots: 2,
    storage: 500,
    bonus: 0.15,
    hasAds: false,
    adFrequency: 'NONE' as const,
    isAdFree: true,
    // Pricing
    id: 'TENANT',
    name: 'Tenant',
    price: 30,
    priceDisplay: '30 USDT',
    currency: 'USDT',
    usdtPrice: 30,
    // Features
    features: {
      autoPlots: 7,
      purchasableSlots: [8, 9],
      storage: 500,
      sellBonus: 15,
      adFrequency: 'NONE',
      hasAds: false,
      isAdFree: true,
    },
    // UI Benefits
    benefits: [
      { icon: '🌱', text: '7 Plots Automatically Active' },
      { icon: '📦', text: '500 Items Storage Capacity' },
      { icon: '💰', text: '+15% Sell Bonus at Market' },
      { icon: '🚫', text: 'Ad-Free Experience' },
    ],
    // Visual
    visual: {
      gradient: 'from-blue-400 to-blue-600',
      border: 'border-blue-500',
      glowColor: 'shadow-blue-500/30',
      icon: '🔑',
      color: 'from-blue-400 to-blue-600',
      label: 'TENANT',
    }
  },
  [Plan.OWNER]: {
    // Core Game Mechanics
    baseLimit: 10,
    purchasableStart: 11,
    purchasableEnd: 12,
    maxPurchasableSlots: 2,
    storage: Infinity,
    bonus: 0.30,
    hasAds: false,
    adFrequency: 'NONE' as const,
    isAdFree: true,
    // Pricing
    id: 'OWNER',
    name: 'Owner',
    price: 50,
    priceDisplay: '50 USDT',
    currency: 'USDT',
    usdtPrice: 50,
    // Features
    features: {
      autoPlots: 10,
      purchasableSlots: [11, 12],
      storage: Infinity,
      sellBonus: 30,
      adFrequency: 'NONE',
      hasAds: false,
      isAdFree: true,
    },
    // UI Benefits
    benefits: [
      { icon: '🌱', text: '10 Plots Automatically Active' },
      { icon: '📦', text: 'Unlimited Storage Capacity' },
      { icon: '💰', text: '+30% Sell Bonus at Market' },
      { icon: '🚫', text: 'Ad-Free Experience' },
    ],
    // Visual
    visual: {
      gradient: 'from-yellow-300 via-yellow-500 to-yellow-600',
      border: 'border-yellow-400',
      glowColor: 'shadow-yellow-500/50',
      icon: '👑',
      color: 'from-yellow-300 via-yellow-500 to-yellow-600',
      label: 'OWNER',
    }
  },
};

// =============================================================================
// Spin Wheel Rewards per gamesystem.txt section 5
export const SPIN_REWARDS = {
  coins: {
    low: 50,
    mid: 100,
    high: 200,
  },
  jackpot: 1500,
  herbs: {
    common: ['Cabbage', 'Spinach', 'Corn'],
    rare: ['Tomato', 'Carrot', 'Bell Pepper'],
  }
};

// Daily Tasks per gamesystem.txt section 4 - UPDATED with new Daily Task System
export enum TaskCategory {
  FARMING = 'FARMING',
  ECONOMIC = 'ECONOMIC',
  SOCIAL = 'SOCIAL',
}

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

export interface DailyTaskConfig {
  id: string;
  category: TaskCategory;
  action: TaskAction;
  description: string;
  target: number;
  rewardPts: number;
  rewardItem?: string;
  icon: string;
}

export const DAILY_TASKS_CONFIG: DailyTaskConfig[] = [
  // Farming Engagement Tasks
  {
    id: 'harvest_crops',
    category: TaskCategory.FARMING,
    action: TaskAction.HARVEST,
    description: 'Harvest 10 Crops',
    target: 10,
    rewardPts: 100,
    icon: '🌾',
  },
  {
    id: 'plant_rare',
    category: TaskCategory.FARMING,
    action: TaskAction.PLANT_RARE,
    description: 'Plant a Rare Crop',
    target: 1,
    rewardPts: 200,
    icon: '💎',
  },
  
  // Economic Activity Tasks
  {
    id: 'sell_market',
    category: TaskCategory.ECONOMIC,
    action: TaskAction.SELL,
    description: 'Sell at Market',
    target: 1,
    rewardPts: 150,
    icon: '💰',
  },
  {
    id: 'earn_pts',
    category: TaskCategory.ECONOMIC,
    action: TaskAction.EARN_PTS,
    description: 'Earn 500 PTS',
    target: 500,
    rewardPts: 250,
    icon: '📈',
  },
  {
    id: 'buy_item',
    category: TaskCategory.ECONOMIC,
    action: TaskAction.BUY_ITEM,
    description: 'Buy from Shop',
    target: 1,
    rewardPts: 100,
    icon: '🛒',
  },
  
  // Social & Monetization Tasks
  {
    id: 'watch_ads',
    category: TaskCategory.SOCIAL,
    action: TaskAction.WATCH_AD,
    description: 'Watch 3 Bonus Ads',
    target: 3,
    rewardPts: 300,
    icon: '📺',
  },
  {
    id: 'invite_friend',
    category: TaskCategory.SOCIAL,
    action: TaskAction.INVITE_FRIEND,
    description: 'Invite a Friend',
    target: 1,
    rewardPts: 500,
    icon: '👥',
  },
  {
    id: 'join_channel',
    category: TaskCategory.SOCIAL,
    action: TaskAction.JOIN_CHANNEL,
    description: 'Join Telegram Channel',
    target: 1,
    rewardPts: 200,
    icon: '📢',
  },
];

// Full completion bonus reward
export const DAILY_TASK_FULL_COMPLETION_REWARD = {
  pts: 1000,
  item: 'Rare Essence',
};

// Get today's date string for daily reset
export const getTodayDateString = (): string => {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
};

// Check if daily reset is needed
export const needsDailyReset = (lastResetDate: string | undefined): boolean => {
  if (!lastResetDate) return true;
  return lastResetDate !== getTodayDateString();
};

// Initialize daily tasks for a new day
export const initializeDailyTasks = (): DailyTaskConfig[] => {
  return DAILY_TASKS_CONFIG.map(task => ({
    ...task,
    currentProgress: 0,
    isCompleted: false,
    isClaimed: false,
  }));
};

// Check if task is completed
export const isTaskCompleted = (task: { target: number; currentProgress: number }): boolean => {
  return task.currentProgress >= task.target;
};

// Get task completion percentage
export const getTaskProgress = (task: { target: number; currentProgress: number }): number => {
  return Math.min(100, Math.round((task.currentProgress / task.target) * 100));
};

// Task navigation actions - where each task should redirect
export const getTaskNavigationAction = (action: TaskAction): string => {
  switch (action) {
    case TaskAction.HARVEST:
    case TaskAction.PLANT_RARE:
      return 'farm';
    case TaskAction.SELL:
    case TaskAction.EARN_PTS:
      return 'market';
    case TaskAction.BUY_ITEM:
      return 'shop';
    case TaskAction.WATCH_AD:
      return 'ads';
    case TaskAction.INVITE_FRIEND:
      return 'affiliate';
    case TaskAction.JOIN_CHANNEL:
      return 'channel';
    default:
      return 'farm';
  }
};

// Get category display properties
export const getCategoryDisplay = (category: TaskCategory): { label: string; color: string; bgColor: string } => {
  switch (category) {
    case TaskCategory.FARMING:
      return { label: 'Farming', color: 'text-green-600', bgColor: 'bg-green-100' };
    case TaskCategory.ECONOMIC:
      return { label: 'Economic', color: 'text-blue-600', bgColor: 'bg-blue-100' };
    case TaskCategory.SOCIAL:
      return { label: 'Social', color: 'text-purple-600', bgColor: 'bg-purple-100' };
    default:
      return { label: 'Other', color: 'text-gray-600', bgColor: 'bg-gray-100' };
  }
};

// Market Price Configuration per gamesystem.txt section 7
export const MARKET_CONFIG = {
  updateInterval: 3600000, // 1 hour in ms
  priceVariationRange: 0.15, // ±15% price variation
  boosterDuration: 86400000, // 24 hours
  boosterBonus: 0.15, // +15% from ads
};

// =============================================================================
// MARKET / DYNAMIC PRICING SYSTEM
// =============================================================================

// Get deterministic hourly price based on timestamp seed
export const getHourlyPrice = (
  cropName: string,
  timestamp: number = Date.now()
): { price: number; trend: 'UP' | 'DOWN' | 'STABLE'; changePercent: number } => {
  const crop = CROPS.find(c => c.name === cropName);
  if (!crop) return { price: 0, trend: 'STABLE', changePercent: 0 };

  // Use hour-based seed for deterministic prices
  const hourSeed = Math.floor(timestamp / 3600000);
  const cropSeed = hourSeed + cropName.charCodeAt(0) + cropName.length;

  // Pseudo-random based on seed
  const random1 = Math.sin(cropSeed * 9999) * 10000;
  const random2 = Math.sin(cropSeed * 8888) * 10000;
  const random3 = Math.sin(cropSeed * 7777) * 10000;

  // Determine trend for this hour (70% stable, 15% up, 15% down)
  const trendRoll = Math.abs(random1 % 100);
  let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
  let changePercent = 0;

  if (trendRoll < 15) {
    trend = 'UP';
    changePercent = Math.abs(random2 % 15) / 100; // 0-15% up
  } else if (trendRoll < 30) {
    trend = 'DOWN';
    changePercent = -(Math.abs(random3 % 15) / 100); // 0-15% down
  }

  // Calculate price with trend applied
  let price = crop.sellPrice;
  if (trend !== 'STABLE') {
    price = Math.round(crop.sellPrice * (1 + changePercent));
  }

  // Ensure price stays within crop's price range
  const minPrice = Math.floor(crop.sellPrice * 0.7); // Min 70% of base
  const maxPrice = Math.ceil(crop.sellPrice * 1.3); // Max 130% of base
  price = Math.max(minPrice, Math.min(maxPrice, price));

  return { price, trend, changePercent };
};

// Get all current market prices
export const getCurrentMarketPrices = (timestamp: number = Date.now()): MarketTrend[] => {
  return CROPS.map(crop => {
    const { price, trend, changePercent } = getHourlyPrice(crop.name, timestamp);
    const isUp = trend === 'UP';
    return {
      cropName: crop.name,
      change: Math.abs(changePercent),
      isUp
    };
  });
};

// Calculate final sell price with all bonuses
// Uses integer math to avoid floating point precision errors
export const calculateSellPrice = (
  cropName: string,
  quantity: number = 1,
  userPlan: Plan,
  activeBuffs: Record<string, number>
): { totalPrice: number; breakdown: { basePrice: number; trendMod: number; planBonus: number; tradePermit: number; booster: number } } => {
  const crop = CROPS.find(c => c.name === cropName);
  if (!crop) return { totalPrice: 0, breakdown: { basePrice: 0, trendMod: 0, planBonus: 0, tradePermit: 0, booster: 0 } };

  const { price: basePrice, trend } = getHourlyPrice(cropName);

  const planBonus = PLAN_CONFIG[userPlan]?.bonus || 0;
  const tradePermitBonus = (activeBuffs['TRADE_PERMIT'] || 0) > Date.now() ? 0.10 : 0;
  const boosterBonus = (activeBuffs['PRICE_BOOSTER'] || 0) > Date.now() ? 0.15 : 0;

  // Integer math: work with basis points (multiply by 10000, divide at end)
  const trendMod = trend === 'UP' ? 110 : (trend === 'DOWN' ? 90 : 100);
  const trendMultiplier = trendMod;
  const planMultiplier = Math.round(planBonus * 100);
  const tradeMultiplier = Math.round(tradePermitBonus * 100);
  const boosterMultiplier = Math.round(boosterBonus * 100);

  // Calculate final price using integer arithmetic
  const totalMultiplier = trendMultiplier * (100 + planMultiplier + tradeMultiplier + boosterMultiplier);
  const finalPrice = Math.floor((basePrice * totalMultiplier * quantity) / 10000);

  return {
    totalPrice: finalPrice,
    breakdown: {
      basePrice: Math.floor(basePrice),
      trendMod: trendMod / 100,
      planBonus: Math.round(planBonus * 100),
      tradePermit: Math.round(tradePermitBonus * 100),
      booster: Math.round(boosterBonus * 100)
    }
  };
};

// Format price with trend indicator
export const formatPrice = (price: number, trend: 'UP' | 'DOWN' | 'STABLE'): { value: string; color: string } => {
  const colors = {
    UP: 'text-green-500',
    DOWN: 'text-red-500',
    STABLE: 'text-gray-700'
  };
  return {
    value: price.toLocaleString(),
    color: colors[trend]
  };
};

// =============================================================================
// AFFILIATE SYSTEM CONSTANTS
// =============================================================================

export const AFFILIATE_CONFIG = {
  // Commission Rates
  commissions: {
    tier1: 0.10, // 10% for direct referrals
    tier2: 0.05, // 5% for indirect referrals (friends of friends)
  },
  // Membership Upgrade Bonuses (flat bonuses in PTS)
  upgradeBonuses: {
    [Plan.MORTGAGE]: 50000, // 50k PTS when referral upgrades to Mortgage
    [Plan.TENANT]: 100000, // 100k PTS when referral upgrades to Tenant
    [Plan.OWNER]: 250000, // 250k PTS when referral upgrades to Owner
  },
  // Claim Thresholds
  minClaimAmount: 100, // Minimum PTS to claim
  // Requirements
  minSalesForActive: 1, // Minimum sales to be considered "active"
};

// Generate referral link
export const generateReferralLink = (userId: string, botUsername: string = 'cyberfarmer_bot'): string => {
  return `https://t.me/${botUsername}?startapp=${userId}`;
};

// Calculate commission from a sale
export const calculateCommission = (saleAmount: number, tier: 1 | 2): number => {
  const rate = tier === 1 ? AFFILIATE_CONFIG.commissions.tier1 : AFFILIATE_CONFIG.commissions.tier2;
  return Math.floor(saleAmount * rate);
};

// Get upgrade bonus for a plan
export const getUpgradeBonus = (plan: Plan): number => {
  return AFFILIATE_CONFIG.upgradeBonuses[plan] || 0;
};

// Format large numbers for display
export const formatAffiliateEarnings = (pts: number): string => {
  if (pts >= 1000000) {
    return `${(pts / 1000000).toFixed(2)}M`;
  } else if (pts >= 1000) {
    return `${(pts / 1000).toFixed(1)}k`;
  }
  return pts.toLocaleString();
};

// =============================================================================
// WAREHOUSE / BARN SYSTEM CONSTANTS
// =============================================================================

// Consumable Items that appear in Tools Tab
export const CONSUMABLES: Record<string, {
  id: string;
  name: string;
  icon: string;
  effect: BuffType;
  duration: number; // in ms
  description: string;
}> = {
  'speed_soil': {
    id: 'speed_soil',
    name: 'Speed Soil',
    icon: '⚡',
    effect: 'SPEED_SOIL',
    duration: 86400000, // 24 hours
    description: '-10% Growth Time',
  },
  'growth_fertilizer': {
    id: 'growth_fertilizer',
    name: 'Growth Fertilizer',
    icon: '🧪',
    effect: 'GROWTH_FERTILIZER',
    duration: 86400000, // 24 hours
    description: '-20% Growth Time',
  },
  'trade_permit': {
    id: 'trade_permit',
    name: 'Trade Permit',
    icon: '📈',
    effect: 'TRADE_PERMIT',
    duration: 86400000, // 24 hours
    description: '+10% Sell Prices',
  },
  'rare_essence': {
    id: 'rare_essence',
    name: 'Rare Essence',
    icon: '✨',
    effect: 'RARE_ESSENCE',
    duration: 86400000, // 24 hours
    description: '+20% Rare Drop Rate',
  },
  'golden_scarecrow': {
    id: 'golden_scarecrow',
    name: 'Golden Scarecrow',
    icon: '🧟',
    effect: 'GOLDEN_SCARECROW',
    duration: 86400000, // 24 hours
    description: 'x3 Rare-Legend Chance',
  },
};

// Storage Upgrade Configuration
export const STORAGE_CONFIG = {
  upgradeAmount: 20, // +20 slots per purchase
  baseCost: 5000, // Base cost in PTS
  costMultiplier: 1.5, // Cost increases by 50% each purchase
  maxUpgrades: 10, // Maximum number of storage upgrades
};

// Check if item is a consumable/tool
export const isConsumable = (itemId: string): boolean => {
  return itemId in CONSUMABLES;
};

// Get consumable info
export const getConsumable = (itemId: string) => {
  return CONSUMABLES[itemId];
};

// Storage scaling formula
export const calculateStorageLimit = (plan: Plan, extraStorage: number): number => {
  const baseStorage = PLAN_CONFIG[plan]?.storage || 100;
  if (baseStorage === Infinity) return Infinity;
  return baseStorage + extraStorage;
};

// Get storage status color
export const getStorageStatusColor = (percentage: number): {
  bar: string;
  text: string;
  status: 'safe' | 'warning' | 'critical';
} => {
  if (percentage >= 90) {
    return {
      bar: 'bg-red-500 animate-pulse',
      text: 'text-red-500',
      status: 'critical',
    };
  } else if (percentage >= 60) {
    return {
      bar: 'bg-yellow-500',
      text: 'text-yellow-500',
      status: 'warning',
    };
  }
  return {
    bar: 'bg-green-500',
    text: 'text-green-500',
    status: 'safe',
  };
};

// =============================================================================
// LUCKY SPIN SYSTEM - Enhanced Prize Pool with Epic & Legendary Herbs
// =============================================================================

// Spin Configuration
export const SPIN_CONFIG = {
  freeCooldown: 3600000, // 1 hour in ms
  paidCost: 150, // PTS cost for paid spin
  jackPot: 1500, // Jackpot prize amount
};

// Prize Pool - Enhanced with Epic & Legendary Herbs
export const SPIN_PRIZE_POOL: (SpinReward & { weight: number; rarity?: Rarity })[] = [
  // === JACKPOT (0.1%) ===
  { type: 'JACKPOT', value: 1500, weight: 0.1, icon: '🎰' },

  // === LEGENDARY HERBS (0.1%) - Ultra Rare ===
  { type: 'HERB', value: 'Black Truffle', rarity: Rarity.LEGENDARY, weight: 0.033, icon: '🍄' },
  { type: 'HERB', value: 'Black Garlic', rarity: Rarity.LEGENDARY, weight: 0.033, icon: '🧄' },
  { type: 'HERB', value: 'Wasabi', rarity: Rarity.LEGENDARY, weight: 0.034, icon: '🟢' },

  // === EPIC HERBS (0.5%) - Special High Value ===
  { type: 'HERB', value: 'Giant Pumpkin', rarity: Rarity.EPIC, weight: 0.125, icon: '🎃' },
  { type: 'HERB', value: 'Bamboo Shoot', rarity: Rarity.EPIC, weight: 0.125, icon: '🎋' },
  { type: 'HERB', value: 'Artichoke', rarity: Rarity.EPIC, weight: 0.125, icon: '🥬' },
  { type: 'HERB', value: 'Shiitake Mushroom', rarity: Rarity.EPIC, weight: 0.125, icon: '🍄' },

  // === RARE HERBS (2%) - Medium Value ===
  { type: 'HERB', value: 'Oyster Mushroom', rarity: Rarity.RARE, weight: 0.4, icon: '🍄' },
  { type: 'HERB', value: 'Purple Cabbage', rarity: Rarity.RARE, weight: 0.4, icon: '🥗' },
  { type: 'HERB', value: 'Cauliflower', rarity: Rarity.RARE, weight: 0.4, icon: '🥦' },
  { type: 'HERB', value: 'Bell Pepper', rarity: Rarity.RARE, weight: 0.4, icon: '🫑' },
  { type: 'HERB', value: 'Asparagus', rarity: Rarity.RARE, weight: 0.4, icon: '🌿' },

  // === UNCOMMON HERBS (6%) ===
  { type: 'HERB', value: 'Cucumber', rarity: Rarity.UNCOMMON, weight: 1.2, icon: '🥒' },
  { type: 'HERB', value: 'Potato', rarity: Rarity.UNCOMMON, weight: 1.2, icon: '🥔' },
  { type: 'HERB', value: 'Broccoli', rarity: Rarity.UNCOMMON, weight: 1.2, icon: '🥦' },
  { type: 'HERB', value: 'Carrot', rarity: Rarity.UNCOMMON, weight: 1.2, icon: '🥕' },
  { type: 'HERB', value: 'Tomato', rarity: Rarity.UNCOMMON, weight: 1.2, icon: '🍅' },

  // === COMMON HERBS (10% each) ===
  { type: 'HERB', value: 'Eggplant', rarity: Rarity.COMMON, weight: 2, icon: '🍆' },
  { type: 'HERB', value: 'Corn', rarity: Rarity.COMMON, weight: 2, icon: '🌽' },
  { type: 'HERB', value: 'Water Spinach', rarity: Rarity.COMMON, weight: 2, icon: '🥬' },
  { type: 'HERB', value: 'Spinach', rarity: Rarity.COMMON, weight: 2, icon: '🍃' },
  { type: 'HERB', value: 'Cabbage', rarity: Rarity.COMMON, weight: 2, icon: '🥬' },

  // === COIN REWARDS (High probability to keep economy flowing) ===
  { type: 'COINS', value: 50, weight: 15, icon: '🪙' },   // Low - 15%
  { type: 'COINS', value: 100, weight: 25, icon: '💰' },  // Mid - 25%
  { type: 'COINS', value: 200, weight: 15, icon: '💎' },  // High - 15%
];

// Calculate total weight for RNG
export const SPIN_TOTAL_WEIGHT = SPIN_PRIZE_POOL.reduce((sum, prize) => sum + prize.weight, 0);

// Spin the wheel and get a random reward
export const spinWheel = (): SpinReward => {
  const random = Math.random() * SPIN_TOTAL_WEIGHT;
  let accumulatedWeight = 0;

  for (const prize of SPIN_PRIZE_POOL) {
    accumulatedWeight += prize.weight;
    if (random <= accumulatedWeight) {
      return {
        type: prize.type,
        value: prize.value,
        rarity: prize.rarity,
        icon: prize.icon,
      };
    }
  }

  // Fallback to common coin
  return { type: 'COINS', value: 100, icon: '💰' };
};

// Check if user can do free spin
export const canFreeSpin = (lastFreeSpin: number): boolean => {
  return Date.now() - lastFreeSpin >= SPIN_CONFIG.freeCooldown;
};

// Get remaining cooldown time in milliseconds
export const getRemainingCooldown = (lastFreeSpin: number): number => {
  const remaining = SPIN_CONFIG.freeCooldown - (Date.now() - lastFreeSpin);
  return Math.max(0, remaining);
};

// Format cooldown time for display
export const formatCooldown = (ms: number): string => {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

// Get rarity color for display
export const getRarityColor = (rarity?: Rarity): { bg: string; border: string; text: string } => {
  switch (rarity) {
    case Rarity.LEGENDARY:
      return { bg: 'bg-yellow-500/20', border: 'border-yellow-400', text: 'text-yellow-400' };
    case Rarity.EPIC:
      return { bg: 'bg-orange-500/20', border: 'border-orange-400', text: 'text-orange-400' };
    case Rarity.RARE:
      return { bg: 'bg-purple-500/20', border: 'border-purple-400', text: 'text-purple-400' };
    case Rarity.UNCOMMON:
      return { bg: 'bg-blue-500/20', border: 'border-blue-400', text: 'text-blue-400' };
    default:
      return { bg: 'bg-green-500/20', border: 'border-green-400', text: 'text-green-400' };
  }
};

// Get reward display value
export const formatSpinReward = (reward: SpinReward): string => {
  if (reward.type === 'COINS' || reward.type === 'JACKPOT') {
    return `${reward.value} PTS`;
  }
  return reward.value as string;
};

// Calculate total expected value for balancing
export const calculateExpectedValue = (): number => {
  return SPIN_PRIZE_POOL.reduce((sum, prize) => {
    const prizeValue = prize.type === 'COINS' || prize.type === 'JACKPOT'
      ? (prize.value as number)
      : 0; // Herb value depends on market, not counting here
    return sum + (prizeValue * prize.weight);
  }, 0) / SPIN_TOTAL_WEIGHT;
};

// =============================================================================
// WITHDRAWAL SYSTEM
// =============================================================================

import { WithdrawMethod, WithdrawStatus, WithdrawLimits, WithdrawValidation, Withdrawal } from './types';

// Conversion Rate: 250,000 PTS = 1 USDT
export const WITHDRAW_CONFIG = {
  // Conversion Rate
  PTS_TO_USDT_RATE: 250000, // 250,000 PTS = 1 USDT

  // Minimum Withdrawal Limits
  limits: {
    newUser: 100,      // First withdrawal minimum (100 PTS)
    returningUser: 1000, // Subsequent withdrawals (1000 PTS)
  },

  // Transaction Fees
  fees: {
    faucetPay: 0,      // 0% fee for FaucetPay
    tonWallet: 0.10,   // 10% fee for TON wallet
  },

  // Supported Networks
  supportedMethods: ['FAUCETPAY', 'TON'] as const,

  // TON Wallet Validation
  tonAddressLength: {
    min: 48,
    max: 48, // Standard TON address length
  },

  // API Endpoints (mock for frontend)
  api: {
    withdraw: '/api/withdraw',
    history: '/api/withdraw-history',
  },
};

// Calculate USDT amount from PTS
export const calculateUsdtAmount = (ptsAmount: number): number => {
  return Math.floor(ptsAmount / WITHDRAW_CONFIG.PTS_TO_USDT_RATE * 1000) / 1000;
};

// Calculate PTS amount from USDT
export const calculatePtsAmount = (usdtAmount: number): number => {
  return Math.floor(usdtAmount * WITHDRAW_CONFIG.PTS_TO_USDT_RATE);
};

// Calculate withdrawal fee
export const calculateWithdrawFee = (ptsAmount: number, method: WithdrawMethod): number => {
  const feeRate = method === 'FAUCETPAY' ? WITHDRAW_CONFIG.fees.faucetPay : WITHDRAW_CONFIG.fees.tonWallet;
  return Math.floor(ptsAmount * feeRate);
};

// Calculate net USDT after fees
export const calculateNetUsdt = (ptsAmount: number, method: WithdrawMethod): number => {
  const fee = calculateWithdrawFee(ptsAmount, method);
  const netPts = ptsAmount - fee;
  return calculateUsdtAmount(netPts);
};

// Get minimum withdrawal amount for user
export const getMinWithdrawAmount = (hasWithdrawnBefore: boolean): number => {
  return hasWithdrawnBefore 
    ? WITHDRAW_CONFIG.limits.returningUser 
    : WITHDRAW_CONFIG.limits.newUser;
};

// Validate withdrawal amount
export const validateWithdrawAmount = (
  amount: number,
  balance: number,
  hasWithdrawnBefore: boolean
): WithdrawValidation => {
  const minAmount = getMinWithdrawAmount(hasWithdrawnBefore);

  if (amount <= 0) {
    return { isValid: false, minAmount, maxAmount: balance, fee: 0, netUsdt: 0, error: 'Amount must be greater than 0' };
  }

  if (amount < minAmount) {
    return { 
      isValid: false, 
      minAmount, 
      maxAmount: balance, 
      fee: 0, 
      netUsdt: 0, 
      error: `Minimum withdrawal is ${minAmount.toLocaleString()} PTS` 
    };
  }

  if (amount > balance) {
    return { 
      isValid: false, 
      minAmount, 
      maxAmount: balance, 
      fee: 0, 
      netUsdt: 0, 
      error: 'Insufficient balance' 
    };
  }

  return { isValid: true, minAmount, maxAmount: balance, fee: 0, netUsdt: 0 };
};

// Validate email format for FaucetPay
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate TON wallet address
export const isValidTonAddress = (address: string): boolean => {
  // TON addresses are typically 48 characters starting with EQ
  // Also support raw addresses and bounceable formats
  const tonRegex = /^(EQ|[0-9a-fA-F]{64})$/i;
  return tonRegex.test(address.trim());
};

// Format TON address for display
export const formatTonAddress = (address: string): string => {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
};

// Get method display info
export const getMethodDisplay = (method: WithdrawMethod): { name: string; icon: string; description: string; fee: string } => {
  switch (method) {
    case 'FAUCETPAY':
      return {
        name: 'FaucetPay',
        icon: '📧',
        description: 'Instant processing via email',
        fee: '0% fee',
      };
    case 'TON':
      return {
        name: 'TON Wallet',
        icon: '🔗',
        description: 'Direct to your TON wallet',
        fee: '10% fee',
      };
    default:
      return { name: method, icon: '💰', description: '', fee: '0%' };
  }
};

// Get status display info
export const getStatusDisplay = (status: WithdrawStatus): { label: string; color: string; bgColor: string } => {
  switch (status) {
    case 'PENDING':
      return { label: 'Pending', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    case 'SUCCESS':
      return { label: 'Completed', color: 'text-green-600', bgColor: 'bg-green-100' };
    case 'FAILED':
      return { label: 'Failed', color: 'text-red-600', bgColor: 'bg-red-100' };
    case 'CANCELLED':
      return { label: 'Cancelled', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    default:
      return { label: status, color: 'text-gray-600', bgColor: 'bg-gray-100' };
  }
};

// Format timestamp for display
export const formatWithdrawDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Generate mock withdrawal ID
export const generateWithdrawId = (): string => {
  return `WD_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// Ad Network Rotation per gamesystem.txt section 9.5
export const AD_NETWORKS = [
  { id: 'adsgram', name: 'Adsgram', priority: 1 },
  { id: 'monetag', name: 'Monetag', priority: 2 },
  { id: 'adsterra', name: 'Adsterra', priority: 3 },
  { id: 'unity', name: 'Unity Ads', priority: 4 },
  { id: 'ironsource', name: 'IronSource', priority: 5 },
  { id: 'applovin', name: 'AppLovin', priority: 6 },
  { id: 'google', name: 'Google AdMob', priority: 7 },
];