import React from 'react';
import { User, Coins } from 'lucide-react';
import { Plan, UserState } from '../../types';

interface HeaderProps {
  user: UserState;
  onProfileClick: () => void;
  onWithdrawClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onProfileClick, onWithdrawClick }) => {
  const formatCurrency = (amount: number) => 
    amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="flex justify-between items-start p-4 pt-6 w-full max-w-lg mx-auto">
      {/* User Profile Card */}
      <button 
        onClick={onProfileClick}
        className="pointer-events-auto flex items-center gap-2 bg-white/40 backdrop-blur-md p-1 pr-4 rounded-full border border-white/50 shadow-sm active:scale-95 transition-transform"
      >
         <div className="w-10 h-10 bg-blue-400 rounded-full border-2 border-white overflow-hidden flex items-center justify-center shrink-0">
             {/* Using an icon as placeholder for the deer avatar */}
             <User size={24} className="text-white" />
         </div>
         <div className="flex flex-col items-start">
             <span className="font-extrabold text-sm text-gray-800 leading-none mb-0.5 shadow-white drop-shadow-sm">{user.username}</span>
             <span className="bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase leading-none border border-blue-600 shadow-sm">
                 {user.plan}
             </span>
         </div>
      </button>

      {/* Balance Card */}
      <button 
        onClick={onWithdrawClick}
        className="pointer-events-auto flex items-center gap-2 bg-white/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/50 shadow-sm active:scale-95 transition-transform"
      >
         <div className="w-6 h-6 rounded-full bg-yellow-400 border-2 border-yellow-500 flex items-center justify-center shadow-sm">
             <Coins size={14} className="text-yellow-800" />
         </div>
         <span className="font-black text-sm text-gray-800 shadow-white drop-shadow-sm">
             {formatCurrency(user.balance)} PTS
         </span>
      </button>
    </div>
  );
};