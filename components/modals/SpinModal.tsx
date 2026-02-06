import React, { useState, useEffect, useCallback } from 'react';
import { Play, Gift, Coins, Zap, Timer, Star, X, Sparkles, RotateCcw } from 'lucide-react';
import { useGameStore } from '../../store';
import { SpinReward, Rarity } from '../../types';
import { SPIN_CONFIG, getRarityColor, formatSpinReward } from '../../constants';

interface SpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWatchAd?: () => void;
  onShowToast: (msg: string, type: 'success' | 'info') => void;
}

export const SpinModal: React.FC<SpinModalProps> = ({ isOpen, onClose, onWatchAd, onShowToast }) => {
  const {
    user,
    isSpinning,
    currentSpinReward,
    spinShowResult,
    canFreeSpinNow,
    formatSpinCooldown,
    startSpin,
    claimFreeSpinReward,
    closeSpinResult,
  } = useGameStore();

  const [selectedMode, setSelectedMode] = useState<'FREE' | 'PAID'>('FREE');
  const [spinMessage, setSpinMessage] = useState<string>('');

  // Wheel segments for visual
  const wheelSegments = [
    { icon: '🪙', label: '50 PTS', color: 'from-gray-400 to-gray-600' },
    { icon: '💎', label: '200 PTS', color: 'from-blue-400 to-blue-600' },
    { icon: '🍀', label: 'Common', color: 'from-green-400 to-green-600' },
    { icon: '🎰', label: 'JACKPOT', color: 'from-yellow-400 to-orange-500' },
    { icon: '💰', label: '100 PTS', color: 'from-emerald-400 to-emerald-600' },
    { icon: '✨', label: 'Rare', color: 'from-purple-400 to-purple-600' },
    { icon: '🌟', label: 'Epic', color: 'from-orange-400 to-red-500' },
    { icon: '👑', label: 'Legendary', color: 'from-yellow-300 to-yellow-600' },
  ];

  const [wheelRotation, setWheelRotation] = useState(0);

  useEffect(() => {
    if (isSpinning) {
      // Animate wheel
      const interval = setInterval(() => {
        setWheelRotation(prev => prev + 30);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isSpinning]);

  useEffect(() => {
    if (!isSpinning && !spinShowResult) {
      setWheelRotation(0);
    }
  }, [isSpinning, spinShowResult]);

  const handleSpin = useCallback(() => {
    const result = startSpin(selectedMode === 'PAID');
    if (!result.success) {
      onShowToast(result.message, 'info');
    }
  }, [selectedMode, startSpin, onShowToast]);

  const handleClaim = useCallback(() => {
    if (selectedMode === 'FREE') {
      // Trigger ad first, then claim
      if (onWatchAd) {
        onWatchAd();
      }
      // After ad completes, claim the reward
      const claimResult = claimFreeSpinReward();
      if (claimResult.success) {
        onShowToast(claimResult.message, 'success');
        closeSpinResult();
      }
    } else {
      closeSpinResult();
    }
  }, [selectedMode, onWatchAd, claimFreeSpinReward, closeSpinResult, onShowToast]);

  const getRewardDisplay = (reward: SpinReward | null) => {
    if (!reward) return null;
    
    const rarityColors = reward.rarity ? getRarityColor(reward.rarity) : null;
    
    return (
      <div className={`relative overflow-hidden rounded-2xl border-2 p-6 text-center transition-all duration-500 ${
        rarityColors 
          ? `${rarityColors.bg} ${rarityColors.border}` 
          : 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/50'
      }`}>
        {/* Glow effect for rare rewards */}
        {(reward.rarity === Rarity.EPIC || reward.rarity === Rarity.LEGENDARY || reward.type === 'JACKPOT') && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
        )}
        
        {/* Epic/Legendary Loss Aversion Message */}
        {(reward.rarity === Rarity.EPIC || reward.rarity === Rarity.LEGENDARY || reward.type === 'JACKPOT') && (
          <div className="mb-4 animate-bounce">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${
              reward.type === 'JACKPOT' 
                ? 'bg-yellow-500 text-black'
                : reward.rarity === Rarity.LEGENDARY
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black'
                  : 'bg-gradient-to-r from-orange-400 to-red-500 text-white'
            }`}>
              <Sparkles size={16} />
              {reward.type === 'JACKPOT' ? 'JACKPOT!' : `${reward.rarity} REWARD!`}
            </span>
          </div>
        )}
        
        {/* Reward Icon */}
        <div className="text-8xl mb-4 relative z-10 animate-bounce">
          {reward.icon || (reward.type === 'COINS' ? '💰' : reward.type === 'JACKPOT' ? '🎰' : '🎁')}
        </div>
        
        {/* Reward Value */}
        <h3 className={`text-2xl font-black mb-2 ${
          rarityColors ? rarityColors.text : 'text-yellow-400'
        }`}>
          {reward.type === 'JACKPOT' 
            ? '1,500 PTS' 
            : reward.type === 'COINS' 
              ? `${reward.value} PTS`
              : (reward.value as string)
          }
        </h3>
        
        {/* Rarity Label */}
        {reward.rarity && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/30 text-white text-sm font-semibold">
            <Star size={14} className={rarityColors?.text} />
            {reward.rarity}
          </div>
        )}
        
        {/* Loss Aversion Message for Free Spins */}
        {selectedMode === 'FREE' && (
          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm font-semibold animate-pulse">
              ⚠️ Watch ad to claim this reward!
            </p>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-gradient-to-r from-purple-600 to-pink-600 border-b border-white/10 shrink-0">
          <h2 className="text-xl font-black tracking-widest uppercase text-white drop-shadow-sm flex items-center gap-2">
            <RotateCcw size={24} className="fill-white" /> Lucky Spin
          </h2>
          <button onClick={onClose} className="bg-black/20 p-2 rounded-full hover:bg-black/40 text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Mode Selector */}
          {!spinShowResult && (
            <div className="flex gap-2 p-1 bg-gray-800/50 rounded-xl">
              <button
                onClick={() => setSelectedMode('FREE')}
                className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  selectedMode === 'FREE'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Gift size={16} /> Free
                {canFreeSpinNow() ? (
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Ready!</span>
                ) : (
                  <span className="text-xs flex items-center gap-1">
                    <Timer size={12} /> {formatSpinCooldown()}
                  </span>
                )}
              </button>
              <button
                onClick={() => setSelectedMode('PAID')}
                className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                  selectedMode === 'PAID'
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Zap size={16} /> Paid
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded">150 PTS</span>
              </button>
            </div>
          )}

          {/* Spin Wheel / Result Area */}
          {spinShowResult && currentSpinReward ? (
            <div className="py-4">
              {getRewardDisplay(currentSpinReward)}
              
              {/* Claim Button */}
              <button
                onClick={handleClaim}
                className={`w-full mt-4 py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
                  selectedMode === 'FREE'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:scale-105 shadow-lg shadow-green-500/30 animate-bounce'
                    : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:scale-105 shadow-lg'
                }`}
              >
                {selectedMode === 'FREE' ? (
                  <>
                    <Play size={20} fill="currentColor" /> Watch Ad & Claim
                  </>
                ) : (
                  <>
                    <Gift size={20} fill="currentColor" /> Claim Reward
                  </>
                )}
              </button>
              
              {/* Skip/Dismiss for paid mode */}
              {selectedMode === 'PAID' && (
                <button
                  onClick={closeSpinResult}
                  className="w-full mt-3 py-3 rounded-xl font-semibold text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Spin Wheel Visual */}
              <div className="relative py-6">
                {/* Wheel */}
                <div 
                  className="relative w-72 h-72 mx-auto rounded-full border-4 border-white/20 overflow-hidden shadow-2xl"
                  style={{ 
                    transform: `rotate(${wheelRotation}deg)`,
                    transition: isSpinning ? 'none' : 'transform 0.5s ease-out'
                  }}
                >
                  {/* Wheel segments */}
                  {wheelSegments.map((segment, index) => (
                    <div
                      key={index}
                      className={`absolute w-full h-full bg-gradient-to-br ${segment.color} flex items-center justify-center`}
                      style={{
                        clipPath: 'polygon(50% 50%, 100% 0, 100% 12.5%, 50% 12.5%)',
                        transform: `rotate(${index * 45}deg)`,
                      }}
                    >
                      <span className="absolute top-4 text-2xl" style={{ transform: 'rotate(67.5deg)' }}>
                        {segment.icon}
                      </span>
                    </div>
                  ))}
                  
                  {/* Center hub */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-full border-4 border-white/30 shadow-lg z-10">
                      <div className="w-full h-full flex items-center justify-center">
                        <Star size={24} className="text-yellow-400 fill-yellow-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pointer */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
                  <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[24px] border-t-white drop-shadow-lg" />
                </div>
              </div>

              {/* Message */}
              {isSpinning && (
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full">
                    <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-purple-400 font-semibold">Spinning...</span>
                  </div>
                </div>
              )}

              {!isSpinning && (
                <>
                  {/* Spin Message */}
                  <div className="text-center py-2">
                    <p className="text-gray-400 text-sm">
                      {selectedMode === 'FREE' 
                        ? canFreeSpinNow() 
                          ? 'Ready to spin for FREE!'
                          : `Free spin available in ${formatSpinCooldown()}`
                        : 'Pay 150 PTS to spin instantly'
                      }
                    </p>
                  </div>

                  {/* Spin Button */}
                  <button
                    onClick={handleSpin}
                    disabled={isSpinning || (selectedMode === 'FREE' && !canFreeSpinNow())}
                    className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
                      selectedMode === 'FREE'
                        ? canFreeSpinNow()
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:scale-105 shadow-lg shadow-green-500/30'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:scale-105 shadow-lg'
                    }`}
                  >
                    <Play size={20} fill="currentColor" />
                    {selectedMode === 'FREE' ? 'Free Spin' : 'Pay & Spin (150 PTS)'}
                  </button>

                  {/* Cooldown Info */}
                  {selectedMode === 'FREE' && !canFreeSpinNow() && (
                    <div className="flex items-center justify-center gap-2 mt-3 text-gray-500 text-xs">
                      <Timer size={14} />
                      <span>Free spin resets every hour</span>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Prize Pool Info */}
          {!spinShowResult && (
            <div className="mt-4 p-4 bg-gray-800/30 rounded-xl border border-white/5">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Prize Pool</h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-gray-800/50 rounded-lg">
                  <span className="text-lg">🪙</span>
                  <p className="text-xs text-gray-400">50-200 PTS</p>
                </div>
                <div className="p-2 bg-green-800/30 rounded-lg">
                  <span className="text-lg">🥬</span>
                  <p className="text-xs text-gray-400">Common</p>
                </div>
                <div className="p-2 bg-purple-800/30 rounded-lg">
                  <span className="text-lg">🫑</span>
                  <p className="text-xs text-gray-400">Rare</p>
                </div>
                <div className="p-2 bg-yellow-800/30 rounded-lg">
                  <span className="text-lg">🎃</span>
                  <p className="text-xs text-gray-400">Epic/Legendary</p>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full">
                  <span className="text-yellow-400 font-bold">🎰</span>
                  <span className="text-yellow-400 text-sm font-semibold">1,500 PTS Jackpot</span>
                </span>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-900/50 border-t border-white/5 shrink-0">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <RotateCcw size={12} />
            <span>Free spin every hour • Paid spin 150 PTS</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SpinModal;
