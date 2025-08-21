import { IRoutineTaskRepository } from '@core/repositories/IRoutineTaskRepository';

export class DeleteRoutineTaskUseCase {
  constructor(private readonly routineTaskRepository: IRoutineTaskRepository) {}

  async execute(id: string): Promise<boolean> {
    if (!id || id.trim().length === 0) {
      throw new Error('RoutineTask ID is required');
    }

    const exists = await this.routineTaskRepository.existsById(id.trim());
    if (!exists) {
      throw new Error('RoutineTask not found');
    }

    return await this.routineTaskRepository.delete(id.trim());
  }
}
