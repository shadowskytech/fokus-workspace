/**
 * @file App.tsx
 * @description Main application entry point for the Nordic-Themed Todo App.
 * Manages parent-level application states, processes live filtering/sorting, integrates
 * the cache synchronization pipelines, and coordinates backup importing/exporting.
 * 
 * -----------------------------------------------------------------------------
 * CLIENT-SIDE API DOCUMENTATION & SCHEMA
 * -----------------------------------------------------------------------------
 * Since this application runs entirely client-side for maximum speed and data privacy, 
 * our programmatic "API" consists of several core data-persistence interfaces and state
 * mutation handlers.
 * 
 * 1. PERSISTENCE STORAGE INTERFACE
 *    Cache triggers use standard synchronous serializations committed to the browser's 
 *    `localStorage` API. No server connections are created, preventing server-side credential leaks.
 *    - loadTasksFromCache()   -> Retrieves & parses tasks JSON (Key: 'nordic_todo_tasks_cache')
 *    - saveTasksToCache(t)    -> Serializes and writes tasks to cached list.
 *    - loadCategoriesFromCache() -> Retrieves category strings (Key: 'nordic_todo_categories_cache')
 *    - saveCategoriesToCache(c)  -> Serializes & commits label strings.
 * 
 * 2. BACKUP & ARCHIVE API SCHEMA
 *    Backup payloads utilize a JSON envelope structured as follows:
 *    Type: TodoBackup
 *    {
 *       "source": "nordic_todo_app", // Format identifier string (Required)
 *       "exportedAt": "ISOString",   // Creation timestamp (Required)
 *       "version": 1,                // Backward-compatibility integer (Required)
 *       "categories": string[],      // Label schemas (Required)
 *       "tasks": [                   // Collection array of Type: Task (Required)
 *         {
 *           "id": "uuid-string",
 *           "title": "string",
 *           "description": "string",
 *           "completed": boolean,
 *           "priority": "low" | "medium" | "high",
 *           "category": "string",
 *           "dueDate": "YYYY-MM-DD",
 *           "createdAt": "ISOString",
 *           "updatedAt": "ISOString"
 *         }
 *       ]
 *    }
 * -----------------------------------------------------------------------------
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Upload, 
  Moon, 
  Sun, 
  Search, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Check, 
  Filter, 
  ArrowUpDown, 
  BookOpen, 
  X,
  FileCheck2,
  ListTodo,
  Menu,
  BarChart3,
  SlidersHorizontal,
  HelpCircle,
  Terminal,
  Lightbulb,
  Zap,
  FileText,
  Folder,
  Tag,
  Settings,
  ToggleRight,
  ToggleLeft
} from 'lucide-react';

import { Task, Priority, FilterState } from './types.ts';
import { 
  loadTasksFromCache, 
  saveTasksToCache, 
  loadCategoriesFromCache, 
  saveCategoriesToCache, 
  triggerBackupDownload, 
  validateAndParseBackup 
} from './store.ts';

import { StatPanel } from './components/StatPanel.tsx';
import { TaskForm } from './components/TaskForm.tsx';
import { TaskRow } from './components/TaskRow.tsx';



export default function App() {
  // ---------------------------------------------------------------------------
  // Core Application States
  // ---------------------------------------------------------------------------

  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isNerdMode, setIsNerdMode] = useState<boolean>(false);
  const [showNerdInfoModal, setShowNerdInfoModal] = useState<boolean>(false);
  const [isAddingChannel, setIsAddingChannel] = useState<boolean>(false);
  const [newChannelName, setNewChannelName] = useState<string>('');
  const [autoCleanup, setAutoCleanup] = useState<boolean>(false);
  
  // Filtering and Sorting States
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    status: 'all',
    priority: 'all',
    category: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // ---------------------------------------------------------------------------
  // Memoized Search, Filter, and Sort engine
  // ---------------------------------------------------------------------------
  const processedTasks = useMemo(() => {
    let result = [...tasks];

    // 1. Query Search Match (ignores casings)
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        item => 
          item.title.toLowerCase().includes(q) || 
          item.description.toLowerCase().includes(q)
      );
    }

    // 2. Status Match Filter
    if (filters.status === 'active') {
      result = result.filter(item => !item.completed);
    } else if (filters.status === 'completed') {
      result = result.filter(item => item.completed);
    }

    // 3. Priority Match Filter
    if (filters.priority !== 'all') {
      result = result.filter(item => item.priority === filters.priority);
    }

    // 4. Label/Category Match Filter
    if (filters.category !== 'all') {
      result = result.filter(item => item.category === filters.category);
    }

    // 5. Sorting engine
    result.sort((a, b) => {
      let valA: any = a[filters.sortBy];
      let valB: any = b[filters.sortBy];

      // Handle priorities as numbers for logical weights
      if (filters.sortBy === 'priority') {
        const orderWeight = { low: 1, medium: 2, high: 3 };
        valA = orderWeight[a.priority] || 2;
        valB = orderWeight[b.priority] || 2;
      }

      // Handle empty due dates pushed to last
      if (filters.sortBy === 'dueDate') {
        if (!valA) return 1;
        if (!valB) return -1;
      }

      if (valA < valB) return filters.sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [tasks, filters]);

  // UI notifications/Status toasts
  const [notification, setNotification] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Helper popup documentation sheet toggle
  const [showDocDrawer, setShowDocDrawer] = useState(false);

  // Responsive sidebar toggler State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Active workspace active visual tab
  const [activeTab, setActiveTab] = useState<'tasks' | 'insights' | 'settings'>('tasks');
  
  // Element ref for hidden file uploader
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------------------------------------------------------------------------
  // Initial Boot mounting & Error Catching
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // 1. Initial State Load from Browser Cache
    let loadedTasks = loadTasksFromCache();
    const loadedCategories = loadCategoriesFromCache();
    const savedNerd = localStorage.getItem('nordic_todo_nerd_mode') === 'true';

    const savedAutoCleanup = localStorage.getItem('fokus_auto_cleanup') === 'true';
    setAutoCleanup(savedAutoCleanup);

    // Efficiency Tip: Clean up old completed tasks (> 24 hours)
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    let hasCleanedUp = false;
    if (savedAutoCleanup) {
      loadedTasks = loadedTasks.filter(task => {
        if (task.completed && task.completedAt) {
          const completedTime = new Date(task.completedAt).getTime();
          if (now - completedTime > ONE_DAY_MS) {
            hasCleanedUp = true;
            return false; // Remove task
          }
        }
        return true; // Keep task
      });
    }

    if (hasCleanedUp) {
       saveTasksToCache(loadedTasks);
    }

    setTasks(loadedTasks);
    setCategories(loadedCategories);
    setIsNerdMode(savedNerd);

    // Set interval to periodically evaluate and clean up tasks over 24h
    const cleanupInterval = setInterval(() => {
       setTasks((currentTasks) => {
          const currentTime = Date.now();
          let cleaned = false;
          const nextTasks = currentTasks.filter(task => {
             if (task.completed && task.completedAt) {
               if (currentTime - new Date(task.completedAt).getTime() > ONE_DAY_MS) {
                 cleaned = true;
                 return false;
               }
             }
             return true;
          });
          if (cleaned) {
             saveTasksToCache(nextTasks);
             return nextTasks;
          }
          return currentTasks;
       });
    }, 60000); // Check every minute

    // Apply color values class list to body tag
    document.documentElement.classList.add('dark');

    // Capture unhandled errors/promises to display gracefully in the app (UI Error Boundary)
    const handleGlobalError = (event: ErrorEvent) => {
      triggerNotification(`System Error: ${event.message}`, 'error');
    };
    const handleGlobalRejection = (event: PromiseRejectionEvent) => {
      triggerNotification(`Async Error: ${event.reason}`, 'error');
    };
    
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleGlobalRejection);

    return () => {
      clearInterval(cleanupInterval);
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleGlobalRejection);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Nerd Mode History popstate (Android back button) & ESC Key listeners
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isNerdMode) {
      // Create a history entry to lock Android back navigation
      window.history.pushState({ isNerd: true }, '');

      const handlePopState = () => {
        setIsNerdMode(false);
        localStorage.setItem('nordic_todo_nerd_mode', 'false');
        triggerNotification('Deactivated Nerd Mode', 'info');
      };

      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isNerdMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isNerdMode) {
        setIsNerdMode(false);
        localStorage.setItem('nordic_todo_nerd_mode', 'false');
        triggerNotification('Deactivated Nerd Mode', 'info');
        if (window.history.state?.isNerd) {
          window.history.back();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNerdMode]);



  // ---------------------------------------------------------------------------
  // Alert Notifications Toast management
  // ---------------------------------------------------------------------------
  const triggerNotification = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ text, type });
    // Automatically close toast after 4s
    setTimeout(() => {
      setNotification(prev => prev?.text === text ? null : prev);
    }, 4000);
  };

  // ---------------------------------------------------------------------------
  // Mutation Handlers (PROGRAMMATIC STATE API ENDPOINTS)
  // ---------------------------------------------------------------------------


  /**
   * Appends a newly created task to the cached list.
   */
  const handleAddTask = (taskData: {
    title: string;
    description: string;
    priority: Priority;
    category: string;
    dueDate: string;
  }) => {
    const newTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: taskData.title,
      description: taskData.description,
      completed: false,
      priority: taskData.priority,
      category: taskData.category,
      dueDate: taskData.dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    saveTasksToCache(updatedTasks);

    triggerNotification(`Created task: "${newTask.title}"`);
  };

  /**
   * Toggles completion status of a target task.
   */
  const handleToggleComplete = (id: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        const nextStatus = !task.completed;
        return { 
          ...task, 
          completed: nextStatus,
          updatedAt: new Date().toISOString(),
          completedAt: nextStatus ? new Date().toISOString() : undefined
        };
      }
      return task;
    });

    setTasks(updatedTasks);
    saveTasksToCache(updatedTasks);

    const updatedTask = updatedTasks.find(t => t.id === id);
    if (updatedTask) {
      if (updatedTask.completed) {
        triggerNotification(`Task "${updatedTask.title}" marked completed.`);
      } else {
        triggerNotification(`Reopened task "${updatedTask.title}".`, 'info');
      }
    }
  };

  /**
   * Deletes a task from the active state.
   */
  const handleDeleteTask = (id: string) => {
    const targetTask = tasks.find(t => t.id === id);
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
    saveTasksToCache(updatedTasks);

    if (targetTask) {
      triggerNotification(`Removed task "${targetTask.title}".`, 'info');
    }
  };

  /**
   * Modifies specific keys of an existing task item.
   */
  const handleEditTask = (id: string, updatedFields: Partial<Task>) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === id) {
        return {
          ...task,
          ...updatedFields,
          updatedAt: new Date().toISOString()
        };
      }
      return task;
    });

    setTasks(updatedTasks);
    saveTasksToCache(updatedTasks);
    

    
    triggerNotification(`Updated task details successfully.`);
  };

  /**
   * Adds custom category tags to filters dynamically.
   */
  const handleAddCategory = (categoryName: string) => {
    const sanitizedName = categoryName.trim();
    if (!sanitizedName || categories.includes(sanitizedName)) return;

    const updatedCategories = [...categories, sanitizedName];
    setCategories(updatedCategories);
    saveCategoriesToCache(updatedCategories);
    triggerNotification(`Created visual list label: "${sanitizedName}"`);
  };

  /**
   * Resets entire cache back to clean slate placeholder state.
   */
  const handleResetApplication = async () => {
    if (window.confirm('Are you holding complete certainty? This wipes all client tasks and resets layouts.')) {

      setTasks([]);
      saveTasksToCache([]);
      triggerNotification('Clean slate initialized. Local browser cache cleared.', 'info');
    }
  };

  /**
   * Clears out all finished visual tasks quickly.
   */
  const handleClearCompleted = async () => {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
      triggerNotification('No finished tasks found.', 'info');
      return;
    }

    if (window.confirm(`Clear all ${completedCount} finished tasks?`)) {
      const activeOnly = tasks.filter(t => !t.completed);
      

      
      setTasks(activeOnly);
      saveTasksToCache(activeOnly);
      triggerNotification(`Successfully cleared ${completedCount} completed items.`, 'success');
    }
  };

  // ---------------------------------------------------------------------------
  // File Transfer Pipeline (JSON Export/Import APIs)
  // ---------------------------------------------------------------------------
  
  /**
   * Triggers download of currently loaded state as JSON
   */
  const handleExportBackup = () => {
    if (tasks.length === 0) {
      triggerNotification('The todo list is empty. Add tasks before exporting.', 'info');
      return;
    }
    triggerBackupDownload(tasks, categories);
    triggerNotification('Backup exported successfully. Download initiated.');
  };

  /**
   * Processes the JSON backup string imported by user file upload
   */
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const text = e.target?.result;
          if (typeof text !== 'string') throw new Error('File reading error: Data is not text.');

          const rawJson = JSON.parse(text);
          const validatedPackage = validateAndParseBackup(rawJson);

          // Commit validated state
          setTasks(validatedPackage.tasks);
          setCategories(validatedPackage.categories);
          saveTasksToCache(validatedPackage.tasks);
          saveCategoriesToCache(validatedPackage.categories);

          triggerNotification(
            `Import success! Loaded ${validatedPackage.tasks.length} tasks and ${validatedPackage.categories.length} category labels.`,
            'success'
          );
        } catch (err: any) {
          console.error(err);
          triggerNotification(`Import failed: ${err.message || 'Malformed JSON content.'}`, 'error');
        } finally {
          // Reset file selection path so import can re-run for same filename
          if (fileInputRef.current) fileInputRef.current.value = '';
          event.target.value = '';
        }
      };

      reader.onerror = () => {
        triggerNotification('File reading failed. The file structure might be inaccessible.', 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        event.target.value = '';
      };

      reader.readAsText(file);
    } catch (err: any) {
      console.error('Import initialization error:', err);
      triggerNotification(`Import initiation failed: ${err.message}`, 'error');
    }
  };



  // ---------------------------------------------------------------------------
  // Interface Presentation Render
  // ---------------------------------------------------------------------------
  if (isNerdMode) {
    return (
      <div className="h-screen w-screen bg-[#111318] text-[#93c5fd] font-mono p-4 md:p-6 flex flex-col gap-5 md:gap-6 select-none overflow-hidden select-none">
        {/* Dynamic Terminal Status Header */}
        <div className="flex items-center justify-between border-b border-[#242b35] pb-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="text-[#a3be8c] animate-pulse">●</span>
            <span className="font-bold flex items-center gap-1"><Terminal size={14} className="opacity-70" /> NERD_MODE // SKELETON_SHELL_ACTIVE</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">{processedTasks.length} NODE(S)</span>
            <button 
              onClick={() => {
                setIsNerdMode(false);
                localStorage.setItem('nordic_todo_nerd_mode', 'false');
                triggerNotification('Deactivated Nerd Mode', 'info');
                if (window.history.state?.isNerd) {
                  window.history.back();
                }
              }}
              className="text-[#88c0d0] hover:underline hover:text-[#88c0d0]/80 cursor-pointer font-bold shrink-0 bg-[#88c0d0]/10 px-2.5 py-0.5 rounded"
            >
              [exit: ESC]
            </button>
          </div>
        </div>

        {/* Main minimal form editor prompt */}
        <div className="w-full shrink-0">
          <TaskForm 
            categories={categories} 
            onAddTask={handleAddTask}
            onAddCategory={handleAddCategory}
            isNerdMode={true}
          />
        </div>

        {/* Barebone Terminal Task List scroll container */}
        <div className="flex-grow overflow-y-auto scrollbar-none divide-y divide-[#3b4252]/10">
          {processedTasks.length > 0 ? (
            processedTasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                categories={categories}
                onToggleComplete={handleToggleComplete}
                onDeleteTask={handleDeleteTask}
                onEditTask={handleEditTask}
                isNerdMode={true}
              />
            ))
          ) : (
            <div className="text-slate-600 text-xs py-10 text-center font-mono">
              [No active nodes. Type task above and hit Enter]
            </div>
          )}
        </div>

        {/* Terminal footer help guide */}
        <div className="text-[10px] text-slate-600 flex items-center justify-between border-t border-[#242b35] pt-3 shrink-0">
          <span>$ help: [x]/[ ] to check, [e] to edit, [d] to delete</span>
          <button 
            type="button"
            className="text-[#88c0d0] hover:underline cursor-pointer bg-transparent border-none text-[10px] uppercase font-bold" 
            onClick={() => setShowNerdInfoModal(true)}
          >
            [man nerd_mode]
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen flex flex-row overflow-hidden transition-all duration-300 bg-[#1e222b] text-[#d8dee9] font-sans antialiased selection:bg-[#434c5e]`}>
      
      {/* Backdrop when sidebar is active */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 cursor-pointer animate-fade-in"
        />
      )}

      {/* Elegant Nordic Left Sidebar Panel - Collapsible drawer on all devices */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-[#2e3440] text-[#eceff4] flex flex-col p-4.5 space-y-4.5 shrink-0 border-r border-[#4c566a]/15 shadow-2xl z-40 transition-transform duration-300 transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } select-none`}>
        
        {/* Sidebar Header Brand Identity */}
        <div className="flex flex-col gap-1.5 pb-2.5 border-b border-[#434c5e]/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-r from-[#81a1c1] to-[#88c0d0] text-[#2e3440] shadow-md">
                <ListTodo size={18} strokeWidth={2.5} />
              </div>
              <h1 className="text-lg font-bold font-sans tracking-tight text-[#88c0d0]">Fokus</h1>
            </div>
            {/* Close button */}
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded hover:bg-[#3b4252] text-[#d8dee9]/60 hover:text-[#eceff4] cursor-pointer"
              title="Close Navigation"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-[10px] text-[#d8dee9]/50 uppercase tracking-widest font-mono mt-1">
            Minimalist Task Engine
          </p>
        </div>

        {/* Quick Click Focus Channel Labels */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#81a1c1]">Focus Channels</span>
          <div className="flex flex-col gap-1 overflow-y-auto max-h-[220px] pr-1 scrollbar-thin">
            <button
              onClick={() => {
                setFilters(prev => ({ ...prev, category: 'all' }));
                setIsSidebarOpen(false);
              }}
              className={`w-full text-left font-sans text-xs px-3 py-2 rounded-lg flex items-center justify-between transition-all cursor-pointer ${
                filters.category === 'all'
                  ? 'bg-[#434c5e] text-[#eceff4] font-semibold border-l-2 border-[#88c0d0]'
                  : 'text-[#d8dee9]/75 hover:bg-[#3b4252] hover:text-[#eceff4]'
              }`}
            >
              <span className="flex items-center gap-2"><Folder size={14} className="opacity-70" /> All Channels</span>
              <span className="text-[10px] bg-[#2e3440]/80 text-[#eceff4]/65 px-2 py-0.5 rounded-md font-mono">
                {tasks.length}
              </span>
            </button>
            {categories.map(c => {
              const count = tasks.filter(t => t.category === c).length;
              return (
                <button
                  key={c}
                  onClick={() => {
                    setFilters(prev => ({ ...prev, category: c }));
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full text-left font-sans text-xs px-3 py-2 rounded-lg flex items-center justify-between transition-all cursor-pointer ${
                    filters.category === c
                      ? 'bg-[#434c5e] text-[#eceff4] font-semibold border-l-2 border-[#88c0d0]'
                      : 'text-[#d8dee9]/75 hover:bg-[#3b4252] hover:text-[#eceff4]'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate text-ellipsis"><Tag size={13} className="opacity-70" /> {c}</span>
                  <span className="text-[10px] bg-[#2e3440]/80 text-[#eceff4]/65 px-2 py-0.5 rounded-md font-mono">
                    {count}
                  </span>
                </button>
              );
            })}
            
            {isAddingChannel ? (
              <div className="px-3 py-2 rounded-lg bg-[#3b4252] flex flex-col gap-2 mt-1">
                <input
                  type="text"
                  autoFocus
                  placeholder="Folder name..."
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCategory(newChannelName);
                      setIsAddingChannel(false);
                      setNewChannelName('');
                    } else if (e.key === 'Escape') {
                      setIsAddingChannel(false);
                      setNewChannelName('');
                    }
                  }}
                  className="w-full bg-[#2e3440] text-[#eceff4] text-xs px-2 py-1.5 rounded outline-none border border-[#4c566a] focus:border-[#88c0d0]"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      handleAddCategory(newChannelName);
                      setIsAddingChannel(false);
                      setNewChannelName('');
                    }}
                    className="flex-1 text-[10px] bg-[#88c0d0] text-[#2e3440] font-semibold py-1 rounded cursor-pointer hover:bg-[#81a1c1]"
                  >
                    Add
                  </button>
                  <button 
                    onClick={() => {
                      setIsAddingChannel(false);
                      setNewChannelName('');
                    }}
                    className="flex-1 text-[10px] bg-[#4c566a] text-[#eceff4] py-1 rounded cursor-pointer hover:bg-[#434c5e]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingChannel(true)}
                className="w-full text-left font-sans text-xs px-3 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer text-[#d8dee9]/75 hover:bg-[#3b4252] hover:text-[#eceff4] mt-1 border border-dashed border-[#4c566a]/50 hover:border-[#88c0d0]/50"
              >
                <Plus size={14} className="opacity-70" />
                <span>Add Folder</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Blocks: Quick Import & Exports */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#81a1c1]">Data Backup</span>
          <div className="grid grid-cols-2 gap-2 text-center">
            <button
              onClick={handleExportBackup}
              className="bg-[#434c5e] hover:bg-[#434c5e]/80 text-[10px] font-mono tracking-wider font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-[#d8dee9] hover:text-[#eceff4]"
              title="Download JSON back-up file"
            >
              <Download size={12} /> EXPORT
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#434c5e] hover:bg-[#434c5e]/80 text-[10px] font-mono tracking-wider font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-[#d8dee9] hover:text-[#eceff4]"
              title="Select local tasks.json to load"
            >
              <Upload size={12} /> IMPORT
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportBackup}
            className="hidden"
          />
        </div>

        {/* Sidebar Footer area */}
        <div className="mt-auto space-y-4 pt-4 border-t border-[#434c5e]/30">
          
          {/* Completion Progress Bar */}
          <div>
            <div className="flex justify-between text-[11px] mb-1.5 font-mono">
              <span className="text-[#d8dee9]/60 uppercase tracking-widest text-[9px] font-semibold">Active completion</span>
              <span className="text-[#88c0d0] font-bold">
                {tasks.filter(t => t.completed).length}/{tasks.length}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#4c566a]/60 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#81a1c1] to-[#88c0d0] transition-all duration-500" 
                style={{ width: `${tasks.length > 0 ? Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* Micro Status Indicators */}
          <div className="p-3 rounded-lg bg-[#3b4252] border border-[#434c5e]/30 flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#d8dee9]/60">Engine Cache</span>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a3be8c] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#a3be8c]"></span>
              </span>
              <span className="text-[10px] font-mono font-medium text-[#eceff4]">Persistent</span>
            </div>
          </div>

          {/* Access schematics drawer & toggle */}
          <div className="flex items-center justify-between text-[10px] font-mono text-[#d8dee9]/60">
            <button
              onClick={() => setShowDocDrawer(true)}
              className="hover:text-[#88c0d0] flex items-center gap-1 transition-colors cursor-pointer text-[10px] font-semibold"
            >
              <BookOpen size={14} className="opacity-70" /> SYSTEM SHEMAS
            </button>
          </div>

        </div>

      </aside>

      {/* Main Focus Workspace Client Content */}
      <main className="flex-1 flex flex-col overflow-hidden max-w-full">
        
        {/* Workspace Dynamic Header Ribbon */}
        <header className="px-4 py-3 md:px-8 md:py-4 flex items-center justify-between border-b border-slate-100 dark:border-[#4c566a]/15 shrink-0 bg-white dark:bg-[#1e222b]">
          <div className="flex items-center gap-3">
            {/* Hamburger menu button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg border border-slate-200 dark:border-[#4c566a]/40 text-slate-500 hover:text-slate-800 dark:text-[#d8dee9]/75 dark:hover:text-white transition-colors cursor-pointer"
              title="Open Navigation"
            >
              <Menu size={16} />
            </button>
            <div className="space-y-0.5">
              <p className="text-[10px] md:text-xs font-mono font-bold tracking-wider uppercase text-[#5e81ac] dark:text-[#88c0d0]">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-800 dark:text-[#eceff4] flex items-center gap-2">
                {filters.category === 'all' ? "Today's Focus" : `${filters.category} Channel`}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Nerd Mode Toggle */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#2e3440]/50 p-1 rounded-xl border border-slate-100 dark:border-[#4c566a]/15 select-none">
              <button
                onClick={() => {
                  const nextNerd = !isNerdMode;
                  setIsNerdMode(nextNerd);
                  localStorage.setItem('nordic_todo_nerd_mode', String(nextNerd));
                  triggerNotification(`Nerd Mode ${nextNerd ? 'Activated (Terminal View)' : 'Deactivated'}`, nextNerd ? 'success' : 'info');
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wider font-mono transition-all uppercase cursor-pointer ${
                  isNerdMode
                    ? 'bg-[#88c0d0] text-[#2c323c] font-black shadow-xs'
                    : 'text-slate-400 hover:text-slate-800 dark:text-[#d8dee9]/50 dark:hover:text-white'
                }`}
                title="Toggle Nerd Mode (Barebone terminal list)"
              >
                <div className="flex items-center gap-1">
                  <Terminal size={14} className="opacity-70" />
                  <span>nerd_mode</span>
                </div>
              </button>
              <button
                onClick={() => setShowNerdInfoModal(true)}
                className="p-1 hover:text-[#88c0d0] text-slate-400 dark:text-[#d8dee9]/40 transition-colors cursor-pointer"
                title="What is Nerd Mode?"
              >
                <HelpCircle size={12} />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Navigation Tabs section */}
        <div className="px-4 py-2 md:px-8 border-b border-slate-100 dark:border-[#4c566a]/15 flex items-center justify-start bg-white/30 dark:bg-[#1e222b]/25 shrink-0 select-none">
          <div className="flex gap-1 bg-slate-100/50 dark:bg-[#2e3440]/40 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'tasks'
                  ? 'bg-white dark:bg-[#3b4252] text-[#2e3440] dark:text-[#eceff4] shadow-xs'
                  : 'text-slate-400 dark:text-[#d8dee9]/50 hover:text-slate-850 dark:hover:text-[#eceff4]'
              }`}
            >
              <ListTodo size={13} className="shrink-0" />
              <span>Workspace</span>
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'insights'
                  ? 'bg-white dark:bg-[#3b4252] text-[#2e3440] dark:text-[#eceff4] shadow-xs'
                  : 'text-slate-400 dark:text-[#d8dee9]/50 hover:text-slate-850 dark:hover:text-[#eceff4]'
              }`}
            >
              <BarChart3 size={13} className="shrink-0" />
              <span>Insights</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-[#3b4252] text-[#2e3440] dark:text-[#eceff4] shadow-xs'
                  : 'text-slate-400 dark:text-[#d8dee9]/50 hover:text-slate-850 dark:hover:text-[#eceff4]'
              }`}
            >
              <Settings size={13} className="shrink-0" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* Workspace Subscroll Body Area */}
        <div className="flex-grow overflow-y-auto px-4 py-4 md:px-8 md:py-5 scrollbar-thin">
          <div className="w-full max-w-4xl mx-auto flex flex-col gap-5 pb-10 min-h-full">
          
          {activeTab === 'tasks' && (
            <>
              {/* Modular Task Form Editor Panel */}
              <div className={isNerdMode ? "p-0 bg-transparent border-none shrink-0" : "p-4 bg-white dark:bg-[#2e3440]/30 border border-slate-100 dark:border-[#4c566a]/20 rounded-2xl shadow-xs"}>
                <TaskForm 
                  categories={categories} 
                  onAddTask={handleAddTask}
                  onAddCategory={handleAddCategory}
                  isNerdMode={isNerdMode}
                />
              </div>

              {/* Ultra minimal active filter selector strip */}
              <div className="flex items-center justify-between pb-1 select-none">
                <div className="flex gap-1">
                  {(['all', 'active', 'completed'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilters(prev => ({ ...prev, status: st }))}
                      className={`text-[10px] uppercase tracking-wider font-mono px-3 py-1 rounded-full transition-colors cursor-pointer ${
                        filters.status === st
                          ? 'bg-[#81a1c1]/25 text-[#5e81ac] dark:text-[#88c0d0] font-bold'
                          : 'text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-[#eceff4]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 select-none">
                  <div className="text-[10px] font-mono text-slate-400">
                    {processedTasks.length} task{processedTasks.length === 1 ? '' : 's'}
                  </div>
                </div>
              </div>

              {/* Active Interactive Task Board Grid List */}
              <section className="w-full flex flex-col gap-2.5 pb-2">
                <AnimatePresence>
                  {processedTasks.length > 0 ? (
                    processedTasks.map(task => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <TaskRow
                          task={task}
                          categories={categories}
                          onToggleComplete={handleToggleComplete}
                          onDeleteTask={handleDeleteTask}
                          onEditTask={handleEditTask}
                          isNerdMode={isNerdMode}
                        />
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="w-full flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200/50 dark:border-[#4c566a]/20 rounded-2xl bg-[#eceff4]/30 dark:bg-[#2e3440]/10"
                    >
                      <div className="text-slate-400/60 dark:text-[#d8dee9]/20 mb-3.5">
                        <FileCheck2 size={36} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-[#d8dee9]/80 font-sans">No tasks found matching criteria</h3>
                      <p className="text-xs text-slate-400 mt-1 font-sans text-center max-w-sm">
                        No items match the active channels or attributes. Try adding a new focus item or adjusting sorting values.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>
            </>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6">
              {/* Completion Metrics Panels */}
              <StatPanel tasks={tasks} activeCategory={filters.category} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-white dark:bg-[#2e3440]/30 border border-slate-100 dark:border-[#4c566a]/20 rounded-2xl">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-[#eceff4] mb-3">Focus Channels Insights</h3>
                  <div className="space-y-3 flex-col flex">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Total Active Channels</span>
                      <span className="font-semibold text-[#88c0d0]">{categories.length}</span>
                    </div>
                    {categories.map(c => {
                      const list = tasks.filter(t => t.category === c);
                      const done = list.filter(t => t.completed).length;
                      const percent = list.length ? Math.round((done / list.length) * 100) : 0;
                      return (
                        <div key={c} className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400 flex flex-row items-center gap-1"><Tag size={12} className="opacity-70" /> {c}</span>
                            <span className="text-slate-500 font-mono">{done}/{list.length} ({percent}%)</span>
                          </div>
                          <div className="w-full h-1 bg-slate-100 dark:bg-[#3b4252]/40 rounded-full overflow-hidden">
                            <div className="h-full bg-[#88c0d0]" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-5 bg-white dark:bg-[#2e3440]/30 border border-slate-100 dark:border-[#4c566a]/20 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-[#eceff4] mb-3">Priority Distribution</h3>
                    <div className="space-y-2">
                      {['high', 'medium', 'low'].map(p => {
                        const count = tasks.filter(t => t.priority === p && !t.completed).length;
                        const colors = {
                          high: 'bg-[#bf616a]/20 text-[#bf616a]',
                          medium: 'bg-[#ebcb8b]/20 text-[#ebcb8b]',
                          low: 'bg-[#a3be8c]/20 text-[#a3be8c]'
                        };
                        return (
                          <div key={p} className="flex justify-between items-center text-xs">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold ${colors[p as Priority]}`}>{p} urgency</span>
                            <span className="font-mono text-slate-500">{count} active</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-[#4c566a]/15 text-[11px] text-slate-400 font-mono leading-normal flex items-start gap-2">
                    <Lightbulb size={16} className="opacity-70 mt-0.5 shrink-0" />
                    <span>Focus on High urgency items on your daily Focus panel first to build sustainable output momentum.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-4xl mx-auto w-full pb-10">
              <div className="flex flex-col gap-1 mb-2">
                <h2 className="text-lg font-bold text-slate-800 dark:text-[#eceff4] flex items-center gap-2">
                  <Settings size={18} className="text-[#88c0d0]" /> System Settings
                </h2>
                <p className="text-xs text-slate-500 dark:text-[#d8dee9]/60">Manage your engine preferences and backup data.</p>
              </div>

              {/* Data Management Panel */}
              <section className="flex flex-col gap-4 font-sans p-5 bg-white dark:bg-[#2e3440]/30 border border-slate-100 dark:border-[#4c566a]/20 rounded-2xl">
                <h3 className="text-sm font-bold text-slate-800 dark:text-[#eceff4] flex items-center gap-1.5 border-b border-slate-100 dark:border-[#4c566a]/20 pb-3">
                  <FileText size={14} className="text-[#88c0d0]" /> Data Management
                </h3>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExportBackup}
                    className="flex-1 min-w-[140px] text-xs font-semibold py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-[#3b4252] dark:hover:bg-[#434c5e] text-slate-700 dark:text-[#eceff4] transition-colors border border-slate-200 dark:border-[#4c566a]/40 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download size={14} /> Export Backup
                  </button>
                  <label className="flex-1 min-w-[140px] text-xs font-semibold py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-[#3b4252] dark:hover:bg-[#434c5e] text-slate-700 dark:text-[#eceff4] transition-colors border border-slate-200 dark:border-[#4c566a]/40 flex items-center justify-center gap-2 cursor-pointer">
                    <Upload size={14} /> Import Data
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleImportBackup}
                    />
                  </label>
                </div>
              </section>

              {/* Maintenance & Engine Panel */}
              <section className="flex flex-col gap-4 font-sans p-5 bg-white dark:bg-[#2e3440]/30 border border-slate-100 dark:border-[#4c566a]/20 rounded-2xl">
                <h3 className="text-sm font-bold text-slate-800 dark:text-[#eceff4] flex items-center gap-1.5 border-b border-slate-100 dark:border-[#4c566a]/20 pb-3">
                  <RotateCcw size={14} className="text-[#88c0d0]" /> Engine Maintenance
                </h3>

                <div className="flex items-center justify-between py-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-[#eceff4]">Auto-Cleanup (24h)</span>
                    <span className="text-xs text-slate-500 dark:text-[#d8dee9]/60">Automatically remove tasks 24 hours after completion.</span>
                  </div>
                  <button 
                    onClick={() => {
                      const next = !autoCleanup;
                      setAutoCleanup(next);
                      localStorage.setItem('fokus_auto_cleanup', String(next));
                      triggerNotification(`Auto-cleanup is now ${next ? 'enabled' : 'disabled'}`, 'info');
                    }}
                    className="text-[#88c0d0] hover:text-[#81a1c1] transition-colors cursor-pointer"
                  >
                    {autoCleanup ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-slate-400" />}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-[#4c566a]/20">
                  <button
                    onClick={handleClearCompleted}
                    className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-[#bf616a]/10 dark:hover:bg-[#bf616a]/20 text-orange-700 dark:text-[#bf616a] transition-colors border border-orange-200 dark:border-[#bf616a]/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 size={14} /> Clear Completed Now
                  </button>
                  <button
                    onClick={handleResetApplication}
                    className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-700 dark:text-red-400 transition-colors border border-red-200 dark:border-red-900/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw size={14} /> Factory Reset Database
                  </button>
                </div>
              </section>

              {/* Display & Appearance Panel */}
              <section className="flex flex-col gap-4 font-sans p-5 bg-white dark:bg-[#2e3440]/30 border border-slate-100 dark:border-[#4c566a]/20 rounded-2xl">
                <h3 className="text-sm font-bold text-slate-800 dark:text-[#eceff4] flex items-center gap-1.5 border-b border-slate-100 dark:border-[#4c566a]/20 pb-3">
                  <Sun size={14} className="text-[#88c0d0]" /> Appearance & Interface
                </h3>

                <div className="flex items-center justify-between py-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-[#eceff4]">Nerd Mode</span>
                    <span className="text-xs text-slate-500 dark:text-[#d8dee9]/60">Render input fields as dynamic UNIX prompts and structural UI.</span>
                  </div>
                  <button 
                    onClick={() => {
                      const next = !isNerdMode;
                      setIsNerdMode(next);
                      localStorage.setItem('nordic_todo_nerd_mode', String(next));
                    }}
                    className="text-[#88c0d0] hover:text-[#81a1c1] transition-colors cursor-pointer"
                  >
                    {isNerdMode ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-slate-400" />}
                  </button>
                </div>
              </section>

            </div>
          )}

          {/* Workspace Footer branding caption */}
          <footer className="mt-8 pt-5 border-t border-slate-100 dark:border-[#4c566a]/15 flex items-center justify-between text-[11px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
            <span>Fokus Workspace</span>
            <span>Local Cache Active</span>
          </footer>

          </div>
        </div>
      </main>



      {/* Slide-over System Documents Schema Drawer */}
      <AnimatePresence>
        {showDocDrawer && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDocDrawer(false)}
              className="fixed inset-0 bg-black z-45 cursor-pointer"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white dark:bg-[#2e3440] border-l border-slate-200 dark:border-[#4c566a]/30 p-6 z-50 overflow-y-auto shadow-2xl flex flex-col gap-4 text-slate-600 dark:text-[#d8dee9]"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#4c566a]/30 pb-3.5">
                <div className="flex items-center gap-1.5 text-slate-800 dark:text-[#eceff4]">
                  <BookOpen size={16} />
                  <h2 className="font-sans font-bold text-sm">System Schematics & JSON Standard</h2>
                </div>
                <button 
                  onClick={() => setShowDocDrawer(false)}
                  className="p-1 px-1.5 hover:bg-slate-100 dark:hover:bg-[#4c566a]/30 rounded-lg text-slate-450 hover:text-slate-750 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="flex flex-col gap-4 text-xs font-sans leading-relaxed">
                
                <div>
                  <h3 className="font-bold text-xs text-slate-850 dark:text-[#88c0d0] mb-1">1. ARCHITECTURAL PATTERN</h3>
                  <p>
                    Runs completely as an <strong>Offline-First client-led system</strong> utilizing synchronous cache writes directly onto your device. Standard browser variables are persistent.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-xs text-slate-850 dark:text-[#88c0d0] mb-1">2. PROGRAMMATIC DATA API</h3>
                  <p className="mb-2">Mutator methods automatically serialize data keys on standard runtime events:</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] font-mono text-slate-600 dark:text-[#eceff4]/80">
                    <li><strong className="text-[#5e81ac] dark:text-[#81a1c1]">loadTasksFromCache()</strong> - Loads cached list from index arrays.</li>
                    <li><strong className="text-[#5e81ac] dark:text-[#81a1c1]">saveTasksToCache(tasks)</strong> - Serializes list to disk safely.</li>
                    <li><strong className="text-[#5e81ac] dark:text-[#81a1c1]">loadCategoriesFromCache()</strong> - Retrieves labels directory strings.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-xs text-slate-850 dark:text-[#88c0d0] mb-1">3. BACKUP PAYLOAD FORMAT (.json)</h3>
                  <pre className="p-3 rounded-xl bg-slate-50 dark:bg-[#3b4252]/40 text-[10px] font-mono leading-tight border border-slate-100 dark:border-[#4c566a]/15 text-[#a3be8c] overflow-x-auto select-all">
{`{
  "source": "nordic_todo_app",
  "exportedAt": "2026-05-21T20:37:51Z",
  "version": 1,
  "categories": ["Inbox", "Work", "Personal"],
  "tasks": [
    {
      "id": "task_170020102003",
      "title": "Build real code features",
      "description": "Ensure responsive layout flexbox",
      "completed": false,
      "priority": "high",
      "category": "Work",
      "dueDate": "2026-05-25",
      "createdAt": "2026-05-21T12:00:00Z",
      "updatedAt": "2026-05-21T12:00:00Z"
    }
  ]
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-bold text-xs text-slate-800 dark:text-[#8fbcbb] mb-1 font-sans">4. SYSTEM PALETTE</h3>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-left font-mono">
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#2e3440]" /> #2E3440 (Polar Night)</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#3b4252]" /> #3B4252 (Polar Slate)</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#eceff4]" /> #ECEFF4 (Storm White)</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#88c0d0]" /> #88C0D0 (Frost Blue)</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#a3be8c]" /> #A3BE8C (Aurora Green)</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-[#bf616a]" /> #BF616A (Aurora Red)</div>
                  </div>
                </div>

              </div>

              <div className="mt-auto border-t border-slate-100 dark:border-[#4c566a]/20 pt-4 flex">
                <button
                  type="button"
                  onClick={() => setShowDocDrawer(false)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-[#3b4252] dark:hover:bg-[#4c566a] text-slate-700 dark:text-[#eceff4] text-xs font-semibold rounded-lg transition-colors cursor-pointer text-center"
                >
                  Dismiss Schematic Panel
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Nerd Mode Explanation Modal */}
      <AnimatePresence>
        {showNerdInfoModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNerdInfoModal(false)}
              className="fixed inset-0 bg-black z-45 cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 mx-auto max-w-md bg-[#1e222b] border border-[#3b4252] p-6 rounded-xl shadow-2xl z-50 font-mono text-xs text-[#d8dee9] flex flex-col gap-4"
            >
              <div className="flex items-center justify-between border-b border-[#3b4252] pb-3 select-none">
                <span className="text-[#88c0d0] font-bold flex items-center gap-2"><Terminal size={16} /> SYSTEM_MANUAL: nerd_mode</span>
                <button
                  onClick={() => setShowNerdInfoModal(false)}
                  className="p-1 hover:text-white rounded cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="space-y-3 leading-relaxed">
                <p>
                  <strong className="text-[#eceff4]">Nerd Mode</strong> is an ultra-minimal, high-efficiency barebone view designed for developers and keyboard-centric power users.
                </p>
                <div className="bg-[#1b1f27] p-2.5 rounded border border-[#3b4252] space-y-1.5 text-[11px] text-[#a3be8c]">
                  <div>• Disables all cosmetic layout decorations and cards</div>
                  <div>• Replaces lists with a raw terminal skeleton grid</div>
                  <div>• Renders input fields as dynamic UNIX prompts ($)</div>
                  <div>• Operates on raw, speed-optimized text nodes</div>
                </div>
                <p className="text-slate-500">
                  Instantly toggle tasks with simple check brackets. Use keyboard tab keys or mouse clicks to manage items in sub-millisecond execution.
                </p>
              </div>
              <button
                onClick={() => setShowNerdInfoModal(false)}
                className="w-full py-2 bg-[#3b4252] hover:bg-[#434c5e] text-white font-bold rounded transition-colors cursor-pointer text-center select-none"
              >
                DISMISS MANUAL
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating System Notification Toasts */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-5 left-5 right-5 sm:left-auto sm:right-5 z-50 self-end font-sans"
          >
            <div className={`p-4 rounded-xl flex items-center gap-3 shadow-lg border max-w-sm ${
              notification.type === 'error'
                ? 'bg-rose-50/95 dark:bg-[#2e3440] text-rose-800 dark:text-[#bf616a] border-rose-200/90 dark:border-[#bf616a]/45'
                : notification.type === 'info'
                  ? 'bg-sky-50/95 dark:bg-[#2e3440] text-sky-800 dark:text-[#88c0d0] border-sky-200/90 dark:border-[#88c0d0]/45'
                  : 'bg-emerald-50/95 dark:bg-[#2e3440] text-emerald-800 dark:text-[#a3be8c] border-emerald-200/90 dark:border-[#a3be8c]/45'
            }`}>
              <Check size={18} strokeWidth={2.5} className={notification.type === 'error' ? 'text-rose-500' : notification.type === 'info' ? 'text-sky-500' : 'text-emerald-500'} />
              <p className="text-xs font-medium leading-normal">{notification.text}</p>
              <button 
                onClick={() => setNotification(null)}
                className="ml-auto text-slate-450 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
