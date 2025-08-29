import { Response } from 'express';
import { RoutineTask } from '../../core/entities/RoutineTask';
import { AuthRequest } from '../../core/interfaces/auth.interface';
import { ICreateRoutineUseCase } from '../../core/interfaces/ICreateRoutineUseCase';
import {
  CreateRoutineDto,
  CreateRoutineRequestDto,
  RoutineResponseDto,
  RoutineTaskResponseDto,
  UpdateRoutineDto,
} from '../../core/interfaces/routine.interface';
import { DeleteRoutineUseCase } from '../../core/usecases/routines/DeleteRoutineUseCase';
import { GetRoutineByIdUseCase } from '../../core/usecases/routines/GetRoutineByIdUseCase';
import { GetRoutinesByUserIdUseCase } from '../../core/usecases/routines/GetRoutinesByUserIdUseCase';
import { UpdateRoutineUseCase } from '../../core/usecases/routines/UpdateRoutineUseCase';

export class RoutineController {
  constructor(
    private readonly createRoutineUseCase: ICreateRoutineUseCase,
    private readonly getRoutineByIdUseCase: GetRoutineByIdUseCase,
    private readonly getRoutinesByUserIdUseCase: GetRoutinesByUserIdUseCase,
    private readonly updateRoutineUseCase: UpdateRoutineUseCase,
    private readonly deleteRoutineUseCase: DeleteRoutineUseCase,
  ) {}

  public async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      // Obtener userId del token de autenticación
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      // Validar request body
      const validationError = this.validateCreateRoutineRequest(req.body);

      if (validationError.length > 0) {
        res.status(400).json({ message: 'Validation failed', errors: validationError });
        return;
      }

      const { title, defaultTimeLocal, repeatDaysJson, active, tasks, templateTasks, createTasks } = req.body;
      const routineDto: CreateRoutineDto = {
        userId: req.user.userId, // Obtener del token
        title: title.trim(),
        defaultTimeLocal,
        repeatDaysJson,
        active,
        tasks: tasks || templateTasks || createTasks, // Aceptar cualquiera de los tres nombres
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

  public async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

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

      // Verificar que la rutina pertenece al usuario autenticado
      if (routine.userId !== req.user.userId) {
        res.status(403).json({ message: 'Access denied' });
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
        tasks: routine.tasks?.map((task) => this.mapTaskToResponse(task)),
      };

      res.status(200).json({ success: true, data: routineResponse });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async getMyRoutines(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const routines = await this.getRoutinesByUserIdUseCase.execute(req.user.userId);

      const routinesResponse: RoutineResponseDto[] = routines.map((routine) => ({
        id: routine.id,
        userId: routine.userId,
        title: routine.title,
        defaultTimeLocal: routine.defaultTimeLocal,
        repeatDaysJson: routine.repeatDaysJson,
        active: routine.active,
        createdAt: routine.createdAt,
        tasks: routine.tasks?.map((task) => this.mapTaskToResponse(task)),
      }));

      res.status(200).json(routinesResponse);
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: 'Routine ID is required' });
        return;
      }

      // Verificar que la rutina existe y pertenece al usuario
      const existingRoutine = await this.getRoutineByIdUseCase.execute(id);
      if (!existingRoutine) {
        res.status(404).json({ message: 'Routine not found' });
        return;
      }

      if (existingRoutine.userId !== req.user.userId) {
        res.status(403).json({ message: 'Access denied' });
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

  public async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: 'Routine ID is required' });
        return;
      }

      // Verificar que la rutina existe y pertenece al usuario
      const existingRoutine = await this.getRoutineByIdUseCase.execute(id);
      if (!existingRoutine) {
        res.status(404).json({ message: 'Routine not found' });
        return;
      }

      if (existingRoutine.userId !== req.user.userId) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }

      await this.deleteRoutineUseCase.execute(id);
      res.status(204).json({ success: true });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  private validateCreateRoutineRequest(body: CreateRoutineRequestDto): string[] {
    const errors: string[] = [];

    // Ya no validamos userId porque viene del token

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
    } else if (body.repeatDaysJson.some((day: unknown) => typeof day !== 'number' || day < 0 || day > 7 || !Number.isInteger(day))) {
      errors.push('Repeat days must be integers between 0 (Sunday) and 7 (Sunday)');
    }

    if (body.active !== undefined && typeof body.active !== 'boolean') {
      errors.push('Active must be a boolean value');
    }

    // Validar tareas opcionales
    if (body.templateTasks !== undefined || body.createTasks !== undefined) {
      const tasks = body.templateTasks || body.createTasks;
      if (!Array.isArray(tasks)) {
        errors.push('templateTasks/createTasks must be an array');
      } else {
        tasks.forEach((task: unknown, index: number) => {
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

    // dateLocal es opcional ahora - si se proporciona debe ser válido
    if (taskObj.dateLocal !== undefined && (typeof taskObj.dateLocal !== 'string' || !this.isValidDate(taskObj.dateLocal))) {
      errors.push(`${prefix} dateLocal must be in YYYY-MM-DD format if provided`);
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
      } else if (body.repeatDaysJson.some((day: unknown) => typeof day !== 'number' || day < 0 || day > 7 || !Number.isInteger(day))) {
        errors.push('Repeat days must be integers between 0 (Sunday) and 7 (Sunday)');
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

  private mapTaskToResponse(task: RoutineTask): RoutineTaskResponseDto {
    return {
      id: task.id,
      routineId: task.routineId,
      title: task.title,
      timeLocal: task.timeLocal,
      durationMin: task.durationMin,
      category: task.category
        ? {
            id: task.category.id,
            name: task.category.name,
            description: task.category.description,
            color: task.category.color,
            icon: task.category.icon,
            active: task.category.active,
            sortOrder: task.category.sortOrder,
            createdAt: task.category.createdAt,
            updatedAt: task.category.updatedAt,
          }
        : undefined,
      priority: task.priority,
      description: task.description,
      sortOrder: task.sortOrder,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
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
