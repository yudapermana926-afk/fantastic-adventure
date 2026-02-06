import React, { useState, useMemo } from 'react';
import { TrendingUp, Store, CheckCircle, Zap, TrendingDown, X, Minus } from 'lucide-react';
import { ChunkyButton } from '../UI';
import { useGameStore } from '../../store';
import { CROPS, PLAN_CONFIG, getShopItemsForPlan, EXTRA_SLOT_PRICES, getHourlyPrice, calculateSellPrice } from '../../constants';
import { InventoryItem, ShopItem } from '../../types';

interface MarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'info') => void;
  onWatchAd: () => void;
}

export const MarketModal: React.FC<MarketModalProps> = ({ isOpen, onClose, onShowToast, onWatchAd }) => {
  const { user, inventory, marketTrends, activeBuffs, sellAll, buyShopItem, slots } = useGameStore();
  const [marketTab, setMarketTab] = useState<'SELL' | 'BUY'>('SELL');
  const [shopCategory, setShopCategory] = useState<'PERMANENT' | 'CONSUMABLE'>('PERMANENT');
  const [selectedCrop, setSelectedCrop] = useState<string | null>(null);

  // Get dynamic shop items based on plan
  const purchasedSlots = useMemo(() =>
    slots.filter(s => s.isPurchased).map(s => s.id),
    [slots]
  );

  const shopItems = useMemo(() =>
    getShopItemsForPlan(user.plan, purchasedSlots),
    [user.plan, purchasedSlots]
  );

  const isBoosterActive = (activeBuffs['PRICE_BOOSTER'] || 0) > Date.now();
  const isTradePermitActive = (activeBuffs['TRADE_PERMIT'] || 0) > Date.now();
  const planBonusPercent = Math.round((PLAN_CONFIG[user.plan]?.bonus || 0) * 100);

  // Calculate total sell value with breakdown
  const totalSellValue = useMemo(() => {
    let total = 0;
    let breakdown: Record<string, { quantity: number; price: number; total: number }> = {};

    Object.values(inventory).forEach(item => {
      const { totalPrice, breakdown: itemBreakdown } = calculateSellPrice(
        item.cropName,
        item.quantity,
        user.plan,
        activeBuffs
      );
      total += totalPrice;
      breakdown[item.cropName] = {
        quantity: item.quantity,
        price: itemBreakdown.basePrice,
        total: totalPrice
      };
    });

    return { total, breakdown };
  }, [inventory, user.plan, activeBuffs]);

  // Get price for a specific crop
  const getCropPrice = (cropName: string): { price: number; trend: 'UP' | 'DOWN' | 'STABLE'; change: number } => {
    const { price, trend, changePercent } = getHourlyPrice(cropName);
    return { price, trend, change: Math.abs(changePercent) };
  };

  const handleSellAll = () => {
    const earned = sellAll();
    if (earned > 0) {
      onShowToast(`Sold all for ${earned.toLocaleString()} PTS!`, 'success');
      if (navigator.vibrate) navigator.vibrate([100]);
    } else {
      onShowToast('Nothing to sell!', 'info');
    }
  };

  const handleShopBuy = (item: any) => {
    if (item.id === 'plot_2' || item.id === 'plot_3') {
      const slot = slots.find(s => s.id === item.slotId);
      if (slot?.isPurchased) {
        onShowToast("Already Owned!", 'info');
        return;
      }
    }
    if (user.balance < item.cost) {
      onShowToast("Insufficient Funds", 'info');
      return;
    }
    if (confirm(`Buy ${item.name} for ${item.cost.toLocaleString()} PTS?`)) {
      const success = buyShopItem(item.id);
      if (success) {
        onShowToast(`Bought ${item.name}!`, 'success');
        if (navigator.vibrate) navigator.vibrate(50);
      } else {
        onShowToast("Purchase Failed", 'info');
      }
    }
  };

  // Render trend icon
  const TrendIcon = ({ trend }: { trend: 'UP' | 'DOWN' | 'STABLE' }) => {
    switch (trend) {
      case 'UP': return <TrendingUp size={14} className="text-green-500" />;
      case 'DOWN': return <TrendingDown size={14} className="text-red-500" />;
      default: return <Minus size={14} className="text-gray-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white border-4 border-gray-300 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center p-4 bg-gradient-to-r from-green-500 to-emerald-600 border-b-4 border-green-700">
          <div className="flex-1">
            <h2 className="text-xl font-black tracking-widest uppercase text-white drop-shadow-sm flex items-center gap-2">
              <TrendingUp size={24} /> Market
            </h2>
          </div>
          <button onClick={onClose} className="bg-black/20 p-2 rounded-full hover:bg-black/40 text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 border-b border-gray-300">
          <button
            onClick={() => setMarketTab('SELL')}
            className={`flex-1 py-4 font-black uppercase tracking-wider flex items-center justify-center gap-2 ${marketTab === 'SELL' ? 'bg-white text-green-600 border-b-4 border-green-500' : 'text-gray-400 hover:bg-gray-200'}`}
          >
            <TrendingUp size={20} /> Sell
          </button>
          <button
            onClick={() => setMarketTab('BUY')}
            className={`flex-1 py-4 font-black uppercase tracking-wider flex items-center justify-center gap-2 ${marketTab === 'BUY' ? 'bg-white text-blue-600 border-b-4 border-blue-500' : 'text-gray-400 hover:bg-gray-200'}`}
          >
            <Store size={20} /> Shop
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide bg-gray-50 p-4">

          {/* SELL VIEW */}
          {marketTab === 'SELL' && (
            <div className="flex flex-col gap-4">

              {/* Bonus Status Banner */}
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase">Plan</div>
                    <div className="text-sm font-black text-amber-400">+{planBonusPercent}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase">Trade</div>
                    <div className={`text-sm font-bold ${isTradePermitActive ? 'text-green-400' : 'text-gray-500'}`}>
                      {isTradePermitActive ? '+10%' : '0%'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase">Booster</div>
                    <div className={`text-sm font-bold ${isBoosterActive ? 'text-green-400' : 'text-gray-500'}`}>
                      {isBoosterActive ? '+15%' : '0%'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase">Total</div>
                    <div className="text-sm font-black text-green-400">
                      +{planBonusPercent + (isTradePermitActive ? 10 : 0) + (isBoosterActive ? 15 : 0)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Booster Banner */}
              <button
                onClick={() => !isBoosterActive && onWatchAd()}
                disabled={isBoosterActive}
                className={`w-full p-4 rounded-xl flex items-center justify-between shadow-md relative overflow-hidden ${isBoosterActive ? 'bg-gray-800' : 'bg-gradient-to-r from-yellow-400 to-amber-500'}`}
              >
                <div className="relative z-10 text-left">
                  <div className={`font-black uppercase text-lg ${isBoosterActive ? 'text-gray-400' : 'text-white drop-shadow-md'}`}>
                    {isBoosterActive ? 'Booster Active' : 'Boost Prices'}
                  </div>
                  <div className={`text-xs font-bold ${isBoosterActive ? 'text-green-400' : 'text-yellow-100'}`}>
                    {isBoosterActive ? '+15% Bonus Applied' : 'Watch Ad for +15% Sell Bonus'}
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isBoosterActive ? 'bg-gray-700 text-green-500' : 'bg-white/20 text-white'}`}>
                  {isBoosterActive ? <CheckCircle size={24} /> : <Zap size={24} className="fill-white" />}
                </div>
              </button>

              {/* Price Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="grid grid-cols-5 bg-gray-100 p-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-2 pl-2">Item</div>
                  <div className="text-center">Owned</div>
                  <div className="text-center">Trend</div>
                  <div className="text-right pr-2">Price</div>
                </div>
                {CROPS.map((crop) => {
                  const { price, trend, change } = getCropPrice(crop.name);
                  const invItem = inventory[crop.name];
                  const owned = invItem ? invItem.quantity : 0;
                  const isSelected = selectedCrop === crop.name;

                  const { breakdown } = calculateSellPrice(crop.name, owned, user.plan, activeBuffs);
                  const finalPrice = breakdown.basePrice * (1 + breakdown.trendMod) * (1 + breakdown.planBonus / 100 + breakdown.tradePermit / 100 + breakdown.booster / 100);

                  return (
                    <div
                      key={crop.name}
                      onClick={() => setSelectedCrop(isSelected ? null : crop.name)}
                      className={`grid grid-cols-5 p-3 border-b border-gray-100 items-center cursor-pointer transition-colors ${isSelected ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="col-span-2 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ backgroundColor: crop.color + '20', color: crop.color }}>
                          🌽
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-800">{crop.name}</div>
                          <div className="text-[10px] text-gray-400">Base: {crop.sellPrice}</div>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className={`text-sm font-bold ${owned > 0 ? 'text-green-600' : 'text-gray-400'}`}>{owned}</span>
                      </div>
                      <div className="text-center">
                        <div className="flex flex-col items-center">
                          <TrendIcon trend={trend} />
                          <span className={`text-[10px] font-bold ${trend === 'UP' ? 'text-green-500' : trend === 'DOWN' ? 'text-red-500' : 'text-gray-400'}`}>
                            {trend === 'STABLE' ? '-' : `+${Math.round(change * 100)}%`}
                          </span>
                        </div>
                      </div>
                      <div className="text-right pr-2">
                        <div className="text-sm font-black text-gray-700">{Math.round(finalPrice).toLocaleString()}</div>
                        {owned > 0 && (
                          <div className="text-[10px] text-green-600 font-bold">
                            ={Math.round(finalPrice * owned).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* BUY VIEW */}
          {marketTab === 'BUY' && (
            <div className="flex flex-col gap-4">
              {/* Category Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShopCategory('PERMANENT')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${shopCategory === 'PERMANENT' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                >
                  Permanent
                </button>
                <button
                  onClick={() => setShopCategory('CONSUMABLE')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${shopCategory === 'CONSUMABLE' ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
                >
                  Consumables
                </button>
              </div>

              {/* Shop Items Grid */}
              <div className="grid grid-cols-2 gap-3">
                {shopItems.filter(i => i.type === shopCategory).map((item) => {
                  const isOwned = (item.slotId && slots.find(s => s.id === item.slotId)?.isPurchased) ||
                    (item.id === 'yield_boost' && user.hasYieldBooster);
                  const canAfford = user.balance >= item.cost;

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-xl p-3 shadow-sm border transition-all ${isOwned ? 'border-gray-200 opacity-60' : canAfford ? 'border-green-200 hover:border-green-400' : 'border-red-200'}`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform">{item.icon}</div>
                        <div className="font-bold text-gray-800 text-sm leading-tight mb-1">{item.name}</div>
                        <div className="text-[10px] text-gray-400 mb-3 h-8 line-clamp-2">{item.description}</div>

                        {isOwned ? (
                          <div className="w-full py-1.5 bg-gray-100 text-gray-400 font-bold text-xs rounded-lg">Owned</div>
                        ) : (
                          <button
                            onClick={() => handleShopBuy(item)}
                            disabled={!canAfford}
                            className={`w-full py-1.5 font-bold text-xs rounded-lg shadow-sm active:scale-95 transition-all ${canAfford ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                          >
                            {item.cost.toLocaleString()} PTS
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Footer Sell Button */}
        {marketTab === 'SELL' && (
          <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
            <div className="flex justify-between items-center mb-3 text-xs font-bold text-gray-500">
              <span>Estimated Total</span>
              <span className="text-green-600 text-lg">{totalSellValue.total.toLocaleString()} PTS</span>
            </div>
            <ChunkyButton
              variant="green"
              className="w-full"
              onClick={handleSellAll}
              disabled={totalSellValue.total === 0}
            >
              Sell All ({Object.keys(inventory).length} items)
            </ChunkyButton>
          </div>
        )}
      </div>
    </div>
  );
};
