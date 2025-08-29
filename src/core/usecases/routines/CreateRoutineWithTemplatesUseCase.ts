import { v4 as uuidv4 } from 'uuid';
import { Routine } from '../../entities/Routine';
import { RoutineTask } from '../../entities/RoutineTask';
import { ICreateRoutineUseCase } from '../../interfaces/ICreateRoutineUseCase';
import { CreateRoutineDto, CreateRoutineTaskDto, RoutinePriority } from '../../interfaces/routine.interface';
import { IRoutineRepository } from '../../repositories/IRoutineRepository';
import { IRoutineTaskRepository } from '../../repositories/IRoutineTaskRepository';

export class CreateRoutineWithTemplatesUseCase implements ICreateRoutineUseCase {
  constructor(
    private readonly routineRepository: IRoutineRepository,
    private readonly routineTaskRepository: IRoutineTaskRepository,
  ) {}

  async execute(createRoutineDto: CreateRoutineDto): Promise<Routine> {
    // Validar DTO
    this.validateCreateRoutineDto(createRoutineDto);

    const { userId, title, defaultTimeLocal, repeatDaysJson, active = true, tasks } = createRoutineDto;

    // Crear nueva rutina
    const newRoutine = new Routine(uuidv4(), userId, title.trim(), defaultTimeLocal, repeatDaysJson, active, new Date());

    // Guardar la rutina en el repositorio
    const savedRoutine = await this.routineRepository.save(newRoutine);

    // Si se especificaron tareas, crearlas
    if (tasks && tasks.length > 0) {
      await this.createTasksForRoutine(savedRoutine, tasks);
    }

    return savedRoutine;
  }

  private async createTasksForRoutine(routine: Routine, tasksToCreate: CreateRoutineTaskDto[]): Promise<void> {
    for (let i = 0; i < tasksToCreate.length; i++) {
      const taskData = tasksToCreate[i];

      // Validar título
      if (!taskData.title || taskData.title.trim().length < 2) {
        throw new Error('Task title is required and must be at least 2 characters');
      }

      const timeLocal = taskData.timeLocal || routine.defaultTimeLocal;
      const priority = taskData.priority || RoutinePriority.MEDIA;
      const sortOrder = taskData.sortOrder ?? i;

      const task = new RoutineTask(
        uuidv4(),
        routine.id,
        taskData.title.trim(),
        timeLocal,
        taskData.durationMin,
        taskData.categoryId,
        undefined, // category - se resolverá en el repositorio si es necesario
        priority,
        taskData.description,
        sortOrder,
        new Date(),
        new Date(),
      );

      await this.routineTaskRepository.create(task);
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

    if (dto.repeatDaysJson.some((day) => typeof day !== 'number' || day < 0 || day > 7 || !Number.isInteger(day))) {
      throw new Error('Repeat days must be integers between 0 (Sunday) and 7 (Sunday)');
    }
  }

  private isValidTime(time: string): boolean {
    const timeRegex = /^([0-1]?\d|2[0-3]):[0-5]\d:[0-5]\d$/;
    return timeRegex.test(time);
  }
}
