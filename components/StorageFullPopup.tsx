import React from 'react';
import { AlertTriangle, ShoppingBag, TrendingUp, ArrowRight, Package } from 'lucide-react';
import { ConfirmDialog } from './UI';

interface StorageFullPopupProps {
  isOpen: boolean;
  storageUsed: number;
  storageMax: number;
  percentage: number;
  onSellClick: () => void;
  onBuyStorageClick: () => void;
  onUpgradeClick: () => void;
  onClose: () => void;
}

export const StorageFullPopup: React.FC<StorageFullPopupProps> = ({
  isOpen,
  storageUsed,
  storageMax,
  percentage,
  onSellClick,
  onBuyStorageClick,
  onUpgradeClick,
  onClose
}) => {
  const isUnlimited = storageMax === Infinity;

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Storage Full!"
      message={
        isUnlimited
          ? `Your barn is getting full with ${storageUsed} items. Consider selling at the market.`
          : `Storage is ${percentage.toFixed(1)}% full! You cannot harvest more crops.`
      }
      onConfirm={onClose}
      onCancel={onClose}
      variant="danger"
      confirmText="Close"
      icon={<AlertTriangle size={32} className="text-red-500" />}
    >
      {/* Storage Status */}
      <div className="mt-4 mb-4">
        <div className={`rounded-xl p-4 border ${percentage >= 90 ? 'bg-red-100 border-red-200' : 'bg-yellow-100 border-yellow-200'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm font-bold ${percentage >= 90 ? 'text-red-800' : 'text-yellow-800'}`}>
              Current Storage
            </span>
            <span className={`text-sm font-black ${percentage >= 90 ? 'text-red-600' : 'text-yellow-600'}`}>
              {storageUsed} / {isUnlimited ? '∞' : storageMax}
            </span>
          </div>
          {!isUnlimited && (
            <>
              <div className={`w-full rounded-full h-3 ${percentage >= 90 ? 'bg-red-200' : 'bg-yellow-200'}`}>
                <div
                  className={`${percentage >= 90 ? 'bg-red-500' : 'bg-yellow-500'} h-3 rounded-full transition-all duration-300`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <div className={`text-xs text-center mt-1 font-medium ${percentage >= 90 ? 'text-red-600' : 'text-yellow-600'}`}>
                {percentage.toFixed(1)}% Full
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Options */}
      <div className="space-y-3">
        {/* Sell at Market */}
        <button
          onClick={() => {
            onSellClick();
            onClose();
          }}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl border-2 border-green-600 active:scale-95 transition-transform shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div className="text-left">
              <div className="font-black text-white uppercase text-sm">Sell at Market</div>
              <div className="text-xs text-green-100">Sell crops to free up space</div>
            </div>
          </div>
          <ArrowRight size={20} className="text-white/70" />
        </button>

        {/* Buy Storage Expansion */}
        <button
          onClick={() => {
            onBuyStorageClick();
            onClose();
          }}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl border-2 border-blue-600 active:scale-95 transition-transform shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ShoppingBag size={20} className="text-white" />
            </div>
            <div className="text-left">
              <div className="font-black text-white uppercase text-sm">Buy Storage</div>
              <div className="text-xs text-blue-100">+20 more slots available</div>
            </div>
          </div>
          <ArrowRight size={20} className="text-white/70" />
        </button>

        {/* Upgrade Plan */}
        <button
          onClick={() => {
            onUpgradeClick();
            onClose();
          }}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl border-2 border-amber-600 active:scale-95 transition-transform shadow-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xl">👑</span>
            </div>
            <div className="text-left">
              <div className="font-black text-white uppercase text-sm">Upgrade Plan</div>
              <div className="text-xs text-amber-100">Get higher storage limits</div>
            </div>
          </div>
          <ArrowRight size={20} className="text-white/70" />
        </button>
      </div>
    </ConfirmDialog>
  );
};

// Inline version for HUD
export const StorageIndicator: React.FC<{
  used: number;
  max: number;
  className?: string;
}> = ({ used, max, className = '' }) => {
  const isUnlimited = max === Infinity;
  const percentage = isUnlimited ? 0 : (used / max) * 100;

  const getStatus = () => {
    if (percentage >= 90) return { bar: 'bg-red-500 animate-pulse', text: 'text-red-500', label: 'CRITICAL!' };
    if (percentage >= 60) return { bar: 'bg-yellow-500', text: 'text-yellow-500', label: 'Low' };
    return { bar: 'bg-green-500', text: 'text-green-500', label: '' };
  };

  const status = getStatus();

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-1">
        <span className={`text-xs font-bold uppercase ${status.text}`}>
          {status.label || 'Storage'}
        </span>
        <span className={`text-xs font-mono ${status.text}`}>
          {used} / {isUnlimited ? '∞' : max}
        </span>
      </div>
      <div className={`w-full rounded-full h-2 ${percentage >= 90 ? 'bg-red-200' : 'bg-gray-200'}`}>
        <div
          className={`${status.bar} h-2 rounded-full transition-all duration-300`}
          style={{ width: isUnlimited ? '0%' : `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};
