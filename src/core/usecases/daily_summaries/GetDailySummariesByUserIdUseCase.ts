import { IDailySummaryRepository } from '@core/repositories/IDailySummaryRepository';
import { DailySummary } from '../../entities/DailySummary';

export class GetDailySummariesByUserIdUseCase {
  constructor(private readonly dailySummaryRepository: IDailySummaryRepository) {}

  async execute(userId: string): Promise<DailySummary[]> {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    return await this.dailySummaryRepository.findByUserId(userId.trim());
  }
}
