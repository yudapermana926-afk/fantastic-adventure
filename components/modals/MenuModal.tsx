import React, { useState } from 'react';
import { FileText, Shield, Send, ChevronRight } from 'lucide-react';
import { Modal } from '../UI';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MenuModal: React.FC<MenuModalProps> = ({ isOpen, onClose }) => {
  const [content, setContent] = useState<'MAIN' | 'TOU' | 'PP'>('MAIN');

  if (!isOpen) return null;

  const title = content === 'MAIN' ? 'Menu' : content === 'TOU' ? 'Terms of Use' : 'Privacy Policy';
  const handleBack = () => setContent('MAIN');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {content === 'MAIN' && (
        <div className="space-y-3">
          <button onClick={() => setContent('TOU')} className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm active:scale-95 transition-transform group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><FileText size={20} /></div>
              <span className="font-bold text-gray-700">Terms of Use</span>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-500" />
          </button>
          
          <button onClick={() => setContent('PP')} className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm active:scale-95 transition-transform group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><Shield size={20} /></div>
              <span className="font-bold text-gray-700">Privacy Policy</span>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-500" />
          </button>

          <a href="https://t.me/cyberfarmer_channel" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm active:scale-95 transition-transform group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white"><Send size={20} /></div>
              <span className="font-bold text-gray-700">Telegram Channel</span>
            </div>
            <ChevronRight size={20} className="text-gray-300 group-hover:text-gray-500" />
          </a>
          
          <div className="text-center text-xs text-gray-400 mt-4 font-bold">
            Version 1.0.0
          </div>
        </div>
      )}

      {content === 'TOU' && (
        <div className="space-y-4">
           <button onClick={handleBack} className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
             &larr; Back
           </button>
           <div className="bg-white p-4 rounded-xl border border-gray-200 text-sm text-gray-600 space-y-2">
              <h3 className="font-bold text-gray-800">1. Account Usage</h3>
              <p>One account per Telegram ID. Multi-accounting is strictly prohibited.</p>
              <h3 className="font-bold text-gray-800">2. Financials</h3>
              <p>Exchange Rate: 250,000 PTS = 1 USDT. Withdrawal Fee: 5% for TON, 0% for FaucetPay.</p>
           </div>
        </div>
      )}

      {content === 'PP' && (
        <div className="space-y-4">
           <button onClick={handleBack} className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
             &larr; Back
           </button>
           <div className="bg-white p-4 rounded-xl border border-gray-200 text-sm text-gray-600 space-y-2">
              <h3 className="font-bold text-gray-800">Data Collection</h3>
              <p>We only collect your public Telegram User ID and Username for game authentication and leaderboard display. No personal data is shared with third parties.</p>
           </div>
        </div>
      )}
    </Modal>
  );
}