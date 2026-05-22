/**
 * @file TaskForm.tsx
 * @description Highly interactive task creation component. Includes a collapsed mode
 * for premium minimalism that expands seamlessly with custom priorities, Categories,
 * description, and calendars.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Calendar, Folder, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Task, Priority } from '../types.ts';

interface TaskFormProps {
  categories: string[];
  onAddTask: (taskData: {
    title: string;
    description: string;
    priority: Priority;
    category: string;
    dueDate: string;
  }) => void;
  onAddCategory: (categoryName: string) => void;
  isNerdMode?: boolean;
}

export const TaskForm: React.FC<TaskFormProps> = ({ categories, onAddTask, onAddCategory, isNerdMode = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState('Inbox');
  const [dueDate, setDueDate] = useState('');
  const [newCatInput, setNewCatInput] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  /**
   * Closes the expanded form if clicked outside, provided the fields are empty.
   */
  useEffect(() => {
    if (isNerdMode) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        formRef.current &&
        !formRef.current.contains(event.target as Node) &&
        !title &&
        !description &&
        !dueDate &&
        category === 'Inbox'
      ) {
        setIsExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [title, description, dueDate, category, isNerdMode]);

  /**
   * Processes the task form submission, validating input
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTask({
      title: title.trim(),
      description: isNerdMode ? '' : description.trim(),
      priority: isNerdMode ? 'medium' : priority,
      category: isNerdMode ? 'Inbox' : category,
      dueDate: isNerdMode ? '' : dueDate
    });

    // Reset Form Fields state
    setTitle('');
    setDescription('');
    setPriority('medium');
    setCategory('Inbox');
    setDueDate('');
    setIsExpanded(false);
  };

  /**
   * Action to create a custom category tag dynamically
   */
  const handleCreateCategory = (e: React.MouseEvent) => {
    e.preventDefault();
    const cleanCat = newCatInput.trim();
    if (cleanCat && !categories.includes(cleanCat)) {
      onAddCategory(cleanCat);
      setCategory(cleanCat);
      setNewCatInput('');
      setIsAddingCat(false);
    }
  };

  if (isNerdMode) {
    return (
      <div className="w-full bg-[#1b1f27] border border-[#3b4252] rounded-lg p-2.5 font-mono">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 text-xs">
          <span className="text-[#a3be8c] shrink-0 select-none">$ add_task:</span>
          <input 
            type="text" 
            placeholder="Type task title and press Enter..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-grow bg-transparent border-none text-[#eceff4] placeholder-[#4c566a] focus:outline-hidden focus:ring-0 text-xs py-0.5"
            autoFocus
          />
          {title.trim() && (
            <span className="text-[10px] text-slate-500 animate-pulse">[Press Enter]</span>
          )}
        </form>
      </div>
    );
  }

  return (
    <div 
      ref={formRef}
      className={`w-full bg-slate-800/30 dark:bg-[#3b4252]/40 border rounded-2xl p-4 shadow-md transition-all duration-300 ${
        isExpanded 
          ? 'border-[#81a1c1]/55 ring-1 ring-[#81a1c1]/20 shadow-lg' 
          : 'border-slate-700/20 dark:border-[#4c566a]/30'
      }`}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Row 1: Quick Title Input and Expand Trigger */}
        <div className="flex items-center gap-2 sm:gap-3 w-full min-w-0">
          <button 
            type="submit" 
            disabled={!title.trim()}
            className={`p-2 rounded-xl flex items-center justify-center shrink-0 transition-all ${
              title.trim() 
                ? 'bg-gradient-to-r from-[#81a1c1] to-[#88c0d0] text-[#2e3440] shadow-md hover:scale-105 active:scale-95' 
                : 'bg-slate-700/30 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Plus size={18} className="sm:w-[20px] sm:h-[20px]" />
          </button>
          
          <input 
            type="text" 
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!isExpanded) setIsExpanded(true);
            }}
            onFocus={() => setIsExpanded(true)}
            className="flex-1 bg-transparent border-none text-slate-800 dark:text-[#eceff4] placeholder-slate-400 dark:placeholder-[#d8dee9]/40 font-medium text-sm sm:text-base focus:outline-hidden focus:ring-0 min-w-0 pr-1 w-full"
          />

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 sm:p-2 rounded-lg border border-slate-700/10 dark:border-[#4c566a]/30 bg-slate-700/10 hover:bg-slate-700/20 text-slate-500 dark:text-[#d8dee9]/60 hover:text-slate-800 dark:hover:text-[#eceff4] transition-all flex items-center justify-center focus:outline-hidden shrink-0"
            title={isExpanded ? "Collapse Details" : "Expand Details"}
          >
            {isExpanded ? <ChevronUp size={16} className="sm:w-[18px] sm:h-[18px]" /> : <ChevronDown size={16} className="sm:w-[18px] sm:h-[18px]" />}
          </button>
        </div>

        {/* Expandable Meta-parameters panel */}
        {isExpanded && (
          <div className="flex flex-col gap-4 mt-2 pt-4 border-t border-slate-700/20 dark:border-[#4c566a]/30 font-sans">
            
            {/* Field: Description Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-[#d8dee9]/60">Description (Optional)</label>
              <textarea 
                placeholder="Add sub-tasks, notes, context, or checklist links..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-slate-900/15 dark:bg-[#2e3440]/30 border border-slate-700/20 dark:border-[#4c566a]/40 text-slate-700 dark:text-[#d8dee9] placeholder-slate-500 dark:placeholder-[#d8dee9]/30 rounded-xl p-2.5 text-sm focus:outline-hidden focus:border-[#81a1c1]/50 focus:ring-1 focus:ring-[#81a1c1]/10 resize-none"
              />
            </div>

            {/* Selection Grid: Category, Priority, and DueDate */}
            <div className="flex flex-row flex-wrap gap-4 items-end">
              
              {/* Category Selector */}
              <div className="flex-1 min-w-[160px] flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-[#d8dee9]/60 flex items-center gap-1.5">
                  <Folder size={12} /> Label
                </label>
                
                {isAddingCat ? (
                  <div className="flex gap-1">
                    <input 
                      type="text"
                      placeholder="New label..."
                      value={newCatInput}
                      onChange={(e) => setNewCatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory(e as any)}
                      className="flex-1 bg-slate-100 dark:bg-[#2e3440] border border-[#81a1c1]/40 text-slate-800 dark:text-[#eceff4] text-xs rounded-lg p-1.5 focus:outline-hidden"
                      autoFocus
                    />
                    <button 
                      onClick={handleCreateCategory}
                      className="bg-[#a3be8c] text-[#2e3440] text-xs font-semibold px-2 rounded-lg hover:scale-105 active:scale-95 transition-all"
                    >
                      OK
                    </button>
                    <button 
                      onClick={() => setIsAddingCat(false)}
                      className="bg-[#bf616a]/15 text-[#bf616a] text-xs px-2 rounded-lg hover:bg-[#bf616a]/20 transition-all font-semibold"
                    >
                      X
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1.5">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="max-sm:w-full flex-1 bg-slate-100 dark:bg-[#3b4252] border border-slate-700/20 dark:border-[#4c566a]/40 text-slate-700 dark:text-[#d8dee9] rounded-lg p-1.5 text-xs focus:outline-hidden focus:border-[#81a1c1]/40"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsAddingCat(true)}
                      className="p-2 border border-dashed border-slate-700/30 dark:border-[#4c566a]/50 text-slate-500 dark:text-slate-400 hover:text-[#88c0d0] rounded-lg transition-colors text-xs"
                    >
                      + New
                    </button>
                  </div>
                )}
              </div>

              {/* Priority Chips Selection */}
              <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-[#d8dee9]/60">Priority</label>
                <div className="flex gap-1.5">
                  {(['low', 'medium', 'high'] as Priority[]).map((level) => {
                    const activeStyles = {
                      low: 'bg-[#a3be8c]/20 border-[#a3be8c] text-emerald-600 dark:text-[#a3be8c] font-bold shadow-xs',
                      medium: 'bg-[#ebcb8b]/20 border-[#ebcb8b] text-amber-600 dark:text-[#ebcb8b] font-bold shadow-xs',
                      high: 'bg-[#bf616a]/20 border-[#bf616a] text-rose-500 dark:text-[#bf616a] font-bold shadow-xs'
                    };
                    const inactiveStyles = 'bg-slate-100 dark:bg-[#2e3440]/40 border-slate-700/15 dark:border-[#4c566a]/30 text-slate-500 dark:text-[#d8dee9]/40 hover:bg-slate-200 dark:hover:bg-[#2e3440]/90';
                    return (
                      <button
                        type="button"
                        key={level}
                        onClick={() => setPriority(level)}
                        className={`flex-1 capitalize text-center text-xs py-1.5 border rounded-lg transition-all ${
                          priority === level ? activeStyles[level] : inactiveStyles
                        }`}
                      >
                        {level}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Due Date Calendar Field */}
              <div className="flex-1 min-w-[150px] flex flex-col gap-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-[#d8dee9]/60 flex items-center gap-1.5">
                  <Calendar size={12} /> Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-slate-100 dark:bg-[#3b4252] border border-slate-700/20 dark:border-[#4c566a]/40 text-slate-700 dark:text-[#d8dee9] rounded-lg p-1.5 text-xs focus:outline-hidden focus:border-[#81a1c1]/40"
                />
              </div>

            </div>

            {/* Row 3: Action Buttons */}
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setTitle('');
                  setDescription('');
                  setDueDate('');
                }}
                className="px-4 py-2 border border-transparent hover:border-slate-700/10 text-slate-500 dark:text-[#d8dee9]/50 hover:text-slate-700 dark:hover:text-[#eceff4] text-xs font-medium rounded-lg transition-all"
              >
                Clear Filters
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-all ${
                  title.trim()
                    ? 'bg-gradient-to-r from-[#81a1c1] to-[#88c0d0] text-[#2e3440] hover:shadow-md cursor-pointer'
                    : 'bg-slate-700/20 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                Create Task
              </button>
            </div>

          </div>
        )}
      </form>
    </div>
  );
};
