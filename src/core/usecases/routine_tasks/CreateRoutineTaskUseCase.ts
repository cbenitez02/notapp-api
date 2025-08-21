import { IRoutineRepository } from '@core/repositories/IRoutineRepository';
import { IRoutineTaskRepository } from '@core/repositories/IRoutineTaskRepository';
import { v4 as uuidv4 } from 'uuid';
import { RoutineTask } from '../../entities/RoutineTask';
import { CreateRoutineTaskDto, RoutinePriority, RoutineTaskStatus } from '../../interfaces/routine.interface';

export class CreateRoutineTaskUseCase {
  constructor(
    private readonly routineTaskRepository: IRoutineTaskRepository,
    private readonly routineRepository: IRoutineRepository,
  ) {}

  async execute(createRoutineTaskDto: CreateRoutineTaskDto): Promise<RoutineTask> {
    // Validar DTO
    this.validateCreateRoutineTaskDto(createRoutineTaskDto);

    const { routineId, userId, dateLocal, timeLocal, durationMin } = createRoutineTaskDto;

    // Verificar que la rutina existe
    const routine = await this.routineRepository.findById(routineId);
    if (!routine) {
      throw new Error('Routine not found');
    }

    // Verificar que la rutina pertenece al usuario
    if (routine.userId !== userId) {
      throw new Error('Routine does not belong to the specified user');
    }

    // Verificar que no existe ya una tarea para esa rutina y fecha
    const existingTask = await this.routineTaskRepository.existsByRoutineAndDate(routineId, dateLocal);
    if (existingTask) {
      throw new Error('A task already exists for this routine and date');
    }

    // Crear nueva tarea de rutina
    const newRoutineTask = new RoutineTask(
      uuidv4(),
      routineId,
      userId,
      routine.title, // usar título de la rutina como default
      dateLocal,
      timeLocal,
      durationMin,
      undefined, // categoryId - null por defecto
      undefined, // category - se carga por separado si se necesita
      RoutinePriority.MEDIA, // prioridad por defecto
      RoutineTaskStatus.PENDING,
      undefined, // startedAtLocal
      undefined, // completedAtLocal
      undefined, // description
      new Date(), // createdAt
      new Date(), // updatedAt
    );

    // Guardar la tarea en el repositorio
    return await this.routineTaskRepository.save(newRoutineTask);
  }

  private validateCreateRoutineTaskDto(dto: CreateRoutineTaskDto): void {
    if (!dto.routineId || dto.routineId.trim().length === 0) {
      throw new Error('Routine ID is required');
    }

    if (!dto.userId || dto.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    if (!dto.dateLocal || !this.isValidDate(dto.dateLocal)) {
      throw new Error('Valid date is required. Use YYYY-MM-DD format');
    }

    if (dto.timeLocal && !this.isValidTime(dto.timeLocal)) {
      throw new Error('Invalid time format. Use HH:MM:SS format');
    }

    if (dto.durationMin && (dto.durationMin < 1 || dto.durationMin > 1440)) {
      throw new Error('Duration must be between 1 and 1440 minutes');
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
