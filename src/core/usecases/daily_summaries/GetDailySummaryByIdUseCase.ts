import { IDailySummaryRepository } from '@core/repositories/IDailySummaryRepository';
import { DailySummary } from '../../entities/DailySummary';

export class GetDailySummaryByIdUseCase {
  constructor(private readonly dailySummaryRepository: IDailySummaryRepository) {}

  async execute(id: string): Promise<DailySummary | null> {
    if (!id || id.trim().length === 0) {
      throw new Error('DailySummary ID is required');
    }

    return await this.dailySummaryRepository.findById(id.trim());
  }
}
