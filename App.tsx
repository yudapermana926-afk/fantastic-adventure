import React, { useState, useMemo, lazy, Suspense, useCallback } from 'react';
import {
  Menu, ShoppingCart, Users, Warehouse,
  Settings, Coins, Wheat, User, Star, Map,
  CheckCircle, Gift, BookOpen, Lock, PlayCircle, X,
  AlertCircle, ClipboardList, Gamepad2, Info, Crown, CreditCard,
  TrendingUp, TrendingDown, Clock, Zap, Store, Copy, Wallet, ChevronRight, ShoppingBag
} from 'lucide-react';
import { useGameStore } from './store';
import { GameScene } from './components/Scene3D';
import { Modal, ChunkyButton, ToastContainer, Toast, ConfirmDialog } from './components/UI';
import { StorageFullPopup } from './components/StorageFullPopup';
import { SlotStatus, Rarity, Plan, InventoryItem, ShopItem } from './types';
import { CROPS, PLAN_CONFIG, RARITY_COLORS } from './constants';
import { validators, formatters } from './utils/validation';

// Lazy loaded modals for code-splitting
const MembershipModal = lazy(() => import('./components/modals/MembershipModal').then(m => ({ default: m.MembershipModal })));
const MarketModal = lazy(() => import('./components/modals/MarketModal').then(m => ({ default: m.MarketModal })));
const ActivityModal = lazy(() => import('./components/modals/ActivityModal').then(m => ({ default: m.ActivityModal })));
const BarnModal = lazy(() => import('./components/modals/BarnModal').then(m => ({ default: m.BarnModal })));
const ProfileModal = lazy(() => import('./components/modals/ProfileModal').then(m => ({ default: m.ProfileModal })));
const AffiliateModal = lazy(() => import('./components/modals/AffiliateModal').then(m => ({ default: m.AffiliateModal })));
const MenuModal = lazy(() => import('./components/modals/MenuModal').then(m => ({ default: m.MenuModal })));
const TaskModal = lazy(() => import('./components/modals/TaskModal').then(m => ({ default: m.TaskModal })));
const SpinModal = lazy(() => import('./components/modals/SpinModal').then(m => ({ default: m.SpinModal })));

// Loading fallback for lazy components
const ModalLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  }>
    {children}
  </Suspense>
);

const NavButton = ({ icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center w-16 h-16 transition-all relative z-10 group ${active ? '-translate-y-5' : 'hover:-translate-y-1'}`}>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.2)] mb-1 transition-all border-2 ${active ? 'bg-amber-400 border-amber-500 text-amber-900 scale-110' : 'bg-[#6D4C41] border-[#5D4037] text-amber-100/50'}`}>
        {React.cloneElement(icon, { size: 24, strokeWidth: 2.5 })}
    </div>
    <span className={`text-[10px] font-black uppercase tracking-wider ${active ? 'text-amber-200' : 'text-transparent group-hover:text-amber-200/50'}`}>{label}</span>
  </button>
);

const SidebarButton = ({ icon, onClick, badgeCount, label }: { icon: any, onClick: () => void, badgeCount?: number, label: string }) => (
    <button onClick={onClick} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/20 shadow-lg active:scale-95 transition-all relative group hover:bg-white/20">
        {icon}
        {badgeCount ? (
             <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold">
                {badgeCount}
             </span>
        ) : null}
    </button>
);

