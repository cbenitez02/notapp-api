import { IRoutineRepository } from '@core/repositories/IRoutineRepository';
import { IRoutineTaskRepository } from '@core/repositories/IRoutineTaskRepository';
import { v4 as uuidv4 } from 'uuid';
import { Routine } from '../../entities/Routine';
import { RoutineTask } from '../../entities/RoutineTask';
import { CreateRoutineDto, CreateRoutineTaskForRoutineDto, RoutinePriority, RoutineTaskStatus } from '../../interfaces/routine.interface';

export class CreateRoutineUseCase {
  constructor(
    private readonly routineRepository: IRoutineRepository,
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

    // Si se especificaron tareas a crear, crearlas con fechas generadas automáticamente
    if (createTasks && createTasks.length > 0) {
      await this.createRoutineTasksWithGeneratedDates(savedRoutine, createTasks);
    } else {
      // Si no se especificaron tareas, generar tareas automáticamente para los próximos 30 días
      await this.generateAutomaticTasks(savedRoutine, 30);
    }

    return savedRoutine;
  }

  private async createRoutineTasksWithGeneratedDates(routine: Routine, tasksToCreate: CreateRoutineTaskForRoutineDto[]): Promise<void> {
    // Generar fechas disponibles basándose en repeatDaysJson para los próximos 30 días
    const availableDates = this.generateAvailableDates(routine.repeatDaysJson, 30);

    for (let i = 0; i < tasksToCreate.length; i++) {
      const taskData = tasksToCreate[i];

      // Validar título
      if (!taskData.title || taskData.title.trim().length < 2) {
        throw new Error('Task title is required and must be at least 2 characters');
      }

      // Si no se especifica dateLocal, usar la siguiente fecha disponible
      let dateLocal: string;
      if (taskData.dateLocal) {
        // Validar que la fecha proporcionada sea válida
        if (!this.isValidDate(taskData.dateLocal)) {
          throw new Error(`Invalid date format for task "${taskData.title}". Use YYYY-MM-DD format`);
        }
        dateLocal = taskData.dateLocal;
      } else {
        // Usar la siguiente fecha disponible basándose en repeatDaysJson
        if (i >= availableDates.length) {
          throw new Error(
            `No more available dates for task "${taskData.title}". Maximum ${availableDates.length} tasks can be created for the configured repeat days.`,
          );
        }
        dateLocal = availableDates[i];
      }

      const timeLocal = taskData.timeLocal || routine.defaultTimeLocal;
      const priority = taskData.priority || RoutinePriority.MEDIA;
      const status = taskData.status || RoutineTaskStatus.PENDING;

      const task = new RoutineTask(
        uuidv4(),
        routine.id,
        routine.userId,
        taskData.title.trim(),
        dateLocal,
        timeLocal,
        taskData.durationMin,
        taskData.categoryId,
        undefined, // category - se resolverá en el repositorio si es necesario
        priority,
        status,
        taskData.startedAtLocal,
        taskData.completedAtLocal,
        taskData.description,
        new Date(),
        new Date(),
      );

      await this.routineTaskRepository.save(task);
    }
  }

  private generateAvailableDates(repeatDaysJson: number[], daysToGenerate: number): string[] {
    const dates: string[] = [];
    const today = new Date();
    let daysChecked = 0;
    let currentDate = new Date(today);

    while (dates.length < daysToGenerate && daysChecked < 365) {
      // Máximo 1 año
      const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();

      if (repeatDaysJson.includes(dayOfWeek)) {
        dates.push(currentDate.toISOString().split('T')[0]);
      }

      currentDate.setDate(currentDate.getDate() + 1);
      daysChecked++;
    }

    return dates;
  }

  private async generateAutomaticTasks(routine: Routine, daysToGenerate: number): Promise<void> {
    const tasks = this.generateTasksForPeriod(routine, daysToGenerate);

    // Guardar todas las tareas
    for (const task of tasks) {
      await this.routineTaskRepository.save(task);
    }
  }

  private generateTasksForPeriod(routine: Routine, days: number): RoutineTask[] {
    const tasks: RoutineTask[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);

      // Convertir día de la semana (0=Sunday, 6=Saturday) a formato (1=Monday, 7=Sunday)
      const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();

      // Si este día está en repeatDaysJson, crear tarea
      if (routine.repeatDaysJson.includes(dayOfWeek)) {
        const dateLocal = currentDate.toISOString().split('T')[0]; // "2025-08-21"

        const task = new RoutineTask(
          uuidv4(),
          routine.id,
          routine.userId,
          routine.title, // Usar el título de la rutina
          dateLocal,
          routine.defaultTimeLocal,
          undefined, // durationMin - sin valor por defecto
          undefined, // categoryId - sin categoría por defecto
          undefined, // category - sin categoría por defecto
          RoutinePriority.MEDIA, // prioridad por defecto
          RoutineTaskStatus.PENDING, // estado inicial
          undefined, // startedAtLocal
          undefined, // completedAtLocal
          undefined, // description
          new Date(), // createdAt
          new Date(), // updatedAt
        );

        tasks.push(task);
      }
    }

    return tasks;
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
