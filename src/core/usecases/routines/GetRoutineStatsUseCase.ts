import { RoutineStats } from '../../interfaces/routine.interface';
import { IRoutineStatsRepository } from '../../repositories/IRoutineStatsRepository';

export class GetUserRoutineStatsUseCase {
  constructor(private readonly routineStatsRepository: IRoutineStatsRepository) {}

  async execute(userId: string): Promise<RoutineStats> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    return await this.routineStatsRepository.getUserRoutineStats(userId);
  }
}
