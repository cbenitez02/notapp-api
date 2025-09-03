import { Response } from 'express';
import { RoutineTask } from '../../core/entities/RoutineTask';
import { RoutineTaskProgress } from '../../core/entities/RoutineTaskProgress';
import { AuthRequest } from '../../core/interfaces/auth.interface';
import { ICreateRoutineUseCase } from '../../core/interfaces/ICreateRoutineUseCase';
import {
  CreateRoutineDto,
  CreateRoutineRequestDto,
  CreateRoutineTaskDto,
  CreateTaskInRoutineRequestDto,
  DailyTaskResponseDto,
  RoutineResponseDto,
  RoutineTaskResponseDto,
  RoutineTaskStatus,
  UpdateRoutineDto,
} from '../../core/interfaces/routine.interface';
import { IRoutineTaskProgressRepository } from '../../core/repositories/IRoutineTaskProgressRepository';
import { IRoutineTaskRepository } from '../../core/repositories/IRoutineTaskRepository';
import { CreateTaskInRoutineUseCase } from '../../core/usecases/routines/CreateTaskInRoutineUseCase';
import { DeleteRoutineUseCase } from '../../core/usecases/routines/DeleteRoutineUseCase';
import { GetRoutineByIdUseCase } from '../../core/usecases/routines/GetRoutineByIdUseCase';
import { GetRoutinesByUserIdUseCase } from '../../core/usecases/routines/GetRoutinesByUserIdUseCase';
import { TaskStatusService } from '../../core/usecases/routines/TaskStatusService';
import { UpdateRoutineUseCase } from '../../core/usecases/routines/UpdateRoutineUseCase';

