import React, { useState } from 'react';
import { Crown, X, Wheat, Warehouse, Star, Check, AlertCircle, Wallet, ArrowRight, Zap, Ban } from 'lucide-react';
import { useGameStore } from '../../store';
import { Plan } from '../../types';
import { PLAN_CONFIG, EXCHANGE_RATE } from '../../constants';
import { ConfirmDialog } from '../UI';

interface MembershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'info') => void;
  onUpgrade: (plan: Plan) => void;
  onDepositClick: () => void;
}

interface PlanBenefit {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  color: string;
}

export const MembershipModal: React.FC<MembershipModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onUpgrade,
  onDepositClick
}) => {
  const { user } = useGameStore();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDepositPopup, setShowDepositPopup] = useState(false);

  if (!isOpen) return null;

  const plans = [Plan.MORTGAGE, Plan.TENANT, Plan.OWNER];

  const getPlanBenefits = (plan: Plan): PlanBenefit[] => {
    const config = PLAN_CONFIG[plan];
    const benefits: PlanBenefit[] = [];

    // 🌱 Auto Plots
    benefits.push({
      icon: <Wheat size={18} />,
      title: `${config.features.autoPlots} Plots Active`,
      subtitle: 'Automatically unlocked',
      color: 'text-green-400',
    });

    // 📦 Storage
    benefits.push({
      icon: <Warehouse size={18} />,
      title: config.features.storage === Infinity ? 'Unlimited Storage' : `${config.features.storage} Items`,
      subtitle: 'Hold more harvests',
      color: 'text-blue-400',
    });

    // 💰 Sell Bonus
    benefits.push({
      icon: <Star size={18} />,
      title: `+${config.features.sellBonus}% Sell Bonus`,
      subtitle: 'On every market sale',
      color: 'text-amber-400',
    });

    // 🚫 Ad Status
    if (config.features.isAdFree) {
      benefits.push({
        icon: <Ban size={18} />,
        title: 'Ad-Free Experience',
        subtitle: 'No ads, full focus',
        color: 'text-purple-400',
      });
    } else {
      benefits.push({
        icon: <Zap size={18} />,
        title: `${config.features.adFrequency} Ads`,
        subtitle: config.features.adFrequency === 'HIGH' ? 'More frequent ads' : 'Reduced ads',
        color: config.features.adFrequency === 'MEDIUM' ? 'text-orange-400' : 'text-yellow-400',
      });
    }

    return benefits;
  };

  const getUsdtPrice = (plan: Plan): number => {
    return PLAN_CONFIG[plan]?.usdtPrice || 0;
  };

  const getPtsEquivalent = (usdtPrice: number): number => {
    return usdtPrice * EXCHANGE_RATE;
  };

  const getUserUsdtBalance = (): number => {
    return user.balance / EXCHANGE_RATE;
  };

  const hasEnoughBalance = (plan: Plan): boolean => {
    const usdtPrice = getUsdtPrice(plan);
    const userUsdtBalance = getUserUsdtBalance();
    return userUsdtBalance >= usdtPrice;
  };

  const handleUpgradeClick = (plan: Plan) => {
    setSelectedPlan(plan);

    if (hasEnoughBalance(plan)) {
      setShowConfirm(true);
    } else {
      setShowDepositPopup(true);
    }
  };

  const confirmUpgrade = () => {
    if (selectedPlan) {
      onUpgrade(selectedPlan);
      onShowToast(`Welcome to ${selectedPlan} Tier!`, 'success');
      onClose();
      setShowConfirm(false);
      setSelectedPlan(null);
    }
  };

  const handleDeposit = () => {
    setShowDepositPopup(false);
    onClose();
    onDepositClick();
  };

  const formatCurrency = (amount: number) => amount.toLocaleString('en-US');

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

        <div className="relative w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex justify-between items-center p-5 bg-gradient-to-r from-yellow-700 to-amber-600 border-b border-white/10 shrink-0">
            <h2 className="text-xl font-black tracking-widest uppercase text-white drop-shadow-sm flex items-center gap-2">
              <Crown size={24} className="fill-white" /> Membership
            </h2>
            <button onClick={onClose} className="bg-black/20 p-2 rounded-full hover:bg-black/40 text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Current Status */}
          <div className="bg-gray-800/50 rounded-xl p-3 mx-4 mt-4 border border-gray-700 flex justify-between items-center">
            <div>
              <div className="text-[10px] text-gray-400 font-bold uppercase">Current Plan</div>
              <div className="text-lg font-black text-white flex items-center gap-2">
                {user.plan === Plan.FREE ? '🌱 FREE' : `${PLAN_CONFIG[user.plan]?.visual.icon} ${user.plan}`}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-400 font-bold uppercase">Your Balance</div>
              <div className="text-sm font-bold text-amber-400">{formatCurrency(user.balance)} PTS</div>
              <div className="text-[10px] text-gray-500">({getUserUsdtBalance().toFixed(2)} USDT)</div>
            </div>
          </div>

          {/* Plans List - Long Vertical Cards */}
          <div className="p-4 overflow-y-auto scrollbar-hide space-y-4">
            {plans.map((plan) => {
              const config = PLAN_CONFIG[plan];
              const isCurrent = user.plan === plan;
              const canAfford = hasEnoughBalance(plan);
              const benefits = getPlanBenefits(plan);
              const usdtPrice = getUsdtPrice(plan);
              const userUsdtBalance = getUserUsdtBalance();
              const deficit = Math.max(0, usdtPrice - userUsdtBalance);

              return (
                <div
                  key={plan}
                  className={`
                    relative rounded-2xl overflow-hidden border-2 transition-all duration-300
                    ${config.visual.border}
                    ${isCurrent ? 'opacity-60' : ''}
                    ${!isCurrent && canAfford ? 'hover:scale-[1.02] hover:shadow-xl' : ''}
                    ${plan === Plan.OWNER && !isCurrent ? 'shadow-yellow-500/20 shadow-2xl' : ''}
                  `}
                >
                  {/* OWNER Glow Effect */}
                  {plan === Plan.OWNER && !isCurrent && (
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-yellow-500/10 animate-pulse" />
                  )}

                  {/* Header Card - Gradient Background */}
                  <div className={`p-5 bg-gradient-to-r ${config.visual.color} relative overflow-hidden`}>
                    {/* Animated shimmer for OWNER */}
                    {plan === Plan.OWNER && !isCurrent && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 animate-[shimmer_2s_infinite]" />
                    )}

                    <div className="relative z-10">
                      {/* Plan Icon & Name */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-4xl filter drop-shadow-lg">{config.visual.icon}</div>
                        <div>
                          <h3 className="text-2xl font-black uppercase tracking-wider text-white drop-shadow-md">
                            {config.visual.label}
                          </h3>
                          <p className="text-xs font-bold text-white/80 uppercase tracking-wide">Membership Tier</p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-end justify-between">
                        <div className="bg-black/30 rounded-lg px-3 py-1.5">
                          <span className="text-lg font-black text-white">{config.priceDisplay}</span>
                        </div>
                        {isCurrent && (
                          <div className="bg-green-500/20 border border-green-500/50 rounded-lg px-3 py-1 flex items-center gap-1">
                            <Check size={14} className="text-green-400" />
                            <span className="text-xs font-bold text-green-400 uppercase">Active</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Body Card - Benefits List */}
                  <div className="bg-[#1E1E1E] p-4 space-y-3">
                    {benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className={`
                          w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border
                          bg-gray-800/50 ${benefit.color}
                        `}>
                          {benefit.icon}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-gray-200">{benefit.title}</div>
                          {benefit.subtitle && (
                            <div className="text-[11px] text-gray-500">{benefit.subtitle}</div>
                          )}
                        </div>
                        <div className="text-lg opacity-30">{benefit.icon}</div>
                      </div>
                    ))}
                  </div>

                  {/* Footer Card - Action Button */}
                  <div className="p-4 pt-3 bg-[#1E1E1E]">
                    {isCurrent ? (
                      <button
                        disabled={true}
                        className="w-full py-3.5 rounded-xl font-black uppercase tracking-wider text-sm
                          bg-gray-700 border-gray-800 text-gray-400 cursor-default flex items-center justify-center gap-2"
                      >
                        <Check size={18} /> Current Plan
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleUpgradeClick(plan)}
                          className={`
                            w-full py-3.5 rounded-xl font-black uppercase tracking-wider text-sm
                            transition-all border-b-4 active:border-b-0 active:translate-y-1
                            flex items-center justify-center gap-2
                            ${canAfford
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-700 text-white hover:brightness-110'
                              : 'bg-gradient-to-r from-red-500 to-orange-500 border-red-700 text-white hover:brightness-110'
                            }
                          `}
                        >
                          {canAfford ? (
                            <>
                              <Wallet size={18} /> Buy for {config.priceDisplay}
                            </>
                          ) : (
                            <>
                              <AlertCircle size={18} /> Insufficient Balance
                            </>
                          )}
                        </button>

                        {!canAfford && (
                          <button
                            onClick={handleDeposit}
                            className="w-full mt-2 py-2.5 rounded-lg font-bold text-xs
                              text-amber-400 hover:text-amber-300 transition-colors
                              bg-amber-400/10 border border-amber-400/20
                              flex items-center justify-center gap-2"
                          >
                            <Wallet size={14} /> Need {formatCurrency(deficit * EXCHANGE_RATE)} PTS? Deposit Now
                            <ArrowRight size={14} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Info Footer */}
          <div className="p-4 border-t border-white/5 bg-black/20">
            <div className="text-[10px] text-gray-500 text-center">
              💰 1 USDT = {EXCHANGE_RATE.toLocaleString()} PTS
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        title={`Upgrade to ${selectedPlan}`}
        message={`Confirm purchase of ${selectedPlan} membership for ${selectedPlan ? PLAN_CONFIG[selectedPlan]?.priceDisplay : ''}?`}
        onConfirm={confirmUpgrade}
        onCancel={() => setShowConfirm(false)}
        variant="warning"
        confirmText="Yes, Upgrade"
        cancelText="Cancel"
      />

      {/* Deposit Popup */}
      <ConfirmDialog
        isOpen={showDepositPopup}
        title="Insufficient Balance"
        message={`You need more PTS to upgrade. Your current balance: ${formatCurrency(user.balance)} PTS (${getUserUsdtBalance().toFixed(2)} USDT). Would you like to deposit now?`}
        onConfirm={handleDeposit}
        onCancel={() => setShowDepositPopup(false)}
        variant="danger"
        confirmText="Deposit Now"
        cancelText="Cancel"
      />
    </>
  );
};
