/**
 * @file store.ts
 * @description LocalStorage State & File Backup utility module.
 * Act as the central client-side data store API. Contains methods for saving to 
 * browser cache (localStorage), pulling stats, exporting JSON data, and validating 
 * JSON backups upon import.
 */

import { Task, TodoBackup, Priority } from './types.ts';

// -------------------------------------------------------------------------
// Storage Constants
// -------------------------------------------------------------------------
const STORAGE_KEYS = {
  TASKS: 'fokus_tasks_v2',
  CATEGORIES: 'fokus_categories_v2',
  THEME: 'fokus_theme_v2'
};

const DEFAULT_CATEGORIES: string[] = [];

// -------------------------------------------------------------------------
// Core Data Persistence API
// -------------------------------------------------------------------------

/**
 * Loads tasks from the browser local storage.
 * If the cache is empty, it returns an empty array.
 * 
 * @returns {Task[]} A list of tasks parsed from cache, or an empty array.
 */
export function loadTasksFromCache(): Task[] {
  try {
    const rawData = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!rawData) return [];
    
    const parsed = JSON.parse(rawData);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error('Error reading tasks cache:', error);
  }
  return [];
}

/**
 * Commits a list of tasks into the browser local storage cache.
 * 
 * @param {Task[]} tasks - List of current tasks to persist.
 * @returns {boolean} True if successful, false otherwise.
 */
export function saveTasksToCache(tasks: Task[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error('Error writing tasks cache:', error);
    return false;
  }
}

/**
 * Loads categories from the browser local storage or returns the default set.
 * 
 * @returns {string[]} An array of category name tags.
 */
export function loadCategoriesFromCache(): string[] {
  try {
    const rawData = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (!rawData) {
      // Initialize with default categories
      saveCategoriesToCache(DEFAULT_CATEGORIES);
      return DEFAULT_CATEGORIES;
    }
    
    const parsed = JSON.parse(rawData);
    if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
      return parsed;
    }
  } catch (error) {
    console.error('Error loading categories cache:', error);
  }
  return DEFAULT_CATEGORIES;
}

/**
 * Commits categories table back into the browser local storage cache.
 * 
 * @param {string[]} categories - Full set of custom category tags.
 * @returns {boolean} Success status of storage operation.
 */
export function saveCategoriesToCache(categories: string[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    return true;
  } catch (error) {
    console.error('Error writing categories cache:', error);
    return false;
  }
}

/**
 * Loads the user's color theme setting from cache.
 * Default is dark mode ('dark') to fit the cozy Polar Night aesthetic.
 * 
 * @returns {'dark' | 'light'} Theme identifier selected by user.
 */
export function loadThemePreference(): 'dark' | 'light' {
  try {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (theme === 'dark' || theme === 'light') {
      return theme;
    }
  } catch (e) {
    console.error('Theme reading error:', e);
  }
  return 'dark'; // Dark theme default: deep Nord cozy setup
}

/**
 * Commits the user's color theme setting back into local storage.
 * 
 * @param {'dark' | 'light'} theme - Dark or Light theme type.
 */
export function saveThemePreference(theme: 'dark' | 'light'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (e) {
    console.error('Theme saving error:', e);
  }
}

// -------------------------------------------------------------------------
// Export & Backup API
// -------------------------------------------------------------------------

/**
 * Prepares a full JSON state payload, formats it as an downloadable Attachment,
 * and initiates standard native browser download procedure.
 * 
 * @param {Task[]} tasks - Present app task state.
 * @param {string[]} categories - Custom categories.
 */
export function triggerBackupDownload(tasks: Task[], categories: string[]): void {
  const backupPayload: TodoBackup = {
    source: 'nordic_todo_app',
    exportedAt: new Date().toISOString(),
    version: 1,
    tasks,
    categories
  };

  // Convert payload to a nice, pretty-printed JSON string
  const fileContent = JSON.stringify(backupPayload, null, 2);
  const blob = new Blob([fileContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Format clean timestamped filename
  const yyyymmdd = new Date().toISOString().slice(0, 10);
  const filename = `fokus-backup-${yyyymmdd}.json`;

  const linkElement = document.createElement('a');
  linkElement.href = url;
  linkElement.download = filename;
  
  // Programmatically click elements to trigger immediate browser dialog
  document.body.appendChild(linkElement);
  linkElement.click();
  
  // Clean up references to conserve browser runtime memory
  document.body.removeChild(linkElement);
  URL.revokeObjectURL(url);
}

// -------------------------------------------------------------------------
// Import Validation API
// -------------------------------------------------------------------------

/**
 * Verifies if an imported object aligns perfectly with the standard TodoBackup schema.
 * Operates like a strict schema validation guard before storing tasks dynamically.
 * 
 * @param {any} input - Parsed JSON candidate.
 * @returns {TodoBackup} A verified TodoBackup object ready for consumption.
 * @throws {Error} Detailed error indicating where parsing or validations failed.
 */
export function validateAndParseBackup(input: any): TodoBackup {
  if (!input || typeof input !== 'object') {
    throw new Error('Import source is empty or is not a valid JSON object.');
  }

  // Validate the application fingerprint
  if (input.source !== 'nordic_todo_app') {
    throw new Error('Invalid file format: Backup source mismatch. Must be generated by Fokus App.');
  }

  // Validate tasks array
  if (!Array.isArray(input.tasks)) {
    throw new Error('Invalid schema: Missing or malformed "tasks" collection list.');
  }

  // Deep validate individual task items
  const validatedTasks: Task[] = input.tasks.map((rawTask: any, index: number) => {
    if (!rawTask || typeof rawTask !== 'object') {
      throw new Error(`Task indices [${index}] is malformed.`);
    }

    const { id, title, completed, priority, category, dueDate, description, createdAt, updatedAt } = rawTask;

    // Title is checking
    if (typeof title !== 'string' || !title.trim()) {
      throw new Error(`Task at index ${index} expects a non-empty string for 'title'.`);
    }

    // ID is checking -> generate string if not present
    const cleanId = typeof id === 'string' && id ? id : `task_${Date.now()}_${index}`;

    // Priority checks
    const validPriorities: Priority[] = ['low', 'medium', 'high'];
    const cleanPriority: Priority = validPriorities.includes(priority) ? priority : 'medium';

    return {
      id: cleanId,
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      completed: typeof completed === 'boolean' ? completed : false,
      priority: cleanPriority,
      category: typeof category === 'string' ? category.trim() : 'Inbox',
      dueDate: typeof dueDate === 'string' ? dueDate : '',
      createdAt: typeof createdAt === 'string' ? createdAt : new Date().toISOString(),
      updatedAt: typeof updatedAt === 'string' ? updatedAt : new Date().toISOString()
    };
  });

  // Category array extraction with safe fallback
  let validatedCategories = DEFAULT_CATEGORIES;
  if (Array.isArray(input.categories)) {
    const stringsOnly = input.categories
      .filter((cat: any) => typeof cat === 'string' && cat.trim())
      .map((cat: string) => cat.trim());
    if (stringsOnly.length > 0) {
      validatedCategories = Array.from(new Set(stringsOnly)); // unique tags only
    }
  }

  return {
    source: 'nordic_todo_app',
    exportedAt: typeof input.exportedAt === 'string' ? input.exportedAt : new Date().toISOString(),
    version: typeof input.version === 'number' ? input.version : 1,
    tasks: validatedTasks,
    categories: validatedCategories
  };
}
