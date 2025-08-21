import { IDailySummaryRepository } from '@core/repositories/IDailySummaryRepository';
import { v4 as uuidv4 } from 'uuid';
import { DailySummary } from '../../entities/DailySummary';
import { CreateDailySummaryDto } from '../../interfaces/routine.interface';

export class CreateDailySummaryUseCase {
  constructor(private readonly dailySummaryRepository: IDailySummaryRepository) {}

  async execute(createDailySummaryDto: CreateDailySummaryDto): Promise<DailySummary> {
    // Validar DTO
    this.validateCreateDailySummaryDto(createDailySummaryDto);

    const {
      userId,
      dateLocal,
      totalCompleted = 0,
      totalMissed = 0,
      totalInProgress = 0,
      totalPending = 0,
      totalSkipped = 0,
      progressPercent = 0,
    } = createDailySummaryDto;

    // Verificar que no existe ya un resumen para ese usuario y fecha
    const existingSummary = await this.dailySummaryRepository.existsByUserAndDate(userId, dateLocal);
    if (existingSummary) {
      throw new Error('A daily summary already exists for this user and date');
    }

    // Crear nuevo resumen diario
    const newDailySummary = new DailySummary(
      uuidv4(),
      userId,
      dateLocal,
      totalCompleted,
      totalMissed,
      totalInProgress,
      totalPending,
      totalSkipped,
      progressPercent,
      new Date(),
      new Date(),
    );

    // Guardar el resumen en el repositorio
    return await this.dailySummaryRepository.save(newDailySummary);
  }

  private validateCreateDailySummaryDto(dto: CreateDailySummaryDto): void {
    if (!dto.userId || dto.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    if (!dto.dateLocal || !this.isValidDate(dto.dateLocal)) {
      throw new Error('Valid date is required. Use YYYY-MM-DD format');
    }

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

  private isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;

    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  }
}
