import { Request, Response } from 'express';
import { CreateRoutineTaskDto, RoutineTaskFilters, RoutineTaskResponseDto, UpdateRoutineTaskDto } from '../../core/interfaces/routine.interface';
import { CreateRoutineTaskUseCase } from '../../core/usecases/routine_tasks/CreateRoutineTaskUseCase';
import { DeleteRoutineTaskUseCase } from '../../core/usecases/routine_tasks/DeleteRoutineTaskUseCase';
import { GetRoutineTaskByIdUseCase } from '../../core/usecases/routine_tasks/GetRoutineTaskByIdUseCase';
import { GetRoutineTasksByFiltersUseCase } from '../../core/usecases/routine_tasks/GetRoutineTasksByFiltersUseCase';
import { GetRoutineTasksByUserIdUseCase } from '../../core/usecases/routine_tasks/GetRoutineTasksByUserIdUseCase';
import { UpdateRoutineTaskUseCase } from '../../core/usecases/routine_tasks/UpdateRoutineTaskUseCase';

export class RoutineTaskController {
  constructor(
    private readonly createRoutineTaskUseCase: CreateRoutineTaskUseCase,
    private readonly getRoutineTaskByIdUseCase: GetRoutineTaskByIdUseCase,
    private readonly getRoutineTasksByUserIdUseCase: GetRoutineTasksByUserIdUseCase,
    private readonly getRoutineTasksByFiltersUseCase: GetRoutineTasksByFiltersUseCase,
    private readonly updateRoutineTaskUseCase: UpdateRoutineTaskUseCase,
    private readonly deleteRoutineTaskUseCase: DeleteRoutineTaskUseCase,
  ) {}

