import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError } from '../utils/appError';
import { CreateTaskInput, UpdateTaskInput, TaskQueryInput } from '../validators/taskValidator';

export class TaskService {
  static async getTasks(userId: string, query: TaskQueryInput) {
    const {
      status,
      category,
      priority,
      search,
      sortBy = 'dueDate',
      sortOrder = 'asc',
      page = 1,
      limit = 50,
    } = query;

    const where: Prisma.TaskWhereInput = {
      userId,
    };

    // Category and Priority filters
    if (category) {
      where.category = category;
    }
    if (priority) {
      where.priority = priority;
    }

    // Status / date filters
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (status === 'completed') {
      where.completed = true;
    } else if (status === 'pending') {
      where.completed = false;
    } else if (status === 'today') {
      where.dueDate = {
        gte: startOfToday,
        lte: endOfToday,
      };
    } else if (status === 'upcoming') {
      where.completed = false;
      where.dueDate = {
        gt: endOfToday,
      };
    } else if (status === 'overdue') {
      where.completed = false;
      where.dueDate = {
        lt: startOfToday,
      };
    }

    // Text search (case-insensitive in PostgreSQL)
    if (search && search.trim() !== '') {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Sorting
    const orderBy: Prisma.TaskOrderByWithRelationInput = {};
    const validSortOrder: Prisma.SortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

    if (sortBy === 'priority') {
      orderBy.priority = validSortOrder;
    } else if (sortBy === 'title') {
      orderBy.title = validSortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = validSortOrder;
    } else {
      orderBy.dueDate = validSortOrder;
    }

    // Enforce pagination with a hard cap (the validator already clamps `limit`
    // to <= 100) so a client can never request an unbounded result set.
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({ where, orderBy, skip, take }),
      prisma.task.count({ where }),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit: take,
        total,
        totalPages: Math.max(1, Math.ceil(total / take)),
        hasMore: skip + tasks.length < total,
      },
    };
  }

  static async getTaskById(taskId: string, userId: string) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
    });

    if (!task) {
      throw new AppError('Task not found or unauthorized access', 404);
    }

    return task;
  }

  static async createTask(userId: string, input: CreateTaskInput) {
    const task = await prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        category: input.category,
        priority: input.priority,
        dueDate: new Date(input.dueDate),
        userId,
      },
    });

    return task;
  }

  static async updateTask(taskId: string, userId: string, input: UpdateTaskInput) {
    // Check ownership first
    await this.getTaskById(taskId, userId);

    const updateData: Prisma.TaskUpdateInput = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.dueDate !== undefined) updateData.dueDate = new Date(input.dueDate);
    if (input.completed !== undefined) {
      updateData.completed = input.completed;
      updateData.completedAt = input.completed ? new Date() : null;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });

    return updatedTask;
  }

  static async toggleComplete(taskId: string, userId: string) {
    const task = await this.getTaskById(taskId, userId);

    const newCompleted = !task.completed;
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        completed: newCompleted,
        completedAt: newCompleted ? new Date() : null,
      },
    });

    return updatedTask;
  }

  static async deleteTask(taskId: string, userId: string) {
    // Check ownership first
    await this.getTaskById(taskId, userId);

    await prisma.task.delete({
      where: { id: taskId },
    });

    return { message: 'Task deleted successfully' };
  }
}
