export class DailySummary {
  constructor(
    public id: string,
    public userId: string,
    public dateLocal: string,
    public totalCompleted: number = 0,
    public totalMissed: number = 0,
    public totalInProgress: number = 0,
    public totalPending: number = 0,
    public totalSkipped: number = 0,
    public progressPercent: number = 0,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {
    this.validateDailySummary();
  }

  private validateDailySummary(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('DailySummary ID cannot be empty');
    }

    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    if (!this.dateLocal || !this.isValidDate(this.dateLocal)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD format');
    }

    if (this.totalCompleted < 0 || this.totalMissed < 0 || this.totalInProgress < 0 || this.totalPending < 0 || this.totalSkipped < 0) {
      throw new Error('Task counts cannot be negative');
    }

    if (this.progressPercent < 0 || this.progressPercent > 100) {
      throw new Error('Progress percent must be between 0 and 100');
    }

    // Validar coherencia en los totales
    this.validateProgressConsistency();
  }

  private isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;

    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  }

  private validateProgressConsistency(): void {
    const totalTasks = this.getTotalTasks();

    if (totalTasks === 0 && this.progressPercent !== 0) {
      throw new Error('Progress percent should be 0 when there are no tasks');
    }

    if (totalTasks > 0) {
      const calculatedProgress = (this.totalCompleted / totalTasks) * 100;
      // Permitir una pequeña diferencia por redondeo
      const tolerance = 0.01;
      if (Math.abs(this.progressPercent - calculatedProgress) > tolerance) {
        throw new Error('Progress percent does not match calculated progress based on completed tasks');
      }
    }
  }

  public getTotalTasks(): number {
    return this.totalCompleted + this.totalMissed + this.totalInProgress + this.totalPending + this.totalSkipped;
  }

  public updateTaskCount(completed: number, missed: number, inProgress: number, pending: number, skipped: number): void {
    if (completed < 0 || missed < 0 || inProgress < 0 || pending < 0 || skipped < 0) {
      throw new Error('Task counts cannot be negative');
    }

    this.totalCompleted = completed;
    this.totalMissed = missed;
    this.totalInProgress = inProgress;
    this.totalPending = pending;
    this.totalSkipped = skipped;

    this.recalculateProgress();
  }

  public incrementCompleted(): void {
    this.totalCompleted += 1;
    if (this.totalPending > 0) {
      this.totalPending -= 1;
    } else if (this.totalInProgress > 0) {
      this.totalInProgress -= 1;
    }
    this.recalculateProgress();
  }

  public incrementMissed(): void {
    this.totalMissed += 1;
    if (this.totalPending > 0) {
      this.totalPending -= 1;
    }
    this.recalculateProgress();
  }

  public incrementInProgress(): void {
    this.totalInProgress += 1;
    if (this.totalPending > 0) {
      this.totalPending -= 1;
    }
    this.recalculateProgress();
  }

  public incrementSkipped(): void {
    this.totalSkipped += 1;
    if (this.totalPending > 0) {
      this.totalPending -= 1;
    } else if (this.totalInProgress > 0) {
      this.totalInProgress -= 1;
    }
    this.recalculateProgress();
  }

  public addPendingTask(): void {
    this.totalPending += 1;
    this.recalculateProgress();
  }

  private recalculateProgress(): void {
    const totalTasks = this.getTotalTasks();
    if (totalTasks === 0) {
      this.progressPercent = 0;
    } else {
      this.progressPercent = Math.round((this.totalCompleted / totalTasks) * 100 * 100) / 100; // Round to 2 decimal places
    }
  }

  public getCompletionRate(): number {
    const totalTasks = this.getTotalTasks();
    return totalTasks === 0 ? 0 : this.totalCompleted / totalTasks;
  }

  public getMissedRate(): number {
    const totalTasks = this.getTotalTasks();
    return totalTasks === 0 ? 0 : this.totalMissed / totalTasks;
  }

  public isFullyCompleted(): boolean {
    return this.getTotalTasks() > 0 && this.totalCompleted === this.getTotalTasks();
  }

  public hasActiveTasks(): boolean {
    return this.totalInProgress > 0 || this.totalPending > 0;
  }
}
