import cron from 'node-cron';
import { TaskStatusService } from './TaskStatusService';

export class TaskSchedulerService {
  constructor(private readonly taskStatusService: TaskStatusService) {}

  /**
   * Inicia todas las tareas programadas
   */
  public startScheduledTasks(): void {
    this.scheduleDailyTaskUpdate();
    this.scheduleExpiredTaskUpdate();

    console.log('Task scheduler service started');
  }

  /**
   * Programa la actualización diaria de tareas a las 00:00 cada día
   * - Resetea tareas a PENDING para rutinas activas del día
   * - No crea nuevas tareas, solo resetea las existentes
   */
  private scheduleDailyTaskUpdate(): void {
    // Ejecutar todos los días a las 00:00 (medianoche)
    cron.schedule(
      '0 0 * * *',
      async () => {
        console.log('Running daily task status update at midnight...');
        try {
          await this.taskStatusService.updateDailyTaskStatuses();
          console.log('Daily task status update completed successfully');
        } catch (error) {
          console.error('Error during daily task status update:', error);
        }
      },
      {
        timezone: 'UTC', // Cambiar según la zona horaria necesaria
      },
    );

    console.log('Daily task update scheduled for 00:00 UTC');
  }

  /**
   * Programa la actualización de tareas expiradas cada hora
   * - Marca tareas como IN_PROGRESS cuando es su hora
   * - Marca tareas como MISSED cuando expiran
   */
  private scheduleExpiredTaskUpdate(): void {
    // Ejecutar cada hora en el minuto 0
    cron.schedule(
      '0 * * * *',
      async () => {
        console.log('Running expired task update...');
        try {
          await this.taskStatusService.updateExpiredTasks();
          console.log('Expired task update completed successfully');
        } catch (error) {
          console.error('Error during expired task update:', error);
        }
      },
      {
        timezone: 'UTC', // Cambiar según la zona horaria necesaria
      },
    );

    console.log('Expired task update scheduled to run every hour');
  }

  /**
   * Ejecuta manualmente la actualización de todas las tareas
   */
  public async runManualUpdate(): Promise<void> {
    try {
      console.log('Running manual task status update...');
      await this.taskStatusService.updateDailyTaskStatuses();
      await this.taskStatusService.updateExpiredTasks();
      console.log('Manual task status update completed successfully');
    } catch (error) {
      console.error('Error during manual task status update:', error);
      throw error;
    }
  }
}
