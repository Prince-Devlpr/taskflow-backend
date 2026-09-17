import { prisma } from '../config/database';

export class StatsService {
  static async getUserStats(userId: string) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Parallel counts
    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      dueTodayTasks,
      completedThisWeekTasks,
      createdThisWeekTasks,
    ] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, completed: true } }),
      prisma.task.count({ where: { userId, completed: false } }),
      prisma.task.count({
        where: {
          userId,
          completed: false,
          dueDate: { lt: startOfToday },
        },
      }),
      prisma.task.count({
        where: {
          userId,
          dueDate: { gte: startOfToday, lte: endOfToday },
        },
      }),
      prisma.task.count({
        where: {
          userId,
          completed: true,
          completedAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.task.count({
        where: {
          userId,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
    ]);

    // Group-by counts with explicit typing
    const categoryCounts = await prisma.task.groupBy({
      by: ['category'],
      where: { userId },
      _count: { id: true },
    });

    const priorityCounts = await prisma.task.groupBy({
      by: ['priority'],
      where: { userId },
      _count: { id: true },
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const weeklyRate =
      createdThisWeekTasks > 0
        ? Math.min(100, Math.round((completedThisWeekTasks / createdThisWeekTasks) * 100))
        : completedThisWeekTasks > 0
        ? 100
        : 0;

    return {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      overdue: overdueTasks,
      dueToday: dueTodayTasks,
      completionRate,
      weeklyRate,
      completedThisWeek: completedThisWeekTasks,
      categories: categoryCounts.map((c) => ({
        category: c.category,
        count: c._count.id,
      })),
      priorities: priorityCounts.map((p) => ({
        priority: p.priority,
        count: p._count.id,
      })),
    };
  }
}
