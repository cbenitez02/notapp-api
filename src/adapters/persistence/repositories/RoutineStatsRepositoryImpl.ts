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

    // Contar rutinas activas
    const activeRoutines = await this.routineRepository
      .createQueryBuilder('routine')
      .where('routine.user_id = :userId', { userId })
      .andWhere('routine.active = :isActive', { isActive: true })
      .getCount();

    return {
      dailyStats: {
        completedTasks: dailyStats.completed,
        totalTasks: dailyStats.total,
        completionPercentage: dailyStats.total > 0 ? (dailyStats.completed / dailyStats.total) * 100 : 0,
        pendingTasks: dailyStats.pending,
        inProgressTasks: dailyStats.inProgress,
        missedTasks: dailyStats.missed,
        skippedTasks: dailyStats.skipped,
      },
      weeklyStats: {
        currentWeekCompletion,
        previousWeekCompletion,
        improvementPercentage,
        activeRoutines,
      },
    };
  }

  async getDailyTaskStats(
    userId: string,
    date: Date,
  ): Promise<{
    completed: number;
    total: number;
    pending: number;
    inProgress: number;
    missed: number;
    skipped: number;
  }> {
    const dateStr = date.toISOString().split('T')[0];

    // Obtener todas las tareas de progreso para el día específico
    const taskProgresses = await this.taskProgressRepository
      .createQueryBuilder('progress')
      .innerJoin('progress.routineTemplateTask', 'task')
      .innerJoin('task.routine', 'routine')
      .where('routine.user_id = :userId', { userId })
      .andWhere('progress.date_local = :dateStr', { dateStr })
      .getMany();

    // Contar tareas por estado
    let completed = 0;
    let pending = 0;
    let inProgress = 0;
    let missed = 0;
    let skipped = 0;

    taskProgresses.forEach((progress) => {
      switch (progress.status) {
        case 'completed':
          completed++;
          break;
        case 'pending':
          pending++;
          break;
        case 'in_progress':
          inProgress++;
          break;
        case 'missed':
          missed++;
          break;
        case 'skipped':
          skipped++;
          break;
      }
    });

    const total = taskProgresses.length;

    return {
      completed,
      total,
      pending,
      inProgress,
      missed,
      skipped,
    };
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

    // Total de tareas completadas (histórico)
    const totalCompletedTasks = await this.taskProgressRepository
      .createQueryBuilder('progress')
      .innerJoin('progress.routineTemplateTask', 'task')
      .innerJoin('task.routine', 'routine')
      .where('routine.user_id = :userId', { userId })
      .andWhere('progress.status = :status', { status: 'completed' })
      .getCount();

    // Para las estadísticas del día actual, necesitamos obtener los datos de hoy
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Obtener todas las tareas de progreso para hoy
    const todayTaskProgresses = await this.taskProgressRepository
      .createQueryBuilder('progress')
      .innerJoin('progress.routineTemplateTask', 'task')
      .innerJoin('task.routine', 'routine')
      .where('routine.user_id = :userId', { userId })
      .andWhere('progress.date_local = :today', { today: todayStr })
      .getMany();

    // Contar estados para el día actual
    let tasksInProgress = 0;
    let pendingTasks = 0;
    let missedTasks = 0;

    todayTaskProgresses.forEach((progress) => {
      switch (progress.status) {
        case 'in_progress':
          tasksInProgress++;
          break;
        case 'pending':
          pendingTasks++;
          break;
        case 'missed':
          missedTasks++;
          break;
      }
    });

    // También contar tareas perdidas de días anteriores
    const previousMissedTasks = await this.taskProgressRepository
      .createQueryBuilder('progress')
      .innerJoin('progress.routineTemplateTask', 'task')
      .innerJoin('task.routine', 'routine')
      .where('routine.user_id = :userId', { userId })
      .andWhere('progress.status = :missedStatus', { missedStatus: 'missed' })
      .andWhere('progress.date_local < :today', { today: todayStr })
      .getCount();

    return {
      activeRoutines,
      totalCompletedTasks,
      tasksInProgress,
      pendingTasks,
      missedTasks: missedTasks + previousMissedTasks,
    };
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajustar para que lunes sea el primer día
    return new Date(d.setDate(diff));
  }
}
