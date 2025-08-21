import { IRoutineRepository } from '@core/repositories/IRoutineRepository';
import { Routine } from '../../entities/Routine';
import { UpdateRoutineDto } from '../../interfaces/routine.interface';

export class UpdateRoutineUseCase {
  constructor(private readonly routineRepository: IRoutineRepository) {}

  async execute(id: string, updateRoutineDto: UpdateRoutineDto): Promise<Routine | null> {
    // Validar ID
    if (!id || id.trim().length === 0) {
      throw new Error('Routine ID is required');
    }

    // Validar DTO
    this.validateUpdateRoutineDto(updateRoutineDto);

    // Buscar la rutina existente
    const existingRoutine = await this.routineRepository.findById(id.trim());
    if (!existingRoutine) {
      throw new Error('Routine not found');
    }

    // Aplicar las actualizaciones
    if (updateRoutineDto.title !== undefined) {
      existingRoutine.updateTitle(updateRoutineDto.title);
    }

    if (updateRoutineDto.defaultTimeLocal !== undefined) {
      existingRoutine.updateDefaultTime(updateRoutineDto.defaultTimeLocal);
    }

    if (updateRoutineDto.repeatDaysJson !== undefined) {
      existingRoutine.updateRepeatDays(updateRoutineDto.repeatDaysJson);
    }

    if (updateRoutineDto.active !== undefined) {
      if (updateRoutineDto.active) {
        existingRoutine.activate();
      } else {
        existingRoutine.deactivate();
      }
    }

    // Guardar los cambios
    return await this.routineRepository.update(id.trim(), existingRoutine);
  }

  private validateUpdateRoutineDto(dto: UpdateRoutineDto): void {
    if (dto.title !== undefined) {
      if (!dto.title || dto.title.trim().length < 2) {
        throw new Error('Title must be at least 2 characters');
      }
      if (dto.title.length > 120) {
        throw new Error('Title cannot exceed 120 characters');
      }
    }

    if (dto.defaultTimeLocal !== undefined && dto.defaultTimeLocal && !this.isValidTime(dto.defaultTimeLocal)) {
      throw new Error('Invalid time format. Use HH:MM:SS format');
    }

    if (dto.repeatDaysJson !== undefined) {
      if (!Array.isArray(dto.repeatDaysJson) || dto.repeatDaysJson.length === 0) {
        throw new Error('Repeat days must be provided');
      }
      if (dto.repeatDaysJson.some((day) => day < 1 || day > 7 || !Number.isInteger(day))) {
        throw new Error('Repeat days must be integers between 1 (Monday) and 7 (Sunday)');
      }
    }
  }

  private isValidTime(time: string): boolean {
    const timeRegex = /^([0-1]?\d|2[0-3]):[0-5]\d:[0-5]\d$/;
    return timeRegex.test(time);
  }
}
