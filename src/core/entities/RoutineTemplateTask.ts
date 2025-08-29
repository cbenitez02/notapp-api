import { RoutinePriority } from '../interfaces/routine.interface';
import { Category } from './Category';

export class RoutineTemplateTask {
  constructor(
    public id: string,
    public routineId: string,
    public title: string,
    public timeLocal: string | undefined,
    public durationMin: number | undefined,
    public categoryId: string | undefined,
    public category: Category | undefined,
    public priority: RoutinePriority,
    public description: string | undefined,
    public sortOrder: number,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validateTemplateTask();
  }

  private validateTemplateTask(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('RoutineTemplateTask ID cannot be empty');
    }

    if (!this.routineId || this.routineId.trim().length === 0) {
      throw new Error('Routine ID cannot be empty');
    }

    if (!this.title || this.title.trim().length < 2) {
      throw new Error('Task title is required and must be at least 2 characters');
    }

    if (this.title.length > 120) {
      throw new Error('Task title cannot exceed 120 characters');
    }

    if (this.timeLocal && !this.isValidTime(this.timeLocal)) {
      throw new Error('Invalid time format. Use HH:MM:SS format');
    }

    if (this.durationMin && (this.durationMin < 1 || this.durationMin > 1440)) {
      throw new Error('Duration must be between 1 and 1440 minutes (24 hours)');
    }

    if (this.sortOrder < 0) {
      throw new Error('Sort order must be non-negative');
    }
  }

  private isValidTime(time: string): boolean {
    const timeRegex = /^([0-1]?\d|2[0-3]):[0-5]\d:[0-5]\d$/;
    return timeRegex.test(time);
  }

  public updateTitle(title: string): void {
    if (!title || title.trim().length < 2) {
      throw new Error('Title must be at least 2 characters');
    }
    if (title.length > 120) {
      throw new Error('Title cannot exceed 120 characters');
    }
    this.title = title.trim();
  }

  public updateTime(time?: string): void {
    if (time && !this.isValidTime(time)) {
      throw new Error('Invalid time format. Use HH:MM:SS format');
    }
    this.timeLocal = time;
  }

  public updateDuration(minutes?: number): void {
    if (minutes && (minutes < 1 || minutes > 1440)) {
      throw new Error('Duration must be between 1 and 1440 minutes');
    }
    this.durationMin = minutes;
  }

  public updateDescription(description?: string): void {
    this.description = description;
  }

  public updateSortOrder(order: number): void {
    if (order < 0) {
      throw new Error('Sort order must be non-negative');
    }
    this.sortOrder = order;
  }
}
