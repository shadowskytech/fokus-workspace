/**
 * @file StatPanel.tsx
 * @description Modular visual statistics panel component with progress bars
 * styled after the minimal Nord design theme.
 */

import React from 'react';
import { BarChart2, CheckSquare, Folder, Clock } from 'lucide-react';
import { Task } from '../types.ts';

interface StatPanelProps {
  tasks: Task[];
  activeCategory: string;
}

/**
 * StatPanel Component
 * Renders high-quality, flexbox-centric metrics illustrating the user's progress.
 * Keeps structural margins fluid and responsive.
 */
export const StatPanel: React.FC<StatPanelProps> = ({ tasks, activeCategory }) => {
  // Compute metrics in real-time
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = totalCount - completedCount;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Compute category breakdown
  const categoryCount = Array.from(new Set(tasks.map(t => t.category))).length;

  return (
    <div className="w-full flex flex-col gap-4 mb-6">
      {/* Cards Row - Fully responsive Flex display */}
      <div className="w-full flex flex-row flex-wrap gap-3">
        
        {/* Stat Widget: Combined Tasks */}
        <div className="flex-1 min-w-[120px] bg-slate-800/40 dark:bg-[#3b4252]/50 border border-slate-700/30 dark:border-[#4c566a]/40 p-4 rounded-xl flex items-center justify-between shadow-sm transition-all hover:border-[#8fbcbb]/30">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-[#d8dee9]/60">Total</span>
            <span className="text-2xl font-bold font-sans text-slate-800 dark:text-[#eceff4]">{totalCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[#81a1c1]/10 text-[#81a1c1]">
            <Clock size={18} />
          </div>
        </div>

        {/* Stat Widget: Completed */}
        <div className="flex-1 min-w-[120px] bg-slate-800/40 dark:bg-[#3b4252]/50 border border-slate-700/30 dark:border-[#4c566a]/40 p-4 rounded-xl flex items-center justify-between shadow-sm transition-all hover:border-[#a3be8c]/30">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-[#d8dee9]/60">Done</span>
            <span className="text-2xl font-bold font-sans text-emerald-500 dark:text-[#a3be8c]">{completedCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 dark:bg-[#a3be8c]/10 text-emerald-500 dark:text-[#a3be8c]">
            <CheckSquare size={18} />
          </div>
        </div>

        {/* Stat Widget: Pending */}
        <div className="flex-1 min-w-[120px] bg-slate-800/40 dark:bg-[#3b4252]/50 border border-slate-700/30 dark:border-[#4c566a]/40 p-4 rounded-xl flex items-center justify-between shadow-sm transition-all hover:border-[#bf616a]/30">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-[#d8dee9]/60 font-mono">Pending</span>
            <span className="text-2xl font-bold font-sans text-indigo-400 dark:text-[#88c0d0]">{pendingCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-500/10 dark:bg-[#88c0d0]/10 text-indigo-400 dark:text-[#88c0d0]">
            <BarChart2 size={18} />
          </div>
        </div>

        {/* Stat Widget: Total Categories */}
        <div className="flex-1 min-w-[120px] bg-slate-800/40 dark:bg-[#3b4252]/50 border border-slate-700/30 dark:border-[#4c566a]/40 p-4 rounded-xl flex items-center justify-between shadow-sm transition-all hover:border-[#ebcb8b]/30">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 dark:text-[#d8dee9]/60">Labels</span>
            <span className="text-2xl font-bold font-sans text-amber-500 dark:text-[#ebcb8b]">{categoryCount}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 dark:bg-[#ebcb8b]/10 text-amber-500 dark:text-[#ebcb8b]">
            <Folder size={18} />
          </div>
        </div>

      </div>

      {/* Progress Bar Container - Flexbox centric */}
      <div className="w-full bg-slate-800/20 dark:bg-[#3b4252]/30 border border-slate-700/20 dark:border-[#4c566a]/30 rounded-xl p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 dark:text-[#d8dee9]/70">
            {activeCategory && activeCategory !== 'all' ? `Category "${activeCategory}" Completion` : 'Overall Completion Rate'}
          </span>
          <span className="font-bold text-[#88c0d0]">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-slate-300 dark:bg-[#4c566a]/50 h-2.5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-linear-to-r from-[#81a1c1] via-[#88c0d0] to-[#8fbcbb] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
