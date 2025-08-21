import { IRoutineRepository } from '@core/repositories/IRoutineRepository';
import { IRoutineTaskRepository } from '@core/repositories/IRoutineTaskRepository';
import { v4 as uuidv4 } from 'uuid';
import { Routine } from '../../entities/Routine';
import { RoutineTask } from '../../entities/RoutineTask';
import { CreateRoutineDto, CreateRoutineTaskForRoutineDto, RoutinePriority, RoutineTaskStatus } from '../../interfaces/routine.interface';
import { ICategoryRepository } from '../../repositories/ICategoryRepository';

export class CreateRoutineUseCase {
  constructor(
    private readonly routineRepository: IRoutineRepository,
    private readonly categoryRepository: ICategoryRepository,
    private readonly routineTaskRepository: IRoutineTaskRepository,
  ) {}

  async execute(createRoutineDto: CreateRoutineDto): Promise<Routine> {
    // Validar DTO
    this.validateCreateRoutineDto(createRoutineDto);

    const { userId, title, defaultTimeLocal, repeatDaysJson, active = true, createTasks } = createRoutineDto;

    // Crear nueva rutina
    const newRoutine = new Routine(uuidv4(), userId, title.trim(), defaultTimeLocal, repeatDaysJson, active, new Date());

    // Guardar la rutina en el repositorio
    const savedRoutine = await this.routineRepository.save(newRoutine);

    // Si se especificaron tareas a crear
    if (createTasks && createTasks.length > 0) {
      await this.createRoutineTasks(savedRoutine, createTasks);
    }

    return savedRoutine;
  }

  private async createRoutineTasks(routine: Routine, tasksToCreate: CreateRoutineTaskForRoutineDto[]): Promise<void> {
    const tasks = tasksToCreate.map(async (taskData) => {
      // Validar título
      if (!taskData.title || taskData.title.trim().length < 2) {
        throw new Error('Task title is required and must be at least 2 characters');
      }

      // Validar fecha
      if (!taskData.dateLocal || !this.isValidDate(taskData.dateLocal)) {
        throw new Error('Invalid date format for task. Use YYYY-MM-DD format');
      }

      const timeLocal = taskData.timeLocal || routine.defaultTimeLocal;
      const durationMin = taskData.durationMin; // Usar solo si se especifica explícitamente
      const priority = taskData.priority || RoutinePriority.MEDIA;
      const status = taskData.status || RoutineTaskStatus.PENDING;

      // Validar que la categoría existe si se proporciona
      let category;
      if (taskData.categoryId) {
        category = await this.categoryRepository.findById(taskData.categoryId);
        if (!category) {
          throw new Error(`Category not found for task: ${taskData.title}`);
        }
      }

      return new RoutineTask(
        uuidv4(),
        routine.id,
        routine.userId,
        taskData.title.trim(),
        taskData.dateLocal,
        timeLocal,
        durationMin,
        taskData.categoryId,
        category,
        priority,
        status,
        taskData.startedAtLocal,
        taskData.completedAtLocal,
        taskData.description,
        new Date(),
        new Date(),
      );
    });

    // Resolver todas las promesas de validación de categorías
    const resolvedTasks = await Promise.all(tasks);

    // Guardar todas las tareas
    for (const task of resolvedTasks) {
      await this.routineTaskRepository.save(task);
    }
  }

  private validateCreateRoutineDto(dto: CreateRoutineDto): void {
    if (!dto.userId || dto.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    if (!dto.title || dto.title.trim().length < 2) {
      throw new Error('Title is required and must be at least 2 characters');
    }

    if (dto.title.length > 120) {
      throw new Error('Title cannot exceed 120 characters');
    }

    if (dto.defaultTimeLocal && !this.isValidTime(dto.defaultTimeLocal)) {
      throw new Error('Invalid default time format. Use HH:MM:SS format');
    }

    if (!Array.isArray(dto.repeatDaysJson) || dto.repeatDaysJson.length === 0) {
      throw new Error('Repeat days must be provided as an array');
    }

    if (dto.repeatDaysJson.some((day) => typeof day !== 'number' || day < 1 || day > 7 || !Number.isInteger(day))) {
      throw new Error('Repeat days must be integers between 1 (Monday) and 7 (Sunday)');
    }
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
}
