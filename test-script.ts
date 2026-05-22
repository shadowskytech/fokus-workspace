import { validateAndParseBackup } from './src/store.ts';
const tasks = [
  {
    id: 'task_1',
    title: 'Test Task',
    description: '',
    completed: false,
    priority: 'medium',
    category: 'Inbox',
    dueDate: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
const payload = {
  source: 'nordic_todo_app',
  exportedAt: new Date().toISOString(),
  version: 1,
  tasks,
  categories: ['Inbox']
};
try {
  validateAndParseBackup(payload);
  console.log("Success");
} catch(e) {
  console.error("Failed:", e);
}
