import { Response, NextFunction } from 'express';
import { TaskService } from '../services/taskService';
import { StatsService } from '../services/statsService';
import { ApiResponse } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class TaskController {
  static async getTasks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tasks = await TaskService.getTasks(req.userId!, req.query as any);
      ApiResponse.success(res, tasks, 'Tasks retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getTaskById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await TaskService.getTaskById(req.params.id, req.userId!);
      ApiResponse.success(res, task, 'Task retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async createTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await TaskService.createTask(req.userId!, req.body);
      ApiResponse.created(res, task, 'Task created successfully');
    } catch (error) {
      next(error);
    }
  }

  static async updateTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await TaskService.updateTask(req.params.id, req.userId!, req.body);
      ApiResponse.success(res, task, 'Task updated successfully');
    } catch (error) {
      next(error);
    }
  }

  static async toggleComplete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await TaskService.toggleComplete(req.params.id, req.userId!);
      ApiResponse.success(res, task, `Task marked as ${task.completed ? 'completed' : 'pending'}`);
    } catch (error) {
      next(error);
    }
  }

  static async deleteTask(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await TaskService.deleteTask(req.params.id, req.userId!);
      ApiResponse.success(res, result, 'Task deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await StatsService.getUserStats(req.userId!);
      ApiResponse.success(res, stats, 'User statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}
