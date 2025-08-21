import { IDailySummaryRepository } from '@core/repositories/IDailySummaryRepository';
import { DailySummary } from '../../entities/DailySummary';
import { DailySummaryFilters } from '../../interfaces/routine.interface';

export class GetDailySummariesByFiltersUseCase {
  constructor(private readonly dailySummaryRepository: IDailySummaryRepository) {}

  async execute(filters: DailySummaryFilters): Promise<DailySummary[]> {
    // Validar filtros
    this.validateFilters(filters);

    return await this.dailySummaryRepository.findByFilters(filters);
  }

  private validateFilters(filters: DailySummaryFilters): void {
    if (filters.dateLocal && !this.isValidDate(filters.dateLocal)) {
      throw new Error('Invalid dateLocal format. Use YYYY-MM-DD format');
    }

    if (filters.dateFrom && !this.isValidDate(filters.dateFrom)) {
      throw new Error('Invalid dateFrom format. Use YYYY-MM-DD format');
    }

    if (filters.dateTo && !this.isValidDate(filters.dateTo)) {
      throw new Error('Invalid dateTo format. Use YYYY-MM-DD format');
    }

    if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) {
      throw new Error('dateFrom cannot be after dateTo');
    }

    if (filters.progressPercentMin !== undefined && (filters.progressPercentMin < 0 || filters.progressPercentMin > 100)) {
      throw new Error('progressPercentMin must be between 0 and 100');
    }

    if (filters.progressPercentMax !== undefined && (filters.progressPercentMax < 0 || filters.progressPercentMax > 100)) {
      throw new Error('progressPercentMax must be between 0 and 100');
    }

    if (
      filters.progressPercentMin !== undefined &&
      filters.progressPercentMax !== undefined &&
      filters.progressPercentMin > filters.progressPercentMax
    ) {
      throw new Error('progressPercentMin cannot be greater than progressPercentMax');
    }
  }

  private isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;

    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  }
}
