import React from 'react';
import { Wheat, Warehouse, ShoppingBasket, Users, MoreHorizontal } from 'lucide-react';

interface BottomNavProps {
  onOpenModal: (modal: 'BARN' | 'MARKET' | 'AFFILIATE' | 'MEMBERSHIP') => void;
}

const NavItem = ({ icon, label, onClick, colorClass }: { icon: any, label: string, onClick?: () => void, colorClass: string }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center w-16 gap-1 active:scale-95 transition-transform"
  >
      <div className={`w-10 h-10 ${colorClass} rounded-xl flex items-center justify-center shadow-sm border border-black/5`}>
         {icon}
      </div>
      <span className="text-[10px] font-bold text-gray-700 leading-none">{label}</span>
  </button>
);

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenModal }) => {
  return (
    <div className="pointer-events-auto w-full bg-[#E8F5E9]/90 backdrop-blur-xl border-t border-white/50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] pb-6 pt-3 px-4 rounded-t-3xl">
        <div className="flex justify-between items-end max-w-lg mx-auto">
            <NavItem 
                icon={<Wheat size={24} className="text-yellow-600 fill-yellow-400" />} 
                label="Farm" 
                colorClass="bg-yellow-100"
            />
            <NavItem 
                icon={<Warehouse size={22} className="text-red-600 fill-red-400" />} 
                label="Barn" 
                onClick={() => onOpenModal('BARN')}
                colorClass="bg-red-100"
            />
            <NavItem 
                icon={<ShoppingBasket size={22} className="text-orange-600 fill-orange-400" />} 
                label="Market" 
                onClick={() => onOpenModal('MARKET')}
                colorClass="bg-orange-100"
            />
            <NavItem 
                icon={<Users size={22} className="text-blue-600 fill-blue-400" />} 
                label="Affiliate" 
                onClick={() => onOpenModal('AFFILIATE')}
                colorClass="bg-blue-100"
            />
            <NavItem 
                icon={<MoreHorizontal size={24} className="text-gray-600" />} 
                label="More" 
                onClick={() => onOpenModal('MEMBERSHIP')}
                colorClass="bg-gray-200"
            />
        </div>
    </div>
  );
};