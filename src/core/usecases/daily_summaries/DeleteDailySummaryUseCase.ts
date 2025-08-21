import { IDailySummaryRepository } from '@core/repositories/IDailySummaryRepository';

export class DeleteDailySummaryUseCase {
  constructor(private readonly dailySummaryRepository: IDailySummaryRepository) {}

  async execute(id: string): Promise<boolean> {
    if (!id || id.trim().length === 0) {
      throw new Error('DailySummary ID is required');
    }

    const exists = await this.dailySummaryRepository.existsById(id.trim());
    if (!exists) {
      throw new Error('DailySummary not found');
    }

    return await this.dailySummaryRepository.delete(id.trim());
  }
}
