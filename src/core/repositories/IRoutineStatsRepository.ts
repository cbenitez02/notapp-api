import { RoutineStats } from '../interfaces/routine.interface';

export interface IRoutineStatsRepository {
  getUserRoutineStats(userId: string): Promise<RoutineStats>;
  getDailyTaskStats(userId: string, date: Date): Promise<{ completed: number; total: number }>;
  getWeeklyCompletionStats(userId: string, startDate: Date, endDate: Date): Promise<number>;
  getGeneralUserStats(userId: string): Promise<{
    activeRoutines: number;
    totalCompletedTasks: number;
    tasksInProgress: number;
    pendingTasks: number;
    missedTasks: number;
  }>;
}
