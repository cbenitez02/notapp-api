import { Repository } from 'typeorm';
import { RoutineStats } from '../../../core/interfaces/routine.interface';
import { IRoutineStatsRepository } from '../../../core/repositories/IRoutineStatsRepository';
import { AppDataSource } from '../../database/ormconfig';
import { RoutineEntity } from '../entities/RoutineEntity';
import { RoutineTaskProgressEntity } from '../entities/RoutineTaskProgressEntity';
import { RoutineTemplateTaskEntity } from '../entities/RoutineTemplateTaskEntity';

export class RoutineStatsRepositoryImpl implements IRoutineStatsRepository {
  private readonly routineRepository: Repository<RoutineEntity>;
  private readonly taskProgressRepository: Repository<RoutineTaskProgressEntity>;
  private readonly templateTaskRepository: Repository<RoutineTemplateTaskEntity>;

  constructor() {
    this.routineRepository = AppDataSource.getRepository(RoutineEntity);
    this.taskProgressRepository = AppDataSource.getRepository(RoutineTaskProgressEntity);
    this.templateTaskRepository = AppDataSource.getRepository(RoutineTemplateTaskEntity);
  }

  async getUserRoutineStats(userId: string): Promise<RoutineStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Estadísticas diarias
    const dailyStats = await this.getDailyTaskStats(userId, today);

    // Estadísticas semanales
    const currentWeekStart = this.getWeekStart(today);
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);

    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const previousWeekEnd = new Date(previousWeekStart);
    previousWeekEnd.setDate(previousWeekEnd.getDate() + 6);

    const currentWeekCompletion = await this.getWeeklyCompletionStats(userId, currentWeekStart, currentWeekEnd);
    const previousWeekCompletion = await this.getWeeklyCompletionStats(userId, previousWeekStart, previousWeekEnd);

    const improvementPercentage = previousWeekCompletion > 0 ? ((currentWeekCompletion - previousWeekCompletion) / previousWeekCompletion) * 100 : 0;

    // Estadísticas generales
    const generalStats = await this.getGeneralUserStats(userId);

    return {
      dailyStats: {
        completedTasks: dailyStats.completed,
        totalTasks: dailyStats.total,
        completionPercentage: dailyStats.total > 0 ? (dailyStats.completed / dailyStats.total) * 100 : 0,
      },
      weeklyStats: {
        currentWeekCompletion,
        previousWeekCompletion,
        improvementPercentage,
      },
      generalStats,
    };
  }

  async getDailyTaskStats(userId: string, date: Date): Promise<{ completed: number; total: number }> {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    // Obtener rutinas activas del usuario
    const activeRoutines = await this.routineRepository
      .createQueryBuilder('routine')
      .where('routine.user_id = :userId', { userId })
      .andWhere('routine.active = :isActive', { isActive: true })
      .getMany();

    let totalTasks = 0;
    let completedTasks = 0;

    for (const routine of activeRoutines) {
      // Obtener tareas de la plantilla para esta rutina
      const templateTasks = await this.templateTaskRepository
        .createQueryBuilder('task')
        .where('task.routine_id = :routineId', { routineId: routine.id })
        .getCount();

      totalTasks += templateTasks;

      // Obtener tareas completadas para el día específico
      const completedTasksForDay = await this.taskProgressRepository
        .createQueryBuilder('progress')
        .innerJoin('progress.routineTemplateTask', 'task')
        .innerJoin('task.routine', 'routine')
        .where('routine.user_id = :userId', { userId })
        .andWhere('routine.id = :routineId', { routineId: routine.id })
        .andWhere('progress.completed_at_local >= :startDate', { startDate: date })
        .andWhere('progress.completed_at_local < :endDate', { endDate: nextDay })
        .andWhere('progress.status = :status', { status: 'completed' })
        .getCount();

      completedTasks += completedTasksForDay;
    }

    return { completed: completedTasks, total: totalTasks };
  }

  async getWeeklyCompletionStats(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await this.taskProgressRepository
      .createQueryBuilder('progress')
      .select('COUNT(*)', 'completedTasks')
      .innerJoin('progress.routineTemplateTask', 'task')
      .innerJoin('task.routine', 'routine')
      .where('routine.user_id = :userId', { userId })
      .andWhere('progress.completed_at_local >= :startDate', { startDate })
      .andWhere('progress.completed_at_local <= :endDate', { endDate })
      .andWhere('progress.status = :status', { status: 'completed' })
      .getRawOne();

    return parseInt(result.completedTasks) || 0;
  }

  async getGeneralUserStats(userId: string): Promise<{
    activeRoutines: number;
    totalCompletedTasks: number;
    tasksInProgress: number;
    pendingTasks: number;
    missedTasks: number;
  }> {
    // Rutinas activas
    const activeRoutines = await this.routineRepository
      .createQueryBuilder('routine')
      .where('routine.user_id = :userId', { userId })
      .andWhere('routine.active = :isActive', { isActive: true })
      .getCount();

    // Total de tareas completadas
    const totalCompletedTasks = await this.taskProgressRepository
      .createQueryBuilder('progress')
      .innerJoin('progress.routineTemplateTask', 'task')
      .innerJoin('task.routine', 'routine')
      .where('routine.user_id = :userId', { userId })
      .andWhere('progress.status = :status', { status: 'completed' })
      .getCount();

    // Tareas en progreso (iniciadas pero no completadas)
    const tasksInProgress = await this.taskProgressRepository
      .createQueryBuilder('progress')
      .innerJoin('progress.routineTemplateTask', 'task')
      .innerJoin('task.routine', 'routine')
      .where('routine.user_id = :userId', { userId })
      .andWhere('progress.status = :status', { status: 'in_progress' })
      .getCount();

    // Para tareas pendientes y perdidas, necesitamos lógica más compleja
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format

    // Tareas perdidas (deberían haberse completado pero no se hicieron)
    const missedTasks = await this.taskProgressRepository
      .createQueryBuilder('progress')
      .innerJoin('progress.routineTemplateTask', 'task')
      .innerJoin('task.routine', 'routine')
      .where('routine.user_id = :userId', { userId })
      .andWhere('progress.status != :completedStatus', { completedStatus: 'completed' })
      .andWhere('progress.date_local < :today', { today: todayStr })
      .getCount();

    // Tareas pendientes (programadas para hoy o el futuro)
    const pendingTasks = await this.taskProgressRepository
      .createQueryBuilder('progress')
      .innerJoin('progress.routineTemplateTask', 'task')
      .innerJoin('task.routine', 'routine')
      .where('routine.user_id = :userId', { userId })
      .andWhere('progress.status = :pendingStatus', { pendingStatus: 'pending' })
      .andWhere('progress.date_local >= :today', { today: todayStr })
      .getCount();

    return {
      activeRoutines,
      totalCompletedTasks,
      tasksInProgress,
      pendingTasks,
      missedTasks,
    };
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que lunes sea el primer día
    return new Date(d.setDate(diff));
  }
}
