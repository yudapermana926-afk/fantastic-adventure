import React, { useState } from 'react';
import { Target, Gift, ArrowRight, CheckCircle, Clock, Coins, Sparkles, ExternalLink } from 'lucide-react';
import { useGameStore } from '../../store';
import { DailyTask, TaskAction, TaskCategory } from '../../types';
import { getCategoryDisplay, getTaskNavigationAction, DAILY_TASK_FULL_COMPLETION_REWARD } from '../../constants';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (action: string) => void;
  onShowToast: (msg: string, type: 'success' | 'info') => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onNavigate, onShowToast }) => {
  const { dailyTasks, claimDailyTask, claimFullCompletionBonus, getDailyTaskStats, updateDailyTaskProgress } = useGameStore();
  const stats = getDailyTaskStats();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClaim = async (task: DailyTask) => {
    setClaimingId(task.id);
    const result = claimDailyTask(task.id);
    if (result.success) {
      onShowToast(result.message, 'success');
    } else {
      onShowToast(result.message, 'info');
    }
    setClaimingId(null);
  };

  const handleClaimFullBonus = () => {
    const result = claimFullCompletionBonus();
    if (result.success) {
      onShowToast(result.message, 'success');
    } else {
      onShowToast(result.message, 'info');
    }
  };

  const handleGo = (task: DailyTask) => {
    const action = getTaskNavigationAction(task.action);
    onClose();
    if (onNavigate) {
      onNavigate(action);
    }
  };

  const handleManualProgress = (action: TaskAction) => {
    // For testing or manual triggers
    updateDailyTaskProgress(action);
  };

  const tasksByCategory = {
    [TaskCategory.FARMING]: dailyTasks.filter(t => t.category === TaskCategory.FARMING),
    [TaskCategory.ECONOMIC]: dailyTasks.filter(t => t.category === TaskCategory.ECONOMIC),
    [TaskCategory.SOCIAL]: dailyTasks.filter(t => t.category === TaskCategory.SOCIAL),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex justify-between items-center p-5 bg-gradient-to-r from-amber-500 to-orange-600 border-b border-white/10 shrink-0">
          <h2 className="text-xl font-black tracking-widest uppercase text-white drop-shadow-sm flex items-center gap-2">
            <Target size={24} className="fill-white" /> Daily Tasks
          </h2>
          <button onClick={onClose} className="bg-black/20 p-2 rounded-full hover:bg-black/40 text-white transition-colors">
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="p-4 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-white/5 shrink-0">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Daily Progress</span>
            <span className="text-sm font-bold text-white">{stats.completed}/{stats.total} Tasks</span>
          </div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${stats.progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">{stats.progressPercent}% Complete</span>
            {stats.canClaimFullBonus ? (
              <span className="text-xs text-green-400 font-semibold animate-pulse">Full Bonus Available!</span>
            ) : (
              <span className="text-xs text-gray-500">
                {stats.remaining} remaining
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-6">

          {/* Full Completion Bonus Card */}
          <div className={`relative overflow-hidden rounded-2xl border-2 p-4 transition-all duration-300 ${
            stats.canClaimFullBonus 
              ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 animate-pulse' 
              : 'border-gray-700 bg-gray-800/50 opacity-60'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl">
                  <Gift size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Full Completion Bonus</h3>
                  <p className="text-sm text-gray-400">
                    {DAILY_TASK_FULL_COMPLETION_REWARD.pts} PTS + {DAILY_TASK_FULL_COMPLETION_REWARD.item}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClaimFullBonus}
                disabled={!stats.canClaimFullBonus}
                className={`px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300 ${
                  stats.canClaimFullBonus
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:scale-105 shadow-lg shadow-yellow-500/25'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {stats.fullBonusClaimed ? 'Claimed' : 'Claim'}
              </button>
            </div>
            {stats.canClaimFullBonus && (
              <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/20 rounded-full blur-2xl -mr-10 -mt-10" />
            )}
          </div>

          {/* Tasks by Category */}
          {Object.entries(tasksByCategory).map(([category, tasks]) => {
            const categoryInfo = getCategoryDisplay(category as TaskCategory);
            
            return (
              <div key={category} className="space-y-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${categoryInfo.bgColor}`}>
                  <span className={`text-xs font-semibold ${categoryInfo.color}`}>
                    {categoryInfo.label}
                  </span>
                </div>
                
                <div className="space-y-2">
                  {tasks.map((task) => {
                    const canClaim = task.isCompleted && !task.isClaimed;
                    const isClaiming = claimingId === task.id;
                    
                    return (
                      <div 
                        key={task.id}
                        className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${
                          task.isClaimed
                            ? 'border-green-500/30 bg-green-500/10'
                            : task.isCompleted
                              ? 'border-green-500/50 bg-green-500/5'
                              : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              task.isClaimed 
                                ? 'bg-green-500/20 text-green-400'
                                : task.isCompleted
                                  ? 'bg-green-500/30 text-green-400'
                                  : 'bg-gray-700 text-gray-400'
                            }`}>
                              {task.isClaimed ? (
                                <CheckCircle size={20} />
                              ) : (
                                <span className="text-xl">{task.icon}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-semibold text-sm ${
                                task.isClaimed 
                                  ? 'text-gray-400 line-through'
                                  : 'text-white'
                              }`}>
                                {task.description}
                              </h4>
                              
                              {/* Progress Bar for Task */}
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                                  <span>Progress</span>
                                  <span className={`${task.isCompleted ? 'text-green-400' : 'text-gray-400'}`}>
                                    {task.currentProgress}/{task.target}
                                  </span>
                                </div>
                                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-500 rounded-full ${
                                      task.isCompleted 
                                        ? 'bg-green-500' 
                                        : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${Math.min(100, (task.currentProgress / task.target) * 100)}%` }}
                                  />
                                </div>
                              </div>
                              
                              {/* Reward */}
                              <div className="flex items-center gap-1 mt-2">
                                <Coins size={12} className="text-yellow-400" />
                                <span className="text-xs text-yellow-400 font-semibold">
                                  {task.rewardPts} PTS
                                </span>
                                {task.rewardItem && (
                                  <>
                                    <span className="text-gray-500 mx-1">•</span>
                                    <span className="text-xs text-purple-400">{task.rewardItem}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              onClick={() => handleGo(task)}
                              disabled={task.isCompleted && task.isClaimed}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center gap-1 ${
                                task.isCompleted && task.isClaimed
                                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                  : 'bg-blue-600 text-white hover:bg-blue-500'
                              }`}
                            >
                              {task.isCompleted && task.isClaimed ? 'Done' : 'Go'}
                              {!task.isCompleted && (
                                <ArrowRight size={12} />
                              )}
                            </button>
                            
                            {canClaim && (
                              <button
                                onClick={() => handleClaim(task)}
                                disabled={isClaiming}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:scale-105 transition-all animate-bounce"
                              >
                                {isClaiming ? '...' : 'Claim'}
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {task.isClaimed && (
                          <div className="absolute top-2 right-12">
                            <CheckCircle size={16} className="text-green-500" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-900/50 border-t border-white/5 shrink-0">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <Clock size={14} />
            <span>Tasks reset daily at UTC 00:00</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TaskModal;
