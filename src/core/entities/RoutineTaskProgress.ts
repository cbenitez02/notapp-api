import { RoutineTaskStatus } from '../interfaces/routine.interface';

export class RoutineTaskProgress {
  constructor(
    public id: string,
    public routineTemplateTaskId: string,
    public userId: string,
    public dateLocal: string,
    public status: RoutineTaskStatus,
    public startedAtLocal: Date | undefined,
    public completedAtLocal: Date | undefined,
    public notes: string | undefined,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validateTaskProgress();
  }

  private validateTaskProgress(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('RoutineTaskProgress ID cannot be empty');
    }

    if (!this.routineTemplateTaskId || this.routineTemplateTaskId.trim().length === 0) {
      throw new Error('RoutineTemplateTask ID cannot be empty');
    }

    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    if (!this.dateLocal || !this.isValidDate(this.dateLocal)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD format');
    }

    if (this.startedAtLocal && this.completedAtLocal) {
      if (this.startedAtLocal > this.completedAtLocal) {
        // Auto-corregir datos inconsistentes: si la fecha de inicio es posterior a la de finalización,
        // ajustar la fecha de inicio para que sea igual a la de finalización
        console.warn(`Inconsistent task progress data detected for task ${this.routineTemplateTaskId}. Auto-correcting start time.`);
        this.startedAtLocal = this.completedAtLocal;
      }
    }
  }

  private isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;

    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  }

  public start(): void {
    // Allow restarting a completed task only if still within time window
    this.status = RoutineTaskStatus.IN_PROGRESS;
    this.startedAtLocal = new Date();
    this.completedAtLocal = undefined;
  }

  public complete(): void {
    if (this.status === RoutineTaskStatus.COMPLETED) {
      return; // Already completed
    }

    this.status = RoutineTaskStatus.COMPLETED;
    this.completedAtLocal = new Date();

    // Set started time if not already set
    this.startedAtLocal ??= this.completedAtLocal;
  }

  public skip(): void {
    // Allow skipping a completed task
    this.status = RoutineTaskStatus.SKIPPED;
    this.startedAtLocal = undefined;
    this.completedAtLocal = undefined;
  }

  public reset(): void {
    this.status = RoutineTaskStatus.PENDING;
    this.startedAtLocal = undefined;
    this.completedAtLocal = undefined;
  }

  public updateNotes(notes?: string): void {
    this.notes = notes;
  }

  /**
   * Verifica si una tarea puede ser cambiada de estado basándose en su ventana de tiempo
   * @param taskTimeLocal Hora local de la tarea en formato HH:MM:SS
   * @param taskDurationMin Duración de la tarea en minutos
   * @param targetStatus Estado al que se quiere cambiar
   * @returns true si el cambio es permitido, false si no
   */
  public canChangeToStatus(taskTimeLocal?: string, taskDurationMin?: number, targetStatus?: RoutineTaskStatus): boolean {
    // Si no hay hora definida para la tarea, permitir cualquier cambio
    if (!taskTimeLocal) {
      return true;
    }

    // Si el estado objetivo es COMPLETED, SKIPPED o MISSED, siempre permitir
    if (targetStatus === RoutineTaskStatus.COMPLETED || targetStatus === RoutineTaskStatus.SKIPPED || targetStatus === RoutineTaskStatus.MISSED) {
      return true;
    }

    // Si se quiere cambiar a PENDING o IN_PROGRESS desde COMPLETED, validar ventana de tiempo
    if (
      this.status === RoutineTaskStatus.COMPLETED &&
      (targetStatus === RoutineTaskStatus.PENDING || targetStatus === RoutineTaskStatus.IN_PROGRESS)
    ) {
      return this.isWithinTimeWindow(taskTimeLocal, taskDurationMin);
    }

    return true;
  }

  /**
   * Verifica si la tarea está dentro de su ventana de tiempo permitida
   * @param taskTimeLocal Hora local de la tarea en formato HH:MM:SS
   * @param taskDurationMin Duración de la tarea en minutos (opcional)
   * @returns true si está dentro de la ventana, false si no
   */
  private isWithinTimeWindow(taskTimeLocal: string, taskDurationMin?: number): boolean {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

      // Si la fecha de la tarea no es hoy, no permitir cambios
      if (this.dateLocal !== today) {
        return false;
      }

      // Crear fecha/hora de inicio de la tarea
      const [hours, minutes, seconds = 0] = taskTimeLocal.split(':').map(Number);
      const taskStartTime = new Date();
      taskStartTime.setHours(hours, minutes, seconds, 0);

      // Si la tarea es futura (aún no ha llegado su hora), SIEMPRE permitir cambios
      if (now < taskStartTime) {
        return true;
      }

      // Si hay duración definida, calcular hora de fin
      if (taskDurationMin && taskDurationMin > 0) {
        const taskEndTime = new Date(taskStartTime.getTime() + taskDurationMin * 60 * 1000);

        // La tarea puede ser modificada si estamos dentro de su ventana de tiempo
        return now <= taskEndTime;
      }

      // Si no hay duración definida, permitir cambios solo si la hora de la tarea no ha pasado más de 2 horas
      const twoHoursAfterStart = new Date(taskStartTime.getTime() + 2 * 60 * 60 * 1000);
      return now <= twoHoursAfterStart;
    } catch (error) {
      console.error('Error validating time window:', error);
      return false;
    }
  }
}
