import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { UserState, FarmSlot, Inventory, SlotStatus, Plan, Rarity, ActiveBuff, MarketTrend, BuffType, Referral, Withdrawal, AffiliateStats, DailyTask, TaskAction, TaskCategory, SpinReward } from './types';
import { CROPS, PLAN_CONFIG, getShopItemsForPlan, EXTRA_SLOT_PRICES, CONSUMABLES, isConsumable, getHourlyPrice, getCurrentMarketPrices, calculateSellPrice, AFFILIATE_CONFIG, generateReferralLink, calculateCommission, formatAffiliateEarnings, DAILY_TASKS_CONFIG, DAILY_TASK_FULL_COMPLETION_REWARD, getTodayDateString, needsDailyReset, initializeDailyTasks, getTaskNavigationAction, getCategoryDisplay, SPIN_CONFIG, SPIN_PRIZE_POOL, spinWheel as constantsSpinWheel, canFreeSpin as checkCanFreeSpin, getRemainingCooldown, formatCooldown, getRarityColor, formatSpinReward, EXCHANGE_RATE } from './constants';

export const useGameStore = () => {
  // --- State ---
  const [user, setUser] = useState<UserState>({
    id: '12345678', // Mock ID
    username: 'FarmerJoe',
    plan: Plan.FREE,
    balance: 5000,
    storageUsed: 0,
    storageMax: 100, // Base for Free
    extraStorage: 0,
    xp: 0,
    hasYieldBooster: false,
    faucetPayEmail: null,
    walletAddress: null,
    totalHarvests: 0,
    totalSales: 0,
    lastSpinTime: 0,
    lastDailyReset: getTodayDateString(),
    hasWithdrawn: false,
    pendingCommission: 0,
    totalCommissionEarned: 0,
    dailyTasks: [],
    dailyTaskCompletedCount: 0,
    dailyTaskFullBonusClaimed: false,
  });

  const [activePage, setActivePage] = useState(1);
  const [activeBuffs, setActiveBuffs] = useState<Record<string, number>>({}); 
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>([]);

  const [inventory, setInventory] = useState<Inventory>({});

  // Ref to prevent race conditions in auto-replant
  const pendingReplants = useRef<Set<number>>(new Set());

  // Daily Tasks State - initialized with config
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>(() => {
    const initialTasks = initializeDailyTasks();
    return initialTasks.map(task => ({
      ...task,
      currentProgress: 0,
      isCompleted: false,
      isClaimed: false,
    }));
  });

  const [slots, setSlots] = useState<FarmSlot[]>(
    Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      status: i === 0 ? SlotStatus.EMPTY : SlotStatus.LOCKED_SHOP, // Slot 1 = EMPTY (free for new users), others = LOCKED_SHOP
      crop: null,
      plantedAt: null,
      isAdReady: false,
      isPurchased: false // Default false
    }))
  );

  // Affiliate State
  const [referrals, setReferrals] = useState<Referral[]>([
    { id: 'ref1', username: '@FarmerJohn', contribution: 2500, isActive: true, tier: 1, joinedAt: Date.now() - 86400000 * 7 },
    { id: 'ref2', username: '@AgroQueen', contribution: 1200, isActive: true, tier: 1, joinedAt: Date.now() - 86400000 * 3 },
    { id: 'ref3', username: '@LuckyFarmer', contribution: 450, isActive: false, tier: 2, joinedAt: Date.now() - 86400000 },
  ]);

  // Withdrawal State
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  // Lucky Spin State
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentSpinReward, setCurrentSpinReward] = useState<SpinReward | null>(null);
  const [spinShowResult, setSpinShowResult] = useState(false);
  const [pendingSpinReward, setPendingSpinReward] = useState<SpinReward | null>(null);

  // --- Logic ---

  // Daily Reset Check
  useEffect(() => {
      const checkDaily = () => {
          const today = getTodayDateString();
          if (needsDailyReset(user.lastDailyReset)) {
              // Reset Daily Tasks
              setDailyTasks(prev => prev.map(t => ({
                  ...t,
                  currentProgress: 0,
                  isCompleted: false,
                  isClaimed: false,
              })));
              setUser(u => ({ 
                  ...u, 
                  lastDailyReset: today,
                  dailyTaskCompletedCount: 0,
                  dailyTaskFullBonusClaimed: false,
              }));
          }
      };
      const interval = setInterval(checkDaily, 60000);
      return () => clearInterval(interval);
  }, [user.lastDailyReset]);

  // Initialize Trends (Every Hour) - Using deterministic hourly prices
  useEffect(() => {
    const updateTrends = () => {
      const newTrends = getCurrentMarketPrices();
      setMarketTrends(newTrends);
    };

    updateTrends();
    const interval = setInterval(updateTrends, 3600000); // 1 Hour
    return () => clearInterval(interval);
  }, []);

  // Buff Expiry Check
  useEffect(() => {
     const interval = setInterval(() => {
        const now = Date.now();
        setActiveBuffs(prev => {
           const next = { ...prev };
           let changed = false;
           Object.keys(next).forEach(key => {
               if (next[key] < now) {
                   delete next[key];
                   changed = true;
               }
           });
           return changed ? next : prev;
        });
     }, 1000);
     return () => clearInterval(interval);
  }, []);

  // Game Loop (Growth)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setSlots((prevSlots) =>
        prevSlots.map((slot) => {
          if (slot.status === SlotStatus.GROWING && slot.crop && slot.plantedAt) {
            const elapsedSeconds = (now - slot.plantedAt) / 1000;
            const targetTime = slot.crop.growthTime; 
            
            if (elapsedSeconds >= targetTime) {
              return { ...slot, status: SlotStatus.READY, isAdReady: true };
            }
          }
          return slot;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Slot Locking Logic Effect (Sequential per new spec)
  useEffect(() => {
      const config = PLAN_CONFIG[user.plan];
      const { baseLimit: maxAutoSlots, purchasableStart, purchasableEnd } = config;

      setSlots(prev => prev.map(slot => {
          const { id, status, isPurchased } = slot;

          // Slot 1 is always auto-active (Tutorial slot)
          if (id === 1) {
              if (status === SlotStatus.DISABLED) {
                  return { ...slot, status: SlotStatus.EMPTY };
              }
              return slot;
          }

          // Purchased slots take priority - always activate regardless of plan
          if (isPurchased) {
              if (status === SlotStatus.DISABLED || status === SlotStatus.LOCKED_SHOP) {
                  return { ...slot, status: SlotStatus.EMPTY };
              }
              return slot;
          }

          // Check if slot is within auto-active range for current plan
          if (id <= maxAutoSlots) {
              // Auto-active slots (1 through maxAutoSlots)
              if (status === SlotStatus.DISABLED) {
                  return { ...slot, status: SlotStatus.EMPTY };
              }
              return slot;
          }

          // Check if slot is LOCKED_SHOP (purchasable within plan limits)
          if (id >= purchasableStart && id <= purchasableEnd) {
              if (status !== SlotStatus.GROWING && status !== SlotStatus.READY) {
                  return { ...slot, status: SlotStatus.LOCKED_SHOP };
              }
              return slot;
          }

          // Slots beyond plan limits are DISABLED (permanently locked by plan)
          if (status !== SlotStatus.GROWING && status !== SlotStatus.READY) {
              return { ...slot, status: SlotStatus.DISABLED };
          }

          return slot;
      }));
  }, [user.plan, slots.map(s => `${s.id}-${s.isPurchased}-${s.status}`).join(',')]);

  // Actions

  // Update daily task progress based on action
  const updateDailyTaskProgress = useCallback((action: TaskAction, amount: number = 1, metadata?: { rarity?: Rarity; ptsEarned?: number }) => {
    setDailyTasks(prev => {
      let completedCount = 0;
      const updated = prev.map(t => {
        if (t.action === action && !t.isCompleted && !t.isClaimed) {
          let newProgress = t.currentProgress + amount;
          
          // Special handling for certain actions
          if (action === TaskAction.PLANT_RARE && metadata?.rarity) {
            // Only count if rarity is Rare or higher
            if (metadata.rarity === Rarity.RARE || metadata.rarity === Rarity.EPIC || metadata.rarity === Rarity.LEGENDARY) {
              newProgress = t.currentProgress + 1;
            } else {
              return t; // Don't count non-rare plantings
            }
          }
          
          const isCompleted = newProgress >= t.target;
          if (isCompleted) completedCount++;
          
          return {
            ...t,
            currentProgress: newProgress,
            isCompleted
          };
        }
        if (t.isCompleted && !t.isClaimed) completedCount++;
        return t;
      });
      
      // Update user state with completed count
      if (completedCount > 0) {
        setUser(u => ({
          ...u,
          dailyTaskCompletedCount: updated.filter(t => t.isCompleted && !t.isClaimed).length
        }));
      }
      
      return updated;
    });
  }, []);

  // Claim individual daily task reward
  const claimDailyTask = useCallback((taskId: string): { success: boolean; message: string; reward?: number } => {
    const task = dailyTasks.find(t => t.id === taskId);
    
    if (!task) {
      return { success: false, message: 'Task not found' };
    }
    
    if (!task.isCompleted) {
      return { success: false, message: 'Task not completed yet' };
    }
    
    if (task.isClaimed) {
      return { success: false, message: 'Already claimed' };
    }
    
    // Mark as claimed and add reward to balance
    setDailyTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, isClaimed: true };
      }
      return t;
    }));
    
    setUser(u => ({
      ...u,
      balance: u.balance + task.rewardPts
    }));
    
    return { success: true, message: `Claimed ${task.rewardPts} PTS!`, reward: task.rewardPts };
  }, [dailyTasks]);

  // Claim full completion bonus
  const claimFullCompletionBonus = useCallback((): { success: boolean; message: string; reward?: number } => {
    if (user.dailyTaskFullBonusClaimed) {
      return { success: false, message: 'Already claimed' };
    }
    
    const allCompleted = dailyTasks.every(t => t.isCompleted && t.isClaimed);
    if (!allCompleted) {
      return { success: false, message: 'Complete all tasks first' };
    }
    
    // Give full completion bonus
    setUser(u => ({
      ...u,
      balance: u.balance + DAILY_TASK_FULL_COMPLETION_REWARD.pts,
      dailyTaskFullBonusClaimed: true
    }));
    
    return { 
      success: true, 
      message: `Full completion bonus: ${DAILY_TASK_FULL_COMPLETION_REWARD.pts} PTS + ${DAILY_TASK_FULL_COMPLETION_REWARD.item}!`,
      reward: DAILY_TASK_FULL_COMPLETION_REWARD.pts
    };
  }, [dailyTasks, user.dailyTaskFullBonusClaimed]);

  // Get daily task statistics
  const getDailyTaskStats = useCallback(() => {
    const total = dailyTasks.length;
    const completed = dailyTasks.filter(t => t.isCompleted).length;
    const claimed = dailyTasks.filter(t => t.isClaimed).length;
    const totalReward = dailyTasks.filter(t => t.isClaimed).reduce((sum, t) => sum + t.rewardPts, 0);
    const fullBonus = user.dailyTaskFullBonusClaimed;
    
    return {
      total,
      completed,
      claimed,
      remaining: total - completed,
      progressPercent: Math.round((completed / total) * 100),
      totalRewardClaimed: totalReward,
      fullBonusClaimed: fullBonus,
      canClaimFullBonus: completed === total && !fullBonus,
    };
  }, [dailyTasks, user.dailyTaskFullBonusClaimed]);

  const plantCrop = useCallback((slotId: number) => {
    const rand = Math.random();
    const hasRareBuff = (activeBuffs['RARE_ESSENCE'] || 0) > Date.now();
    const hasScarecrow = (activeBuffs['GOLDEN_SCARECROW'] || 0) > Date.now();

    // === DropEngine: Rarity Probabilities ===
    // Common: 10%
    // Uncommon: 6%
    // Rare: 2%
    // Epic: 0.5%
    // Legendary: 0.1%
    
    let pLegend = 0.001; 
    let pEpic = 0.005;   
    let pRare = 0.02;    
    let pUncommon = 0.06;

    // === Consumable Effects ===
    if (hasRareBuff) {
      // Rare Essence: +20% rare drop rate
      pRare *= 1.2;
    }
    
    if (hasScarecrow) {
      // Golden Scarecrow: x3 rare-legend chance
      pLegend *= 3;
      pEpic *= 3;
      pRare *= 3;
    }

    // Determine rarity
    let selectedRarity = Rarity.COMMON;
    if (rand < pLegend) selectedRarity = Rarity.LEGENDARY;
    else if (rand < pLegend + pEpic) selectedRarity = Rarity.EPIC;
    else if (rand < pLegend + pEpic + pRare) selectedRarity = Rarity.RARE;
    else if (rand < pLegend + pEpic + pRare + pUncommon) selectedRarity = Rarity.UNCOMMON;

    // Select random crop within rarity
    const possibleCrops = CROPS.filter(c => c.rarity === selectedRarity);
    const crop = possibleCrops[Math.floor(Math.random() * possibleCrops.length)] || CROPS[0];

    // Calculate growth time with consumables
    let speedMult = 1;
    if ((activeBuffs['SPEED_SOIL'] || 0) > Date.now()) {
      // Speed Soil: -10% growth time
      speedMult *= 0.9;
    }
    if ((activeBuffs['GROWTH_FERTILIZER'] || 0) > Date.now()) {
      // Growth Fertilizer: -20% growth time
      speedMult *= 0.8;
    }

    const adjustedCrop = { ...crop, growthTime: crop.growthTime * speedMult };

    setSlots(prev => prev.map(s => {
      if (s.id === slotId && s.status === SlotStatus.EMPTY) {
        return {
          ...s,
          status: SlotStatus.GROWING,
          crop: adjustedCrop,
          plantedAt: Date.now(),
          isAdReady: false
        };
      }
      return s;
    }));
    
    // Note: Only rare plantings count toward tasks
  }, [activeBuffs, updateDailyTaskProgress]);

  // Helper: Check if TENANT/OWNER (no ads required)
  const isAdFreeUser = useCallback(() => {
    return user.plan === Plan.TENANT || user.plan === Plan.OWNER;
  }, [user.plan]);

  // Helper: Get all ready slots for batch harvesting
  const getReadySlots = useCallback(() => {
    return slots.filter(s => s.status === SlotStatus.READY);
  }, [slots]);

  // Helper: Get storage info
  const getStorageInfo = useCallback(() => {
    const totalMax = user.storageMax === Infinity ? Infinity : user.storageMax + user.extraStorage;
    const percentage = user.storageMax === Infinity ? 0 : (user.storageUsed / totalMax) * 100;
    const isNearFull = percentage >= 90;
    const isFull = user.storageMax !== Infinity && user.storageUsed >= totalMax;
    
    return {
      used: user.storageUsed,
      max: totalMax,
      percentage,
      isNearFull,
      isFull,
      hasUnlimited: user.storageMax === Infinity
    };
  }, [user.storageUsed, user.storageMax, user.extraStorage]);

  // Helper: Check if storage can accommodate harvest
  const canHarvest = useCallback((slot: FarmSlot): { can: boolean; reason?: string; needed?: number; available?: number } => {
    if (!slot.crop) return { can: false, reason: 'No crop' };
    
    const totalMax = user.storageMax + user.extraStorage;
    const isNearFull = user.storageUsed / totalMax >= 0.9;
    
    const isDouble = user.hasYieldBooster && Math.random() < 0.25;
    const amount = isDouble ? 2 : 1;
    
    if (user.storageMax === Infinity) {
      return { can: true };
    }
    
    const available = totalMax - user.storageUsed;
    
    if (user.storageUsed + amount > totalMax) {
      return { 
        can: false, 
        reason: 'Storage full',
        needed: amount,
        available
      };
    }
    
    return { can: true, available };
  }, [user.storageUsed, user.storageMax, user.extraStorage, user.hasYieldBooster]);

  // Helper: Validate batch harvest with detailed info
  const canBatchHarvest = useCallback((): { 
    can: boolean; 
    reason?: string; 
    readyCount?: number;
    needed?: number;
    available?: number;
    percentage?: number;
  } => {
    const readySlots = getReadySlots();
    if (readySlots.length === 0) return { can: false, reason: 'No ready crops', readyCount: 0 };

    const totalMax = user.storageMax + user.extraStorage;
    const percentage = user.storageMax === Infinity ? 0 : (user.storageUsed / totalMax) * 100;

    if (user.storageMax === Infinity) {
      return { can: true, readyCount: readySlots.length, percentage };
    }

    // Calculate total needed for all ready slots
    let totalNeeded = 0;
    for (const slot of readySlots) {
      if (slot.crop) {
        const isDouble = user.hasYieldBooster && Math.random() < 0.25;
        totalNeeded += isDouble ? 2 : 1;
      }
    }
    
    const available = totalMax - user.storageUsed;
    
    if (user.storageUsed + totalNeeded > totalMax) {
      return { 
        can: false, 
        reason: 'Storage capacity exceeded',
        readyCount: readySlots.length,
        needed: totalNeeded,
        available,
        percentage
      };
    }

    return { can: true, readyCount: readySlots.length, needed: totalNeeded, available, percentage };
  }, [user.storageUsed, user.storageMax, user.extraStorage, user.hasYieldBooster, getReadySlots]);

  // Harvest single slot (with ad check)
  const harvestCrop = useCallback((slotId: number, requireAd: boolean = true): { success: boolean; message?: string; isDouble?: boolean; storageFull?: boolean } => {
    const slot = slots.find(s => s.id === slotId);
    if (!slot || slot.status !== SlotStatus.READY || !slot.crop) {
      return { success: false, message: 'Invalid slot' };
    }

    const totalMax = user.storageMax + user.extraStorage;
    
    // Storage validation - PRE-HARVEST CHECK
    if (user.storageMax !== Infinity && user.storageUsed >= totalMax) {
      return { success: false, message: 'Storage full - cannot harvest', storageFull: true };
    }

    // Check if ad is required (TENANT/OWNER bypass ads)
    const shouldRequireAd = requireAd && !isAdFreeUser();

    const cropName = slot.crop.name;
    const isDouble = user.hasYieldBooster && Math.random() < 0.25;
    const cropRarity = slot.crop.rarity;
    const amount = isDouble ? 2 : 1;

    // Storage check with yield
    if (user.storageMax !== Infinity && (user.storageUsed + amount) > totalMax) {
      return { success: false, message: 'Not enough storage for harvest', storageFull: true };
    }

    // Update inventory
    setInventory(inv => ({
      ...inv,
      [cropName]: {
        cropName,
        rarity: cropRarity,
        quantity: (inv[cropName]?.quantity || 0) + amount,
        type: 'CROP'
      }
    }));
    
    // Update user state
    setUser(u => ({ 
        ...u, 
        storageUsed: u.storageUsed + amount,
        totalHarvests: u.totalHarvests + amount 
    }));

    // Update slot status
    setSlots(prev => prev.map(s => {
      if (s.id === slotId && s.status === SlotStatus.READY) {
        return {
          ...s,
          status: SlotStatus.EMPTY,
          crop: null,
          plantedAt: null,
          isAdReady: false
        };
      }
      return s;
    }));

    updateDailyTaskProgress(TaskAction.HARVEST, amount);

    // Auto-Replant Logic - using requestAnimationFrame to prevent race conditions
    requestAnimationFrame(() => {
      if (!pendingReplants.current.has(slotId)) {
        pendingReplants.current.add(slotId);
        setTimeout(() => {
          plantCrop(slotId);
          pendingReplants.current.delete(slotId);
        }, 200);
      }
    });
    return { success: true, isDouble };
  }, [user, slots, plantCrop, updateDailyTaskProgress, isAdFreeUser]);

  // Batch harvest all ready slots (1 ad for all)
  const batchHarvest = useCallback(() => {
    const validation = canBatchHarvest();
    if (!validation.can) {
      return { success: false, message: validation.reason };
    }

    const readySlots = getReadySlots();
    const adRequired = !isAdFreeUser();

    // Harvest all ready slots
    let totalHarvested = 0;
    let totalDoubles = 0;
    const slotIds: number[] = [];
    const inventoryUpdates: Record<string, { cropName: string; rarity: Rarity; quantity: number }> = {};

    readySlots.forEach(slot => {
      if (slot.crop && slot.status === SlotStatus.READY) {
        const cropName = slot.crop.name;
        const isDouble = user.hasYieldBooster && Math.random() < 0.25;
        const amount = isDouble ? 2 : 1;

        // Track inventory updates
        if (!inventoryUpdates[cropName]) {
          inventoryUpdates[cropName] = {
            cropName,
            rarity: slot.crop.rarity,
            quantity: 0
          };
        }
        inventoryUpdates[cropName].quantity += amount;
        
        totalHarvested += amount;
        if (isDouble) totalDoubles++;
        slotIds.push(slot.id);
      }
    });

    // Apply all updates at once
    setInventory(inv => {
      const updated = { ...inv };
      Object.entries(inventoryUpdates).forEach(([cropName, update]) => {
        updated[cropName] = {
          cropName: update.cropName,
          rarity: update.rarity,
          quantity: (inv[cropName]?.quantity || 0) + update.quantity,
          type: 'CROP'
        };
      });
      return updated;
    });

    setUser(u => ({
      ...u,
      storageUsed: u.storageUsed + totalHarvested,
      totalHarvests: u.totalHarvests + totalHarvested
    }));

    setSlots(prev => prev.map(s => {
      if (slotIds.includes(s.id)) {
        return {
          ...s,
          status: SlotStatus.EMPTY,
          crop: null,
          plantedAt: null,
          isAdReady: false
        };
      }
      return s;
    }));

    // Auto-Replant all harvested slots with staggered delays to prevent race conditions
    slotIds.forEach((id, index) => {
      requestAnimationFrame(() => {
        if (!pendingReplants.current.has(id)) {
          pendingReplants.current.add(id);
          setTimeout(() => {
            plantCrop(id);
            pendingReplants.current.delete(id);
          }, 200 + (index * 50)); // Stagger by 50ms per slot
        }
      });
    });

    updateDailyTaskProgress(TaskAction.HARVEST, totalHarvested);

    return {
      success: true,
      count: readySlots.length,
      totalHarvested,
      totalDoubles,
      adRequired 
    };
  }, [user, slots, getReadySlots, canBatchHarvest, isAdFreeUser, plantCrop, updateDailyTaskProgress]);

  const sellAll = useCallback(() => {
    let totalValue = 0;
    const now = Date.now();
    const planBonus = PLAN_CONFIG[user.plan]?.bonus || 0;
    const tradePermitBonus = (activeBuffs['TRADE_PERMIT'] || 0) > now ? 0.10 : 0;
    const boosterBonus = (activeBuffs['PRICE_BOOSTER'] || 0) > now ? 0.15 : 0;

    // Integer math multipliers (basis points)
    const planMultiplier = Math.round(planBonus * 100);
    const tradeMultiplier = Math.round(tradePermitBonus * 100);
    const boosterMultiplier = Math.round(boosterBonus * 100);

    Object.values(inventory).forEach(item => {
      const cropConfig = CROPS.find(c => c.name === item.cropName);
      const trend = marketTrends.find(t => t.cropName === item.cropName);

      if (cropConfig) {
        // Integer math: work with basis points
        const trendMultiplier = trend && trend.isUp ? 110 : (trend && !trend.isUp ? 90 : 100);
        const totalMultiplier = trendMultiplier * (100 + planMultiplier + tradeMultiplier + boosterMultiplier);
        const itemValue = Math.floor((cropConfig.sellPrice * totalMultiplier * item.quantity) / 10000);
        totalValue += itemValue;
      }
    });

    setInventory({});
    setUser(u => ({
      ...u,
      balance: u.balance + totalValue,
      totalSales: u.totalSales + totalValue,
      storageUsed: 0
    }));

    updateDailyTaskProgress(TaskAction.SELL);
    return totalValue;
  }, [inventory, user.plan, activeBuffs, marketTrends, updateDailyTaskProgress]);

  const upgradePlan = useCallback((newPlan: Plan) => {
    const config = PLAN_CONFIG[newPlan];
    setUser(u => ({
      ...u,
      plan: newPlan,
      storageMax: config.storage
    }));
  }, []);

  const purchaseSlot = useCallback((slotId: number) => {
      // Calculate cost based on how many slots user has already purchased
      const purchasedSlots = slots.filter(s => s.isPurchased).length;
      const cost = purchasedSlots === 0 ? EXTRA_SLOT_PRICES.first : EXTRA_SLOT_PRICES.second;

      if (user.balance >= cost) {
          setUser(u => ({ ...u, balance: u.balance - cost }));
          setSlots(prev => prev.map(s => s.id === slotId ? { ...s, isPurchased: true } : s));
          return true;
      }
      return false;
  }, [user.balance, slots]);

  const buyShopItem = useCallback((itemId: string): boolean => {
       const purchasedSlots = slots.filter(s => s.isPurchased).map(s => s.id);
       const shopItems = getShopItemsForPlan(user.plan, purchasedSlots);
       const item = shopItems.find(i => i.id === itemId);
       if (!item) return false;
       if (user.balance < item.cost) return false;

       // Handle Slot Purchase specially
       if (item.type === 'PERMANENT' && item.slotId) {
           return purchaseSlot(item.slotId);
       }

      // Deduct Cost
      setUser(u => ({ ...u, balance: u.balance - item.cost }));

      if (item.type === 'PERMANENT') {
          if (item.id === 'yield_booster') {
             setUser(u => ({ ...u, hasYieldBooster: true }));
             return true;
          }
          if (item.id === 'storage_up' && item.storageAmount) {
             setUser(u => ({ ...u, extraStorage: u.extraStorage + item.storageAmount! }));
             return true;
          }
      }

      if (item.type === 'CONSUMABLE' && item.effect && item.duration) {
          setActiveBuffs(prev => ({ ...prev, [item.effect!]: Date.now() + item.duration! }));
          
          // Update daily task progress for buying from shop
          updateDailyTaskProgress(TaskAction.BUY_ITEM, 1);
          return true;
      }

      return false;
  }, [user.balance, user.plan, slots, purchaseSlot, updateDailyTaskProgress]);

  const activateBooster = useCallback(() => {
       // Limit to once per 24h tracked by activeBuff expiry? Or separate timer?
       // Spec says "Watch Ad to boost +15% Once/24h".
       // Using a long duration for now or just standard buff time. Assuming 24h buff duration for simplicity based on spec context.
       // If it's a 24h cooldown but short effect, we need separate logic. Assuming effect lasts until reset or 1h.
       // For this code, I'll set effect to 1 hour.
       setActiveBuffs(prev => ({ ...prev, 'PRICE_BOOSTER': Date.now() + 3600000 }));
       
       // Update daily task progress for watching ads
       updateDailyTaskProgress(TaskAction.WATCH_AD, 1);
   }, [updateDailyTaskProgress]);

  // Track ad completion for tasks
  const onAdWatched = useCallback(() => {
    updateDailyTaskProgress(TaskAction.WATCH_AD, 1);
  }, [updateDailyTaskProgress]);

  // Use a consumable tool from inventory
  const useItem = useCallback((itemId: string): { success: boolean; message?: string } => {
    const consumableInfo = CONSUMABLES[itemId];
    if (!consumableInfo) {
      return { success: false, message: 'Invalid item' };
    }

    const currentItem = inventory[itemId];
    if (!currentItem || currentItem.quantity <= 0) {
      return { success: false, message: 'No items available' };
    }

    // Check if buff is already active
    if ((activeBuffs[consumableInfo.effect] || 0) > Date.now()) {
      return { success: false, message: 'Buff already active!' };
    }

    // Activate the buff
    setActiveBuffs(prev => ({
      ...prev,
      [consumableInfo.effect]: Date.now() + consumableInfo.duration
    }));

    // Remove 1 from inventory
    setInventory(inv => {
      const updated = { ...inv };
      const newQuantity = (updated[itemId]?.quantity || 0) - 1;

      if (newQuantity <= 0) {
        delete updated[itemId];
      } else {
        updated[itemId] = {
          ...updated[itemId]!,
          quantity: newQuantity
        };
      }

      return updated;
    });

    return { success: true, message: `${consumableInfo.name} activated!` };
  }, [inventory, activeBuffs]);

  // Get items that are consumables/tools
  const getTools = useCallback(() => {
    return Object.entries(inventory)
      .filter(([itemId, item]) => isConsumable(itemId))
      .map(([itemId, item]) => {
        const consumableInfo = CONSUMABLES[itemId];
        const isActive = (activeBuffs[consumableInfo?.effect] || 0) > Date.now();
        return {
          id: itemId,
          name: consumableInfo?.name || itemId,
          quantity: item.quantity,
          icon: consumableInfo?.icon || '📦',
          effect: consumableInfo?.effect || 'SPEED_SOIL',
          duration: consumableInfo?.duration || 86400000,
          description: consumableInfo?.description || '',
          isActive
        };
      });
  }, [inventory, activeBuffs]);

  // Get crops only
  const getCrops = useCallback(() => {
    return Object.entries(inventory)
      .filter(([itemId, item]) => !isConsumable(itemId))
      .map(([itemId, item]) => ({
        cropName: item.cropName,
        quantity: item.quantity,
        rarity: item.rarity,
        type: 'CROP' as const
      }));
  }, [inventory]);

  const requestWithdrawal = useCallback((amountPts: number, method: 'FAUCETPAY' | 'TON', addressOrEmail: string) => {
      if (user.balance < amountPts) return { success: false, message: 'Insufficient Balance' };

      // Minimum withdrawal limits (per gamesystem.txt)
      // - New user (first withdrawal): 100 PTS
      // - Returning user (has withdrawn before): 1000 PTS
      const minThreshold = user.hasWithdrawn ? 1000 : 100;
      if (amountPts < minThreshold) return { success: false, message: `Minimum withdrawal is ${minThreshold} PTS` };

      // Calculate USDT value and fees
      // Conversion: 250,000 PTS = 1 USDT
      // - FaucetPay: 0% fee (instant)
      // - TON Wallet: 10% fee
      const rawUsdt = amountPts / EXCHANGE_RATE;
      const feeRate = method === 'TON' ? 0.10 : 0;
      const feePts = Math.floor(amountPts * feeRate);
      const feeUsdt = rawUsdt * feeRate;
      const finalUsdt = rawUsdt - feeUsdt;

      setUser(u => ({ ...u, balance: u.balance - amountPts }));

      const newWithdrawal: Withdrawal = {
          id: Math.random().toString(36).substr(2, 9),
          userId: user.id,
          amountPts,
          amountUsdt: finalUsdt,
          feePts,
          netUsdt: finalUsdt,
          method,
          destination: addressOrEmail,
          status: 'PENDING',
          timestamp: Date.now()
      };

      setWithdrawals(prev => [newWithdrawal, ...prev]);

      // Wallet Locking - Bind destination on first successful withdrawal
      // After this, user can only withdraw to the same address/email
      if (method === 'FAUCETPAY' && !user.faucetPayEmail) {
          setUser(u => ({ ...u, faucetPayEmail: addressOrEmail, hasWithdrawn: true }));
      } else if (method === 'TON' && !user.walletAddress) {
          setUser(u => ({ ...u, walletAddress: addressOrEmail, hasWithdrawn: true }));
      } else {
          // Update hasWithdrawn for subsequent withdrawals
          setUser(u => ({ ...u, hasWithdrawn: true }));
      }

      return { success: true, message: 'Withdrawal Requested!' };
  }, [user.balance, user.hasWithdrawn, user.faucetPayEmail, user.walletAddress, user.id]);

  // Lucky Spin Functions
  const canFreeSpinNow = useCallback((): boolean => {
    return checkCanFreeSpin(user.lastSpinTime);
  }, [user.lastSpinTime]);

  const getSpinCooldownRemaining = useCallback((): number => {
    return getRemainingCooldown(user.lastSpinTime);
  }, [user.lastSpinTime]);

  const formatSpinCooldown = useCallback((): string => {
    return formatCooldown(getRemainingCooldown(user.lastSpinTime));
  }, [user.lastSpinTime]);

  const startSpin = useCallback((isPaid: boolean): { success: boolean; message: string; isAdRequired?: boolean } => {
    // Check if already spinning
    if (isSpinning) {
      return { success: false, message: 'Already spinning!' };
    }

    if (isPaid) {
      // Paid spin - check balance
      if (user.balance < SPIN_CONFIG.paidCost) {
        return { success: false, message: `Not enough PTS (${SPIN_CONFIG.paidCost} required)` };
      }
      
      // Deduct cost and spin
      setIsSpinning(true);
      setUser(u => ({ ...u, balance: u.balance - SPIN_CONFIG.paidCost }));
      
      // Generate reward using enhanced prize pool
      const reward = constantsSpinWheel();
      setCurrentSpinReward(reward);
      
      // Show spinning animation, then award immediately
      setTimeout(() => {
        setIsSpinning(false);
        setSpinShowResult(true);
        
        // Award the prize immediately for paid spin
        if (reward.type === 'COINS' || reward.type === 'JACKPOT') {
          setUser(u => ({ ...u, balance: u.balance + (reward.value as number) }));
        } else if (reward.type === 'HERB' && reward.value) {
          const herbName = reward.value as string;
          setInventory(prev => ({
            ...prev,
            [herbName]: {
              cropName: herbName,
              quantity: (prev[herbName]?.quantity || 0) + 1,
              rarity: reward.rarity || Rarity.COMMON,
              type: 'CROP'
            }
          }));
          setUser(u => ({ ...u, storageUsed: u.storageUsed + 1 }));
        }
      }, 2000);
      
      return { success: true, message: 'Spinning...', isAdRequired: false };
    } else {
      // Free spin - check cooldown
      if (!canFreeSpinNow()) {
        return { success: false, message: `Cooldown: ${formatSpinCooldown()}` };
      }
      
      // Start free spin - show result first, then ad required
      setIsSpinning(true);
      
      // Generate reward using enhanced prize pool
      const reward = constantsSpinWheel();
      setPendingSpinReward(reward);
      
      // Show spinning animation, then show result with ad requirement
      setTimeout(() => {
        setIsSpinning(false);
        setCurrentSpinReward(reward);
        setSpinShowResult(true);
      }, 2000);
      
      return { success: true, message: 'Spinning...', isAdRequired: true };
    }
  }, [user.balance, user.lastSpinTime, user.storageMax, user.extraStorage, isSpinning]);

  const claimFreeSpinReward = useCallback((): { success: boolean; message: string } => {
    if (!pendingSpinReward) {
      return { success: false, message: 'No pending reward' };
    }

    const reward = pendingSpinReward;

    // Update last free spin time
    setUser(u => ({ ...u, lastSpinTime: Date.now() }));

    // Award the prize
    if (reward.type === 'COINS' || reward.type === 'JACKPOT') {
      setUser(u => ({ ...u, balance: u.balance + (reward.value as number) }));
    } else if (reward.type === 'HERB' && reward.value) {
      const herbName = reward.value as string;
      setInventory(prev => ({
        ...prev,
        [herbName]: {
          cropName: herbName,
          quantity: (prev[herbName]?.quantity || 0) + 1,
          rarity: reward.rarity || Rarity.COMMON,
          type: 'CROP'
        }
      }));
      setUser(u => ({ ...u, storageUsed: u.storageUsed + 1 }));
    }

    // Clear state
    setPendingSpinReward(null);
    setCurrentSpinReward(null);
    setSpinShowResult(false);

    return { 
      success: true, 
      message: `Won ${formatSpinReward(reward)}!` 
    };
  }, [pendingSpinReward]);

  const closeSpinResult = useCallback(() => {
    setSpinShowResult(false);
    setCurrentSpinReward(null);
    setPendingSpinReward(null);
  }, []);

  const resetSpinCooldown = useCallback(() => {
    // Debug/testing function to reset cooldown
    setUser(u => ({ ...u, lastSpinTime: 0 }));
  }, []);

  const setPage = (page: number) => {
      setActivePage(page);
  };

  // Generate referral link
  const referralLink = useMemo(() => generateReferralLink(user.id), [user.id]);

  // Calculate affiliate statistics
  const affiliateStats: AffiliateStats = useMemo(() => {
    const tier1 = referrals.filter(r => r.tier === 1);
    const tier2 = referrals.filter(r => r.tier === 2);
    const totalEarnings = referrals.reduce((sum, r) => sum + r.contribution, 0);

    return {
      totalReferrals: referrals.length,
      activeReferrals: referrals.filter(r => r.isActive).length,
      tier1Count: tier1.length,
      tier2Count: tier2.length,
      totalEarnings,
      pendingCommission: user.pendingCommission
    };
  }, [referrals, user.pendingCommission]);

  // Claim pending commission
  const claimCommission = useCallback((): { success: boolean; message: string; amount?: number } => {
    if (user.pendingCommission < AFFILIATE_CONFIG.minClaimAmount) {
      return {
        success: false,
        message: `Minimum ${AFFILIATE_CONFIG.minClaimAmount} PTS required to claim`
      };
    }

    const amount = user.pendingCommission;

    // Move pending to main balance
    setUser(u => ({
      ...u,
      balance: u.balance + amount,
      pendingCommission: 0,
      totalCommissionEarned: u.totalCommissionEarned + amount
    }));

    return {
      success: true,
      message: `Successfully claimed ${amount.toLocaleString()} PTS!`,
      amount
    };
  }, [user.pendingCommission]);

  // Update referral contribution (called when referral makes a sale)
  const updateReferralContribution = useCallback((referralId: string, saleAmount: number) => {
    setReferrals(prev => prev.map(r => {
      if (r.id === referralId) {
        const commission = calculateCommission(saleAmount, r.tier);
        return {
          ...r,
          contribution: r.contribution + commission,
          isActive: true
        };
      }
      return r;
    }));

    // Add to user's pending commission
    const commission = calculateCommission(saleAmount, 1); // Tier 1 rate for direct referral
    setUser(u => ({
      ...u,
      pendingCommission: u.pendingCommission + commission
    }));
  }, []);

  // Track successful friend invite for daily tasks
  const onFriendInvited = useCallback(() => {
    updateDailyTaskProgress(TaskAction.INVITE_FRIEND, 1);
  }, [updateDailyTaskProgress]);

  // Track joining telegram channel for daily tasks
  const onJoinChannel = useCallback(() => {
    updateDailyTaskProgress(TaskAction.JOIN_CHANNEL, 1);
  }, [updateDailyTaskProgress]);

  return {
    user,
    slots,
    inventory,
    dailyTasks,
    activePage,
    marketTrends,
    activeBuffs,
    referrals,
    withdrawals,
    setPage,
    plantCrop,
    harvestCrop,
    sellAll,
    claimDailyTask,
    claimFullCompletionBonus,
    getDailyTaskStats,
    updateDailyTaskProgress,
    upgradePlan,
    purchaseSlot,
    buyShopItem,
    activateBooster,
    onAdWatched,
    onFriendInvited,
    onJoinChannel,
    useItem,
    getTools,
    getCrops,
    claimCommission,
    updateReferralContribution,
    affiliateStats,
    referralLink,
    requestWithdrawal,
    // Lucky Spin
    isSpinning,
    currentSpinReward,
    spinShowResult,
    canFreeSpinNow,
    getSpinCooldownRemaining,
    formatSpinCooldown,
    startSpin,
    claimFreeSpinReward,
    closeSpinResult,
    resetSpinCooldown,
  };
};