import React, { useState, useMemo } from 'react';
import { User, Crown, ChevronRight, LogOut, ArrowUpRight, ArrowDownLeft, Wallet, Users, TrendingUp } from 'lucide-react';
import { ChunkyButton } from '../UI';
import { useGameStore } from '../../store';
import { Plan, Withdrawal } from '../../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'info') => void;
  onWithdrawClick: () => void;
  onUpgradeClick: () => void;
}

type HistoryTab = 'ACTIVITY' | 'WITHDRAW';

const THEME_COLORS = {
  [Plan.FREE]: {
    bg: 'bg-gray-100/50',
    border: 'border-gray-200/50',
    badge: 'bg-gray-500',
    icon: 'from-gray-300 to-gray-500',
    accent: 'text-gray-600',
    accentBg: 'bg-gray-100',
    glow: 'shadow-gray-500/30',
    headerBg: 'from-gray-400 to-gray-600',
  },
  [Plan.MORTGAGE]: {
    bg: 'bg-blue-100/50',
    border: 'border-blue-200/50',
    badge: 'bg-blue-500',
    icon: 'from-blue-300 to-blue-500',
    accent: 'text-blue-600',
    accentBg: 'bg-blue-100',
    glow: 'shadow-blue-500/30',
    headerBg: 'from-blue-400 to-blue-600',
  },
  [Plan.TENANT]: {
    bg: 'bg-purple-100/50',
    border: 'border-purple-200/50',
    badge: 'bg-purple-500',
    icon: 'from-purple-300 to-purple-500',
    accent: 'text-purple-600',
    accentBg: 'bg-purple-100',
    glow: 'shadow-purple-500/30',
    headerBg: 'from-purple-400 to-purple-600',
  },
  [Plan.OWNER]: {
    bg: 'bg-amber-100/50',
    border: 'border-amber-200/50',
    badge: 'bg-yellow-500',
    icon: 'from-yellow-300 to-yellow-500',
    accent: 'text-amber-600',
    accentBg: 'bg-amber-100',
    glow: 'shadow-yellow-500/30',
    headerBg: 'from-yellow-400 to-yellow-600',
  },
};

const formatBigNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num.toString();
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const getActivityIcon = (type: string): React.ReactNode => {
  const isIncome = ['SELL', 'COMMISSION', 'UPGRADE_REFUND'].includes(type);
  if (isIncome) {
    return <ArrowDownLeft size={14} className="text-green-500" />;
  }
  return <ArrowUpRight size={14} className="text-red-500" />;
};

