import { IDailySummaryRepository } from '@core/repositories/IDailySummaryRepository';
import { DailySummary } from '../../entities/DailySummary';
import { UpdateDailySummaryDto } from '../../interfaces/routine.interface';

export class UpdateDailySummaryUseCase {
  constructor(private readonly dailySummaryRepository: IDailySummaryRepository) {}

  async execute(id: string, updateDailySummaryDto: UpdateDailySummaryDto): Promise<DailySummary | null> {
    // Validar ID
    if (!id || id.trim().length === 0) {
      throw new Error('DailySummary ID is required');
    }

    // Validar DTO
    this.validateUpdateDailySummaryDto(updateDailySummaryDto);

    // Buscar el resumen existente
    const existingSummary = await this.dailySummaryRepository.findById(id.trim());
    if (!existingSummary) {
      throw new Error('DailySummary not found');
    }

    // Aplicar las actualizaciones usando el método de dominio
    if (this.hasTaskCountUpdates(updateDailySummaryDto)) {
      existingSummary.updateTaskCount(
        updateDailySummaryDto.totalCompleted ?? existingSummary.totalCompleted,
        updateDailySummaryDto.totalMissed ?? existingSummary.totalMissed,
        updateDailySummaryDto.totalInProgress ?? existingSummary.totalInProgress,
        updateDailySummaryDto.totalPending ?? existingSummary.totalPending,
        updateDailySummaryDto.totalSkipped ?? existingSummary.totalSkipped,
      );
    } else if (updateDailySummaryDto.progressPercent !== undefined) {
      // Solo actualizar el progreso si no se actualizaron los contadores
      existingSummary.progressPercent = updateDailySummaryDto.progressPercent;
    }

    // Guardar los cambios
    return await this.dailySummaryRepository.update(id.trim(), existingSummary);
  }

  private hasTaskCountUpdates(dto: UpdateDailySummaryDto): boolean {
    return (
      dto.totalCompleted !== undefined ||
      dto.totalMissed !== undefined ||
      dto.totalInProgress !== undefined ||
      dto.totalPending !== undefined ||
      dto.totalSkipped !== undefined
    );
  }

  private validateUpdateDailySummaryDto(dto: UpdateDailySummaryDto): void {
    if (dto.totalCompleted !== undefined && dto.totalCompleted < 0) {
      throw new Error('Total completed cannot be negative');
    }

    if (dto.totalMissed !== undefined && dto.totalMissed < 0) {
      throw new Error('Total missed cannot be negative');
    }

    if (dto.totalInProgress !== undefined && dto.totalInProgress < 0) {
      throw new Error('Total in progress cannot be negative');
    }

    if (dto.totalPending !== undefined && dto.totalPending < 0) {
      throw new Error('Total pending cannot be negative');
    }

    if (dto.totalSkipped !== undefined && dto.totalSkipped < 0) {
      throw new Error('Total skipped cannot be negative');
    }

    if (dto.progressPercent !== undefined && (dto.progressPercent < 0 || dto.progressPercent > 100)) {
      throw new Error('Progress percent must be between 0 and 100');
    }
  }
}
