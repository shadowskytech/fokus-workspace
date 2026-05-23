/**
 * @file TaskRow.tsx
 * @description Single task checklist item renderer. Focuses on premium typography,
 * smooth transitions via motion, active inline row transitions, and overdue highlights.
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trash2, Edit3, Check, X, Calendar, AlertTriangle, MessageSquare, Folder } from 'lucide-react';
import { Task, Priority } from '../types.ts';

interface TaskRowProps {
  task: Task;
  categories: string[];
  onToggleComplete: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (id: string, updatedFields: Partial<Task>) => void;
  isNerdMode?: boolean;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  categories,
  onToggleComplete,
  onDeleteTask,
  onEditTask,
  isNerdMode = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const [editPriority, setEditPriority] = useState<Priority>(task.priority);
  const [editCategory, setEditCategory] = useState(task.category);
  const [editDueDate, setEditDueDate] = useState(task.dueDate);

  /**
   * Commits the inline edited properties back into context.
   */
  const handleSave = () => {
    if (!editTitle.trim()) return;
    onEditTask(task.id, {
      title: editTitle.trim(),
      description: isNerdMode ? '' : editDescription.trim(),
      priority: isNerdMode ? task.priority : editPriority,
      category: isNerdMode ? task.category : editCategory,
      dueDate: isNerdMode ? task.dueDate : editDueDate,
      updatedAt: new Date().toISOString()
    });
    setIsEditing(false);
  };

  /**
   * Resets editing fields and closes panel
   */
  const handleCancel = () => {
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditPriority(task.priority);
    setEditCategory(task.category);
    setEditDueDate(task.dueDate);
    setIsEditing(false);
  };

  /**
   * Overdue and near-deadline status calculation.
   * Returns: 'overdue', 'today', 'upcoming', or 'none'.
   */
  const getDueDateStatus = (): 'overdue' | 'today' | 'upcoming' | 'none' => {
    if (!task.dueDate) return 'none';
    const todayStr = new Date().toISOString().slice(0, 10);
    const dueStr = task.dueDate.slice(0, 10);

    if (dueStr < todayStr && !task.completed) return 'overdue';
    if (dueStr === todayStr && !task.completed) return 'today';
    return 'upcoming';
  };

  const deadlineStatus = getDueDateStatus();

  // Color schemes for priorities matching the Nord Theme
  const priorityBadges = {
    low: 'bg-[#a3be8c]/15 text-[#a3be8c] border-[#a3be8c]/20',
    medium: 'bg-[#ebcb8b]/15 text-[#ebcb8b] border-[#ebcb8b]/20',
    high: 'bg-[#bf616a]/15 text-[#bf616a] border-[#bf616a]/25 animate-pulse-slow'
  };

  if (isNerdMode) {
    if (isEditing) {
      return (
        <div className="w-full bg-[#1b1f27] border border-[#3b4252] rounded-lg p-2.5 font-mono text-xs flex items-center justify-between gap-2">
          <div className="flex-grow flex items-center gap-2 min-w-0">
            <span className="text-[#81a1c1] select-none shrink-0">$ edit:</span>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="flex-grow bg-transparent border-none text-[#eceff4] focus:outline-hidden focus:ring-0 p-0 text-xs"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          <div className="flex gap-2 shrink-0 select-none text-[10px]">
            <button onClick={handleSave} className="text-[#a3be8c] hover:underline cursor-pointer font-bold">[save]</button>
            <button onClick={handleCancel} className="text-[#bf616a] hover:underline cursor-pointer">[cancel]</button>
          </div>
        </div>
      );
    }

    return (
      <div 
        className="w-full bg-transparent border-b border-[#3b4252]/25 py-1.5 flex items-center justify-between font-mono text-xs select-none hover:text-[#eceff4] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => onToggleComplete(task.id)}
            className="text-xs hover:text-[#88c0d0] focus:outline-hidden shrink-0 font-bold cursor-pointer"
          >
            {task.completed ? (
              <span className="text-[#a3be8c]">[x]</span>
            ) : (
              <span className="text-[#4c566a] hover:text-[#d8dee9]">[ ]</span>
            )}
          </button>
          <span className={`truncate text-[#d8dee9] ${task.completed ? 'line-through text-[#4c566a]' : ''}`}>
            {task.title}
          </span>
          {task.priority === 'high' && !task.completed && (
            <span className="text-[#bf616a] text-[9px] uppercase font-bold px-1 py-0.2 bg-[#bf616a]/10 rounded select-none shrink-0 border border-[#bf616a]/15 font-mono">[!]</span>
          )}
        </div>
        <div className="flex gap-2 text-[10px] text-[#4c566a] shrink-0 select-none">
          <button onClick={() => setIsEditing(true)} className="hover:text-[#81a1c1] cursor-pointer">[e]</button>
          <button onClick={() => onDeleteTask(task.id)} className="hover:text-[#bf616a] cursor-pointer">[d]</button>
        </div>
      </div>
    );
  }

  /**
   * Renders the editor panel directly inside the row with custom form structures.
   */
  if (isEditing) {
    return (
      <div className="w-full bg-slate-800/40 dark:bg-[#3b4252]/60 border border-[#81a1c1]/40 rounded-xl p-4 flex flex-col gap-3 shadow-md">
        
        {/* Row 1: Title input */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-[#d8dee9]/60">Task Title</label>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full bg-white dark:bg-[#2e3440] border border-slate-700/20 dark:border-[#4c566a]/40 rounded-lg p-2 text-sm text-slate-800 dark:text-[#eceff4] focus:outline-hidden focus:border-[#81a1c1]/50"
            autoFocus
          />
        </div>

        {/* Row 2: Description text */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-[#d8dee9]/60">Description</label>
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={2}
            className="w-full bg-white dark:bg-[#2e3440] border border-slate-700/20 dark:border-[#4c566a]/40 rounded-lg p-2 text-sm text-slate-850 dark:text-[#d8dee9] focus:outline-hidden focus:border-[#81a1c1]/50 resize-none"
          />
        </div>

        {/* Row 3: parameters columns */}
        <div className="flex flex-row flex-wrap gap-3">

          {/* Priority selector */}
          <div className="flex-1 min-w-[120px] flex flex-col gap-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-[#d8dee9]/60">Priority</label>
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value as Priority)}
              className="bg-white dark:bg-[#2e3440] border border-slate-700/20 dark:border-[#4c566a]/40 text-slate-700 dark:text-[#d8dee9] rounded-lg p-1.5 text-xs focus:outline-hidden"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Due date */}
          <div className="flex-1 min-w-[120px] flex flex-col gap-1">
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-[#d8dee9]/60">Due Date</label>
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="bg-white dark:bg-[#2e3440] border border-slate-700/20 dark:border-[#4c566a]/40 text-slate-700 dark:text-[#d8dee9] rounded-lg p-1.5 text-xs focus:outline-hidden"
            />
          </div>

        </div>

        {/* Save/Cancel controls */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-700/10 dark:border-[#4c566a]/30">
          <button
            onClick={handleCancel}
            className="p-1 px-3 border border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-[#eceff4] text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
          >
            <X size={12} /> Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!editTitle.trim()}
            className="p-1 px-3 bg-[#a3be8c] hover:bg-[#a3be8c]/90 text-[#2e3440] font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
          >
            <Check size={12} /> Save
          </button>
        </div>

      </div>
    );
  }

  return (
    <div 
      className={`w-full group task-card bg-white dark:bg-[#3b4252]/20 border rounded-xl p-4 flex flex-row items-start gap-3.5 shadow-xs transition-all duration-200 ${
        task.completed 
          ? 'border-slate-300/45 dark:border-[#4c566a]/20 opacity-55' 
          : 'border-slate-100 dark:border-[#4c566a]/30'
      } hover:shadow-sm`}
    >
      {/* Visual Ticking Circle */}
      <button 
        onClick={() => onToggleComplete(task.id)}
        className={`mt-0.5 w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
          task.completed 
            ? 'bg-emerald-500 border-emerald-500 dark:bg-[#a3be8c] dark:border-[#a3be8c] text-[#2e3440]' 
            : 'border-slate-300 dark:border-[#4c566a] hover:border-[#88c0d0]'
        }`}
      >
        {task.completed && <Check size={12} strokeWidth={3} />}
      </button>

      {/* Main Core Columns - flex-1 is robust for responsive space limits */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        
        {/* Title text */}
        <h3 
          className={`font-sans text-sm font-semibold tracking-tight transition-all truncate text-slate-800 dark:text-[#eceff4] ${
            task.completed ? 'line-through text-slate-400 dark:text-[#d8dee9]/40' : ''
          }`}
        >
          {task.title}
        </h3>

        {/* Description line (rendered only if present or active) */}
        {task.description && (
          <p className={`text-xs text-slate-500 dark:text-[#d8dee9]/60 line-clamp-2 leading-relaxed ${
            task.completed ? 'line-through text-slate-400/40 dark:text-[#d8dee9]/20' : ''
          }`}>
            {task.description}
          </p>
        )}

        {/* Metadata Badge container row - Flex wrap for responsive layout scaling */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[10px] font-mono font-medium">
          
          {/* Badge: Category */}
          <span className="bg-slate-100 hover:bg-slate-200/90 dark:bg-[#2e3440]/60 text-slate-500 dark:text-[#81a1c1] px-2 py-0.5 rounded-md border border-slate-200/50 dark:border-transparent flex items-center gap-1">
            <Folder size={10} />
            {task.category}
          </span>

          {/* Badge: Priority */}
          <span className={`px-2 py-0.5 rounded-md border uppercase tracking-wider ${priorityBadges[task.priority]}`}>
            {task.priority} Priority
          </span>

          {/* Badge: Calendars / Due dates */}
          {task.dueDate && (
            <span className={`px-2 py-0.5 rounded-md border flex items-center gap-1 ${
              deadlineStatus === 'overdue' 
                ? 'bg-rose-500/10 text-[#bf616a] border-[#bf616a]/30 font-semibold' 
                : deadlineStatus === 'today'
                  ? 'bg-amber-500/10 text-amber-500 dark:text-[#ebcb8b] border-amber-500/30'
                  : 'bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-[#d8dee9]/50 border-slate-200/40 dark:border-[#4c566a]/20'
            }`}>
              <Calendar size={10} />
              {task.dueDate}
              {deadlineStatus === 'overdue' && <AlertTriangle size={10} className="ml-0.5 inline animate-bounce" />}
            </span>
          )}

        </div>

      </div>

      {/* Hover Action controls panels */}
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 self-center">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 text-slate-400 hover:text-[#88c0d0] rounded-md hover:bg-slate-100 dark:hover:bg-[#4c566a]/30 transition-colors cursor-pointer"
          title="Edit Task"
        >
          <Edit3 size={15} />
        </button>
        <button
          onClick={() => onDeleteTask(task.id)}
          className="p-1.5 text-slate-400 hover:text-[#bf616a] rounded-md hover:bg-slate-100 dark:hover:bg-[#4c566a]/30 transition-colors cursor-pointer"
          title="Delete Task"
        >
          <Trash2 size={15} />
        </button>
      </div>

    </div>
  );
};
