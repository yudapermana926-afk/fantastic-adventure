import React from 'react';
import { Gamepad2, ClipboardList, BookOpen, Info } from 'lucide-react';

interface SidebarProps {
  onSpinClick: () => void;
  onTasksClick: () => void;
  onWikiClick: () => void;
  tasksBadge: number;
}

const SidebarItem = ({ icon, label, onClick, badge, colorClass }: { icon: any, label: string, onClick: () => void, badge?: number, colorClass: string }) => (
    <button 
        onClick={onClick} 
        className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
    >
        <div className={`w-12 h-12 rounded-full ${colorClass} border-2 border-white/50 shadow-lg flex items-center justify-center relative backdrop-blur-sm`}>
            {icon}
            {badge ? (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                    {badge}
                </div>
            ) : null}
        </div>
        <span className="text-[10px] font-bold text-white drop-shadow-md stroke-black">{label}</span>
    </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ onSpinClick, onTasksClick, onWikiClick, tasksBadge }) => {
  return (
    <div className="absolute right-4 top-24 pointer-events-auto">
       <div className="flex flex-col gap-4 bg-white/20 backdrop-blur-md p-2 rounded-2xl border border-white/30 shadow-sm">
          <SidebarItem 
              icon={<div className="text-2xl">🎡</div>} // Using emoji for colorful wheel look or icon
              label="Spin"
              onClick={onSpinClick}
              colorClass="bg-yellow-400/80 hover:bg-yellow-400"
          />
          <SidebarItem 
              icon={<ClipboardList size={22} className="text-green-800" />}
              label="Task"
              onClick={onTasksClick}
              badge={tasksBadge}
              colorClass="bg-green-100/80 hover:bg-green-100"
          />
          <SidebarItem 
              icon={<Info size={24} className="text-blue-800" />}
              label="Wiki"
              onClick={onWikiClick}
              colorClass="bg-blue-100/80 hover:bg-blue-100"
          />
       </div>
    </div>
  );
};