import React from 'react';
import { Info, X, Clock, BookOpen, Sprout, TrendingUp, Users, Gift, Star } from 'lucide-react';
import { Modal } from '../UI';
import { RARITY_COLORS, CROPS, PLAN_CONFIG } from '../../constants';
import { Rarity, Plan } from '../../types';

interface ActivityModalProps {
  type: 'WIKI' | 'FULL' | 'NONE';
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({ type, isOpen, onClose }) => {
  if (!isOpen || type === 'NONE') return null;

  // WAREHOUSE FULL
  if (type === 'FULL') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-sm bg-gradient-to-br from-red-500 to-red-700 border-4 border-red-300 rounded-3xl p-6 text-center animate-in zoom-in-95 duration-200 shadow-2xl">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30">
            <span className="text-5xl">📦</span>
          </div>
          <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wider">Warehouse Full!</h2>
          <p className="text-white/80 font-semibold mb-6">Your storage is full. Sell crops at the Market or upgrade your Barn to continue farming.</p>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-white text-red-600 font-black uppercase tracking-wider rounded-xl shadow-lg hover:bg-gray-100 active:scale-95 transition-all"
          >
            Got It!
          </button>
        </div>
      </div>
    );
  }

  // WIKI / ENCYCLOPEDIA
  const getRarityGradient = (rarity: Rarity): string => {
    switch (rarity) {
      case Rarity.LEGENDARY: return 'from-yellow-400 via-yellow-500 to-orange-500';
      case Rarity.EPIC: return 'from-orange-400 via-red-500 to-red-600';
      case Rarity.RARE: return 'from-purple-400 to-purple-600';
      case Rarity.UNCOMMON: return 'from-blue-400 to-blue-600';
      default: return 'from-green-400 to-green-600';
    }
  };

  const getRarityIcon = (rarity: Rarity): string => {
    switch (rarity) {
      case Rarity.LEGENDARY: return '👑';
      case Rarity.EPIC: return '💎';
      case Rarity.RARE: return '⭐';
      case Rarity.UNCOMMON: return '💠';
      default: return '🌿';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Encyclopedia">
      <div className="space-y-4 h-full flex flex-col">
        {/* How to Play Section */}
        <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 p-4 rounded-xl border border-blue-500/20 flex items-start gap-3 shrink-0">
          <div className="p-2 bg-blue-500 rounded-lg">
            <BookOpen size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
              How to Play
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              1. <strong>Plant</strong> seeds in your farm plots<br/>
              2. <strong>Wait</strong> for crops to grow (check rarity for time)<br/>
              3. <strong>Harvest</strong> and store in your Barn<br/>
              4. <strong>Sell</strong> at Market for PTS<br/>
              5. <strong>Upgrade</strong> plan for more plots & bonuses!
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 shrink-0">
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-3 rounded-xl border border-green-500/20 text-center">
            <Sprout size={24} className="mx-auto mb-1 text-green-500" />
            <p className="text-xs font-bold text-gray-600">Crops</p>
            <p className="text-lg font-black text-green-600">{CROPS.length}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-3 rounded-xl border border-amber-500/20 text-center">
            <TrendingUp size={24} className="mx-auto mb-1 text-amber-500" />
            <p className="text-xs font-bold text-gray-600">Rarity</p>
            <p className="text-lg font-black text-amber-600">5 Tiers</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-3 rounded-xl border border-purple-500/20 text-center">
            <Users size={24} className="mx-auto mb-1 text-purple-500" />
            <p className="text-xs font-bold text-gray-600">Members</p>
            <p className="text-lg font-black text-purple-600">4 Plans</p>
          </div>
        </div>

        {/* Rarity Guide */}
        <div className="shrink-0">
          <h3 className="font-bold text-gray-700 uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
            <Star size={14} /> Rarity Guide
          </h3>
          <div className="grid grid-cols-5 gap-1">
            {Object.entries(RARITY_COLORS).map(([rarity, color]) => (
              <div 
                key={rarity} 
                className="flex flex-col items-center p-2 bg-white rounded-lg border border-gray-100 shadow-sm"
              >
                <span className="text-lg mb-1">{getRarityIcon(rarity as Rarity)}</span>
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color as string }}></div>
                <span className="text-[9px] font-bold text-gray-500 capitalize mt-1">{rarity.toLowerCase()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Membership Plans */}
        <div className="shrink-0">
          <h3 className="font-bold text-gray-700 uppercase tracking-wider text-xs mb-2 flex items-center gap-2">
            <Gift size={14} /> Membership Plans
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(PLAN_CONFIG).map(([plan, config]) => (
              <div 
                key={plan}
                className={`p-2 rounded-lg border ${
                  plan === Plan.OWNER 
                    ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/50' 
                    : plan === Plan.TENANT
                      ? 'bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30'
                      : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">
                    {plan === Plan.OWNER ? '👑' : plan === Plan.TENANT ? '🔑' : plan === Plan.MORTGAGE ? '🏠' : '🌱'}
                  </span>
                  <span className="text-xs font-bold text-gray-700">{plan}</span>
                </div>
                <div className="text-[10px] text-gray-500">
                  {config.baseLimit} plots • {config.storage === Infinity ? '∞' : config.storage} storage
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Crop List */}
        <div className="flex-1 min-h-0 flex flex-col">
          <h3 className="font-bold text-gray-700 uppercase tracking-wider text-xs mb-2 flex items-center gap-2 shrink-0">
            <Sprout size={14} /> Vegetable List
          </h3>
          <div className="grid grid-cols-1 gap-1.5 overflow-y-auto pr-1 scrollbar-hide pb-2 flex-1">
            {CROPS.map((crop) => (
              <div 
                key={crop.name} 
                className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 shadow-sm hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shadow-inner border border-white/50"
                    style={{ backgroundColor: `${crop.color}20` }}
                  >
                    🌽
                  </div>
                  <div>
                    <div className="text-xs font-black text-gray-800">{crop.name}</div>
                    <div 
                      className="text-[9px] font-bold uppercase tracking-wide flex items-center gap-1"
                      style={{ color: RARITY_COLORS[crop.rarity] }}
                    >
                      <span>{getRarityIcon(crop.rarity)}</span>
                      {crop.rarity.toLowerCase()}
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase bg-gray-100 px-1.5 py-0.5 rounded">
                    <Clock size={10} /> {crop.growthTime}s
                  </div>
                  <div className="text-xs font-black text-amber-500 mt-0.5">
                    {crop.sellPrice.toLocaleString()} PTS
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ActivityModal;
