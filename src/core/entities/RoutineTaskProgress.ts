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
        throw new Error('Start time cannot be after completion time');
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
    if (this.status === RoutineTaskStatus.COMPLETED) {
      throw new Error('Cannot start a completed task');
    }

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

  public updateNotes(notes?: string): void {
    this.notes = notes;
  }
}
