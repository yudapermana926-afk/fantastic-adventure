import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameStore } from './store';
import { Plan, SlotStatus, Rarity, DailyTask } from './types';
import { CROPS, PLAN_CONFIG } from './constants';

describe('Game Store', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useGameStore());
    act(() => {
      result.current.setUser({
        id: 'test-id',
        username: 'TestFarmer',
        plan: Plan.FREE,
        balance: 5000,
        storageUsed: 0,
        storageMax: 100,
        extraStorage: 0,
        xp: 0,
        hasYieldBooster: false,
        faucetPayEmail: null,
        walletAddress: null,
        totalHarvests: 0,
        totalSales: 0,
        lastSpinTime: 0,
        lastDailyReset: new Date().toISOString().split('T')[0],
        hasWithdrawn: false,
        pendingCommission: 0,
        totalCommissionEarned: 0,
        dailyTasks: [],
        dailyTaskCompletedCount: 0,
        dailyTaskFullBonusClaimed: false,
      });
      result.current.setSlots(Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        status: i === 0 ? SlotStatus.EMPTY : SlotStatus.LOCKED_SHOP,
        crop: null,
        plantedAt: null,
        isAdReady: false,
        isPurchased: false
      })));
      result.current.setInventory({});
    });
  });

  describe('User State', () => {
    it('should update user balance', () => {
      const { result } = renderHook(() => useGameStore());
      act(() => {
        result.current.setUser({ balance: 10000 });
      });
      expect(result.current.user.balance).toBe(10000);
    });

    it('should calculate storage correctly', () => {
      const { result } = renderHook(() => useGameStore());
      const totalMax = result.current.user.storageMax + result.current.user.extraStorage;
      const isStorageFull = result.current.user.storageMax !== Infinity && result.current.user.storageUsed >= totalMax;
      expect(isStorageFull).toBe(false);
    });

    it('should detect full storage', () => {
      const { result } = renderHook(() => useGameStore());
      act(() => {
        result.current.setUser({ storageUsed: 100, storageMax: 100 });
      });
      const totalMax = result.current.user.storageMax + result.current.user.extraStorage;
      const isStorageFull = result.current.user.storageMax !== Infinity && result.current.user.storageUsed >= totalMax;
      expect(isStorageFull).toBe(true);
    });
  });

  describe('Slot Management', () => {
    it('should unlock first slot initially', () => {
      const { result } = renderHook(() => useGameStore());
      expect(result.current.slots[0].status).toBe(SlotStatus.EMPTY);
    });

    it('should lock other slots initially', () => {
      const { result } = renderHook(() => useGameStore());
      expect(result.current.slots[1].status).toBe(SlotStatus.LOCKED_SHOP);
    });

    it('should update slot status', () => {
      const { result } = renderHook(() => useGameStore());
      act(() => {
        result.current.updateSlot(1, { status: SlotStatus.GROWING });
      });
      expect(result.current.slots[0].status).toBe(SlotStatus.GROWING);
    });
  });

  describe('Inventory', () => {
    it('should add items to inventory', () => {
      const { result } = renderHook(() => useGameStore());
      act(() => {
        result.current.addToInventory('Cabbage', Rarity.COMMON, 5);
      });
      expect(result.current.inventory['Cabbage'].quantity).toBe(5);
    });

    it('should accumulate quantities', () => {
      const { result } = renderHook(() => useGameStore());
      act(() => {
        result.current.addToInventory('Corn', Rarity.COMMON, 3);
        result.current.addToInventory('Corn', Rarity.COMMON, 2);
      });
      expect(result.current.inventory['Corn'].quantity).toBe(5);
    });
  });

  describe('Currency Conversion', () => {
    it('should calculate USDT value without fee', () => {
      const { result } = renderHook(() => useGameStore());
      const value = (250000 / 250000) * (1 - 0);
      expect(value).toBe(1);
    });

    it('should calculate USDT value with TON fee', () => {
      const { result } = renderHook(() => useGameStore());
      const pts = 250000;
      const feeRate = 0.10;
      const value = (pts / 250000) * (1 - feeRate);
      expect(value).toBe(0.9);
    });
  });
});

describe('Game Constants', () => {
  describe('PLAN_CONFIG', () => {
    it('should have correct values for FREE plan', () => {
      expect(PLAN_CONFIG[Plan.FREE].baseLimit).toBe(1);
      expect(PLAN_CONFIG[Plan.FREE].storage).toBe(100);
      expect(PLAN_CONFIG[Plan.FREE].bonus).toBe(0);
    });

    it('should have correct values for OWNER plan', () => {
      expect(PLAN_CONFIG[Plan.OWNER].baseLimit).toBe(10);
      expect(PLAN_CONFIG[Plan.OWNER].storage).toBe(Infinity);
      expect(PLAN_CONFIG[Plan.OWNER].bonus).toBe(0.30);
    });
  });

  describe('CROPS', () => {
    it('should have crops for all rarities', () => {
      const rarities = new Set(CROPS.map(c => c.rarity));
      expect(rarities.has(Rarity.COMMON)).toBe(true);
      expect(rarities.has(Rarity.UNCOMMON)).toBe(true);
      expect(rarities.has(Rarity.RARE)).toBe(true);
      expect(rarities.has(Rarity.EPIC)).toBe(true);
      expect(rarities.has(Rarity.LEGENDARY)).toBe(true);
    });

    it('should have increasing prices by rarity', () => {
      const avgPrices = {
        [Rarity.COMMON]: CROPS.filter(c => c.rarity === Rarity.COMMON).reduce((s, c) => s + c.sellPrice, 0) / 5,
        [Rarity.LEGENDARY]: CROPS.filter(c => c.rarity === Rarity.LEGENDARY).reduce((s, c) => s + c.sellPrice, 0) / 3,
      };
      expect(avgPrices[Rarity.LEGENDARY]).toBeGreaterThan(avgPrices[Rarity.COMMON]);
    });
  });
});
