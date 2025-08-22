import { RoutineTask } from './RoutineTask';

export class Routine {
  constructor(
    public id: string,
    public userId: string,
    public title: string,
    public defaultTimeLocal: string | undefined,
    public repeatDaysJson: number[],
    public active: boolean = true,
    public readonly createdAt: Date = new Date(),
    public tasks?: RoutineTask[],
  ) {
    this.validateRoutine();
  }

  private validateRoutine(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error('Routine ID cannot be empty');
    }

    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('User ID cannot be empty');
    }

    if (!this.title || this.title.trim().length < 2) {
      throw new Error('Title must be at least 2 characters');
    }

    if (this.title.length > 120) {
      throw new Error('Title cannot exceed 120 characters');
    }

    if (this.defaultTimeLocal && !this.isValidTime(this.defaultTimeLocal)) {
      throw new Error('Invalid time format. Use HH:MM:SS format');
    }

    if (!Array.isArray(this.repeatDaysJson) || this.repeatDaysJson.length === 0) {
      throw new Error('Repeat days must be provided');
    }

    if (this.repeatDaysJson.some((day) => day < 1 || day > 7 || !Number.isInteger(day))) {
      throw new Error('Repeat days must be integers between 1 (Monday) and 7 (Sunday)');
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

  public updateDefaultTime(time?: string): void {
    if (time && !this.isValidTime(time)) {
      throw new Error('Invalid time format. Use HH:MM:SS format');
    }
    this.defaultTimeLocal = time;
  }

  public updateRepeatDays(days: number[]): void {
    if (!Array.isArray(days) || days.length === 0) {
      throw new Error('Repeat days must be provided');
    }
    if (days.some((day) => day < 1 || day > 7 || !Number.isInteger(day))) {
      throw new Error('Repeat days must be integers between 1 (Monday) and 7 (Sunday)');
    }
    this.repeatDaysJson = [...days];
  }

  public activate(): void {
    this.active = true;
  }

  public deactivate(): void {
    this.active = false;
  }
}
