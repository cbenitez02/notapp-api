import { IRoutineTaskRepository } from '@core/repositories/IRoutineTaskRepository';
import { RoutineTask } from '../../entities/RoutineTask';
import { UpdateRoutineTaskDto } from '../../interfaces/routine.interface';

export class UpdateRoutineTaskUseCase {
  constructor(private readonly routineTaskRepository: IRoutineTaskRepository) {}

  async execute(id: string, updateRoutineTaskDto: UpdateRoutineTaskDto): Promise<RoutineTask | null> {
    // Validar ID
    if (!id || id.trim().length === 0) {
      throw new Error('RoutineTask ID is required');
    }

    // Validar DTO
    this.validateUpdateRoutineTaskDto(updateRoutineTaskDto);

    // Buscar la tarea existente
    const existingTask = await this.routineTaskRepository.findById(id.trim());
    if (!existingTask) {
      throw new Error('RoutineTask not found');
    }

    // Aplicar las actualizaciones
    if (updateRoutineTaskDto.timeLocal !== undefined) {
      existingTask.updateTime(updateRoutineTaskDto.timeLocal);
    }

    if (updateRoutineTaskDto.durationMin !== undefined) {
      existingTask.updateDuration(updateRoutineTaskDto.durationMin);
    }

    if (updateRoutineTaskDto.description !== undefined) {
      existingTask.updateDescription(updateRoutineTaskDto.description);
    }

    // Actualizar estado y fechas relacionadas
    if (updateRoutineTaskDto.status !== undefined) {
      this.updateTaskStatus(existingTask, updateRoutineTaskDto);
    } else {
      // Si no se especifica estado, actualizar fechas individuales
      if (updateRoutineTaskDto.startedAtLocal !== undefined) {
        existingTask.startedAtLocal = updateRoutineTaskDto.startedAtLocal;
      }

      if (updateRoutineTaskDto.completedAtLocal !== undefined) {
        existingTask.completedAtLocal = updateRoutineTaskDto.completedAtLocal;
      }
    }

    // Guardar los cambios
    return await this.routineTaskRepository.update(id.trim(), existingTask);
  }

  private updateTaskStatus(task: RoutineTask, dto: UpdateRoutineTaskDto): void {
    switch (dto.status) {
      case 'pending':
        task.reset();
        break;
      case 'in_progress':
        task.start();
        break;
      case 'completed':
        task.complete();
        break;
      case 'skipped':
        task.skip();
        break;
      default:
        throw new Error('Invalid status provided');
    }

    // Sobrescribir fechas si se proporcionan explícitamente
    if (dto.startedAtLocal !== undefined) {
      task.startedAtLocal = dto.startedAtLocal;
    }

    if (dto.completedAtLocal !== undefined) {
      task.completedAtLocal = dto.completedAtLocal;
    }
  }

  private validateUpdateRoutineTaskDto(dto: UpdateRoutineTaskDto): void {
    if (dto.timeLocal !== undefined && dto.timeLocal !== null && !this.isValidTime(dto.timeLocal)) {
      throw new Error('Invalid time format. Use HH:MM:SS format');
    }

    if (dto.durationMin !== undefined && dto.durationMin !== null && (dto.durationMin < 1 || dto.durationMin > 1440)) {
      throw new Error('Duration must be between 1 and 1440 minutes');
    }

    if (dto.description !== undefined && dto.description !== null && dto.description.length > 500) {
      throw new Error('Description cannot exceed 500 characters');
    }

    if (dto.startedAtLocal && dto.completedAtLocal && dto.startedAtLocal > dto.completedAtLocal) {
      throw new Error('Started date cannot be after completed date');
    }
  }

  private isValidTime(time: string): boolean {
    const timeRegex = /^([0-1]?\d|2[0-3]):[0-5]\d:[0-5]\d$/;
    return timeRegex.test(time);
  }
}
