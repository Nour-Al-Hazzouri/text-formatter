/**
 * Task List Display Component - Enhanced UI for displaying formatted task lists
 * 
 * Features:
 * - Interactive checkboxes for task completion
 * - Priority indicators with colors
 * - Due date highlighting
 * - Category grouping
 * - Progress tracking
 */

'use client';

import React from 'react';
import { CheckCircle2, Circle, AlertTriangle, Calendar, Tag } from 'lucide-react';
import { Badge, Card, CardContent, CardHeader, CardTitle, Progress } from '@/components/ui';
import type { FormattedOutput } from '@/types/formatting';

interface TaskListDisplayProps {
  output: FormattedOutput;
  className?: string;
}

interface TaskItem {
  id: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dueDate?: Date;
  category?: string;
  status: 'completed' | 'pending' | 'in-progress' | 'cancelled';
}

interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}

/**
 * Get priority badge variant and icon
 */
const getPriorityDisplay = (priority: TaskItem['priority']) => {
  switch (priority) {
    case 'urgent':
      return {
        variant: 'destructive' as const,
        icon: '🔴',
        label: 'Urgent'
      };
    case 'high':
      return {
        variant: 'default' as const,
        icon: '🟠',
        label: 'High'
      };
    case 'low':
      return {
        variant: 'outline' as const,
        icon: '🔵',
        label: 'Low'
      };
    default:
      return {
        variant: 'secondary' as const,
        icon: '',
        label: 'Medium'
      };
  }
};

/**
 * Format due date for display
 */
const formatDueDate = (date: Date): { text: string; isOverdue: boolean; isToday: boolean } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = dueDay.getTime() === today.getTime();
  const isOverdue = dueDay.getTime() < today.getTime();
  const isTomorrow = dueDay.getTime() === tomorrow.getTime();

  let text: string;
  if (isToday) {
    text = 'Today';
  } else if (isTomorrow) {
    text = 'Tomorrow';
  } else if (isOverdue) {
    const daysOverdue = Math.floor((today.getTime() - dueDay.getTime()) / (1000 * 60 * 60 * 24));
    text = `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`;
  } else {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    };
    text = date.toLocaleDateString('en-US', options);
  }

  return { text, isOverdue, isToday };
};

/**
 * Task item component
 */
const TaskItemComponent: React.FC<{ task: TaskItem; onToggle?: (taskId: string) => void }> = ({ 
  task, 
  onToggle 
}) => {
  const priorityDisplay = getPriorityDisplay(task.priority);
  const dueDateInfo = task.dueDate ? formatDueDate(task.dueDate) : null;
  
  const handleToggle = () => {
    onToggle?.(task.id);
  };

  return (
    <div className={`
      flex items-start gap-3 p-3 rounded-lg border transition-colors
      ${task.status === 'completed' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-orange-200'}
    `}>
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className="mt-0.5 text-gray-400 hover:text-orange-500 transition-colors"
        aria-label={`Mark task as ${task.status === 'completed' ? 'pending' : 'completed'}`}
      >
        {task.status === 'completed' ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
      </button>

      {/* Task content */}
      <div className="flex-1 min-w-0">
        <div className={`
          text-sm font-medium
          ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}
        `}>
          {task.description}
        </div>

        {/* Task metadata */}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {/* Priority */}
          {task.priority !== 'medium' && (
            <Badge variant={priorityDisplay.variant} className="text-xs">
              {priorityDisplay.icon} {priorityDisplay.label}
            </Badge>
          )}

          {/* Category */}
          {task.category && (
            <Badge variant="outline" className="text-xs">
              <Tag className="w-3 h-3 mr-1" />
              {task.category}
            </Badge>
          )}

          {/* Due date */}
          {dueDateInfo && (
            <Badge 
              variant={dueDateInfo.isOverdue ? "destructive" : dueDateInfo.isToday ? "default" : "outline"} 
              className="text-xs"
            >
              <Calendar className="w-3 h-3 mr-1" />
              {dueDateInfo.text}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Task category section component
 */
const TaskCategorySection: React.FC<{
  title: string;
  tasks: TaskItem[];
  onToggleTask?: (taskId: string) => void;
}> = ({ title, tasks, onToggleTask }) => {
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-handwritten text-gray-900">
            {title}
          </CardTitle>
          <div className="text-sm text-gray-500">
            {completedTasks}/{tasks.length} completed
          </div>
        </div>
        {tasks.length > 0 && (
          <Progress value={progress} className="h-1.5" />
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {tasks.map((task) => (
            <TaskItemComponent
              key={task.id}
              task={task}
              onToggle={onToggleTask}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main task list display component
 */
export const TaskListDisplay: React.FC<TaskListDisplayProps> = ({ output, className }) => {
  // Extract task data from formatted output
  const taskData = output.data?.formatSpecific as { 
    categories?: Array<{ name: string; taskIds: string[] }>;
    tasks?: TaskItem[];
    stats?: TaskStats;
  };

  const tasks = taskData?.tasks || [];
  const categories = taskData?.categories || [];
  const stats = taskData?.stats;

  // Group tasks by category
  const tasksByCategory = new Map<string, TaskItem[]>();
  const uncategorizedTasks: TaskItem[] = [];

  // Initialize categories
  categories.forEach(cat => {
    tasksByCategory.set(cat.name, []);
  });

  // Distribute tasks
  tasks.forEach(task => {
    if (task.category) {
      const categoryTasks = tasksByCategory.get(task.category);
      if (categoryTasks) {
        categoryTasks.push(task);
      } else {
        uncategorizedTasks.push(task);
      }
    } else {
      uncategorizedTasks.push(task);
    }
  });

  // Handle task toggle (for demo purposes - in real app this would update state)
  const handleTaskToggle = (taskId: string) => {
    console.log(`Toggle task: ${taskId}`);
    // In a real implementation, this would update the task status
  };

  // Overall stats
  const overallProgress = stats && stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div className={className}>
      {/* Overall progress */}
      {stats && stats.total > 0 && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-handwritten font-semibold text-gray-900">
                Task Progress
              </h3>
              <div className="text-sm text-gray-500">
                {stats.completed}/{stats.total} completed
              </div>
            </div>
            <Progress value={overallProgress} className="h-2 mb-2" />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-blue-600">{stats.pending}</div>
                <div className="text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-600">{stats.completed}</div>
                <div className="text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-red-600">{stats.overdue}</div>
                <div className="text-gray-500">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task categories */}
      {tasksByCategory.size > 0 && Array.from(tasksByCategory.entries()).map(([categoryName, categoryTasks]) => (
        categoryTasks.length > 0 && (
          <TaskCategorySection
            key={categoryName}
            title={categoryName}
            tasks={categoryTasks}
            onToggleTask={handleTaskToggle}
          />
        )
      ))}

      {/* Uncategorized tasks */}
      {uncategorizedTasks.length > 0 && (
        <TaskCategorySection
          title={tasksByCategory.size > 0 ? "Other Tasks" : "Tasks"}
          tasks={uncategorizedTasks}
          onToggleTask={handleTaskToggle}
        />
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-gray-400 mb-2">
              <CheckCircle2 className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No tasks found</h3>
            <p className="text-gray-500">
              Try entering some task items to see them organized here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskListDisplay;
