import { IDailySummaryRepository } from '@core/repositories/IDailySummaryRepository';
import { DailySummary } from '../../entities/DailySummary';

export class GetDailySummaryByUserAndDateUseCase {
  constructor(private readonly dailySummaryRepository: IDailySummaryRepository) {}

  async execute(userId: string, dateLocal: string): Promise<DailySummary | null> {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    if (!dateLocal || !this.isValidDate(dateLocal)) {
      throw new Error('Valid date is required. Use YYYY-MM-DD format');
    }

    return await this.dailySummaryRepository.findByUserAndDate(userId.trim(), dateLocal.trim());
  }

  private isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;

    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
  }
}