export default function App() {
  const { 
    user, slots, dailyTasks, activePage, marketTrends, activeBuffs, referrals, withdrawals,
    setPage, inventory, plantCrop, harvestCrop, sellAll, getDailyTaskStats,
    upgradePlan, purchaseSlot, buyShopItem, activateBooster, requestWithdrawal,
    // Lucky Spin
    isSpinning, currentSpinReward, spinShowResult, canFreeSpinNow, formatSpinCooldown,
    startSpin, claimFreeSpinReward, closeSpinResult, 
  } = useGameStore();
  
  // UI State
  const [activeModal, setActiveModal] = useState<'NONE' | 'BARN' | 'MARKET' | 'PROFILE' | 'SPIN' | 'FULL' | 'TASKS' | 'WIKI' | 'MEMBERSHIP' | 'AFFILIATE' | 'WITHDRAW' | 'MENU'>('NONE');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [marketTab, setMarketTab] = useState<'SELL' | 'BUY'>('SELL');
  const [shopCategory, setShopCategory] = useState<'PERMANENT' | 'CONSUMABLE'>('PERMANENT');
  
  // Withdraw State
  const [withdrawMethod, setWithdrawMethod] = useState<'FAUCETPAY' | 'TON'>('FAUCETPAY');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [withdrawErrors, setWithdrawErrors] = useState<string[]>([]);

  // Storage Full Popup State
  const [storageFullPopup, setStorageFullPopup] = useState<{
    isOpen: boolean;
    used: number;
    max: number;
    percentage: number;
  }>({ isOpen: false, used: 0, max: 100, percentage: 0 });

  // Ad Simulation State
  const [adState, setAdState] = useState<{
      isPlaying: boolean;
      type: 'HARVEST' | 'SPIN_CLAIM' | 'TASK_CLAIM' | 'PRICE_BOOST';
      contextId?: string | number;
  }>({ isPlaying: false, type: 'HARVEST' });

  // Spin Game State
  const [spinState, setSpinState] = useState<{hasSpun: boolean, reward: string | null}>({ hasSpun: false, reward: null });

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'warning' | 'danger' | 'info';
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {}, variant: 'warning' });

  // --- Helpers ---
  const showToast = (message: string, type: 'success' | 'info' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  };

  const planConfig = PLAN_CONFIG[user.plan] || PLAN_CONFIG['FREE'];
  const totalMax = user.storageMax + (user.extraStorage || 0);
  const storagePercentage = user.storageMax === Infinity ? 0 : (user.storageUsed / totalMax) * 100;
  const isStorageFull = user.storageMax !== Infinity && user.storageUsed >= totalMax;
  const isStorageNearFull = storagePercentage >= 90;
  
  const tasksReadyToClaim = dailyTasks.filter(t => t.isCompleted && !t.isClaimed).length;
  const isBoosterActive = (activeBuffs['PRICE_BOOSTER'] || 0) > Date.now();

  const referralLink = `t.me/cyberfarmer_bot?startapp=${user.id}`;
  const totalReferralEarnings = referrals.reduce((sum, r) => sum + r.contribution, 0);

  // --- Storage Full Popup Helpers ---
  const showStorageFullPopup = () => {
    setStorageFullPopup({
      isOpen: true,
      used: user.storageUsed,
      max: totalMax,
      percentage: storagePercentage
    });
  };

  const handleStorageSell = () => {
    setMarketTab('SELL');
    setActiveModal('MARKET');
  };

  const handleStorageBuy = () => {
    setShopCategory('PERMANENT');
    setMarketTab('BUY');
    setActiveModal('MARKET');
  };

  const handleStorageUpgrade = () => {
    setActiveModal('MEMBERSHIP');
  };

  // --- Confirm Dialog Helpers ---
  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    variant: 'warning' | 'danger' | 'info' = 'warning'
  ) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm, variant });
  };

  const handleConfirm = () => {
    confirmDialog.onConfirm();
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  // --- Interaction Handlers ---
  const handleSlotClick = (id: number) => {
    const slot = slots.find(s => s.id === id);
    if (!slot) return;

    // 1. Disabled Slots (Need Plan Upgrade)
    if (slot.status === SlotStatus.DISABLED) {
        showToast("Upgrade Membership to unlock!", 'info');
        setActiveModal('MEMBERSHIP');
        if (navigator.vibrate) navigator.vibrate(200);
        return;
    }

    // 2. Locked Shop Slots (Purchasable with PTS)
    if (slot.status === SlotStatus.LOCKED_SHOP) {
        // Calculate cost based on how many slots user has already purchased
        const purchasedSlots = slots.filter(s => s.isPurchased).length;
        const cost = purchasedSlots === 0 ? 10000 : 750000;

        showConfirm(
          `Unlock Slot #${id}`,
          `Purchase this slot for ${cost.toLocaleString()} PTS?`,
          () => {
            const success = purchaseSlot(id);
            if (success) showToast("Slot Unlocked!", "success");
            else showToast("Insufficient Funds!", "info");
          },
          'warning'
        );
        return;
    }

    // 3. Normal Gameplay
    if (slot.status === SlotStatus.EMPTY) {
      plantCrop(id);
      if (navigator.vibrate) navigator.vibrate(50);
    } 
    else if (slot.status === SlotStatus.READY) {
      if (isStorageFull) {
        showStorageFullPopup();
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        return;
      }
      setAdState({ isPlaying: true, type: 'HARVEST', contextId: id });
    }
  };

  const handleTaskClaim = (id: number) => {
      setAdState({ isPlaying: true, type: 'TASK_CLAIM', contextId: id });
  };

  const handleSpinClaim = () => {
      setAdState({ isPlaying: true, type: 'SPIN_CLAIM' });
  };

  const handleBoosterAd = () => {
      setAdState({ isPlaying: true, type: 'PRICE_BOOST' });
  };

  const handleUpgrade = (plan: Plan) => {
      showConfirm(
        `Upgrade to ${plan}`,
        `Confirm upgrade to ${plan} tier? (Simulation: Payment Successful)`,
        () => {
          upgradePlan(plan);
          showToast(`Welcome to ${plan} Tier!`, 'success');
          setActiveModal('NONE');
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
        },
        'warning'
      );
  };

  const handleShopBuy = (item: ShopItem) => {
      if (item.id === 'plot_2' || item.id === 'plot_3') {
          const slot = slots.find(s => s.id === item.slotId);
          if (slot?.isPurchased) {
              showToast("Already Owned!", 'info');
              return;
          }
      }

      if (user.balance < item.cost) {
          showToast("Insufficient Funds", 'info');
          return;
      }

      showConfirm(
        `Purchase ${item.name}`,
        `Buy ${item.name} for ${item.cost.toLocaleString()} PTS?`,
        () => {
          const success = buyShopItem(item.id);
          if (success) {
              showToast(`Bought ${item.name}!`, 'success');
              if (navigator.vibrate) navigator.vibrate(50);
          } else {
              showToast("Purchase Failed", 'info');
          }
        },
        'warning'
      );
  };

  const handleCopyLink = () => {
      navigator.clipboard.writeText(referralLink);
      showToast("Link Copied!", 'success');
  };

  const validateWithdraw = useCallback(() => {
    const amountResult = validators.withdrawAmount(withdrawAmount, user.balance, user.plan);
    const addressResult = withdrawMethod === 'FAUCETPAY'
      ? validators.email(withdrawAddress)
      : validators.tonAddress(withdrawAddress);

    const errors = [...amountResult.errors, ...addressResult.errors];
    setWithdrawErrors(errors);
    return errors.length === 0;
  }, [withdrawAmount, withdrawAddress, withdrawMethod, user.balance, user.plan]);

  const handleWithdraw = () => {
    if (!validateWithdraw()) return;

    const amount = parseInt(withdrawAmount.replace(/,/g, ''));
    const result = requestWithdrawal(amount, withdrawMethod, withdrawAddress);

    if (result.success) {
      showToast(result.message, 'success');
      setWithdrawAmount('');
      setWithdrawAddress('');
      setWithdrawErrors([]);
    } else {
      showToast(result.message || 'Error', 'info');
    }
  };

    const finishAd = () => {
       if (adState.type === 'HARVEST' && adState.contextId) {
          // Harvest
          harvestCrop(Number(adState.contextId));
          if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
       }
       else if (adState.type === 'TASK_CLAIM' && adState.contextId) {
         // Ad watched for task - task will be claimed manually in TaskModal
         showToast("Ad watched! Task progress updated.", 'success');
         if (navigator.vibrate) navigator.vibrate(100);
      }
      else if (adState.type === 'SPIN_CLAIM') {
          showToast(`Spin Reward Claimed!`, 'success');
      }
      else if (adState.type === 'PRICE_BOOST') {
          activateBooster();
          showToast("Price Booster Activated! (+15%)", 'success');
          if (navigator.vibrate) navigator.vibrate([100, 100]);
      }

     setAdState(prev => ({ ...prev, isPlaying: false }));
  };

  React.useEffect(() => {
      if (adState.isPlaying) {
          const isVip = user.plan === Plan.TENANT || user.plan === Plan.OWNER;
          const time = (isVip && adState.type === 'HARVEST') ? 500 : 3000;
          const timer = setTimeout(finishAd, time);
          return () => clearTimeout(timer);
      }
  }, [adState.isPlaying, user.plan]);

  const handlePageChange = (page: number) => {
      setPage(page);
      if (navigator.vibrate) navigator.vibrate(50);
  }

  const formatCurrency = (amount: number) => amount.toLocaleString('en-US');

  const handleSellAll = () => {
    const earned = sellAll();
    if (earned > 0) {
      showToast(`Sold all for $${formatCurrency(earned)}!`, 'success');
      if (navigator.vibrate) navigator.vibrate([100]);
    } else {
      showToast('Nothing to sell!', 'info');
    }
  };

  // --- Derived State for Inventory ---
  const [sortMethod, setSortMethod] = useState<'NEWEST' | 'QUANTITY' | 'RARITY'>('NEWEST');
  const sortedInventory = useMemo(() => {
    const items = Object.values(inventory) as InventoryItem[];
    return items.sort((a, b) => {
      if (sortMethod === 'QUANTITY') return b.quantity - a.quantity;
      if (sortMethod === 'RARITY') {
        const rarityOrder = { [Rarity.LEGENDARY]: 5, [Rarity.EPIC]: 4, [Rarity.RARE]: 3, [Rarity.UNCOMMON]: 2, [Rarity.COMMON]: 1 };
        return rarityOrder[b.rarity] - rarityOrder[a.rarity];
      }
      return 0;
    });
  }, [inventory, sortMethod]);

  const totalSellValue = useMemo(() => {
    let total = 0;
    const planBonus = PLAN_CONFIG[user.plan]?.bonus || 0;
    const tradePermitBonus = (activeBuffs['TRADE_PERMIT'] || 0) > Date.now() ? 0.10 : 0;
    const boosterBonus = isBoosterActive ? 0.15 : 0;

    (Object.values(inventory) as InventoryItem[]).forEach(item => {
      const cropConfig = CROPS.find(c => c.name === item.cropName);
      const trend = marketTrends.find(t => t.cropName === item.cropName);
      if (cropConfig) {
        let price = cropConfig.sellPrice;
        if (trend) {
           const trendMod = trend.isUp ? (1 + trend.change) : (1 - trend.change);
           price *= trendMod;
        }
        const totalBonus = 1 + planBonus + tradePermitBonus + boosterBonus;
        price *= totalBonus;
        total += Math.floor(price * item.quantity);
      }
    });
    return total;
  }, [inventory, marketTrends, user.plan, activeBuffs, isBoosterActive]);

  const calculatedUsdt = useMemo(() => {
      const pts = parseInt(withdrawAmount.replace(/,/g, '')) || 0;
      const rate = 250000;
      const fee = withdrawMethod === 'TON' ? 0.05 : 0;
      return (pts / rate) * (1 - fee);
  }, [withdrawAmount, withdrawMethod]);

  return (
    <div className="relative w-full h-screen bg-[#7CB342] overflow-hidden text-[#3E2723] font-sans">
      
      {/* LAYER 0: 3D Scene */}
      <GameScene 
        slots={slots} 
        activePage={activePage}
        user={user}
        onInteract={handleSlotClick} 
        onBarnClick={() => setActiveModal('BARN')}
      />

      <ToastContainer toasts={toasts} />
      
      {/* Ad Overlay */}
      {adState.isPlaying && (
          <div className="absolute inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center text-white backdrop-blur-sm">
              <div className="w-16 h-16 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-4"></div>
              <h2 className="text-xl font-bold uppercase tracking-widest text-amber-400">
                  {(user.plan === Plan.TENANT || user.plan === Plan.OWNER) && adState.type === 'HARVEST' ? 'VIP Harvest...' : 'Watching Ad...'}
              </h2>
              <p className="text-gray-400 text-sm mt-2">Reward Incoming</p>
          </div>
      )}

      {/* LAYER 1: HUD */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-10 safe-area-padding">
        
        {/* HEADER */}
        <div className="flex justify-between items-start p-4 pt-6">
          <button className="pointer-events-auto bg-white/30 backdrop-blur-md pl-1 pr-4 py-1 rounded-full border border-white/40 shadow-lg flex items-center gap-3 transition-transform active:scale-95" onClick={() => setActiveModal('PROFILE')}>
             <div className="w-10 h-10 bg-gradient-to-br from-amber-300 to-amber-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm relative">
                <User className="text-amber-900" size={20} />
                {user.plan === Plan.OWNER && (
                    <div className="absolute -top-3 -right-2 transform rotate-12">
                         <Crown size={20} className="text-yellow-300 drop-shadow-md fill-yellow-400" />
                    </div>
                )}
             </div>
             <div className="flex flex-col items-start">
                <div className={`text-[10px] ${user.plan === Plan.OWNER ? 'bg-yellow-500' : 'bg-amber-500'} text-white px-1.5 rounded-sm font-bold leading-none mb-0.5 flex items-center gap-1 shadow-sm uppercase`}>
                   {user.plan} <Star size={8} fill="currentColor" />
                </div>
                <div className="font-extrabold text-sm leading-none text-white drop-shadow-md text-outline">{user.username}</div>
             </div>
          </button>

          <button onClick={() => setActiveModal('WITHDRAW')} className="pointer-events-auto bg-white/30 backdrop-blur-md px-4 py-2 rounded-full border border-white/40 shadow-lg flex items-center gap-2 active:scale-95 transition-transform">
             <div className="w-6 h-6 rounded-full bg-yellow-400 border-2 border-yellow-200 flex items-center justify-center shadow-sm">
                <span className="text-yellow-800 font-bold text-xs">$</span>
             </div>
             <span className="font-black text-xl text-white tracking-tight drop-shadow-md text-outline">{formatCurrency(user.balance)}</span>
          </button>
        </div>

        {/* SIDEBAR (THE RIGHT PILL) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto">
           <div className="flex flex-col gap-5 p-2.5 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl">
              <SidebarButton 
                  icon={<Gamepad2 size={24} />} 
                  onClick={() => setActiveModal('SPIN')} 
                  label="Spin"
              />
              <SidebarButton 
                  icon={<ClipboardList size={24} />} 
                  onClick={() => setActiveModal('TASKS')} 
                  badgeCount={tasksReadyToClaim}
                  label="Tasks"
              />
              <SidebarButton 
                  icon={<BookOpen size={24} />} 
                  onClick={() => setActiveModal('WIKI')}
                  label="Wiki" 
              />
           </div>
        </div>

        {/* BOTTOM NAV */}
        <div className="pointer-events-auto p-4 pb-8 flex flex-col gap-3">
            <div className="flex justify-center gap-4">
               {[1, 2, 3].map(page => {
                   return (
                       <button 
                         key={page}
                         onClick={() => handlePageChange(page)}
                         className={`
                            w-14 h-14 rounded-2xl font-black text-xl transition-all shadow-[0_4px_0_rgba(0,0,0,0.2)] border-2 active:shadow-none active:translate-y-1 relative
                            ${activePage === page 
                                ? 'bg-amber-400 border-amber-500 text-amber-900 -translate-y-2' 
                                : 'bg-[#FFF8E1] border-[#D7CCC8] text-[#8D6E63]'}
                         `}
                       >
                         {page}
                       </button>
                   )
               })}
            </div>

            <div className="bg-[#5D4037] px-4 py-3 rounded-[2rem] flex justify-between items-center shadow-2xl border-t-4 border-[#8D6E63] relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>
                <NavButton icon={<Wheat />} label="Farm" active />
                <NavButton icon={<ShoppingCart />} label="Market" onClick={() => setActiveModal('MARKET')} />
                {/* Changed: Membership replaces Barn, Menu added to right */}
                <NavButton icon={<Crown />} label="Member" onClick={() => setActiveModal('MEMBERSHIP')} />
                <NavButton icon={<Users />} label="Team" onClick={() => setActiveModal('AFFILIATE')} />
                <NavButton icon={<Menu />} label="Menu" onClick={() => setActiveModal('MENU')} />
            </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      <MenuModal 
        isOpen={activeModal === 'MENU'} 
        onClose={() => setActiveModal('NONE')} 
      />

      <MembershipModal
          isOpen={activeModal === 'MEMBERSHIP'}
          onClose={() => setActiveModal('NONE')}
          onShowToast={showToast}
          onUpgrade={(plan) => handleUpgrade(plan)}
          onDepositClick={() => setActiveModal('WITHDRAW')}
      />

      <AffiliateModal
        isOpen={activeModal === 'AFFILIATE'}
        onClose={() => setActiveModal('NONE')}
        onShowToast={showToast}
      />

      <Modal isOpen={activeModal === 'WITHDRAW'} onClose={() => setActiveModal('NONE')} title="Withdraw Funds">
         <div className="space-y-4">
             <div className="bg-gray-800 text-white p-4 rounded-xl flex justify-between items-center shadow-md">
                 <div>
                     <div className="text-xs text-gray-400 font-bold uppercase">Available Balance</div>
                     <div className="text-xl font-black text-amber-400">{formatCurrency(user.balance)} PTS</div>
                 </div>
                 <div className="text-right">
                     <div className="text-[10px] text-gray-400 font-bold uppercase">Rate</div>
                     <div className="text-xs font-bold">250k PTS = 1 USDT</div>
                 </div>
             </div>

             <div className="flex gap-2">
                 <button 
                    onClick={() => setWithdrawMethod('FAUCETPAY')}
                    className={`flex-1 py-3 rounded-xl border-2 font-bold text-xs uppercase transition-all ${withdrawMethod === 'FAUCETPAY' ? 'bg-blue-500 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-400'}`}
                 >
                     FaucetPay
                     <span className="block text-[9px] opacity-80 normal-case">0% Fee / Instant</span>
                 </button>
                 <button 
                    onClick={() => setWithdrawMethod('TON')}
                    className={`flex-1 py-3 rounded-xl border-2 font-bold text-xs uppercase transition-all ${withdrawMethod === 'TON' ? 'bg-blue-500 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-400'}`}
                 >
                     Direct TON
                     <span className="block text-[9px] opacity-80 normal-case">5% Fee / Network</span>
                 </button>
             </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                  {withdrawErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      {withdrawErrors.map((error, idx) => (
                        <div key={idx} className="text-xs text-red-600 font-bold flex items-center gap-1">
                          <AlertCircle size={12} />
                          {error}
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                      <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Amount (PTS)</label>
                      <input
                         type="text"
                         value={withdrawAmount}
                         onChange={(e) => setWithdrawAmount(formatters.numbersOnly(e.target.value))}
                         placeholder="Min 1,000"
                         className={`w-full bg-gray-50 border rounded-lg p-3 font-mono font-bold text-gray-800 focus:outline-none transition-colors ${withdrawErrors.some(e => e.includes('Amount')) ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-amber-400'}`}
                      />
                  </div>

                  <div>
                      <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">
                          {withdrawMethod === 'FAUCETPAY' ? 'FaucetPay Email' : 'TON Wallet Address'}
                      </label>
                      <input
                         type="text"
                         value={withdrawAddress}
                         onChange={(e) => setWithdrawAddress(e.target.value)}
                         placeholder={withdrawMethod === 'FAUCETPAY' ? 'email@example.com' : 'UQ...'}
                         className={`w-full bg-gray-50 border rounded-lg p-3 font-mono text-xs text-gray-600 focus:outline-none transition-colors ${withdrawErrors.some(e => e.includes('Email') || e.includes('TON') || e.includes('address') || e.includes('Invalid')) ? 'border-red-400 focus:border-red-500' : 'border-gray-200 focus:border-amber-400'}`}
                      />
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg flex justify-between items-center border border-green-100">
                      <span className="text-xs font-bold text-green-800 uppercase">You Receive</span>
                      <span className="text-lg font-black text-green-600">${calculatedUsdt.toFixed(4)} USDT</span>
                  </div>

                  <ChunkyButton variant="green" className="w-full" onClick={handleWithdraw}>
                      Confirm Withdraw
                  </ChunkyButton>
              </div>

             <div>
                 <h4 className="font-bold text-gray-700 uppercase tracking-wider text-xs mb-2">History</h4>
                 <div className="bg-white rounded-xl border border-gray-100 overflow-hidden max-h-[150px] overflow-y-auto">
                     {withdrawals.length === 0 ? (
                         <div className="p-4 text-center text-xs text-gray-400">No withdrawals yet</div>
                     ) : (
                         withdrawals.map(w => (
                             <div key={w.id} className="flex justify-between items-center p-3 border-b border-gray-50 last:border-0">
                                 <div>
                                     <div className="font-bold text-xs text-gray-700">{w.method}</div>
                                     <div className="text-[10px] text-gray-400">{new Date(w.timestamp).toLocaleDateString()}</div>
                                 </div>
                                 <div className="text-right">
                                     <div className="font-bold text-xs text-gray-800">-${w.amountUsdt.toFixed(3)}</div>
                                     <div className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${w.status === 'PENDING' ? 'bg-yellow-100 text-yellow-600' : w.status === 'SUCCESS' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                         {w.status}
                                     </div>
                                 </div>
                             </div>
                         ))
                     )}
                 </div>
             </div>
         </div>
      </Modal>

        <ModalLoader>
          <MarketModal
            isOpen={activeModal === 'MARKET'}
            onClose={() => setActiveModal('NONE')}
            onShowToast={showToast}
            onWatchAd={() => setAdState({ isPlaying: true, type: 'PRICE_BOOST' })}
          />
        </ModalLoader>

        <ModalLoader>
          <TaskModal
            isOpen={activeModal === 'TASKS'}
            onClose={() => setActiveModal('NONE')}
            onNavigate={(action) => {
              const actionMap: Record<string, string> = {
                'farm': 'NONE',
                'market': 'MARKET',
                'shop': 'MEMBERSHIP',
                'ads': 'NONE',
                'affiliate': 'AFFILIATE',
                'channel': 'NONE',
              };
              const targetModal = actionMap[action] || 'NONE';
              if (targetModal !== 'NONE') {
                setActiveModal(targetModal as any);
              }
            }}
            onShowToast={showToast}
          />
        </ModalLoader>

        <ModalLoader>
          <SpinModal
            isOpen={activeModal === 'SPIN'}
            onClose={() => setActiveModal('NONE')}
            onWatchAd={() => setAdState({ isPlaying: true, type: 'SPIN_CLAIM' })}
            onShowToast={showToast}
          />
        </ModalLoader>

        <ModalLoader>
          <ActivityModal
            type={['WIKI', 'FULL'].includes(activeModal) ? activeModal as any : 'NONE'}
            isOpen={['WIKI', 'FULL'].includes(activeModal)}
            onClose={() => setActiveModal('NONE')}
          />
        </ModalLoader>

        <ModalLoader>
           <BarnModal
            isOpen={activeModal === 'BARN'}
            onClose={() => setActiveModal('NONE')}
            onGoToMarket={() => setActiveModal('MARKET')}
          />
        </ModalLoader>

        <ModalLoader>
          <ProfileModal
            isOpen={activeModal === 'PROFILE'}
            onClose={() => setActiveModal('NONE')}
            onShowToast={showToast}
            onWithdrawClick={() => setActiveModal('WITHDRAW')}
            onUpgradeClick={() => setActiveModal('MEMBERSHIP')}
          />
        </ModalLoader>

        <ModalLoader>
          <MenuModal
            isOpen={activeModal === 'MENU'}
            onClose={() => setActiveModal('NONE')}
          />
        </ModalLoader>

        <ModalLoader>
          <MembershipModal
            isOpen={activeModal === 'MEMBERSHIP'}
            onClose={() => setActiveModal('NONE')}
            onShowToast={showToast}
            onUpgrade={(plan) => handleUpgrade(plan)}
            onDepositClick={() => setActiveModal('WITHDRAW')}
          />
        </ModalLoader>

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          variant={confirmDialog.variant}
        />

        <StorageFullPopup
          isOpen={storageFullPopup.isOpen}
          storageUsed={storageFullPopup.used}
          storageMax={storageFullPopup.max}
          percentage={storageFullPopup.percentage}
          onSellClick={handleStorageSell}
          onBuyStorageClick={handleStorageBuy}
          onUpgradeClick={handleStorageUpgrade}
          onClose={() => setStorageFullPopup(prev => ({ ...prev, isOpen: false }))}
        />

    </div>
  );
}