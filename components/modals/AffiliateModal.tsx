import React, { useState } from 'react';
import { Users, Share2, TrendingUp, Clock, CheckCircle, Copy, Wallet, Gift, Award, Coins } from 'lucide-react';
import { useGameStore } from '../../store';
import { ConfirmDialog } from '../UI';
import { formatAffiliateEarnings, AFFILIATE_CONFIG } from '../../constants';

interface AffiliateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'info') => void;
}

export const AffiliateModal: React.FC<AffiliateModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const {
    user,
    referrals,
    referralLink,
    affiliateStats,
    claimCommission
  } = useGameStore();

  const [showClaimConfirm, setShowClaimConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      onShowToast('Link copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      onShowToast('Failed to copy link', 'info');
    }
  };

  const handleShareTelegram = () => {
    const text = `🌾 Join Cyber Farmer and start farming! Use my link:\n\n${referralLink}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, '_blank');
  };

  const handleClaim = () => {
    const result = claimCommission();
    if (result.success) {
      onShowToast(result.message, 'success');
      setShowClaimConfirm(false);
    } else {
      onShowToast(result.message, 'info');
    }
  };

  const referralUrl = referralLink;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

        <div className="relative w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex justify-between items-center p-5 bg-gradient-to-r from-purple-600 to-purple-800 border-b border-white/10 shrink-0">
            <h2 className="text-xl font-black tracking-widest uppercase text-white drop-shadow-sm flex items-center gap-2">
              <Award size={24} className="fill-white" /> Affiliate Center
            </h2>
            <button onClick={onClose} className="bg-black/20 p-2 rounded-full hover:bg-black/40 text-white transition-colors">
              <Copy size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Pending Commission */}
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <Coins size={16} className="text-green-400" />
                  <span className="text-[10px] text-green-400 font-bold uppercase">Pending</span>
                </div>
                <div className="text-2xl font-black text-white">{formatAffiliateEarnings(affiliateStats.pendingCommission)} PTS</div>
                <div className="text-[10px] text-green-400/70 mt-1">Ready to claim</div>
              </div>

              {/* Total Earned */}
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 p-4 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-amber-400" />
                  <span className="text-[10px] text-amber-400 font-bold uppercase">Total Earned</span>
                </div>
                <div className="text-2xl font-black text-white">{formatAffiliateEarnings(affiliateStats.totalEarnings)} PTS</div>
                <div className="text-[10px] text-amber-400/70 mt-1">Lifetime earnings</div>
              </div>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#1E1E1E] border border-white/5 p-3 rounded-xl text-center">
                <div className="text-xl font-black text-white">{affiliateStats.totalReferrals}</div>
                <div className="text-[10px] text-gray-500 uppercase">Total Friends</div>
              </div>
              <div className="bg-[#1E1E1E] border border-white/5 p-3 rounded-xl text-center">
                <div className="text-xl font-black text-green-400">{affiliateStats.activeReferrals}</div>
                <div className="text-[10px] text-gray-500 uppercase">Active</div>
              </div>
              <div className="bg-[#1E1E1E] border border-white/5 p-3 rounded-xl text-center">
                <div className="text-xl font-black text-amber-400">{affiliateStats.tier1Count}</div>
                <div className="text-[10px] text-gray-500 uppercase">Direct (L1)</div>
              </div>
            </div>

            {/* Share Section */}
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Share2 size={18} className="text-purple-400" />
                <span className="text-sm font-bold text-white uppercase">Invite Friends</span>
              </div>

              <div className="flex gap-2 mb-3">
                <div className="flex-1 bg-black/40 border border-white/10 p-3 rounded-xl">
                  <div className="text-[10px] text-gray-500 uppercase mb-1">Your Referral Link</div>
                  <div className="text-xs font-mono text-gray-300 truncate">{referralUrl}</div>
                </div>
                <button
                  onClick={handleCopyLink}
                  className={`px-4 rounded-xl font-bold uppercase text-xs transition-all ${copied ? 'bg-green-500 text-white' : 'bg-purple-500 hover:bg-purple-400 text-white'}`}
                >
                  {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                </button>
              </div>

              <button
                onClick={handleShareTelegram}
                className="w-full bg-[#0088cc] hover:bg-[#0099dd] text-white py-3 rounded-xl font-bold uppercase text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.696.064-1.225-.46-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Share on Telegram
              </button>
            </div>

            {/* Commission Info */}
            <div className="bg-[#1E1E1E] border border-white/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Gift size={18} className="text-amber-400" />
                <span className="text-sm font-bold text-white uppercase">Commission Rates</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-green-400">Level 1</span>
                    <span className="text-[10px] text-gray-500">(Direct)</span>
                  </div>
                  <span className="text-sm font-black text-white">+{AFFILIATE_CONFIG.commissions.tier1 * 100}%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-400">Level 2</span>
                    <span className="text-[10px] text-gray-500">(Indirect)</span>
                  </div>
                  <span className="text-sm font-black text-white">+{AFFILIATE_CONFIG.commissions.tier2 * 100}%</span>
                </div>
              </div>
            </div>

            {/* Referral List */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users size={18} className="text-white" />
                <span className="text-sm font-bold text-white uppercase">Your Team ({referrals.length})</span>
              </div>

              <div className="bg-[#1E1E1E] border border-white/5 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-12 bg-white/5 p-3 text-[10px] font-bold text-gray-400 uppercase">
                  <div className="col-span-5">Friend</div>
                  <div className="col-span-3 text-center">Tier</div>
                  <div className="col-span-4 text-right">Earned</div>
                </div>

                {referrals.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users size={40} className="mx-auto text-gray-600 mb-3" />
                    <div className="text-gray-500 italic">No referrals yet</div>
                    <div className="text-gray-600 text-xs mt-1">Share your link to invite friends!</div>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {referrals.map((ref) => (
                      <div key={ref.id} className="grid grid-cols-12 p-3 items-center hover:bg-white/5 transition-colors">
                        <div className="col-span-5 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white">
                            {ref.username.charAt(1).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white">{ref.username}</div>
                            <div className="text-[10px] text-gray-500">
                              {ref.isActive ? (
                                <span className="flex items-center gap-1 text-green-400">
                                  <CheckCircle size={10} /> Active
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-gray-500">
                                  <Clock size={10} /> New
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="col-span-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            ref.tier === 1
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            L{ref.tier}
                          </span>
                        </div>
                        <div className="col-span-4 text-right">
                          <div className="text-xs font-black text-amber-400">+{formatAffiliateEarnings(ref.contribution)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Footer - Claim Button */}
          {affiliateStats.pendingCommission >= AFFILIATE_CONFIG.minClaimAmount && (
            <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-600 border-t border-white/10">
              <button
                onClick={() => setShowClaimConfirm(true)}
                className="w-full py-4 rounded-xl font-black uppercase tracking-wider text-white flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Wallet size={20} />
                Claim {formatAffiliateEarnings(affiliateStats.pendingCommission)} PTS
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Claim Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showClaimConfirm}
        title="Claim Commission"
        message={`Are you sure you want to claim ${formatAffiliateEarnings(affiliateStats.pendingCommission)} PTS? This will be added to your main balance.`}
        onConfirm={handleClaim}
        onCancel={() => setShowClaimConfirm(false)}
        variant="warning"
        confirmText="Yes, Claim"
        cancelText="Cancel"
      />
    </>
  );
};
