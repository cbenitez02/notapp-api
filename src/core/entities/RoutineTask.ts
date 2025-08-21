import { RoutinePriority, RoutineTaskStatus } from '../interfaces/routine.interface';
import { Category } from './Category';

export class RoutineTask {
  constructor(
    public id: string,
    public routineId: string,
    public userId: string,
    public title: string,
    public dateLocal: string,
    public timeLocal: string | undefined,
    public durationMin: number | undefined,
    public categoryId: string | undefined,
    public category: Category | undefined,
    public priority: RoutinePriority,
    public status: RoutineTaskStatus,
    public startedAtLocal: Date | undefined,
    public completedAtLocal: Date | undefined,
    public description: string | undefined,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validateRoutineTask();
  }

  private validateRoutineTask(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('RoutineTask ID cannot be empty');
    }

    if (!this.routineId || this.routineId.trim().length === 0) {
      throw new Error('Routine ID cannot be empty');
    }

    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    if (!this.title || this.title.trim().length < 2) {
      throw new Error('Task title is required and must be at least 2 characters');
    }

    if (this.title.length > 120) {
      throw new Error('Task title cannot exceed 120 characters');
    }

    if (!this.dateLocal || !this.isValidDate(this.dateLocal)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD format');
    }

    if (this.timeLocal && !this.isValidTime(this.timeLocal)) {
      throw new Error('Invalid time format. Use HH:MM:SS format');
    }

    if (this.durationMin && (this.durationMin < 1 || this.durationMin > 1440)) {
      throw new Error('Duration must be between 1 and 1440 minutes');
    }

    if (this.description && this.description.length > 500) {
      throw new Error('Description cannot exceed 500 characters');
    }

    // Validar que las fechas de inicio y completado sean coherentes
    if (this.startedAtLocal && this.completedAtLocal && this.startedAtLocal > this.completedAtLocal) {
      throw new Error('Started date cannot be after completed date');
    }

    // Validar coherencia entre estado y fechas
    this.validateStatusConsistency();
  }

  private isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;

    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  }

  private isValidTime(time: string): boolean {
    const timeRegex = /^([0-1]?\d|2[0-3]):[0-5]\d:[0-5]\d$/;
    return timeRegex.test(time);
  }

  private validateStatusConsistency(): void {
    if (this.status === RoutineTaskStatus.IN_PROGRESS && !this.startedAtLocal) {
      throw new Error('In progress tasks must have a started date');
    }

    if (this.status === RoutineTaskStatus.COMPLETED && !this.completedAtLocal) {
      throw new Error('Completed tasks must have a completed date');
    }

    if (this.status === RoutineTaskStatus.PENDING && (this.startedAtLocal || this.completedAtLocal)) {
      throw new Error('Pending tasks cannot have started or completed dates');
    }

    if (this.status === RoutineTaskStatus.SKIPPED && (this.startedAtLocal || this.completedAtLocal)) {
      throw new Error('Skipped tasks cannot have started or completed dates');
    }
  }

  public updateTitle(title: string): void {
    if (!title || title.trim().length < 2) {
      throw new Error('Task title is required and must be at least 2 characters');
    }
    if (title.length > 120) {
      throw new Error('Task title cannot exceed 120 characters');
    }
    this.title = title.trim();
  }

  public updatePriority(priority: RoutinePriority): void {
    this.priority = priority;
  }

  public updateTime(time?: string): void {
    if (time && !this.isValidTime(time)) {
      throw new Error('Invalid time format. Use HH:MM:SS format');
    }
    this.timeLocal = time;
  }

  public updateDuration(duration?: number): void {
    if (duration && (duration < 1 || duration > 1440)) {
      throw new Error('Duration must be between 1 and 1440 minutes');
    }
    this.durationMin = duration;
  }

  public updateDescription(description?: string): void {
    if (description && description.length > 500) {
      throw new Error('Description cannot exceed 500 characters');
    }
    this.description = description;
  }

  public start(): void {
    if (this.status === RoutineTaskStatus.COMPLETED || this.status === RoutineTaskStatus.SKIPPED) {
      throw new Error('Cannot start a completed or skipped task');
    }

    this.status = RoutineTaskStatus.IN_PROGRESS;
    this.startedAtLocal = new Date();
    this.completedAtLocal = undefined;
  }

  public complete(): void {
    if (this.status === RoutineTaskStatus.PENDING) {
      // Si está pendiente, la iniciamos automáticamente
      this.startedAtLocal = new Date();
    }

    this.status = RoutineTaskStatus.COMPLETED;
    this.completedAtLocal = new Date();
  }

  public skip(): void {
    if (this.status === RoutineTaskStatus.COMPLETED) {
      throw new Error('Cannot skip a completed task');
    }

    this.status = RoutineTaskStatus.SKIPPED;
    this.startedAtLocal = undefined;
    this.completedAtLocal = undefined;
  }

  public reset(): void {
    this.status = RoutineTaskStatus.PENDING;
    this.startedAtLocal = undefined;
    this.completedAtLocal = undefined;
  }
}
