import React, { useState, useMemo } from 'react';
import { Warehouse, X, Zap, Wheat, Package, Sparkles } from 'lucide-react';
import { Modal, ChunkyButton } from '../UI';
import { useGameStore } from '../../store';
import { InventoryItem, Rarity } from '../../types';
import { RARITY_COLORS, CROPS, getStorageStatusColor, isConsumable, CONSUMABLES } from '../../constants';

interface BarnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToMarket: () => void;
}

type TabType = 'HARVESTS' | 'TOOLS';

export const BarnModal: React.FC<BarnModalProps> = ({ isOpen, onClose, onGoToMarket }) => {
  const { user, inventory, getTools, useItem, activeBuffs } = useGameStore();
  const [activeTab, setActiveTab] = useState<TabType>('HARVESTS');
  const [sortMethod, setSortMethod] = useState<'NEWEST' | 'QUANTITY' | 'RARITY'>('NEWEST');

  // Calculate total storage
  const totalMax = user.storageMax === Infinity ? Infinity : user.storageMax + user.extraStorage;
  const percentage = user.storageMax === Infinity ? 0 : (user.storageUsed / totalMax) * 100;
  const isStorageFull = user.storageMax !== Infinity && user.storageUsed >= totalMax;
  const storageStatus = getStorageStatusColor(percentage);

  // Get crops (non-consumables)
  const crops = useMemo(() => {
    return Object.values(inventory)
      .filter((item): item is InventoryItem & { type: 'CROP' } => !isConsumable(item.cropName) && item.type === 'CROP')
      .sort((a, b) => {
        if (sortMethod === 'QUANTITY') return b.quantity - a.quantity;
        if (sortMethod === 'RARITY') {
          const rarityOrder = { [Rarity.LEGENDARY]: 5, [Rarity.EPIC]: 4, [Rarity.RARE]: 3, [Rarity.UNCOMMON]: 2, [Rarity.COMMON]: 1 };
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        }
        return 0;
      });
  }, [inventory, sortMethod]);

  // Get tools (consumables)
  const tools = useMemo(() => getTools(), [getTools]);

  // Get crop emoji/icon
  const getCropIcon = (cropName: string): string => {
    const crop = CROPS.find(c => c.name === cropName);
    if (crop) {
      // Return a simple emoji based on rarity
      switch (crop.rarity) {
        case Rarity.LEGENDARY: return '💎';
        case Rarity.EPIC: return '⭐';
        case Rarity.RARE: return '🌟';
        case Rarity.UNCOMMON: return '✨';
        default: return '🌿';
      }
    }
    return '🌿';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md bg-black/40 border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-gradient-to-r from-amber-500/80 to-yellow-600/80 backdrop-blur-md border-b border-white/10">
          <h2 className="text-xl font-black tracking-widest uppercase text-white drop-shadow-sm flex items-center gap-2">
            <Warehouse size={20} /> WAREHOUSE
          </h2>
          <button onClick={onClose} className="bg-black/20 p-2 rounded-full hover:bg-black/40 text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Storage Status Bar */}
        <div className="px-5 pt-4">
          <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <Package size={14} className={storageStatus.text} />
                <span className="text-xs text-gray-400 font-bold uppercase tracking-wide">Storage</span>
              </div>
              <span className={`text-sm font-black ${storageStatus.text}`}>
                {user.storageUsed} / {totalMax === Infinity ? '∞' : totalMax}
              </span>
            </div>

            {totalMax !== Infinity ? (
              <>
                <div className={`w-full h-3 bg-gray-800/50 rounded-full overflow-hidden border border-white/5`}>
                  <div
                    className={`h-full transition-all duration-500 ${storageStatus.bar}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className={`text-[10px] font-bold uppercase ${storageStatus.text}`}>
                    {storageStatus.status === 'critical' ? 'STORAGE CRITICAL!' :
                      storageStatus.status === 'warning' ? 'Storage Low' : 'Storage Available'}
                  </span>
                  <span className={`text-[10px] font-mono ${storageStatus.text}`}>
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </>
            ) : (
              <div className="text-green-400 text-xs font-bold flex items-center gap-1">
                <Sparkles size={12} /> Unlimited Storage (VIP)
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('HARVESTS')}
              className={`flex-1 py-2.5 rounded-xl font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'HARVESTS'
                  ? 'bg-amber-500 text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Wheat size={14} /> Harvests
            </button>
            <button
              onClick={() => setActiveTab('TOOLS')}
              className={`flex-1 py-2.5 rounded-xl font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 ${
                activeTab === 'TOOLS'
                  ? 'bg-amber-500 text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Zap size={14} /> Tools
              {tools.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{tools.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-5">
          {activeTab === 'HARVESTS' && (
            <>
              {/* Sort Options */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                {(['NEWEST', 'QUANTITY', 'RARITY'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setSortMethod(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      sortMethod === m
                        ? 'bg-amber-500 border-amber-400 text-black'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Crops Grid */}
              <div className="grid grid-cols-4 gap-3">
                {crops.map((item, idx) => {
                  const color = RARITY_COLORS[item.rarity];
                  return (
                    <div
                      key={idx}
                      className="aspect-square bg-black/40 rounded-xl flex flex-col items-center justify-center relative shadow-lg transition-transform hover:scale-105"
                      style={{ border: `2px solid ${color}` }}
                    >
                      <div className="text-3xl drop-shadow-md">{getCropIcon(item.cropName)}</div>
                      <div className="absolute bottom-1 right-1 bg-black/80 text-[10px] px-1.5 py-0.5 rounded-md text-white font-bold border border-white/10">
                        x{item.quantity}
                      </div>
                      <div
                        className="absolute top-1 left-1 w-2 h-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                  );
                })}
                {crops.length === 0 && (
                  <div className="col-span-4 py-12 text-center">
                    <Package size={48} className="mx-auto text-gray-600 mb-3" />
                    <div className="text-gray-500 italic">Barn is empty</div>
                    <div className="text-gray-600 text-xs mt-1">Plant some crops to get started!</div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'TOOLS' && (
            <div className="space-y-3">
              {tools.map((tool) => {
                const consumableInfo = CONSUMABLES[tool.id];
                const isActive = (activeBuffs[tool.effect] || 0) > Date.now();

                return (
                  <div
                    key={tool.id}
                    className={`bg-black/40 rounded-xl p-4 border transition-all ${
                      isActive
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${
                        isActive ? 'bg-green-500/20' : 'bg-white/10'
                      }`}>
                        {tool.icon}
                      </div>

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-white uppercase text-sm">{tool.name}</h4>
                          {isActive && (
                            <span className="bg-green-500 text-black text-[9px] px-2 py-0.5 rounded-full font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{tool.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs font-bold text-amber-400">x{tool.quantity}</span>
                          {isActive ? (
                            <span className="text-[10px] text-green-400 flex items-center gap-1">
                              <Zap size={10} /> Active
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500">Tap to activate</span>
                          )}
                        </div>
                      </div>

                      {/* Use Button */}
                      <button
                        onClick={() => {
                          if (!isActive && tool.quantity > 0) {
                            useItem(tool.id);
                          }
                        }}
                        disabled={isActive || tool.quantity <= 0}
                        className={`px-4 py-2 rounded-lg font-black uppercase text-xs transition-all ${
                          isActive
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : tool.quantity > 0
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:brightness-110'
                              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isActive ? 'Active' : tool.quantity <= 0 ? 'Empty' : 'Use'}
                      </button>
                    </div>
                  </div>
                );
              })}
              {tools.length === 0 && (
                <div className="py-12 text-center">
                  <Zap size={48} className="mx-auto text-gray-600 mb-3" />
                  <div className="text-gray-500 italic">No tools in inventory</div>
                  <div className="text-gray-600 text-xs mt-1">Buy consumables from the Market!</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-black/20 border-t border-white/5 backdrop-blur-md">
          <ChunkyButton variant="yellow" className="w-full" onClick={onGoToMarket}>
            Go to Market
          </ChunkyButton>
        </div>
      </div>
    </div>
  );
};