  public async create(req: Request, res: Response): Promise<void> {
    try {
      // Validar request body
      const validationError = this.validateCreateRoutineTaskRequest(req.body);

      if (validationError.length > 0) {
        res.status(400).json({ message: 'Validation failed', errors: validationError });
        return;
      }

      const { routineId, userId, dateLocal, timeLocal, durationMin } = req.body;
      const routineTaskDto: CreateRoutineTaskDto = {
        routineId: routineId.trim(),
        userId: userId.trim(),
        dateLocal: dateLocal.trim(),
        timeLocal,
        durationMin,
      };

      const routineTask = await this.createRoutineTaskUseCase.execute(routineTaskDto);

      const routineTaskResponse: RoutineTaskResponseDto = {
        id: routineTask.id,
        routineId: routineTask.routineId,
        userId: routineTask.userId,
        title: routineTask.title,
        dateLocal: routineTask.dateLocal,
        timeLocal: routineTask.timeLocal,
        durationMin: routineTask.durationMin,
        priority: routineTask.priority,
        status: routineTask.status,
        startedAtLocal: routineTask.startedAtLocal,
        completedAtLocal: routineTask.completedAtLocal,
        description: routineTask.description,
        createdAt: routineTask.createdAt,
        updatedAt: routineTask.updatedAt,
      };

      res.status(201).json({ success: true, data: routineTaskResponse });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: 'RoutineTask ID is required' });
        return;
      }

      const routineTask = await this.getRoutineTaskByIdUseCase.execute(id);

      if (!routineTask) {
        res.status(404).json({ message: 'RoutineTask not found' });
        return;
      }

      const routineTaskResponse: RoutineTaskResponseDto = {
        id: routineTask.id,
        routineId: routineTask.routineId,
        userId: routineTask.userId,
        title: routineTask.title,
        dateLocal: routineTask.dateLocal,
        timeLocal: routineTask.timeLocal,
        durationMin: routineTask.durationMin,
        priority: routineTask.priority,
        status: routineTask.status,
        startedAtLocal: routineTask.startedAtLocal,
        completedAtLocal: routineTask.completedAtLocal,
        description: routineTask.description,
        createdAt: routineTask.createdAt,
        updatedAt: routineTask.updatedAt,
      };

      res.status(200).json({ success: true, data: routineTaskResponse });
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

      const routineTasks = await this.getRoutineTasksByUserIdUseCase.execute(userId);

      const routineTasksResponse: RoutineTaskResponseDto[] = routineTasks.map((routineTask) => ({
        id: routineTask.id,
        routineId: routineTask.routineId,
        userId: routineTask.userId,
        title: routineTask.title,
        dateLocal: routineTask.dateLocal,
        timeLocal: routineTask.timeLocal,
        durationMin: routineTask.durationMin,
        priority: routineTask.priority,
        status: routineTask.status,
        startedAtLocal: routineTask.startedAtLocal,
        completedAtLocal: routineTask.completedAtLocal,
        description: routineTask.description,
        createdAt: routineTask.createdAt,
        updatedAt: routineTask.updatedAt,
      }));

      res.status(200).json({ success: true, data: routineTasksResponse });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async getByFilters(req: Request, res: Response): Promise<void> {
    try {
      const filters: RoutineTaskFilters = req.query as unknown as RoutineTaskFilters;

      // Validar filtros
      const validationError = this.validateFilters(filters);
      if (validationError.length > 0) {
        res.status(400).json({ message: 'Validation failed', errors: validationError });
        return;
      }

      const routineTasks = await this.getRoutineTasksByFiltersUseCase.execute(filters);

      const routineTasksResponse: RoutineTaskResponseDto[] = routineTasks.map((routineTask) => ({
        id: routineTask.id,
        routineId: routineTask.routineId,
        userId: routineTask.userId,
        title: routineTask.title,
        dateLocal: routineTask.dateLocal,
        timeLocal: routineTask.timeLocal,
        durationMin: routineTask.durationMin,
        priority: routineTask.priority,
        status: routineTask.status,
        startedAtLocal: routineTask.startedAtLocal,
        completedAtLocal: routineTask.completedAtLocal,
        description: routineTask.description,
        createdAt: routineTask.createdAt,
        updatedAt: routineTask.updatedAt,
      }));

      res.status(200).json({ success: true, data: routineTasksResponse });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: 'RoutineTask ID is required' });
        return;
      }

      // Validar request body
      const validationError = this.validateUpdateRoutineTaskRequest(req.body);

      if (validationError.length > 0) {
        res.status(400).json({ message: 'Validation failed', errors: validationError });
        return;
      }

      const updateDto: UpdateRoutineTaskDto = req.body;

      const routineTask = await this.updateRoutineTaskUseCase.execute(id, updateDto);

      if (!routineTask) {
        res.status(404).json({ message: 'RoutineTask not found' });
        return;
      }

      const routineTaskResponse: RoutineTaskResponseDto = {
        id: routineTask.id,
        routineId: routineTask.routineId,
        userId: routineTask.userId,
        title: routineTask.title,
        dateLocal: routineTask.dateLocal,
        timeLocal: routineTask.timeLocal,
        durationMin: routineTask.durationMin,
        priority: routineTask.priority,
        status: routineTask.status,
        startedAtLocal: routineTask.startedAtLocal,
        completedAtLocal: routineTask.completedAtLocal,
        description: routineTask.description,
        createdAt: routineTask.createdAt,
        updatedAt: routineTask.updatedAt,
      };

      res.status(200).json({ success: true, data: routineTaskResponse });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: 'RoutineTask ID is required' });
        return;
      }

      await this.deleteRoutineTaskUseCase.execute(id);
      res.status(204).json({ success: true });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  private validateCreateRoutineTaskRequest(body: CreateRoutineTaskDto): string[] {
    const errors: string[] = [];

    if (!body.routineId || typeof body.routineId !== 'string' || body.routineId.trim().length === 0) {
      errors.push('Routine ID is required');
    }

    if (!body.userId || typeof body.userId !== 'string' || body.userId.trim().length === 0) {
      errors.push('User ID is required');
    }

    if (!body.dateLocal || typeof body.dateLocal !== 'string' || !this.isValidDate(body.dateLocal)) {
      errors.push('Valid date is required. Use YYYY-MM-DD format');
    }

    if (body.timeLocal && (typeof body.timeLocal !== 'string' || !this.isValidTime(body.timeLocal))) {
      errors.push('Time must be in HH:MM:SS format');
    }

    if (body.durationMin && (typeof body.durationMin !== 'number' || body.durationMin < 1 || body.durationMin > 1440)) {
      errors.push('Duration must be a number between 1 and 1440 minutes');
    }

    return errors;
  }

  private validateUpdateRoutineTaskRequest(body: UpdateRoutineTaskDto): string[] {
    const errors: string[] = [];

    if (body.timeLocal !== undefined && body.timeLocal !== null && (typeof body.timeLocal !== 'string' || !this.isValidTime(body.timeLocal))) {
      errors.push('Time must be in HH:MM:SS format');
    }

    if (
      body.durationMin !== undefined &&
      body.durationMin !== null &&
      (typeof body.durationMin !== 'number' || body.durationMin < 1 || body.durationMin > 1440)
    ) {
      errors.push('Duration must be a number between 1 and 1440 minutes');
    }

    if (body.description !== undefined && body.description !== null && (typeof body.description !== 'string' || body.description.length > 500)) {
      errors.push('Description must be a string and cannot exceed 500 characters');
    }

    if (body.status !== undefined && !['pending', 'in_progress', 'completed', 'skipped'].includes(body.status)) {
      errors.push('Status must be one of: pending, in_progress, completed, skipped');
    }

    return errors;
  }

  private validateFilters(filters: RoutineTaskFilters): string[] {
    const errors: string[] = [];

    if (filters.dateLocal && !this.isValidDate(filters.dateLocal)) {
      errors.push('Invalid dateLocal format. Use YYYY-MM-DD format');
    }

    if (filters.dateFrom && !this.isValidDate(filters.dateFrom)) {
      errors.push('Invalid dateFrom format. Use YYYY-MM-DD format');
    }

    if (filters.dateTo && !this.isValidDate(filters.dateTo)) {
      errors.push('Invalid dateTo format. Use YYYY-MM-DD format');
    }

    if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
      errors.push('dateFrom cannot be after dateTo');
    }

    if (filters.status && !['pending', 'in_progress', 'completed', 'skipped'].includes(filters.status)) {
      errors.push('Status must be one of: pending, in_progress, completed, skipped');
    }

    return errors;
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

  private handleError(error: unknown, res: Response): void {
    console.error('RoutineTaskController error:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        res.status(404).json({ message: error.message });
      } else if (error.message.includes('already exists')) {
        res.status(409).json({ message: error.message });
      } else if (
        error.message.includes('required') ||
        error.message.includes('must be') ||
        error.message.includes('cannot') ||
        error.message.includes('Invalid')
      ) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}
