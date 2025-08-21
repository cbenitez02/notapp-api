import { IRoutineTaskRepository } from '@core/repositories/IRoutineTaskRepository';
import { RoutineTask } from '../../entities/RoutineTask';

export class GetRoutineTaskByIdUseCase {
  constructor(private readonly routineTaskRepository: IRoutineTaskRepository) {}

  async execute(id: string): Promise<RoutineTask | null> {
    if (!id || id.trim().length === 0) {
      throw new Error('RoutineTask ID is required');
    }

    return await this.routineTaskRepository.findById(id.trim());
  }
}
