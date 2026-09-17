import { z } from 'zod';
import { Category, Priority } from '@prisma/client';

export const CategoryEnum = z.nativeEnum(Category);
export const PriorityEnum = z.nativeEnum(Priority);

export const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Task title is required' })
    .trim()
    .min(1, 'Task title cannot be empty')
    .max(200, 'Task title cannot exceed 200 characters'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional()
    .nullable(),
  category: CategoryEnum.default(Category.ASSIGNMENT),
  priority: PriorityEnum.default(Priority.MEDIUM),
  dueDate: z
    .string({ required_error: 'Due date is required' })
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Due date must be a valid ISO-8601 date string',
    }),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Task title cannot be empty')
    .max(200, 'Task title cannot exceed 200 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional()
    .nullable(),
  category: CategoryEnum.optional(),
  priority: PriorityEnum.optional(),
  dueDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Due date must be a valid ISO-8601 date string',
    })
    .optional(),
  completed: z.boolean().optional(),
});

export const taskQuerySchema = z.object({
  status: z.enum(['all', 'pending', 'completed', 'today', 'upcoming', 'overdue']).optional().default('all'),
  category: CategoryEnum.optional(),
  priority: PriorityEnum.optional(),
  search: z.string().optional(),
  sortBy: z.enum(['dueDate', 'priority', 'createdAt', 'title']).optional().default('dueDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
