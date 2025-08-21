import { IRoutineTaskRepository } from '@core/repositories/IRoutineTaskRepository';
import { RoutineTask } from '../../entities/RoutineTask';

export class GetRoutineTasksByUserIdUseCase {
  constructor(private readonly routineTaskRepository: IRoutineTaskRepository) {}

  async execute(userId: string): Promise<RoutineTask[]> {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    return await this.routineTaskRepository.findByUserId(userId.trim());
  }
}
