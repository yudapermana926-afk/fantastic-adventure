import React, { useState, useMemo } from 'react';
import { Copy, CheckCircle, Clock } from 'lucide-react';
import { Modal, ChunkyButton } from '../UI';
import { useGameStore } from '../../store';
import { Plan } from '../../types';

interface FinanceModalProps {
  type: 'WITHDRAW' | 'AFFILIATE';
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'info') => void;
}

export const FinanceModal: React.FC<FinanceModalProps> = ({ type, isOpen, onClose, onShowToast }) => {
  const { user, withdrawals, requestWithdrawal, referrals } = useGameStore();
  
  // Withdraw Local State
  const [withdrawMethod, setWithdrawMethod] = useState<'FAUCETPAY' | 'TON'>('FAUCETPAY');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');

  const referralLink = `t.me/cyberfarmer_bot?startapp=${user.id}`;
  const totalReferralEarnings = referrals.reduce((sum, r) => sum + r.contribution, 0);

  const calculatedUsdt = useMemo(() => {
      const pts = parseInt(withdrawAmount.replace(/,/g, '')) || 0;
      const rate = 250000;
      const fee = withdrawMethod === 'TON' ? 0.05 : 0;
      return (pts / rate) * (1 - fee);
  }, [withdrawAmount, withdrawMethod]);

  const handleWithdraw = () => {
      const amount = parseInt(withdrawAmount.replace(/,/g, ''));
      if (isNaN(amount) || amount <= 0) {
          onShowToast("Invalid Amount", 'info');
          return;
      }
      if (!withdrawAddress) {
          onShowToast("Please enter address/email", 'info');
          return;
      }
      const result = requestWithdrawal(amount, withdrawMethod, withdrawAddress);
      if (result.success) {
          onShowToast(result.message, 'success');
          setWithdrawAmount('');
      } else {
          onShowToast(result.message || 'Error', 'info');
      }
  };

  const handleCopyLink = () => {
      navigator.clipboard.writeText(referralLink);
      onShowToast("Link Copied!", 'success');
  };

  if (!isOpen) return null;

  if (type === 'AFFILIATE') {
      return (
          <Modal isOpen={isOpen} onClose={onClose} title="Affiliate Center">
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-amber-100 p-3 rounded-xl border border-amber-200">
                      <div className="text-xs text-amber-600 font-bold mb-1 uppercase">Total Earned</div>
                      <div className="text-lg font-black text-amber-900">{totalReferralEarnings.toLocaleString()} PTS</div>
                   </div>
                   <div className="bg-blue-100 p-3 rounded-xl border border-blue-200">
                       <div className="text-xs text-blue-600 font-bold mb-1 uppercase">Friends</div>
                       <div className="text-lg font-black text-blue-900">{referrals.length} Users</div>
                   </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                   <div className="text-xs text-gray-400 font-bold uppercase mb-2">Your Referral Link</div>
                   <div className="flex gap-2">
                      <div className="flex-1 bg-gray-100 p-2 rounded-lg text-xs font-mono text-gray-600 truncate flex items-center">
                         {referralLink}
                      </div>
                      <button onClick={handleCopyLink} className="bg-amber-500 text-white px-3 rounded-lg flex items-center justify-center">
                         <Copy size={16} />
                      </button>
                   </div>
                   <p className="text-[10px] text-gray-400 mt-2 text-center">Earn 10% commission on every friend's market sale!</p>
                </div>

                <div>
                   <h4 className="font-bold text-gray-700 uppercase tracking-wider text-xs mb-2">Your Team</h4>
                   <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <div className="grid grid-cols-3 bg-gray-50 p-2 text-[10px] font-bold text-gray-400 uppercase">
                         <div className="col-span-2">Username</div>
                         <div className="text-right">Earnings</div>
                      </div>
                      {referrals.map(ref => (
                         <div key={ref.id} className="grid grid-cols-3 p-3 border-b border-gray-50 last:border-0 items-center">
                            <div className="col-span-2 flex items-center gap-2">
                                <span className="font-bold text-sm text-gray-700">{ref.username}</span>
                                {ref.isActive ? (
                                   <CheckCircle size={14} className="text-white fill-green-500" />
                                ) : (
                                   <Clock size={14} className="text-gray-300" />
                                )}
                            </div>
                            <div className="text-right font-bold text-amber-600">+{ref.contribution.toLocaleString()}</div>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          </Modal>
      )
  }

  return (
      <Modal isOpen={isOpen} onClose={onClose} title="Withdraw Funds">
         <div className="space-y-4">
             <div className="bg-gray-800 text-white p-4 rounded-xl flex justify-between items-center shadow-md">
                 <div>
                     <div className="text-xs text-gray-400 font-bold uppercase">Available Balance</div>
                     <div className="text-xl font-black text-amber-400">{user.balance.toLocaleString()} PTS</div>
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
                 <div>
                     <label className="text-xs text-gray-400 font-bold uppercase mb-1 block">Amount (PTS)</label>
                     <input 
                        type="text" 
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="Min 1,000"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono font-bold text-gray-800 focus:outline-none focus:border-amber-400 transition-colors"
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
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-xs text-gray-600 focus:outline-none focus:border-amber-400 transition-colors"
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
         </div>
      </Modal>
  );
};
