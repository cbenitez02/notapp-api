import { Request, Response } from 'express';
import { CreateRoutineDto, RoutinePriority, RoutineResponseDto, UpdateRoutineDto } from '../../core/interfaces/routine.interface';
import { CreateRoutineUseCase } from '../../core/usecases/routines/CreateRoutineUseCase';
import { DeleteRoutineUseCase } from '../../core/usecases/routines/DeleteRoutineUseCase';
import { GetRoutineByIdUseCase } from '../../core/usecases/routines/GetRoutineByIdUseCase';
import { GetRoutinesByUserIdUseCase } from '../../core/usecases/routines/GetRoutinesByUserIdUseCase';
import { UpdateRoutineUseCase } from '../../core/usecases/routines/UpdateRoutineUseCase';

export class RoutineController {
  constructor(
    private readonly createRoutineUseCase: CreateRoutineUseCase,
    private readonly getRoutineByIdUseCase: GetRoutineByIdUseCase,
    private readonly getRoutinesByUserIdUseCase: GetRoutinesByUserIdUseCase,
    private readonly updateRoutineUseCase: UpdateRoutineUseCase,
    private readonly deleteRoutineUseCase: DeleteRoutineUseCase,
  ) {}

  public async create(req: Request, res: Response): Promise<void> {
    try {
      // Validar request body
      const validationError = this.validateCreateRoutineRequest(req.body);

      if (validationError.length > 0) {
        res.status(400).json({ message: 'Validation failed', errors: validationError });
        return;
      }

      const { userId, title, defaultTimeLocal, repeatDaysJson, active, createTasks } = req.body;
      const routineDto: CreateRoutineDto = {
        userId: userId.trim(),
        title: title.trim(),
        defaultTimeLocal,
        repeatDaysJson,
        active,
        createTasks, // Agregar las tareas opcionales
      };

      const routine = await this.createRoutineUseCase.execute(routineDto);

      const routineResponse: RoutineResponseDto = {
        id: routine.id,
        userId: routine.userId,
        title: routine.title,
        defaultTimeLocal: routine.defaultTimeLocal,
        repeatDaysJson: routine.repeatDaysJson,
        active: routine.active,
        createdAt: routine.createdAt,
      };

      res.status(201).json({ success: true, data: routineResponse });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: 'Routine ID is required' });
        return;
      }

      const routine = await this.getRoutineByIdUseCase.execute(id);

      if (!routine) {
        res.status(404).json({ message: 'Routine not found' });
        return;
      }

      const routineResponse: RoutineResponseDto = {
        id: routine.id,
        userId: routine.userId,
        title: routine.title,
        defaultTimeLocal: routine.defaultTimeLocal,
        repeatDaysJson: routine.repeatDaysJson,
        active: routine.active,
        createdAt: routine.createdAt,
      };

      res.status(200).json({ success: true, data: routineResponse });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async getByUserId(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      if (!userId) {
        res.status(400).json({ message: 'User ID is required' });
        return;
      }

      const routines = await this.getRoutinesByUserIdUseCase.execute(userId);

      const routinesResponse: RoutineResponseDto[] = routines.map((routine) => ({
        id: routine.id,
        userId: routine.userId,
        title: routine.title,
        defaultTimeLocal: routine.defaultTimeLocal,
        repeatDaysJson: routine.repeatDaysJson,
        active: routine.active,
        createdAt: routine.createdAt,
      }));

      res.status(200).json({ success: true, data: routinesResponse });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: 'Routine ID is required' });
        return;
      }

      // Validar request body
      const validationError = this.validateUpdateRoutineRequest(req.body);

      if (validationError.length > 0) {
        res.status(400).json({ message: 'Validation failed', errors: validationError });
        return;
      }

      const updateDto: UpdateRoutineDto = req.body;

      const routine = await this.updateRoutineUseCase.execute(id, updateDto);

      if (!routine) {
        res.status(404).json({ message: 'Routine not found' });
        return;
      }

      const routineResponse: RoutineResponseDto = {
        id: routine.id,
        userId: routine.userId,
        title: routine.title,
        defaultTimeLocal: routine.defaultTimeLocal,
        repeatDaysJson: routine.repeatDaysJson,
        active: routine.active,
        createdAt: routine.createdAt,
      };

      res.status(200).json({ success: true, data: routineResponse });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: 'Routine ID is required' });
        return;
      }

      await this.deleteRoutineUseCase.execute(id);
      res.status(204).json({ success: true });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  private validateCreateRoutineRequest(body: CreateRoutineDto): string[] {
    const errors: string[] = [];

    if (!body.userId || typeof body.userId !== 'string' || body.userId.trim().length === 0) {
      errors.push('User ID is required');
    }

    if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 2) {
      errors.push('Title is required and must be at least 2 characters');
    }

    if (body.title && body.title.length > 120) {
      errors.push('Title cannot exceed 120 characters');
    }

    // Campos opcionales - validar solo si se envían
    if (body.defaultTimeLocal !== undefined && (typeof body.defaultTimeLocal !== 'string' || !this.isValidTime(body.defaultTimeLocal))) {
      errors.push('Default time must be in HH:MM:SS format');
    }

    // repeatDaysJson es requerido
    if (!Array.isArray(body.repeatDaysJson) || body.repeatDaysJson.length === 0) {
      errors.push('Repeat days must be provided as an array');
    } else if (body.repeatDaysJson.some((day: unknown) => typeof day !== 'number' || day < 1 || day > 7 || !Number.isInteger(day))) {
      errors.push('Repeat days must be integers between 1 (Monday) and 7 (Sunday)');
    }

    if (body.active !== undefined && typeof body.active !== 'boolean') {
      errors.push('Active must be a boolean value');
    }

    // Validar tareas opcionales
    if (body.createTasks !== undefined) {
      if (!Array.isArray(body.createTasks)) {
        errors.push('createTasks must be an array');
      } else {
        body.createTasks.forEach((task: unknown, index: number) => {
          const taskErrors = this.validateCreateTaskForRoutine(task, index);
          errors.push(...taskErrors);
        });
      }
    }

    return errors;
  }

  private validateCreateTaskForRoutine(task: unknown, index: number): string[] {
    const errors: string[] = [];
    const prefix = `Task ${index + 1}:`;

    // Type guard para verificar que task es un objeto
    if (!task || typeof task !== 'object') {
      errors.push(`${prefix} must be a valid object`);
      return errors;
    }

    const taskObj = task as Record<string, unknown>;

    if (!taskObj.title || typeof taskObj.title !== 'string' || taskObj.title.trim().length < 2) {
      errors.push(`${prefix} title is required and must be at least 2 characters`);
    }

    if (taskObj.title && typeof taskObj.title === 'string' && taskObj.title.length > 120) {
      errors.push(`${prefix} title cannot exceed 120 characters`);
    }

    if (!taskObj.dateLocal || typeof taskObj.dateLocal !== 'string' || !this.isValidDate(taskObj.dateLocal)) {
      errors.push(`${prefix} dateLocal is required and must be in YYYY-MM-DD format`);
    }

    if (taskObj.timeLocal && (typeof taskObj.timeLocal !== 'string' || !this.isValidTime(taskObj.timeLocal))) {
      errors.push(`${prefix} timeLocal must be in HH:MM:SS format if provided`);
    }

    if (taskObj.durationMin !== undefined && (typeof taskObj.durationMin !== 'number' || taskObj.durationMin < 1 || taskObj.durationMin > 1440)) {
      errors.push(`${prefix} durationMin must be a number between 1 and 1440 minutes if provided`);
    }

    if (taskObj.categoryId !== undefined && (typeof taskObj.categoryId !== 'string' || taskObj.categoryId.trim().length === 0)) {
      errors.push(`${prefix} categoryId must be a non-empty string if provided`);
    }

    if (
      taskObj.priority !== undefined &&
      (typeof taskObj.priority !== 'string' || !Object.values(RoutinePriority).includes(taskObj.priority as RoutinePriority))
    ) {
      errors.push(`${prefix} priority must be one of: Alta, Media, Baja if provided`);
    }

    if (taskObj.status && typeof taskObj.status !== 'string') {
      errors.push(`${prefix} status must be a string if provided`);
    }

    if (taskObj.startedAtLocal && !(taskObj.startedAtLocal instanceof Date) && typeof taskObj.startedAtLocal !== 'string') {
      errors.push(`${prefix} startedAtLocal must be a valid date if provided`);
    }

    if (taskObj.completedAtLocal && !(taskObj.completedAtLocal instanceof Date) && typeof taskObj.completedAtLocal !== 'string') {
      errors.push(`${prefix} completedAtLocal must be a valid date if provided`);
    }

    if (taskObj.description && (typeof taskObj.description !== 'string' || taskObj.description.length > 500)) {
      errors.push(`${prefix} description must be a string with maximum 500 characters if provided`);
    }

    return errors;
  }

  private validateUpdateRoutineRequest(body: UpdateRoutineDto): string[] {
    const errors: string[] = [];

    if (body.title !== undefined && (typeof body.title !== 'string' || body.title.trim().length < 2 || body.title.length > 120)) {
      errors.push('Title must be a string between 2 and 120 characters');
    }

    if (
      body.defaultTimeLocal !== undefined &&
      body.defaultTimeLocal !== null &&
      (typeof body.defaultTimeLocal !== 'string' || !this.isValidTime(body.defaultTimeLocal))
    ) {
      errors.push('Default time must be in HH:MM:SS format');
    }

    if (body.repeatDaysJson !== undefined) {
      if (!Array.isArray(body.repeatDaysJson) || body.repeatDaysJson.length === 0) {
        errors.push('Repeat days must be provided as an array');
      } else if (body.repeatDaysJson.some((day: unknown) => typeof day !== 'number' || day < 1 || day > 7 || !Number.isInteger(day))) {
        errors.push('Repeat days must be integers between 1 (Monday) and 7 (Sunday)');
      }
    }

    if (body.active !== undefined && typeof body.active !== 'boolean') {
      errors.push('Active must be a boolean value');
    }

    return errors;
  }

  private isValidTime(time: string): boolean {
    const timeRegex = /^([0-1]?\d|2[0-3]):[0-5]\d:[0-5]\d$/;
    return timeRegex.test(time);
  }

  private isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;

    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  }

  private handleError(error: unknown, res: Response): void {
    console.error('RoutineController error:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({ message: error.message });
      } else if (error.message.includes('required') || error.message.includes('must be') || error.message.includes('cannot')) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
