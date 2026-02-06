import { useMemo } from 'react';
import { useGameStore } from '../store';
import { InventoryItem, Rarity, Plan } from '../types';
import { CROPS, PLAN_CONFIG } from '../constants';

// Exchange rate constant
const EXCHANGE_RATE = 250000;

export const useInventoryValue = () => {
  const { inventory, marketTrends, user, activeBuffs } = useGameStore();

  return useMemo(() => {
    const planBonus = PLAN_CONFIG[user.plan]?.bonus || 0;
    const tradePermitBonus = (activeBuffs['TRADE_PERMIT'] || 0) > Date.now() ? 0.10 : 0;
    const boosterBonus = (activeBuffs['PRICE_BOOSTER'] || 0) > Date.now() ? 0.15 : 0;

    // Integer math multipliers (basis points)
    const planMultiplier = Math.round(planBonus * 100);
    const tradeMultiplier = Math.round(tradePermitBonus * 100);
    const boosterMultiplier = Math.round(boosterBonus * 100);

    let total = 0;
    const items = Object.values(inventory) as InventoryItem[];

    items.forEach(item => {
      const cropConfig = CROPS.find(c => c.name === item.cropName);
      const trend = marketTrends.find(t => t.cropName === item.cropName);

      if (cropConfig) {
        // Integer math: work with basis points
        const trendMultiplier = trend && trend.isUp ? 110 : (trend && !trend.isUp ? 90 : 100);
        const totalMultiplier = trendMultiplier * (100 + planMultiplier + tradeMultiplier + boosterMultiplier);
        const itemValue = Math.floor((cropConfig.sellPrice * totalMultiplier * item.quantity) / 10000);
        total += itemValue;
      }
    });

    return total;
  }, [inventory, marketTrends, user.plan, activeBuffs]);
};

export const useUsdtConverter = (pts: number, method: 'FAUCETPAY' | 'TON') => {
  return useMemo(() => {
    const fee = method === 'TON' ? 0.05 : 0;
    return Math.floor((pts / EXCHANGE_RATE) * (1 - fee) * 100) / 100;
  }, [pts, method]);
};

export const useFormattedBalance = () => {
  const { user } = useGameStore();
  return useMemo(() => user.balance.toLocaleString('en-US'), [user.balance]);
};

export const useStorageStatus = () => {
  const { user } = useGameStore();
  return useMemo(() => {
    const totalStorage = user.storageMax + user.extraStorage;
    const isFull = user.storageMax !== Infinity && user.storageUsed >= totalStorage;
    const percentage = user.storageMax === Infinity ? 0 : (user.storageUsed / totalStorage) * 100;
    return { isFull, percentage, totalStorage };
  }, [user.storageMax, user.storageUsed, user.extraStorage]);
};

export const useActiveBuffs = () => {
  const { activeBuffs } = useGameStore();
  return useMemo(() => {
    const now = Date.now();
    return Object.entries(activeBuffs)
      .filter(([_, expiresAt]) => expiresAt > now)
      .reduce((acc, [key, expiresAt]) => ({ ...acc, [key]: expiresAt }), {} as Record<string, number>);
  }, [activeBuffs]);
};

export const useTasksSummary = () => {
  const { dailyTasks } = useGameStore();
  return useMemo(() => ({
    total: dailyTasks.length,
    completed: dailyTasks.filter(t => t.isCompleted && !t.isClaimed).length,
  }), [dailyTasks]);
};

export const useReferralStats = () => {
  const { referrals } = useGameStore();
  return useMemo(() => ({
    count: referrals.length,
    totalEarnings: referrals.reduce((sum, r) => sum + r.contribution, 0),
  }), [referrals]);
};

// Crop growth progress calculator
export const useCropProgress = (slot: { status: string; plantedAt: number | null; crop: { growthTime: number } | null }) => {
  return useMemo(() => {
    if (slot.status !== 'GROWING' || !slot.plantedAt || !slot.crop) {
      return { progress: 0, timeLeft: 0 };
    }

    const elapsed = (Date.now() - slot.plantedAt) / 1000;
    const progress = Math.min(elapsed / slot.crop.growthTime, 1);
    const timeLeft = Math.max(0, Math.ceil(slot.crop.growthTime - elapsed));

    return { progress, timeLeft };
  }, [slot.status, slot.plantedAt, slot.crop]);
};

// Format time helper
export const useFormattedTime = (seconds: number) => {
  return useMemo(() => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [seconds]);
};

// Dynamic pricing calculator
export const useDynamicPrice = (cropName: string) => {
  const { marketTrends, user, activeBuffs } = useGameStore();

  return useMemo(() => {
    const cropConfig = CROPS.find(c => c.name === cropName);
    const trend = marketTrends.find(t => t.cropName === cropName);

    if (!cropConfig) return 0;

    const planBonus = PLAN_CONFIG[user.plan]?.bonus || 0;
    const tradePermitBonus = (activeBuffs['TRADE_PERMIT'] || 0) > Date.now() ? 0.10 : 0;
    const boosterBonus = (activeBuffs['PRICE_BOOSTER'] || 0) > Date.now() ? 0.15 : 0;

    // Integer math multipliers (basis points)
    const trendMultiplier = trend && trend.isUp ? 110 : (trend && !trend.isUp ? 90 : 100);
    const planMultiplier = Math.round(planBonus * 100);
    const tradeMultiplier = Math.round(tradePermitBonus * 100);
    const boosterMultiplier = Math.round(boosterBonus * 100);

    const totalMultiplier = trendMultiplier * (100 + planMultiplier + tradeMultiplier + boosterMultiplier);
    return Math.floor((cropConfig.sellPrice * totalMultiplier) / 10000);
  }, [cropName, marketTrends, user.plan, activeBuffs]);
};