export class RoutineController {
  constructor(
    private readonly createRoutineUseCase: ICreateRoutineUseCase,
    private readonly getRoutineByIdUseCase: GetRoutineByIdUseCase,
    private readonly getRoutinesByUserIdUseCase: GetRoutinesByUserIdUseCase,
    private readonly updateRoutineUseCase: UpdateRoutineUseCase,
    private readonly deleteRoutineUseCase: DeleteRoutineUseCase,
    private readonly progressRepository: IRoutineTaskProgressRepository,
    private readonly routineTaskRepository: IRoutineTaskRepository,
    private readonly taskStatusService: TaskStatusService,
    private readonly createTaskInRoutineUseCase: CreateTaskInRoutineUseCase,
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

      const { title, icon, defaultTimeLocal, repeatDaysJson, active, tasks, templateTasks, createTasks } = req.body;
      const routineDto: CreateRoutineDto = {
        userId: req.user.userId, // Obtener del token
        title: title.trim(),
        icon: icon,
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
        icon: routine.icon,
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
        icon: routine.icon,
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
        icon: routine.icon,
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

  public async getTasksForDay(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      // Obtener el día de la semana del query parameter (opcional)
      const dayOfWeekParam = req.query.dayOfWeek as string;
      let dayOfWeek: number;

      if (dayOfWeekParam) {
        dayOfWeek = parseInt(dayOfWeekParam);
        if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
          res.status(400).json({ message: 'dayOfWeek must be a number between 1 (Monday) and 7 (Sunday)' });
          return;
        }
      } else {
        // Si no se especifica, usar el día actual
        const today = new Date();
        const day = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
        dayOfWeek = day === 0 ? 7 : day; // Convertir a 1=Monday, 7=Sunday
      }

      // Obtener todas las rutinas del usuario
      const routines = await this.getRoutinesByUserIdUseCase.execute(req.user.userId);

      // Filtrar rutinas activas que corresponden al día de la semana
      const activeRoutinesForDay = routines.filter((routine) => routine.active && routine.repeatDaysJson.includes(dayOfWeek));

      // Recopilar todas las tareas de las rutinas activas
      const allTasks: RoutineTaskResponseDto[] = [];

      for (const routine of activeRoutinesForDay) {
        if (routine.tasks) {
          const tasksWithRoutineInfo = await Promise.all(
            routine.tasks.map(async (task) => {
              // Obtener el progreso/estado de la tarea para hoy
              const today = new Date();
              const todayStr = today.toISOString().split('T')[0];

              const progress = await this.progressRepository.findByTaskAndDate(task.id, todayStr);
              let status: RoutineTaskStatus = RoutineTaskStatus.PENDING;

              if (progress) {
                status = progress.status;
              } else {
                // Si no hay progreso, determinar el estado basado en la hora actual
                const taskTime = task.timeLocal;
                if (taskTime) {
                  const [hours, minutes] = taskTime.split(':').map(Number);
                  const taskDateTime = new Date(today);
                  taskDateTime.setHours(hours, minutes, 0, 0);

                  if (today > taskDateTime) {
                    status = RoutineTaskStatus.MISSED;
                  }
                }
              }

              return {
                ...this.mapTaskToResponse(task),
                routineName: routine.title,
                status: status,
              };
            }),
          );
          allTasks.push(...tasksWithRoutineInfo);
        }
      }

      // Ordenar tareas por hora (timeLocal)
      allTasks.sort((a, b) => {
        const timeA = a.timeLocal || '23:59:59'; // Las tareas sin hora van al final
        const timeB = b.timeLocal || '23:59:59';
        return timeA.localeCompare(timeB);
      });

      res.status(200).json({
        dayOfWeek: dayOfWeek,
        dayName: this.getDayName(dayOfWeek),
        tasks: allTasks,
        totalTasks: allTasks.length,
        routinesCount: activeRoutinesForDay.length,
      });
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
        icon: routine.icon,
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

  /**
   * Crea una nueva tarea en una rutina existente
   * POST /routines/:id/tasks
   */
  public async createTaskInRoutine(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const { id: routineId } = req.params;
      if (!routineId) {
        res.status(400).json({ message: 'Routine ID is required' });
        return;
      }

      // Validar request body
      const validationErrors = this.validateCreateTaskInRoutineRequest(req.body);
      if (validationErrors.length > 0) {
        res.status(400).json({ message: 'Validation failed', errors: validationErrors });
        return;
      }

      const taskDto: CreateRoutineTaskDto = req.body;

      // Crear la tarea
      const createdTask = await this.createTaskInRoutineUseCase.execute(routineId, req.user.userId, taskDto);

      // Mapear la respuesta
      const taskResponse: RoutineTaskResponseDto = this.mapTaskToResponse(createdTask);

      res.status(201).json({ success: true, data: taskResponse });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  /**
   * Obtiene las rutinas del usuario para selección (formato ligero)
   * GET /routines/user/selector
   */
  public async getRoutinesForSelector(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const routines = await this.getRoutinesByUserIdUseCase.execute(req.user.userId);

      // Mapear a formato ligero para selector
      const routineOptions = routines
        .filter((routine) => routine.active) // Solo rutinas activas
        .map((routine) => ({
          id: routine.id,
          title: routine.title,
          icon: routine.icon,
          taskCount: routine.tasks?.length || 0,
        }));

      res.status(200).json({ success: true, data: routineOptions });
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

    if (typeof body.icon !== 'number' || body.icon < 0) {
      errors.push('Icon is required and must be a positive number');
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

    if (body.icon !== undefined && (typeof body.icon !== 'number' || body.icon < 0)) {
      errors.push('Icon must be a positive number');
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

  private validateCreateTaskInRoutineRequest(body: CreateTaskInRoutineRequestDto): string[] {
    const errors: string[] = [];

    if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 2) {
      errors.push('Title is required and must be at least 2 characters');
    }

    if (body.title && body.title.length > 120) {
      errors.push('Title cannot exceed 120 characters');
    }

    if (body.timeLocal && (typeof body.timeLocal !== 'string' || !this.isValidTime(body.timeLocal))) {
      errors.push('timeLocal must be in HH:MM:SS format if provided');
    }

    if (body.durationMin !== undefined && (typeof body.durationMin !== 'number' || body.durationMin < 1 || body.durationMin > 1440)) {
      errors.push('durationMin must be a number between 1 and 1440 minutes if provided');
    }

    if (body.categoryId !== undefined && (typeof body.categoryId !== 'string' || body.categoryId.trim().length === 0)) {
      errors.push('categoryId must be a non-empty string if provided');
    }

    if (body.description && (typeof body.description !== 'string' || body.description.length > 500)) {
      errors.push('description must be a string with maximum 500 characters if provided');
    }

    if (body.sortOrder !== undefined && (typeof body.sortOrder !== 'number' || body.sortOrder < 0)) {
      errors.push('sortOrder must be a non-negative number if provided');
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
      routineName: task.routineName,
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

  private getDayName(dayOfWeek: number): string {
    const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return dayNames[dayOfWeek] || 'Unknown';
  }

  /**
   * Obtiene las tareas del día para un usuario por fecha específica
   * GET /routines/tasks-for-date?date=2025-09-01
   */
  public async getTasksForDate(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const dateLocal = (req.query.date as string) || this.getTodayDateLocal();

      // Validar formato de fecha
      if (!this.isValidDate(dateLocal)) {
        res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
        return;
      }

      // Primero actualizar las tareas del día (resetear si es necesario, marcar expiradas)
      await this.taskStatusService.updateDailyTaskStatuses(req.user.userId);

      // Obtener las tareas del día con su progreso
      const taskProgresses = await this.progressRepository.findByUserIdAndDate(req.user.userId, dateLocal);

      const dailyTasks: DailyTaskResponseDto[] = [];

      for (const progress of taskProgresses) {
        const routineTask = await this.routineTaskRepository.findById(progress.routineTemplateTaskId);

        if (routineTask) {
          const dailyTask: DailyTaskResponseDto = {
            id: progress.id,
            routineTaskId: routineTask.id,
            routineId: routineTask.routineId,
            routineName: routineTask.routineName || 'Unknown Routine',
            title: routineTask.title,
            timeLocal: routineTask.timeLocal,
            durationMin: routineTask.durationMin,
            category: routineTask.category
              ? {
                  id: routineTask.category.id,
                  name: routineTask.category.name,
                  description: routineTask.category.description,
                  color: routineTask.category.color,
                  icon: routineTask.category.icon,
                  active: routineTask.category.active,
                  sortOrder: routineTask.category.sortOrder,
                  createdAt: routineTask.category.createdAt,
                  updatedAt: routineTask.category.updatedAt,
                }
              : undefined,
            priority: routineTask.priority,
            description: routineTask.description,
            status: progress.status,
            dateLocal: progress.dateLocal,
            startedAtLocal: progress.startedAtLocal,
            completedAtLocal: progress.completedAtLocal,
            notes: progress.notes,
            createdAt: progress.createdAt,
            updatedAt: progress.updatedAt,
          };

          dailyTasks.push(dailyTask);
        }
      }

      // Ordenar por sortOrder y luego por timeLocal
      dailyTasks.sort((a, b) => {
        const timeA = a.timeLocal || '23:59:59';
        const timeB = b.timeLocal || '23:59:59';
        return timeA.localeCompare(timeB);
      });

      res.status(200).json({
        success: true,
        data: {
          date: dateLocal,
          tasks: dailyTasks,
          summary: this.calculateDailySummary(dailyTasks),
        },
      });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  /**
   * Actualiza el estado de una tarea
   * PUT /routines/tasks/:id/status
   */
  public async updateTaskStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const { status, notes } = req.body;

      // Validar que el estado sea válido
      if (!Object.values(RoutineTaskStatus).includes(status)) {
        res.status(400).json({ message: 'Invalid status' });
        return;
      }

      // Verificar que la tarea existe y pertenece al usuario
      const taskProgress = await this.progressRepository.findById(id);
      if (!taskProgress) {
        res.status(404).json({ message: 'Task not found' });
        return;
      }

      if (taskProgress.userId !== req.user.userId) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }

      // Crear una nueva instancia de RoutineTaskProgress con los datos actualizados
      const updatedTaskProgress = new RoutineTaskProgress(
        taskProgress.id,
        taskProgress.routineTemplateTaskId,
        taskProgress.userId,
        taskProgress.dateLocal,
        taskProgress.status,
        taskProgress.startedAtLocal,
        taskProgress.completedAtLocal,
        taskProgress.notes,
        taskProgress.createdAt,
        new Date(), // updated_at
      );

      switch (status) {
        case RoutineTaskStatus.IN_PROGRESS:
          updatedTaskProgress.start();
          break;
        case RoutineTaskStatus.COMPLETED:
          updatedTaskProgress.complete();
          break;
        case RoutineTaskStatus.SKIPPED:
          updatedTaskProgress.skip();
          break;
        case RoutineTaskStatus.PENDING:
          updatedTaskProgress.reset();
          break;
        default:
          updatedTaskProgress.status = status;
      }

      if (notes !== undefined) {
        updatedTaskProgress.updateNotes(notes);
      }

      await this.progressRepository.update(updatedTaskProgress);

      res.status(200).json({ success: true, message: 'Task status updated successfully' });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  /**
   * Fuerza la actualización de tareas expiradas
   * POST /routines/tasks/update-expired
   */
  public async updateExpiredTasks(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      await this.taskStatusService.updateExpiredTasks(req.user.userId);

      res.status(200).json({ success: true, message: 'Expired tasks updated successfully' });
    } catch (error: unknown) {
      this.handleError(error, res);
    }
  }

  private getTodayDateLocal(): string {
    return new Date().toISOString().split('T')[0];
  }

  private calculateDailySummary(tasks: DailyTaskResponseDto[]) {
    const summary = {
      total: tasks.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      skipped: 0,
      missed: 0,
    };

    tasks.forEach((task) => {
      switch (task.status) {
        case RoutineTaskStatus.PENDING:
          summary.pending++;
          break;
        case RoutineTaskStatus.IN_PROGRESS:
          summary.inProgress++;
          break;
        case RoutineTaskStatus.COMPLETED:
          summary.completed++;
          break;
        case RoutineTaskStatus.SKIPPED:
          summary.skipped++;
          break;
        case RoutineTaskStatus.MISSED:
          summary.missed++;
          break;
      }
    });

    return summary;
  }
}