const getActivityLabel = (type: string): string => {
  const labels: Record<string, string> = {
    SELL: 'Market Sale',
    BUY: 'Purchase',
    UPGRADE: 'Plan Upgrade',
    WITHDRAW: 'Withdrawal',
    COMMISSION: 'Affiliate Earned',
    SPIN: 'Lucky Spin',
    REFERRAL_BONUS: 'Referral Bonus',
  };
  return labels[type] || type;
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onShowToast, onWithdrawClick, onUpgradeClick }) => {
  const { user, referrals, withdrawals, affiliateStats } = useGameStore();
  const [activeTab, setActiveTab] = useState<HistoryTab>('ACTIVITY');

  const theme = THEME_COLORS[user.plan];

  const filteredHistory = useMemo(() => {
    const activities: Array<{ id: string; type: string; amount: number; timestamp: number; description?: string }> = [];

    // Add withdrawals to history
    withdrawals.forEach((w: Withdrawal) => {
      activities.push({
        id: w.id,
        type: 'WITHDRAW',
        amount: -w.amountPts,
        timestamp: w.timestamp,
        description: `${w.method} - ${w.status}`,
      });
    });

    // Sort by timestamp (newest first) and take last 10
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);
  }, [withdrawals]);

  const activityItems = filteredHistory.filter(item => item.type !== 'WITHDRAW');
  const withdrawItems = filteredHistory.filter(item => item.type === 'WITHDRAW');

  const displayHistory = activeTab === 'ACTIVITY' ? activityItems : withdrawItems;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className={`relative w-full max-w-[420px] ${theme.bg} ${theme.border} border-2 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        {/* Header */}
        <div className={`bg-gradient-to-r ${theme.headerBg} p-5`}>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-white uppercase tracking-wider">My Profile</h2>
            <button onClick={onClose} className="bg-black/20 p-2 rounded-full hover:bg-black/40 text-white transition-colors">
              <span className="text-sm font-bold">✕</span>
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Identity Header */}
          <div className={`flex items-center gap-4 p-4 rounded-2xl border ${theme.border} ${theme.bg}`}>
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${theme.icon} border-4 border-white shadow-lg flex items-center justify-center relative shrink-0`}>
              <User size={32} className="text-white" />
              {user.plan === Plan.OWNER && (
                <Crown size={20} className="absolute -top-2 -right-2 text-yellow-300 fill-yellow-400 drop-shadow-md rotate-12" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-gray-900 truncate">{user.username}</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white uppercase ${theme.badge}`}>
                  {user.plan}
                </span>
              </div>
              <div className="text-xs text-gray-500 font-mono mt-0.5">ID: {user.id}</div>
            </div>
          </div>

          {/* Balance Display */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-4 rounded-2xl shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">Available Balance</div>
                <div className="text-3xl font-black text-white">{formatBigNumber(user.balance)} <span className="text-lg text-amber-400">PTS</span></div>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Wallet size={24} className="text-amber-400" />
              </div>
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-green-500" />
                <div className="text-xs text-gray-400 font-bold uppercase">Total Earned</div>
              </div>
              <div className="text-xl font-black text-gray-900">{formatBigNumber(user.totalSales)} PTS</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-blue-500" />
                <div className="text-xs text-gray-400 font-bold uppercase">Commission</div>
              </div>
              <div className="text-xl font-black text-blue-600">{formatBigNumber(user.pendingCommission)} PTS</div>
              <div className="text-[10px] text-gray-400">Total: {formatBigNumber(user.totalCommissionEarned)}</div>
            </div>
          </div>

          {/* Affiliate Stats */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-purple-600" />
                <h3 className="font-bold text-gray-900">Affiliate Network</h3>
              </div>
              <span className="text-xs font-bold px-2 py-1 bg-purple-100 text-purple-600 rounded-full">
                {affiliateStats.totalReferrals} Referrals
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/60 p-3 rounded-lg">
                <div className="text-xs text-gray-500">Active Referrals</div>
                <div className="font-bold text-green-600">{affiliateStats.activeReferrals}</div>
              </div>
              <div className="bg-white/60 p-3 rounded-lg">
                <div className="text-xs text-gray-500">Lifetime Earnings</div>
                <div className="font-bold text-amber-600">{formatBigNumber(affiliateStats.totalEarnings)} PTS</div>
              </div>
            </div>
          </div>

          {/* History Tabs */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab('ACTIVITY')}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${
                  activeTab === 'ACTIVITY'
                    ? `${theme.accentBg} ${theme.accent} border-b-2 ${theme.badge.replace('bg-', 'border-')}`
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Activity
              </button>
              <button
                onClick={() => setActiveTab('WITHDRAW')}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${
                  activeTab === 'WITHDRAW'
                    ? `${theme.accentBg} ${theme.accent} border-b-2 ${theme.badge.replace('bg-', 'border-')}`
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Withdrawals
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {displayHistory.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  No {activeTab.toLowerCase()} history yet
                </div>
              ) : (
                displayHistory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.amount >= 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {getActivityIcon(item.type)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">{getActivityLabel(item.type)}</div>
                        <div className="text-xs text-gray-400">{formatDate(item.timestamp)}</div>
                      </div>
                    </div>
                    <div className={`text-sm font-bold ${
                      item.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.amount >= 0 ? '+' : ''}{formatBigNumber(item.amount)} PTS
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <ChunkyButton variant="cyan" className="flex-1" onClick={onUpgradeClick}>
              Upgrade Plan
            </ChunkyButton>
            <ChunkyButton variant="red" className="flex-1 flex items-center justify-center gap-2" onClick={() => onShowToast("Logged Out", "info")}>
              <LogOut size={18} /> Log Out
            </ChunkyButton>
          </div>
        </div>
      </div>
    </div>
  );
};
