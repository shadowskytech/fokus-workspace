/**
 * @file types.ts
 * @description Core TypeScript type definitions and interfaces for the Todo Application.
 * This defines our local data schema and export/import validation formats.
 */

/**
 * Task priority classification levels
 */
export type Priority = 'low' | 'medium' | 'high';

/**
 * Core interface representing a single Todo Task
 */
export interface Task {
  /** Uniquely generated identifier (UUID or timestamp string) */
  id: string;
  /** The actionable title of the task */
  title: string;
  /** Optional detailed notes or description of the task */
  description: string;
  /** Current completion status of the task */
  completed: boolean;
  /** Visual urgency prioritization (low, medium, or high) */
  priority: Priority;
  /** Optional categorized label (e.g., 'Work', 'Personal') */
  category: string;
  /** Optional deadline or due date in ISO YYYY-MM-DD format */
  dueDate: string;
  /** Timestamp indicating when the task was initially created */
  createdAt: string;
  /** Timestamp indicating when the task was last edited */
  updatedAt: string;
  /** Timestamp indicating when the task was completed */
  completedAt?: string;
}

/**
 * Layout configuration parameters for filters and sorting
 */
export interface FilterState {
  searchQuery: string;
  status: 'all' | 'active' | 'completed';
  priority: 'all' | Priority;
  category: string;
  sortBy: 'createdAt' | 'dueDate' | 'priority';
  sortOrder: 'asc' | 'desc';
}

/**
 * Schema format for JSON backup export and import validations
 */
export interface TodoBackup {
  /** Metadata identifier verifying the system of record */
  source: 'nordic_todo_app';
  /** ISO format export timestamp */
  exportedAt: string;
  /** Version identification for backwards compatibility */
  version: number;
  /** Array containing full task list details */
  tasks: Task[];
  /** Custom categories stored by the user */
  categories: string[];
}
