import { RoutineTask } from '../../entities/RoutineTask';
import { ITaskStatusService, RoutineTaskStatus } from '../../interfaces/routine.interface';
import { IRoutineRepository } from '../../repositories/IRoutineRepository';
import { IRoutineTaskProgressRepository } from '../../repositories/IRoutineTaskProgressRepository';
import { IRoutineTaskRepository } from '../../repositories/IRoutineTaskRepository';
import { IUserRepository } from '../../repositories/IUserRepository';

export class TaskStatusService implements ITaskStatusService {
  constructor(
    private readonly routineRepository: IRoutineRepository,
    private readonly routineTaskRepository: IRoutineTaskRepository,
    private readonly routineTaskProgressRepository: IRoutineTaskProgressRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Actualiza los estados de todas las tareas para un usuario específico o todos los usuarios
   */
  async updateDailyTaskStatuses(userId?: string): Promise<void> {
    const currentDate = new Date();
    const dateLocal = this.formatDateLocal(currentDate);

    if (userId) {
      await this.processUserDailyTasks(userId, dateLocal, currentDate);
    } else {
      // Procesar todos los usuarios
      const users = await this.userRepository.findAll();
      for (const user of users) {
        try {
          await this.processUserDailyTasks(user.id, dateLocal, currentDate);
        } catch (error) {
          console.error(`Error processing daily tasks for user ${user.id}:`, error);
        }
      }
    }
  }

  /**
   * Resetea las tareas al estado PENDING al inicio del día si la rutina está activa para hoy
   */
  async resetDailyTasksForUser(userId: string, dateLocal: string): Promise<void> {
    const date = new Date(dateLocal);
    const dayOfWeek = this.getDayOfWeek(date); // 1=Monday, 7=Sunday

    // Obtener rutinas activas del usuario para este día
    const userRoutines = await this.routineRepository.findByUserId(userId);
    const activeRoutinesForToday = userRoutines.filter((routine) => routine.active && routine.repeatDaysJson.includes(dayOfWeek));

    for (const routine of activeRoutinesForToday) {
      if (routine.tasks) {
        for (const task of routine.tasks) {
          // Verificar si ya existe progreso para esta tarea en esta fecha
          const existingProgress = await this.routineTaskProgressRepository.findByTaskAndDate(task.id, dateLocal);

          if (!existingProgress) {
            // Solo crear progreso si no existe para este día
            await this.routineTaskProgressRepository.createFromDto({
              routineTemplateTaskId: task.id,
              userId: userId,
              dateLocal: dateLocal,
              status: RoutineTaskStatus.PENDING,
            });
          } else if (existingProgress.status === RoutineTaskStatus.MISSED) {
            // Si la tarea estaba marcada como MISSED, resetearla a PENDING para el nuevo día
            await this.routineTaskProgressRepository.updateStatus(existingProgress.id, RoutineTaskStatus.PENDING);
          }
        }
      }
    }
  }

  /**
   * Actualiza las tareas expiradas a estado MISSED
   */
  async updateExpiredTasks(userId?: string): Promise<void> {
    const currentDate = new Date();
    const dateLocal = this.formatDateLocal(currentDate);

    if (userId) {
      await this.processExpiredTasksForUser(userId, dateLocal, currentDate);
    } else {
      const users = await this.userRepository.findAll();
      for (const user of users) {
        try {
          await this.processExpiredTasksForUser(user.id, dateLocal, currentDate);
        } catch (error) {
          console.error(`Error processing expired tasks for user ${user.id}:`, error);
        }
      }
    }
  }

  private async processUserDailyTasks(userId: string, dateLocal: string, currentDate: Date): Promise<void> {
    // Primero resetear las tareas del día si no existen o están en estado MISSED
    await this.resetDailyTasksForUser(userId, dateLocal);

    // Luego actualizar las tareas expiradas
    await this.processExpiredTasksForUser(userId, dateLocal, currentDate);
  }

  private async processExpiredTasksForUser(userId: string, dateLocal: string, currentDate: Date): Promise<void> {
    // Obtener todas las tareas pendientes o en progreso del día actual
    const tasksInProgress = await this.routineTaskProgressRepository.findByUserAndDateAndStatuses(userId, dateLocal, [
      RoutineTaskStatus.PENDING,
      RoutineTaskStatus.IN_PROGRESS,
    ]);

    for (const taskProgress of tasksInProgress) {
      // Obtener la información de la tarea template para conocer su hora
      const routineTask = await this.getRoutineTaskById(taskProgress.routineTemplateTaskId);

      if (routineTask?.timeLocal) {
        const taskDateTime = this.combineDateAndTime(dateLocal, routineTask.timeLocal);
        const taskEndTime = routineTask.durationMin ? new Date(taskDateTime.getTime() + routineTask.durationMin * 60000) : taskDateTime;

        // Si la tarea ya empezó pero no ha terminado, marcarla como IN_PROGRESS
        if (currentDate >= taskDateTime && currentDate <= taskEndTime && taskProgress.status === RoutineTaskStatus.PENDING) {
          await this.routineTaskProgressRepository.updateStatus(taskProgress.id, RoutineTaskStatus.IN_PROGRESS);
        }
        // Si la hora de finalización de la tarea ya pasó, marcarla como MISSED
        else if (currentDate > taskEndTime) {
          await this.routineTaskProgressRepository.updateStatus(taskProgress.id, RoutineTaskStatus.MISSED);
        }
      } else {
        // Si no tiene hora definida, considerar que expira al final del día (23:59)
        const endOfDay = new Date(dateLocal + 'T23:59:59');
        if (currentDate > endOfDay) {
          await this.routineTaskProgressRepository.updateStatus(taskProgress.id, RoutineTaskStatus.MISSED);
        }
      }
    }
  }

  private async getRoutineTaskById(taskId: string): Promise<RoutineTask | null> {
    return await this.routineTaskRepository.findById(taskId);
  }

  private formatDateLocal(date: Date): string {
    return date.toISOString().split('T')[0]; // "2025-09-01"
  }

  private getDayOfWeek(date: Date): number {
    const day = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    return day === 0 ? 7 : day; // Convertir a 1=Monday, 7=Sunday
  }

  private combineDateAndTime(dateLocal: string, timeLocal: string): Date {
    return new Date(`${dateLocal}T${timeLocal}`);
  }
}
